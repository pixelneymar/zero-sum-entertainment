#!/usr/bin/env bash
# Workspace tests — the staff dashboard's RPC surface.
#
# docs/workspace.md's own security model is the same one docs/integrity.md
# uses for the game: "a guarantee that is not an RLS policy, a database
# constraint, or a check inside a SECURITY DEFINER function does not exist."
# Every ws_* RPC added by
# supabase/migrations/20260826193732_workspace_analytics.sql is EXECUTE-
# revoked from PUBLIC and granted to `authenticated` only (not `anon`, and
# — deliberately narrower than betting_core.sql's settle_round() — not
# `service_role` either, since the whole surface is a staff browser session,
# never a backend job). This file proves the anon half of that with curl
# against the LIVE api, the same way tests/integrity.sh does (integrity.md
# §1: a guarantee enforced only in JavaScript is not a guarantee).
#
# What this file CANNOT prove without a signed-in, non-anon session: that a
# signed-in NON-STAFF user is also rejected (every ws_* function but ws_me()
# raises 'staff only' as its first statement — see the migration's
# "Deliberate departure" note at the top of the file), and that a signed-in
# STAFF user gets correct, sealed-while-pending data back. Those need a real
# `authenticated` JWT, which this project has no anon-sign-in flow to obtain
# yet. Section 2 below documents exactly what to run once one exists, as
# comments — do not skip writing them just because they cannot execute today.
#
# Usage:  ./tests/workspace.sh
set -uo pipefail
# NOTE: PostgREST maps `raise exception` (P0001) to HTTP 400. A staff-gated definer
# function therefore answers an anon caller with 400 "staff only" once applied, and
# 404/400 before it exists. Both prove the RPC is not usable by anon.
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
rpc_code() {
  # $1 = function name, $2 = JSON body (default '{}')
  curl -sS -o /dev/null -w "%{http_code}" "${H[@]}" -X POST \
    "$URL/rest/v1/rpc/$1" -d "${2:-{\}}" --max-time 25
}

head_ "1. Every ws_* RPC is closed to anon (docs/workspace.md \"Server source\")"

# ws_me() is the one function every AUTHENTICATED caller may reach (staff or
# not — it is how the client learns which it is). It is still not anon-
# callable: anon has no auth.uid() at all, and EXECUTE is granted to
# `authenticated` only, never `anon`.
for fn in ws_me ws_overview ws_players ws_ledger_audit ws_ledger_audit_all_ok ws_games ws_integrity; do
  c=$(rpc_code "$fn")
  { [ "$c" = "400" ] || [ "$c" = "401" ] || [ "$c" = "403" ] || [ "$c" = "404" ]; } \
    && ok "rpc/$fn not anon-callable ($c)" \
    || bad "rpc/$fn reachable by anon" "400 (staff-only raise) / 401 / 403 / 404" "$c"
done

# Parameterised reads — body carries plausible-shaped args so a permissive
# server would at least attempt the call; a correctly-locked-down one
# rejects before ever looking at them.
c=$(rpc_code "ws_rounds" '{"p_limit":10,"p_offset":0}')
{ [ "$c" = "400" ] || [ "$c" = "401" ] || [ "$c" = "403" ] || [ "$c" = "404" ]; } \
  && ok "rpc/ws_rounds not anon-callable ($c)" \
  || bad "rpc/ws_rounds reachable by anon" "400 (staff-only raise) / 401 / 403 / 404" "$c"

c=$(rpc_code "ws_round_detail" '{"p_round_id":"00000000-0000-0000-0000-000000000000"}')
{ [ "$c" = "400" ] || [ "$c" = "401" ] || [ "$c" = "403" ] || [ "$c" = "404" ]; } \
  && ok "rpc/ws_round_detail not anon-callable ($c)" \
  || bad "rpc/ws_round_detail reachable by anon" "400 (staff-only raise) / 401 / 403 / 404" "$c"

c=$(rpc_code "ws_bets" '{"p_limit":10}')
{ [ "$c" = "400" ] || [ "$c" = "401" ] || [ "$c" = "403" ] || [ "$c" = "404" ]; } \
  && ok "rpc/ws_bets not anon-callable ($c)" \
  || bad "rpc/ws_bets reachable by anon" "400 (staff-only raise) / 401 / 403 / 404" "$c"

c=$(rpc_code "ws_ledger" '{"p_limit":10}')
{ [ "$c" = "400" ] || [ "$c" = "401" ] || [ "$c" = "403" ] || [ "$c" = "404" ]; } \
  && ok "rpc/ws_ledger not anon-callable ($c)" \
  || bad "rpc/ws_ledger reachable by anon" "400 (staff-only raise) / 401 / 403 / 404" "$c"

head_ "2. Management RPCs are closed to anon (docs/workspace.md: all raise unless is_staff())"

c=$(rpc_code "ws_set_game_active" '{"p_slug":"banana_cut","p_active":false}')
{ [ "$c" = "400" ] || [ "$c" = "401" ] || [ "$c" = "403" ] || [ "$c" = "404" ]; } \
  && ok "rpc/ws_set_game_active not anon-callable ($c)" \
  || bad "rpc/ws_set_game_active reachable by anon — could disable a live game" "400 (staff-only raise) / 401 / 403 / 404" "$c"

c=$(rpc_code "ws_void_round" '{"p_round_id":"00000000-0000-0000-0000-000000000000"}')
{ [ "$c" = "400" ] || [ "$c" = "401" ] || [ "$c" = "403" ] || [ "$c" = "404" ]; } \
  && ok "rpc/ws_void_round not anon-callable ($c)" \
  || bad "rpc/ws_void_round reachable by anon — could refund a live round" "400 (staff-only raise) / 401 / 403 / 404" "$c"

c=$(rpc_code "ws_schedule_round" '{"p_slug":"banana_cut"}')
{ [ "$c" = "400" ] || [ "$c" = "401" ] || [ "$c" = "403" ] || [ "$c" = "404" ]; } \
  && ok "rpc/ws_schedule_round not anon-callable ($c)" \
  || bad "rpc/ws_schedule_round reachable by anon — could create rounds" "400 (staff-only raise) / 401 / 403 / 404" "$c"

head_ "3. round_scripts is not readable directly (no anon/authenticated SELECT policy)"
c=$(curl -sS -o /dev/null -w "%{http_code}" "${H[@]}" "$URL/rest/v1/round_scripts?select=*&limit=1" --max-time 25)
{ [ "$c" = "401" ] || [ "$c" = "403" ] || [ "$c" = "404" ] || [ "$c" = "200" ]; } \
  && ok "round_scripts closed or empty to anon ($c)" \
  || bad "round_scripts leaks a future result" "401/403/404/200-empty" "$c"
# A 200 here is only safe if the body is an empty array — RLS with no policy
# denies rows, not the request. Confirm the row count explicitly.
if [ "$c" = "200" ]; then
  n=$(curl -sS "${H[@]}" "$URL/rest/v1/round_scripts?select=game_id&limit=5" --max-time 25 \
        | python3 -c "import json,sys; print(len(json.load(sys.stdin)))" 2>/dev/null || echo ERR)
  [ "$n" = "0" ] && ok "round_scripts returns 0 rows to anon" \
                 || bad "ROUND_SCRIPTS LEAK — future results readable" "0 rows" "$n rows"
fi

printf "\n\033[1m%d passed, %d failed\033[0m\n" "$PASS" "$FAIL"

# ---------------------------------------------------------------------------
# 4. Authenticated checks — NOT executable yet.
#
# This project has no anon sign-in flow enabled today, so there is no way to
# mint a real `authenticated` JWT for a NON-staff user or a staff user from
# this script. The checks below are the ones to run BY HAND (or wire into
# this file) the moment one exists — via `supabase auth sign-in` in a test
# harness, or a service-role-minted JWT for a throwaway test user. Do not
# consider the workspace security model verified until every one of these
# has actually been run and observed, not just read.
#
# Setup once anon sign-in exists:
#   NONSTAFF=<JWT for a signed-in user NOT present in public.staff>
#   STAFF=<JWT for a signed-in user present in public.staff>
#   HN=(-H "apikey: $ANON" -H "Authorization: Bearer $NONSTAFF" -H "Content-Type: application/json")
#   HS=(-H "apikey: $ANON" -H "Authorization: Bearer $STAFF"    -H "Content-Type: application/json")
#
# 4.1 ws_me() works for EVERY authenticated caller, staff or not, and reports
#     accurately:
#       curl "${HN[@]}" -X POST "$URL/rest/v1/rpc/ws_me" -d '{}'
#         -> 200, { user_id: <uuid>, is_staff: false, is_admin: false }
#       curl "${HS[@]}" -X POST "$URL/rest/v1/rpc/ws_me" -d '{}'
#         -> 200, { user_id: <uuid>, is_staff: true, is_admin: <bool> }
#
# 4.2 Every other ws_* read RPC raises for a NON-staff authenticated caller
#     (this is the departure documented at the top of the migration — the
#     spec text only mandates the staff gate on management RPCs, this
#     migration extends it to every read too):
#       for fn in ws_overview ws_rounds ws_round_detail ws_bets ws_players \
#                 ws_ledger ws_ledger_audit ws_ledger_audit_all_ok ws_games \
#                 ws_integrity; do
#         curl "${HN[@]}" -X POST "$URL/rest/v1/rpc/$fn" -d '{}'
#           -> non-2xx, error mentions "staff only"
#       done
#
# 4.3 The same RPCs succeed for a STAFF caller and return the documented
#     shape (docs/workspace.md "Data shapes"):
#       curl "${HS[@]}" -X POST "$URL/rest/v1/rpc/ws_overview" -d '{}'
#         -> 200, one row with rounds/bets/staked/paid_out/house_take/players/
#            avg_multiplier/best_multiplier/conservation_ok/breaches
#       curl "${HS[@]}" -X POST "$URL/rest/v1/rpc/ws_integrity" -d '{}'
#         -> 200, five rows (result_hidden, no_late_bets, conservation,
#            ledger_matches_balances, settle_idempotent), each status in
#            {pass,fail,na,unknown}; expect all pass or na on a clean db
#
# 4.4 Sealing holds for STAFF too (docs/workspace.md principle 3 — the load-
#     bearing one). Find a round where result_visible_at is in the future
#     (or create one with public.dev_create_round from supabase/seed.sql on a
#     LOCAL db only — never against this remote project), then as STAFF:
#       curl "${HS[@]}" -X POST "$URL/rest/v1/rpc/ws_round_detail" \
#         -d "{\"p_round_id\":\"<pending-round-id>\"}"
#         -> 200, but result: null, distribution: [], and every bet in
#            `bets` has guess/distance/won/payout all null
#       curl "${HS[@]}" -X POST "$URL/rest/v1/rpc/ws_bets" \
#         -d "{\"p_round_id\":\"<pending-round-id>\"}"
#         -> 200, every row has guess/distance/won/payout null
#     Then re-run both AFTER result_visible_at passes and confirm the same
#     round now returns real values — sealing must be time-varying, not a
#     permanent lock.
#
# 4.5 ws_void_round() on an already-settled round raises rather than double-
#     refunding:
#       curl "${HS[@]}" -X POST "$URL/rest/v1/rpc/ws_void_round" \
#         -d "{\"p_round_id\":\"<a settled round id>\"}"
#         -> non-2xx, error mentions "already settled"
#     ...and on a genuinely open round writes exactly one refund row per bet
#     and conservation still holds afterwards (chip_ledger sums to 0 for
#     that round_id) — check with rpc/ws_ledger_audit or a direct
#     `sum(amount)` query against chip_ledger filtered by round_id.
#
# 4.6 ws_schedule_round() creates a round whose five timestamps satisfy
#     rounds_schedule_ordered and whose video offsets pass
#     rounds_video_alignment (betting_core.sql) — i.e. it does not need a
#     special case, because the same triggers that guard every other writer
#     guard this one too. Call it twice in a row for the same slug and
#     confirm round_index increments and the script used cycles (round 3
#     reuses round_scripts.round_index = 1, per the migration's cycling
#     note).
# ---------------------------------------------------------------------------

[ "$FAIL" -eq 0 ] || exit 1
