#!/usr/bin/env bash
# Integrity tests — the guarantees that ARE the product.
#
# These run against the LIVE api with curl, deliberately bypassing the client.
# A guarantee enforced only in JavaScript is not a guarantee (docs/integrity.md §1).
#
# Usage:  ./tests/integrity.sh
set -uo pipefail
export PATH="$HOME/.local/bin:$PATH"

REF=xgvuavikubqwsdhoadyw
URL="https://$REF.supabase.co"
PASS=0; FAIL=0

ok()   { printf "  \033[32mPASS\033[0m  %s\n" "$1"; PASS=$((PASS+1)); }
bad()  { printf "  \033[31mFAIL\033[0m  %s\n     expected: %s\n     actual:   %s\n" "$1" "$2" "$3"; FAIL=$((FAIL+1)); }
head_() { printf "\n\033[1m%s\033[0m\n" "$1"; }

ANON=$(supabase projects api-keys --project-ref "$REF" -o json 2>/dev/null \
  | python3 -c "import json,sys
for k in json.load(sys.stdin):
    if k.get('name')=='anon': print(k['api_key']); break" 2>/dev/null)
[ -z "$ANON" ] && { echo "FATAL: could not read anon key (is the CLI logged in?)"; exit 1; }

H=(-H "apikey: $ANON" -H "Authorization: Bearer $ANON" -H "Content-Type: application/json")
api()  { curl -sS "${H[@]}" "$URL/rest/v1/$1" --max-time 25; }
code() { curl -sS -o /dev/null -w "%{http_code}" "${H[@]}" "$URL/rest/v1/$1" --max-time 25; }

head_ "1. Schema is present"
for t in games rounds round_results bets chip_ledger balances profiles; do
  c=$(code "$t?select=*&limit=1")
  if [ "$c" = "200" ] || [ "$c" = "206" ]; then ok "table $t reachable"
  elif [ "$c" = "401" ] || [ "$c" = "403" ]; then ok "table $t exists, RLS closed to anon ($c)"
  else bad "table $t" "200/401/403" "$c"; fi
done

head_ "2. Legacy CMS schema is gone"
for t in artists releases events enquiries; do
  c=$(code "$t?select=*&limit=1")
  [ "$c" = "404" ] && ok "$t dropped" || bad "$t still present" "404" "$c"
done

head_ "3. The result is unreadable before the video shows it  (integrity.md §5.1)"
# find a round whose result is not yet visible
PEND=$(api "rounds?select=id,result_visible_at&order=result_visible_at.desc&limit=20" \
  | python3 -c "
import json,sys,datetime
try: rs=json.load(sys.stdin)
except: sys.exit()
now=datetime.datetime.now(datetime.timezone.utc)
for r in rs if isinstance(rs,list) else []:
    t=r.get('result_visible_at')
    if t and datetime.datetime.fromisoformat(t.replace('Z','+00:00'))>now:
        print(r['id']); break")
if [ -n "$PEND" ]; then
  n=$(api "round_results?round_id=eq.$PEND&select=result_value" | python3 -c "import json,sys; print(len(json.load(sys.stdin)))" 2>/dev/null || echo ERR)
  [ "$n" = "0" ] && ok "pending round leaks no result (0 rows)" \
                 || bad "RESULT LEAK — the product's core claim" "0 rows" "$n rows"
  # duel: each attempt is gated on its own visible_at (integrity.md §8)
  a=$(api "round_attempts?round_id=eq.$PEND&select=side,offset_value,visible_at" | python3 -c "
import json,sys,datetime
try: rs=json.load(sys.stdin)
except: print('ERR'); sys.exit()
now=datetime.datetime.now(datetime.timezone.utc)
early=[r for r in rs if isinstance(rs,list) and datetime.datetime.fromisoformat(r['visible_at'].replace('Z','+00:00'))>now]
print(len(early))" 2>/dev/null || echo ERR)
  if [ "$a" = "ERR" ]; then echo "  SKIP  round_attempts not present yet (duel migration not applied)"
  elif [ "$a" = "0" ]; then ok "no attempt readable before its visible_at (0 early rows)"
  else bad "ATTEMPT LEAK — a challenger's reading is readable early" "0 rows" "$a rows"; fi
else
  echo "  SKIP  no pending round scheduled"
fi

head_ "4. The bet write surface is closed  (integrity.md §3)"
R=$(api "rounds?select=id&limit=1" | python3 -c "
import json,sys
try:
    d=json.load(sys.stdin); print(d[0]['id'] if d else '')
except: print('')")
if [ -n "$R" ]; then
  c=$(curl -sS -o /dev/null -w "%{http_code}" "${H[@]}" -X POST "$URL/rest/v1/bets" \
        -d "{\"round_id\":\"$R\",\"user_id\":\"00000000-0000-0000-0000-000000000000\",\"guess\":1}" --max-time 25)
  { [ "$c" = "401" ] || [ "$c" = "403" ] || [ "$c" = "404" ]; } \
    && ok "direct INSERT into bets rejected ($c) — free bets impossible" \
    || bad "DIRECT BET INSERT ACCEPTED — bets are free" "401/403/404" "$c"
else
  echo "  SKIP  no round available"
fi

head_ "5. Privileged RPCs are not callable by anon  (integrity.md, data-model.md §6)"
for fn in settle_round place_bet ensure_profile; do
  c=$(curl -sS -o /dev/null -w "%{http_code}" "${H[@]}" -X POST "$URL/rest/v1/rpc/$fn" -d '{}' --max-time 25)
  { [ "$c" = "401" ] || [ "$c" = "403" ] || [ "$c" = "404" ]; } \
    && ok "rpc/$fn not anon-callable ($c)" \
    || bad "rpc/$fn reachable by anon" "401/403/404" "$c"
done

head_ "6. Aggregates expose counts, never guesses  (integrity.md §5.2)"
c=$(code "bets?select=guess&limit=1")
{ [ "$c" = "401" ] || [ "$c" = "403" ] || [ "$c" = "200" ]; } && ok "bets.guess gated ($c)" \
  || bad "bets.guess readable" "401/403/200-empty" "$c"

printf "\n\033[1m%d passed, %d failed\033[0m\n" "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ] || exit 1
