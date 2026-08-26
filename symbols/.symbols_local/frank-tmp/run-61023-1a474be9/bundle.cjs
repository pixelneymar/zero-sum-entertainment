if(!globalThis.location)globalThis.location={pathname:"/",search:"",hash:"",href:"http://localhost/",origin:"http://localhost",protocol:"http:",host:"localhost",hostname:"localhost",port:"",assign:function(){},replace:function(){},reload:function(){}};if(!globalThis.addEventListener)globalThis.addEventListener=function(){};if(!globalThis.removeEventListener)globalThis.removeEventListener=function(){};if(!globalThis.scrollTo)globalThis.scrollTo=function(){};if(!globalThis.scrollY)globalThis.scrollY=0;if(!globalThis.innerHeight)globalThis.innerHeight=0;if(!globalThis.innerWidth)globalThis.innerWidth=0;if(!globalThis.getComputedStyle)globalThis.getComputedStyle=function(){return{}};if(!globalThis.requestAnimationFrame)globalThis.requestAnimationFrame=function(cb){return setTimeout(cb,0)};if(!globalThis.cancelAnimationFrame)globalThis.cancelAnimationFrame=function(id){clearTimeout(id)};if(!globalThis.onpopstate)globalThis.onpopstate=null;if(!globalThis.history)globalThis.history={pushState:function(){},replaceState:function(){},back:function(){},forward:function(){},go:function(){}};if(!globalThis.IntersectionObserver)globalThis.IntersectionObserver=function(){this.observe=function(){};this.unobserve=function(){};this.disconnect=function(){}};if(!globalThis.MutationObserver)globalThis.MutationObserver=function(){this.observe=function(){};this.disconnect=function(){}};if(!globalThis.matchMedia)globalThis.matchMedia=function(){return{matches:false,addListener:function(){},removeListener:function(){}}};if(!globalThis.URL)globalThis.URL=function(u){try{var p=new(require("url").URL)(u);Object.assign(this,p)}catch(e){this.pathname="/";this.search="";this.hash="";this.origin="http://localhost";this.href=u}};if(!globalThis.module)globalThis.module={exports:{}};if(!globalThis.exports)globalThis.exports=globalThis.module.exports;if(!globalThis.require)globalThis.require=function(){return{}};var window=globalThis;var navigator=globalThis.navigator||{};if(!globalThis.document)globalThis.document=(function(){
var noop=function(){return stub};
var stub={style:{},textContent:"",innerHTML:"",nodeName:"",nodeType:1,parentNode:null,namespaceURI:"",
sheet:{cssRules:[],insertRule:function(r,i){this.cssRules.splice(i||0,0,{cssText:r})},deleteRule:noop},
styleSheets:[],
appendChild:noop,removeChild:noop,insertBefore:noop,replaceChild:noop,prepend:noop,append:noop,
cloneNode:function(){return Object.create(stub)},
setAttribute:noop,removeAttribute:noop,
getAttribute:function(){return ""},hasAttribute:function(){return false},
closest:function(){return null},querySelector:function(){return null},
querySelectorAll:function(){return []},getElementsByTagName:function(){return []},
classList:{add:noop,remove:noop,contains:function(){return false},toggle:noop},
children:[],childNodes:[],firstChild:null,lastChild:null,nextSibling:null,previousSibling:null,parentElement:null,
createElement:function(){var el=Object.create(stub);el.sheet={cssRules:[],insertRule:function(r,i){el.sheet.cssRules.splice(i||0,0,{cssText:r})},deleteRule:noop};return el},
createTextNode:function(){return Object.create(stub)},
createDocumentFragment:function(){return Object.create(stub)},
createElementNS:function(){return Object.create(stub)},
addEventListener:noop,removeEventListener:noop,dispatchEvent:noop,
getBoundingClientRect:function(){return{top:0,left:0,right:0,bottom:0,width:0,height:0}},
getComputedStyle:function(){return{}},
head:null,body:null,documentElement:null,scrollTo:noop};
stub.head=Object.create(stub);stub.body=Object.create(stub);stub.documentElement=Object.create(stub);stub.documentElement.scrollTo=noop;stub.parentElement=Object.create(stub);
return stub}());var document=globalThis.document;
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __origToESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
)); var __stubProxy = function(id) { var noop = function(){ return __stubProxy(id) }; noop.__isStubPhantom = true; if (id) noop.__stubId = id; return new Proxy(noop, { get: function(t,p) { if (p === Symbol.toPrimitive || p === "valueOf" || p === "toString") return function() { return "" }; return p in t ? t[p] : __stubProxy(id) }, apply: function() { return __stubProxy(id) }, construct: function() { return __stubProxy(id) } }); }; var __toESM = function(mod) { var r = __origToESM.apply(null, arguments); if (mod && mod.__isStub) { var id = mod.__stubId; return new Proxy(r, { get: function(t,p) { if (p === Symbol.toPrimitive || p === "valueOf" || p === "toString") return function() { return "" }; return p in t ? t[p] : __stubProxy(id) } }); } return r; };
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// stub-external:@supabase/supabase-js
var require_supabase_js = __commonJS({
  "stub-external:@supabase/supabase-js"(exports2, module2) {
    module2.exports = { __esModule: true, __isStub: true, __stubId: "@supabase/supabase-js" };
  }
});

// symbols/context.js
var context_exports = {};
__export(context_exports, {
  default: () => context_default
});
module.exports = __toCommonJS(context_exports);

// symbols/components/index.js
var components_exports = {};
__export(components_exports, {
  BalanceChip: () => BalanceChip,
  BetPanel: () => BetPanel,
  CrowdCounter: () => CrowdCounter,
  ErrorBanner: () => ErrorBanner,
  GameCard: () => GameCard,
  GamePicker: () => GamePicker,
  HistoryPanel: () => HistoryPanel,
  HistoryRow: () => HistoryRow,
  ObjectiveBanner: () => ObjectiveBanner,
  ResultsCard: () => ResultsCard,
  TimerChip: () => TimerChip,
  TimerFace: () => TimerFace
});

// symbols/components/GameCard.js
var GameCard = {
  tag: "button",
  flow: "y",
  align: "flex-start flex-start",
  gap: "A",
  padding: "B",
  round: "Z",
  theme: "surface",
  border: "1px solid neutral.2",
  textAlign: "left",
  cursor: "pointer",
  flex: "1",
  minWidth: "16em",
  transition: "A defaultBezier",
  transitionProperty: "border-color, background, box-shadow",
  ":hover": { borderColor: "brand" },
  ":focus-visible": { outline: "2px solid currentColor", outlineOffset: "2px" },
  CardGlyph: {
    tag: "span",
    fontSize: "E",
    lineHeight: "E"
  },
  CardTitle: {
    tag: "h2",
    fontSize: "C",
    lineHeight: "C",
    fontWeight: "700",
    letterSpacing: "-X",
    margin: "0"
  },
  CardLine: {
    tag: "p",
    fontSize: "A",
    lineHeight: "B",
    theme: "muted",
    margin: "0"
  },
  CardMeta: {
    flow: "x",
    align: "center flex-start",
    gap: "Y",
    fontSize: "Z",
    theme: "muted",
    RangeNote: { tag: "span", text: "{{ gameRange | polyglot }}" },
    MetaDot: { tag: "span", text: "\xB7" },
    StakeNote: { tag: "span", text: "{{ gameStake | polyglot }}" }
  },
  CardAction: {
    tag: "span",
    text: "{{ playNow | polyglot }}",
    fontSize: "Z",
    fontWeight: "700",
    letterSpacing: "X",
    textTransform: "uppercase",
    color: "brand"
  }
};

// symbols/components/GamePicker.js
var GamePicker = {
  tag: "section",
  flow: "y",
  align: "center center",
  gap: "C",
  padding: "D B",
  width: "100%",
  display: (el, s) => s.screen === "picker" ? "flex" : "none",
  PickerIntro: {
    flow: "y",
    align: "center center",
    gap: "Y",
    textAlign: "center",
    maxWidth: "38em",
    PickerKicker: {
      tag: "span",
      text: "{{ pickerKicker | polyglot }}",
      fontSize: "Z",
      fontWeight: "700",
      letterSpacing: "Y",
      textTransform: "uppercase",
      color: "brand"
    },
    PickerTitle: {
      tag: "h1",
      text: "{{ pickerTitle | polyglot }}",
      fontSize: "E",
      lineHeight: "E",
      fontWeight: "800",
      letterSpacing: "-Y",
      margin: "0"
    },
    PickerLead: {
      tag: "p",
      text: "{{ pickerLead | polyglot }}",
      fontSize: "A2",
      lineHeight: "B",
      theme: "muted",
      margin: "0"
    }
  },
  GameCards: {
    flow: "x",
    align: "stretch center",
    gap: "B",
    flexWrap: "wrap",
    width: "100%",
    maxWidth: "46em",
    childExtends: "GameCard",
    BananaCard: {
      onClick: (e, el, s) => s.update({
        screen: "playing",
        phase: "preview",
        game: {
          slug: "banana_cut",
          title: "Banana Cut",
          objectiveLine: "Cut the banana exactly in half",
          guessMin: -20,
          guessMax: 20,
          guessStep: 1,
          resultUnit: "g"
        }
      }),
      CardGlyph: { text: "\u{1F34C}" },
      CardTitle: { text: "{{ bananaTitle | polyglot }}" },
      CardLine: { text: "{{ bananaObjective | polyglot }}" }
    },
    WaterCard: {
      onClick: (e, el, s) => s.update({
        screen: "playing",
        phase: "preview",
        game: {
          slug: "water_200g",
          title: "Water Pour",
          objectiveLine: "Pour exactly 200 g of water",
          guessMin: -20,
          guessMax: 20,
          guessStep: 1,
          resultUnit: "g"
        }
      }),
      CardGlyph: { text: "\u{1F4A7}" },
      CardTitle: { text: "{{ waterTitle | polyglot }}" },
      CardLine: { text: "{{ waterObjective | polyglot }}" }
    }
  },
  PickerHonesty: {
    tag: "p",
    text: "{{ pickerHonesty | polyglot }}",
    fontSize: "Z",
    lineHeight: "A",
    theme: "muted",
    textAlign: "center",
    maxWidth: "34em",
    margin: "0"
  }
};

// symbols/components/TimerFace.js
var TimerFace = {
  flow: "x",
  align: "center center",
  gap: "Y",
  padding: "Y A",
  round: "Z",
  border: "1px solid neutral.2",
  fontVariantNumeric: "tabular-nums"
};

// symbols/components/TimerChip.js
var TimerChip = {
  flow: "x",
  align: "center center",
  display: (el, s) => s.screen === "playing" && s.phase !== "reveal" ? "flex" : "none",
  childExtends: "TimerFace",
  TimerNormal: {
    theme: "surface",
    display: (el, s) => s.phase === "preview" || s.phase === "results" || s.phase === "betting" && (s.secondsLeft ?? 99) > 5 ? "flex" : "none",
    PreviewLabel: {
      tag: "span",
      text: "{{ timerPreview | polyglot }}",
      fontSize: "Z",
      fontWeight: "600",
      letterSpacing: "X",
      textTransform: "uppercase",
      display: (el, s) => s.phase === "preview" ? "inline" : "none"
    },
    BettingLabel: {
      tag: "span",
      text: "{{ timerBetting | polyglot }}",
      fontSize: "Z",
      fontWeight: "600",
      letterSpacing: "X",
      textTransform: "uppercase",
      display: (el, s) => s.phase === "betting" ? "inline" : "none"
    },
    ResultsLabel: {
      tag: "span",
      text: "{{ timerResults | polyglot }}",
      fontSize: "Z",
      fontWeight: "600",
      letterSpacing: "X",
      textTransform: "uppercase",
      display: (el, s) => s.phase === "results" ? "inline" : "none"
    },
    SecondsValue: {
      tag: "span",
      text: (el, s) => `${Math.max(0, Math.ceil(s.secondsLeft ?? 0))}s`,
      fontSize: "B",
      fontWeight: "800"
    }
  },
  TimerUrgent: {
    theme: "danger",
    display: (el, s) => s.phase === "betting" && (s.secondsLeft ?? 99) <= 5 ? "flex" : "none",
    UrgentLabel: {
      tag: "span",
      text: "{{ timerBetting | polyglot }}",
      fontSize: "Z",
      fontWeight: "700",
      letterSpacing: "X",
      textTransform: "uppercase"
    },
    UrgentSeconds: {
      tag: "span",
      text: (el, s) => `${Math.max(0, Math.ceil(s.secondsLeft ?? 0))}s`,
      fontSize: "B",
      fontWeight: "800"
    }
  },
  TimerLocked: {
    theme: "locked",
    display: (el, s) => s.phase === "locked" ? "flex" : "none",
    LockedLabel: {
      tag: "span",
      text: "{{ timerLocked | polyglot }}",
      fontSize: "A",
      fontWeight: "800",
      letterSpacing: "Y",
      textTransform: "uppercase"
    }
  }
};

// symbols/components/ObjectiveBanner.js
var ObjectiveBanner = {
  flow: "y",
  align: "center center",
  gap: "X",
  padding: "Y B",
  round: "Z",
  theme: "surface",
  border: "1px solid neutral.2",
  textAlign: "center",
  display: (el, s) => s.screen === "playing" && (s.phase === "preview" || s.phase === "betting") ? "flex" : "none",
  ObjectiveKicker: {
    tag: "span",
    text: "{{ objectiveKicker | polyglot }}",
    fontSize: "Z",
    fontWeight: "700",
    letterSpacing: "Y",
    textTransform: "uppercase",
    color: "brand"
  },
  ObjectiveText: {
    tag: "p",
    text: (el, s) => s.game ? s.game.objectiveLine : "",
    fontSize: "B",
    lineHeight: "B",
    fontWeight: "600",
    letterSpacing: "-X",
    margin: "0"
  },
  RakeNote: {
    tag: "span",
    text: "{{ rakeNote | polyglot }}",
    fontSize: "Z",
    theme: "muted"
  }
};

// symbols/components/CrowdCounter.js
var CrowdCounter = {
  flow: "y",
  align: "flex-start flex-start",
  gap: "A",
  padding: "A",
  round: "Z",
  theme: "surface",
  border: "1px solid neutral.2",
  minWidth: "11em",
  fontVariantNumeric: "tabular-nums",
  display: (el, s) => s.screen === "playing" ? "flex" : "none",
  CrowdHead: {
    flow: "x",
    align: "center space-between",
    gap: "A",
    width: "100%",
    CrowdTitle: {
      tag: "span",
      text: "{{ crowdTitle | polyglot }}",
      fontSize: "Z",
      fontWeight: "600",
      letterSpacing: "X",
      textTransform: "uppercase",
      theme: "muted"
    },
    LiveBadge: {
      flow: "x",
      align: "center center",
      gap: "X",
      display: (el, s) => s.phase === "preview" || s.phase === "betting" ? "flex" : "none",
      LiveDot: { tag: "span", text: "\u25CF", fontSize: "Z", color: "ember" },
      LiveWord: {
        tag: "span",
        text: "{{ liveBadge | polyglot }}",
        fontSize: "Z",
        fontWeight: "700",
        letterSpacing: "X",
        textTransform: "uppercase",
        color: "ember"
      }
    },
    LockBadge: {
      tag: "span",
      text: "{{ lockedBadge | polyglot }}",
      theme: "locked",
      fontSize: "Z",
      fontWeight: "700",
      letterSpacing: "X",
      textTransform: "uppercase",
      padding: "X Y",
      round: "Y",
      display: (el, s) => s.phase === "locked" || s.phase === "reveal" || s.phase === "results" ? "inline-block" : "none"
    }
  },
  PlayersStat: {
    flow: "y",
    align: "flex-start flex-start",
    gap: "X",
    PlayersLabel: {
      tag: "span",
      text: "{{ playersLabel | polyglot }}",
      fontSize: "Z",
      letterSpacing: "X",
      textTransform: "uppercase",
      theme: "muted"
    },
    PlayersValue: {
      tag: "span",
      text: (el, s) => {
        const frozen = s.frozen && (s.phase === "locked" || s.phase === "reveal" || s.phase === "results");
        const value = frozen ? s.frozen.playerCount : s.playerCount;
        return (value ?? 0).toLocaleString("en-US");
      },
      fontSize: "D",
      lineHeight: "D",
      fontWeight: "800",
      letterSpacing: "-X"
    }
  },
  PotStat: {
    flow: "y",
    align: "flex-start flex-start",
    gap: "X",
    PotLabel: {
      tag: "span",
      text: "{{ potLabel | polyglot }}",
      fontSize: "Z",
      letterSpacing: "X",
      textTransform: "uppercase",
      theme: "muted"
    },
    PotRow: {
      flow: "x",
      align: "baseline flex-start",
      gap: "Y",
      PotValue: {
        tag: "span",
        text: (el, s) => {
          const frozen = s.frozen && (s.phase === "locked" || s.phase === "reveal" || s.phase === "results");
          const value = frozen ? s.frozen.pot : s.pot;
          return (value ?? 0).toLocaleString("en-US");
        },
        fontSize: "D",
        lineHeight: "D",
        fontWeight: "800",
        letterSpacing: "-X",
        color: "gold"
      },
      PotUnit: {
        tag: "span",
        text: "{{ chipsUnit | polyglot }}",
        fontSize: "Z",
        theme: "muted"
      }
    }
  },
  FrozenNote: {
    tag: "span",
    text: "{{ lockedNote | polyglot }}",
    fontSize: "Z",
    theme: "muted",
    display: (el, s) => s.phase === "locked" || s.phase === "reveal" || s.phase === "results" ? "inline" : "none"
  }
};

// symbols/components/BetPanel.js
var BetPanel = {
  flow: "y",
  align: "center center",
  gap: "A",
  padding: "A B",
  round: "Z",
  theme: "surface",
  border: "1px solid neutral.2",
  display: (el, s) => s.screen === "playing" && (s.phase === "preview" || s.phase === "betting" || s.phase === "locked") ? "flex" : "none",
  BetPrompt: {
    tag: "span",
    text: "{{ betPrompt | polyglot }}",
    fontSize: "Z",
    fontWeight: "600",
    letterSpacing: "X",
    textTransform: "uppercase",
    theme: "muted"
  },
  GuessRow: {
    flow: "x",
    align: "center center",
    gap: "A",
    transition: "A defaultBezier",
    transitionProperty: "opacity",
    display: (el, s) => s.myBet ? "none" : "flex",
    opacity: (el, s) => s.phase === "preview" || s.phase === "betting" ? "1" : ".45",
    pointerEvents: (el, s) => s.phase === "preview" || s.phase === "betting" ? "auto" : "none",
    StepDown: {
      extends: "Button",
      text: "\u2212",
      fontSize: "B",
      fontWeight: "700",
      padding: "Y Z",
      round: "Y",
      theme: "surface",
      border: "1px solid neutral.2",
      cursor: "pointer",
      ":hover": { borderColor: "brand" },
      ":focus-visible": { outline: "2px solid currentColor", outlineOffset: "2px" },
      onClick: (e, el, s) => {
        const game = s.game;
        if (!game || s.myBet || s.phase !== "preview" && s.phase !== "betting") return;
        const step = game.guessStep || 1;
        const current = s.myGuess == null ? 0 : s.myGuess;
        const next = Math.max(game.guessMin, Math.min(game.guessMax, current - step));
        s.update({ myGuess: next });
      }
    },
    GuessValue: {
      flow: "y",
      align: "center center",
      gap: "X",
      minWidth: "4em",
      textAlign: "center",
      fontVariantNumeric: "tabular-nums",
      GuessNumber: {
        tag: "span",
        text: (el, s) => {
          const value = s.myGuess == null ? 0 : s.myGuess;
          return value > 0 ? `+${value}` : String(value);
        },
        fontSize: "D",
        lineHeight: "D",
        fontWeight: "800",
        letterSpacing: "-X"
      },
      GuessUnit: {
        tag: "span",
        text: (el, s) => s.game ? s.game.resultUnit : "",
        fontSize: "Z",
        theme: "muted"
      }
    },
    StepUp: {
      extends: "Button",
      text: "+",
      fontSize: "B",
      fontWeight: "700",
      padding: "Y Z",
      round: "Y",
      theme: "surface",
      border: "1px solid neutral.2",
      cursor: "pointer",
      ":hover": { borderColor: "brand" },
      ":focus-visible": { outline: "2px solid currentColor", outlineOffset: "2px" },
      onClick: (e, el, s) => {
        const game = s.game;
        if (!game || s.myBet || s.phase !== "preview" && s.phase !== "betting") return;
        const step = game.guessStep || 1;
        const current = s.myGuess == null ? 0 : s.myGuess;
        const next = Math.max(game.guessMin, Math.min(game.guessMax, current + step));
        s.update({ myGuess: next });
      }
    }
  },
  RangeHint: {
    tag: "span",
    text: (el, s) => {
      const game = s.game;
      if (!game) return "";
      const min = game.guessMin > 0 ? `+${game.guessMin}` : String(game.guessMin);
      const max = game.guessMax > 0 ? `+${game.guessMax}` : String(game.guessMax);
      return `${min} \u2026 ${max} ${game.resultUnit}`;
    },
    fontSize: "Z",
    theme: "muted",
    display: (el, s) => s.myBet ? "none" : "inline"
  },
  PlacedRow: {
    flow: "x",
    align: "baseline center",
    gap: "Y",
    fontVariantNumeric: "tabular-nums",
    display: (el, s) => s.myBet ? "flex" : "none",
    PlacedLabel: {
      tag: "span",
      text: "{{ yourGuess | polyglot }}",
      fontSize: "A",
      theme: "muted"
    },
    PlacedValue: {
      tag: "span",
      text: (el, s) => {
        const bet = s.myBet;
        if (!bet) return "";
        const unit = s.game ? s.game.resultUnit : "";
        const value = bet.guess > 0 ? `+${bet.guess}` : String(bet.guess);
        return `${value}${unit}`;
      },
      fontSize: "C",
      lineHeight: "C",
      fontWeight: "800",
      letterSpacing: "-X"
    }
  },
  PlaceButton: {
    extends: "Button",
    background: "brand",
    color: "white",
    ":hover": { background: "brand+8" },
    round: "Y",
    padding: "Z B",
    fontSize: "A",
    fontWeight: "700",
    letterSpacing: "X",
    textTransform: "uppercase",
    cursor: "pointer",
    transition: "A defaultBezier",
    transitionProperty: "opacity, background",
    opacity: (el, s) => !s.myBet && s.phase === "betting" ? "1" : ".45",
    pointerEvents: (el, s) => !s.myBet && s.phase === "betting" ? "auto" : "none",
    ":focus-visible": { outline: "2px solid currentColor", outlineOffset: "2px" },
    onClick: (e, el, s) => {
      if (s.myBet || s.phase !== "betting") return;
      const guess = s.myGuess == null ? 0 : s.myGuess;
      s.update({ myBet: { guess, stake: 20 } });
    },
    PlaceLabel: {
      tag: "span",
      text: "{{ placeBet | polyglot }}",
      display: (el, s) => s.myBet ? "none" : "inline"
    },
    PlacedButtonLabel: {
      tag: "span",
      text: "{{ betPlaced | polyglot }}",
      display: (el, s) => s.myBet ? "inline" : "none"
    }
  }
};

// symbols/components/HistoryRow.js
var HistoryRow = {
  flow: "x",
  align: "center space-between",
  gap: "A",
  padding: "X 0",
  borderBottom: "1px solid neutral.2",
  RoundTag: {
    tag: "span",
    text: (el, s) => `#${s.roundIndex}`,
    fontSize: "Z",
    theme: "muted"
  },
  ResultText: {
    tag: "span",
    text: (el, s) => {
      const value = s.value > 0 ? `+${s.value}` : String(s.value);
      return `${value}${s.unit}`;
    },
    fontSize: "A",
    fontWeight: "600",
    color: (el, s) => Math.abs(s.value) <= 1 ? "mint" : "currentColor"
  }
};

// symbols/components/HistoryPanel.js
var HistoryPanel = {
  flow: "y",
  align: "flex-start flex-start",
  gap: "Y",
  padding: "A",
  round: "Z",
  theme: "surface",
  border: "1px solid neutral.2",
  minWidth: "11em",
  display: (el, s) => s.screen === "playing" ? "flex" : "none",
  HistoryHead: {
    tag: "button",
    flow: "x",
    align: "center space-between",
    gap: "A",
    width: "100%",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "0",
    ":focus-visible": { outline: "2px solid currentColor", outlineOffset: "2px" },
    onClick: (e, el, s) => {
      const open = s.historyOpen !== false;
      s.update({ historyOpen: !open });
    },
    HistoryTitle: {
      tag: "span",
      text: "{{ historyTitle | polyglot }}",
      fontSize: "Z",
      fontWeight: "600",
      letterSpacing: "X",
      textTransform: "uppercase",
      theme: "muted"
    },
    HistoryChevron: {
      tag: "span",
      text: (el, s) => s.historyOpen !== false ? "\u25BE" : "\u25B8",
      fontSize: "Z",
      theme: "muted"
    }
  },
  HistoryList: {
    flow: "y",
    align: "stretch flex-start",
    gap: "0",
    width: "100%",
    fontVariantNumeric: "tabular-nums",
    display: (el, s) => s.historyOpen !== false ? "flex" : "none",
    childrenAs: "state",
    children: (el, s) => (s.history || []).slice().sort((a, b) => b.roundIndex - a.roundIndex).slice(0, 8),
    childExtends: "HistoryRow"
  },
  HistoryEmpty: {
    tag: "span",
    text: "{{ historyEmpty | polyglot }}",
    fontSize: "Z",
    theme: "muted",
    display: (el, s) => s.historyOpen !== false && !(s.history && s.history.length) ? "inline" : "none"
  }
};

// symbols/components/ResultsCard.js
var ResultsCard = {
  flow: "y",
  align: "center center",
  gap: "A",
  padding: "B C",
  round: "Z",
  theme: "surface",
  textAlign: "center",
  transition: "A defaultBezier",
  transitionProperty: "border-color",
  border: "1px solid neutral.2",
  borderColor: (el, s) => s.settlement && s.settlement.iWon ? "mint" : "neutral.2",
  display: (el, s) => s.screen === "playing" && s.phase === "results" && s.result ? "flex" : "none",
  ResultKicker: {
    tag: "span",
    text: "{{ resultKicker | polyglot }}",
    fontSize: "Z",
    fontWeight: "700",
    letterSpacing: "Y",
    textTransform: "uppercase",
    theme: "muted"
  },
  ResultValue: {
    flow: "x",
    align: "baseline center",
    gap: "Y",
    fontVariantNumeric: "tabular-nums",
    ValueNumber: {
      tag: "span",
      text: (el, s) => {
        if (!s.result) return "";
        const value = s.result.value;
        return value > 0 ? `+${value}` : String(value);
      },
      fontSize: "F",
      lineHeight: "E",
      fontWeight: "800",
      letterSpacing: "-Y"
    },
    ValueUnit: {
      tag: "span",
      text: (el, s) => s.result ? s.result.unit : "",
      fontSize: "C",
      theme: "muted"
    }
  },
  WinnerLine: {
    flow: "x",
    align: "baseline center",
    gap: "Y",
    fontSize: "A2",
    WinnerCount: {
      tag: "span",
      text: (el, s) => s.settlement ? String(s.settlement.winnerCount) : "",
      fontWeight: "800"
    },
    WinnerWordOne: {
      tag: "span",
      text: "{{ winnerOne | polyglot }}",
      display: (el, s) => s.settlement && s.settlement.winnerCount === 1 ? "inline" : "none"
    },
    WinnerWordMany: {
      tag: "span",
      text: "{{ winnerMany | polyglot }}",
      display: (el, s) => s.settlement && s.settlement.winnerCount !== 1 ? "inline" : "none"
    },
    WinnerDash: { tag: "span", text: "\u2014", theme: "muted" },
    MultiplierText: {
      tag: "span",
      text: (el, s) => s.settlement ? `\xD7${Number(s.settlement.multiplier).toFixed(2)}` : "",
      fontWeight: "800",
      color: "gold"
    }
  },
  WinBanner: {
    flow: "x",
    align: "baseline center",
    gap: "Y",
    theme: "success",
    round: "Y",
    padding: "Y A",
    display: (el, s) => s.settlement && s.settlement.iWon ? "flex" : "none",
    WinLabel: {
      tag: "span",
      text: "{{ youWon | polyglot }}",
      fontSize: "A",
      fontWeight: "700",
      letterSpacing: "X",
      textTransform: "uppercase"
    },
    WinAmount: {
      tag: "span",
      text: (el, s) => s.settlement ? `+${(s.settlement.myPayout ?? 0).toLocaleString("en-US")}` : "",
      fontSize: "B",
      fontWeight: "800",
      fontVariantNumeric: "tabular-nums"
    },
    WinUnit: {
      tag: "span",
      text: "{{ chipsUnit | polyglot }}",
      fontSize: "Z"
    }
  },
  LossNote: {
    tag: "span",
    text: "{{ notThisTime | polyglot }}",
    fontSize: "A",
    theme: "muted",
    display: (el, s) => s.myBet && s.settlement && !s.settlement.iWon ? "inline" : "none"
  },
  MetaRow: {
    flow: "x",
    align: "baseline center",
    gap: "A",
    flexWrap: "wrap",
    fontSize: "Z",
    fontVariantNumeric: "tabular-nums",
    PlayersMeta: {
      flow: "x",
      align: "baseline flex-start",
      gap: "X",
      MetaValue: {
        tag: "span",
        text: (el, s) => ((s.frozen ? s.frozen.playerCount : s.playerCount) ?? 0).toLocaleString("en-US"),
        fontWeight: "700"
      },
      MetaLabel: { tag: "span", text: "{{ playersMeta | polyglot }}", theme: "muted" }
    },
    PotMeta: {
      flow: "x",
      align: "baseline flex-start",
      gap: "X",
      MetaValue: {
        tag: "span",
        text: (el, s) => ((s.frozen ? s.frozen.pot : s.pot) ?? 0).toLocaleString("en-US"),
        fontWeight: "700"
      },
      MetaLabel: { tag: "span", text: "{{ potMeta | polyglot }}", theme: "muted" }
    },
    RakeMeta: {
      flow: "x",
      align: "baseline flex-start",
      gap: "X",
      MetaValue: { tag: "span", text: "5%", fontWeight: "700" },
      MetaLabel: { tag: "span", text: "{{ rakeMeta | polyglot }}", theme: "muted" }
    },
    MultiplierMeta: {
      flow: "x",
      align: "baseline flex-start",
      gap: "X",
      MetaValue: {
        tag: "span",
        text: (el, s) => s.settlement ? `\xD7${Number(s.settlement.multiplier).toFixed(2)}` : "",
        fontWeight: "700"
      },
      MetaLabel: { tag: "span", text: "{{ multiplierMeta | polyglot }}", theme: "muted" }
    }
  }
};

// symbols/components/BalanceChip.js
var BalanceChip = {
  flow: "x",
  align: "baseline center",
  gap: "Y",
  padding: "Y A",
  round: "Z",
  theme: "surface",
  border: "1px solid neutral.2",
  fontVariantNumeric: "tabular-nums",
  BalanceLabel: {
    tag: "span",
    text: "{{ balanceLabel | polyglot }}",
    fontSize: "Z",
    fontWeight: "600",
    letterSpacing: "X",
    textTransform: "uppercase",
    theme: "muted"
  },
  BalanceValue: {
    tag: "span",
    text: (el, s) => (s.balance ?? 0).toLocaleString("en-US"),
    fontSize: "A2",
    fontWeight: "800",
    letterSpacing: "-X"
  },
  BalanceUnit: {
    tag: "span",
    text: "{{ chipsUnit | polyglot }}",
    fontSize: "Z",
    theme: "muted"
  }
};

// symbols/components/ErrorBanner.js
var ErrorBanner = {
  flow: "x",
  align: "center space-between",
  gap: "A",
  padding: "Y A",
  round: "Z",
  theme: "danger",
  fontWeight: "600",
  display: (el, s) => s.error ? "flex" : "none",
  ErrorText: {
    tag: "span",
    text: (el, s) => s.error || "",
    fontSize: "A",
    lineHeight: "B"
  },
  DismissButton: {
    extends: "Button",
    text: "\xD7",
    fontSize: "B",
    lineHeight: "A",
    fontWeight: "700",
    background: "transparent",
    border: "none",
    padding: "X Y",
    round: "Y",
    cursor: "pointer",
    ":hover": { opacity: ".7" },
    ":focus-visible": { outline: "2px solid currentColor", outlineOffset: "2px" },
    onClick: (e, el, s) => s.update({ error: null })
  }
};

// symbols/functions/index.js
var functions_exports = {};
__export(functions_exports, {
  backToPicker: () => backToPicker,
  phaseOf: () => phaseOf,
  secondsLeft: () => secondsLeft,
  selectGame: () => selectGame,
  serverNow: () => serverNow,
  startEngine: () => startEngine2,
  stopEngine: () => stopEngine,
  submitBet: () => submitBet
});

// symbols/lib/supabase.js
var import_supabase_js = __toESM(require_supabase_js(), 1);
var SUPABASE_URL = "https://xgvuavikubqwsdhoadyw.supabase.co";
var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhndnVhdmlrdWJxd3NkaG9hZHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3NTQ0MTYsImV4cCI6MjEwMzMzMDQxNn0.GDOlD5NQF50uXUyKqQXXDbpJpJh6FKyLKjy1R8qatak";
var supabase = (0, import_supabase_js.createClient)(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});
var userId = null;
function getUserId() {
  return userId;
}
async function bootstrapAuth() {
  const { data: sessionData } = await supabase.auth.getSession();
  let session = sessionData ? sessionData.session : null;
  if (!session) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    session = data ? data.session : null;
  }
  userId = session && session.user ? session.user.id : null;
  const { error: profileError } = await supabase.rpc("ensure_profile");
  if (profileError) throw profileError;
  return userId;
}
var authReady = bootstrapAuth();
supabase.auth.onAuthStateChange((_event, session) => {
  if (session && session.user) userId = session.user.id;
});

// symbols/lib/clock.js
var offset = 0;
async function measure() {
  const t0 = Date.now();
  const { data, error } = await supabase.rpc("server_now");
  const rtt = Date.now() - t0;
  if (error) {
    console.error("[clock] server_now failed, keeping previous offset", error);
    return offset;
  }
  offset = new Date(data).getTime() - (t0 + rtt / 2);
  return offset;
}
var readyPromise = measure();
function serverNow() {
  return Date.now() + offset;
}
function remeasureClock() {
  readyPromise = measure();
  return readyPromise;
}
function clockReady() {
  return readyPromise;
}

// symbols/lib/api.js
function mapGame(row) {
  if (!row) return null;
  return {
    slug: row.slug,
    title: row.title,
    objectiveLine: row.objective_line,
    guessMin: row.guess_min,
    guessMax: row.guess_max,
    guessStep: row.guess_step,
    resultUnit: row.result_unit
  };
}
function mapRound(row) {
  if (!row) return null;
  return {
    id: row.id,
    roundIndex: row.round_index,
    bettingOpensAt: row.betting_opens_at,
    bettingClosesAt: row.betting_closes_at,
    resultVisibleAt: row.result_visible_at,
    resultsEndAt: row.results_end_at,
    videoBetOpenS: Number(row.video_bet_open_s),
    videoRevealS: Number(row.video_reveal_s),
    videoPauseS: Number(row.video_pause_s)
  };
}
async function getGame(slug) {
  await authReady;
  const { data, error } = await supabase.from("games").select(
    "slug, title, objective_line, guess_min, guess_max, guess_step, result_unit, is_active"
  ).eq("slug", slug).eq("is_active", true).maybeSingle();
  if (error) throw error;
  return mapGame(data);
}
async function currentRound(gameId) {
  await authReady;
  const { data: gameRow, error: gameError } = await supabase.from("games").select("id").eq("slug", gameId).maybeSingle();
  if (gameError) throw gameError;
  if (!gameRow) return null;
  const nowIso = new Date(serverNow()).toISOString();
  const { data, error } = await supabase.from("rounds").select(
    "id, round_index, betting_opens_at, betting_closes_at, result_visible_at, results_end_at, video_bet_open_s, video_reveal_s, video_pause_s"
  ).eq("game_id", gameRow.id).gt("results_end_at", nowIso).order("betting_opens_at", { ascending: true }).limit(1).maybeSingle();
  if (error) throw error;
  return mapRound(data);
}
async function placeBet(roundId, guess) {
  await authReady;
  const { data, error } = await supabase.rpc("place_bet", {
    p_round_id: roundId,
    p_guess: guess
  });
  if (error) throw error;
  return data;
}
async function myBet(roundId) {
  await authReady;
  const { data, error } = await supabase.from("bets").select("guess, stake").eq("round_id", roundId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { guess: data.guess, stake: data.stake };
}
async function roundStats(roundId) {
  await authReady;
  const { data, error } = await supabase.from("round_stats").select("player_count, pot").eq("round_id", roundId).maybeSingle();
  if (error) throw error;
  return {
    playerCount: data ? Number(data.player_count) || 0 : 0,
    pot: data ? Number(data.pot) || 0 : 0
  };
}
async function roundResult(roundId) {
  await authReady;
  const { data, error } = await supabase.from("round_results").select("result_value, recorded_at").eq("round_id", roundId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { value: data.result_value, recordedAt: data.recorded_at };
}
async function settlement(roundId) {
  await authReady;
  const { data: roundRow, error: roundError } = await supabase.from("rounds").select("settled_at").eq("id", roundId).maybeSingle();
  if (roundError) throw roundError;
  if (!roundRow || !roundRow.settled_at) return null;
  const [{ playerCount }, ledgerResult] = await Promise.all([
    roundStats(roundId),
    supabase.from("chip_ledger").select("amount").eq("round_id", roundId).eq("kind", "payout").maybeSingle()
  ]);
  if (ledgerResult.error) throw ledgerResult.error;
  const myPayout = ledgerResult.data ? Number(ledgerResult.data.amount) : 0;
  const iWon = myPayout > 0;
  return {
    playerCount,
    iWon,
    myPayout,
    // winnerCount/multiplier are not exposed by a dedicated read path yet —
    // see the ambiguity note in the final report. Left null rather than
    // guessed at.
    winnerCount: null,
    multiplier: null,
    payout: myPayout
  };
}
async function balance() {
  await authReady;
  const { data, error } = await supabase.from("balances").select("balance").maybeSingle();
  if (error) throw error;
  return data ? Number(data.balance) : 0;
}
async function history(gameId, limit = 8) {
  await authReady;
  const { data: gameRow, error: gameError } = await supabase.from("games").select("id").eq("slug", gameId).maybeSingle();
  if (gameError) throw gameError;
  if (!gameRow) return [];
  const { data, error } = await supabase.from("rounds").select("id, round_index, result_visible_at, round_results(result_value, recorded_at)").eq("game_id", gameRow.id).order("round_index", { ascending: false }).limit(limit);
  if (error) throw error;
  return (data || []).filter((row) => row.round_results && row.round_results.result_value != null).map((row) => ({
    roundId: row.id,
    roundIndex: row.round_index,
    value: row.round_results.result_value,
    revealedAt: row.round_results.recorded_at
  }));
}

// symbols/lib/round.js
function toMs(value) {
  return new Date(value).getTime();
}
var LOCKED_MS = 5e3;
function phaseOf(round, now) {
  if (!round) return "preview";
  const opens = toMs(round.bettingOpensAt);
  const closes = toMs(round.bettingClosesAt);
  const visible = toMs(round.resultVisibleAt);
  const ends = toMs(round.resultsEndAt);
  if (now < opens) return "preview";
  if (now < closes) return "betting";
  if (now < Math.min(closes + LOCKED_MS, visible)) return "locked";
  if (now < visible) return "reveal";
  if (now < ends) return "results";
  return "results";
}
function secondsLeft(round, now) {
  if (!round) return 0;
  const phase = phaseOf(round, now);
  let target;
  switch (phase) {
    case "preview":
      target = round.bettingOpensAt;
      break;
    case "betting":
      target = round.bettingClosesAt;
      break;
    case "locked":
      target = round.resultVisibleAt;
      break;
    case "reveal":
      target = round.resultsEndAt;
      break;
    default:
      return 0;
  }
  const ms = toMs(target) - now;
  return ms > 0 ? Math.ceil(ms / 1e3) : 0;
}

// symbols/lib/realtime.js
var activeChannels = /* @__PURE__ */ new Map();
function teardown(key) {
  const channel = activeChannels.get(key);
  if (channel) {
    supabase.removeChannel(channel);
    activeChannels.delete(key);
  }
}
function subscribeRoundAggregates(roundId, onChange) {
  const key = `aggregates:${roundId}`;
  teardown(key);
  const channel = supabase.channel(`round-stats-${roundId}`).on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "round_stats",
      filter: `round_id=eq.${roundId}`
    },
    (payload) => {
      const row = payload.new || payload.old;
      if (!row) return;
      onChange({
        playerCount: Number(row.player_count) || 0,
        pot: Number(row.pot) || 0
      });
    }
  ).subscribe((status) => onStatusChange(status));
  activeChannels.set(key, channel);
  return () => teardown(key);
}
function subscribeOwnBet(roundId, userId2, onBet) {
  const key = `own-bet:${roundId}:${userId2}`;
  teardown(key);
  const channel = supabase.channel(`own-bet-${roundId}-${userId2}`).on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "bets",
      filter: `user_id=eq.${userId2}`
    },
    (payload) => {
      const row = payload.new;
      if (!row || row.round_id !== roundId) return;
      onBet({ guess: row.guess, stake: row.stake });
    }
  ).subscribe((status) => onStatusChange(status));
  activeChannels.set(key, channel);
  return () => teardown(key);
}
function onStatusChange(status) {
  if (status === "SUBSCRIBED") remeasureClock();
}
function unsubscribeAll() {
  for (const key of Array.from(activeChannels.keys())) teardown(key);
}

// symbols/lib/engine.js
var TICK_MS = 250;
var STATS_POLL_MS = 1500;
var timer = null;
var advancing = false;
var lastStatsPollAt = 0;
function startEngine2(state) {
  if (timer) return stopEngine;
  bootstrap(state);
  timer = setInterval(() => tick(state), TICK_MS);
  return stopEngine;
}
function stopEngine() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  unsubscribeAll();
}
async function bootstrap(state) {
  try {
    await authReady;
    await clockReady();
    state.balance = await balance();
  } catch (err) {
    state.error = describeError(err);
  }
}
async function selectGame(state, slug) {
  state.error = null;
  try {
    await authReady;
    const game = await getGame(slug);
    if (!game) {
      state.error = `Game "${slug}" was not found.`;
      return;
    }
    state.game = game;
    state.screen = "playing";
    state.history = await history(slug, 8);
    const round = await currentRound(slug);
    if (!round) {
      state.round = null;
      state.error = "No upcoming round for this game right now. Try again shortly.";
      return;
    }
    await loadRound(state, round);
  } catch (err) {
    state.error = describeError(err);
  }
}
function backToPicker(state) {
  unsubscribeAll();
  state.screen = "picker";
  state.game = null;
  state.round = null;
  state.phase = "preview";
  state.secondsLeft = 0;
  state.playerCount = 0;
  state.pot = 0;
  state.frozen = null;
  state.myGuess = null;
  state.myBet = null;
  state.result = null;
  state.settlement = null;
  state.error = null;
}
async function submitBet(state, guess) {
  if (!state.round) {
    state.error = "There is no active round to bet on.";
    return;
  }
  state.error = null;
  try {
    await placeBet(state.round.id, guess);
    const confirmed = await myBet(state.round.id);
    if (confirmed) {
      state.myBet = confirmed;
      state.myGuess = confirmed.guess;
    }
    state.balance = await balance();
  } catch (err) {
    state.error = describeError(err);
  }
}
async function loadRound(state, round) {
  unsubscribeAll();
  lastStatsPollAt = 0;
  state.round = round;
  state.myGuess = null;
  state.myBet = null;
  state.result = null;
  state.settlement = null;
  state.frozen = null;
  const now = serverNow();
  state.phase = phaseOf(round, now);
  state.secondsLeft = secondsLeft(round, now);
  try {
    const [stats, existingBet] = await Promise.all([
      roundStats(round.id),
      myBet(round.id)
    ]);
    if (!state.round || state.round.id !== round.id) return;
    state.playerCount = stats.playerCount;
    state.pot = stats.pot;
    if (existingBet) {
      state.myBet = existingBet;
      state.myGuess = existingBet.guess;
    }
    if (state.phase !== "preview" && state.phase !== "betting") {
      state.frozen = { playerCount: stats.playerCount, pot: stats.pot };
    }
    if (state.phase === "reveal" || state.phase === "results") {
      const result = await roundResult(round.id);
      if (result) {
        state.result = { value: result.value, unit: state.game ? state.game.resultUnit : "" };
      }
    }
    if (state.phase === "results") {
      const info = await settlement(round.id);
      if (info) state.settlement = info;
    }
  } catch (err) {
    state.error = describeError(err);
  }
  const roundId = round.id;
  subscribeRoundAggregates(roundId, ({ playerCount, pot }) => {
    if (!state.round || state.round.id !== roundId) return;
    if (state.phase !== "preview" && state.phase !== "betting") return;
    state.playerCount = playerCount;
    state.pot = pot;
  });
  const userId2 = getUserId();
  if (userId2) {
    subscribeOwnBet(roundId, userId2, ({ guess, stake }) => {
      if (!state.round || state.round.id !== roundId) return;
      state.myBet = { guess, stake };
      state.myGuess = guess;
    });
  }
}
async function advanceRound(state) {
  if (advancing || !state.game) return;
  advancing = true;
  try {
    const nextRound = await currentRound(state.game.slug);
    if (nextRound && (!state.round || nextRound.id !== state.round.id)) {
      await loadRound(state, nextRound);
      state.history = await history(state.game.slug, 8);
    }
  } catch (err) {
    state.error = describeError(err);
  } finally {
    advancing = false;
  }
}
function tick(state) {
  if (!state.round) return;
  const now = serverNow();
  const nextPhase = phaseOf(state.round, now);
  state.secondsLeft = secondsLeft(state.round, now);
  if (nextPhase !== state.phase) {
    const prevPhase = state.phase;
    state.phase = nextPhase;
    onPhaseChange(state, prevPhase, nextPhase);
  } else if ((nextPhase === "preview" || nextPhase === "betting") && now - lastStatsPollAt >= STATS_POLL_MS) {
    lastStatsPollAt = now;
    pollStats(state);
  }
  if (nextPhase === "results" && now >= new Date(state.round.resultsEndAt).getTime()) {
    advanceRound(state);
  }
}
function onPhaseChange(state, from, to) {
  if (to === "locked" && from !== "locked") {
    state.frozen = { playerCount: state.playerCount, pot: state.pot };
  }
  reconcile(state, to);
}
async function reconcile(state, phase) {
  const round = state.round;
  if (!round) return;
  try {
    if (phase === "preview" || phase === "betting") {
      const stats = await roundStats(round.id);
      if (isCurrent(state, round)) {
        state.playerCount = stats.playerCount;
        state.pot = stats.pot;
      }
    } else if (phase === "locked") {
      const stats = await roundStats(round.id);
      if (isCurrent(state, round)) {
        state.frozen = { playerCount: stats.playerCount, pot: stats.pot };
        state.playerCount = stats.playerCount;
        state.pot = stats.pot;
      }
    } else if (phase === "reveal") {
      const result = await roundResult(round.id);
      if (result && isCurrent(state, round)) {
        state.result = { value: result.value, unit: state.game ? state.game.resultUnit : "" };
      }
    } else if (phase === "results") {
      const [info, freshBalance] = await Promise.all([
        settlement(round.id),
        balance()
      ]);
      if (isCurrent(state, round)) {
        if (info) state.settlement = info;
        state.balance = freshBalance;
      }
    }
  } catch (err) {
    state.error = describeError(err);
  }
}
async function pollStats(state) {
  const round = state.round;
  if (!round) return;
  try {
    const stats = await roundStats(round.id);
    if (isCurrent(state, round) && (state.phase === "preview" || state.phase === "betting")) {
      state.playerCount = stats.playerCount;
      state.pot = stats.pot;
    }
  } catch (err) {
  }
}
function isCurrent(state, round) {
  return !!state.round && state.round.id === round.id;
}
function describeError(err) {
  if (!err) return "Something went wrong. Please try again.";
  return err.message || String(err);
}

// symbols/designSystem/color.js
var color_default = {
  black: "#0B0B0D",
  white: "#F4F4F6",
  brand: "#D2352A",
  neutral: "#8C8C95",
  ember: "#FF453A",
  mint: "#2FA36B",
  gold: "#E9B949"
};

// symbols/designSystem/theme.js
var theme_default = {
  document: {
    "@light": { background: "white", color: "black" },
    "@dark": { background: "black", color: "white" }
  },
  surface: {
    "@light": { background: "white-4", color: "black" },
    "@dark": { background: "black+6", color: "white" }
  },
  muted: {
    "@light": { color: "black+35" },
    "@dark": { color: "white-35" }
  },
  primary: {
    background: "brand",
    color: "white",
    ":hover": { background: "brand+8" }
  },
  danger: {
    "@light": { background: "ember", color: "white" },
    "@dark": { background: "ember", color: "white" }
  },
  success: {
    "@light": { background: "mint", color: "white" },
    "@dark": { background: "mint", color: "white" }
  },
  locked: {
    "@light": { background: "black", color: "white" },
    "@dark": { background: "white", color: "black" }
  }
};

// symbols/designSystem/typography.js
var typography_default = {
  base: 16,
  ratio: 1.25,
  subSequence: true
};

// symbols/designSystem/spacing.js
var spacing_default = {
  base: 16,
  ratio: 1.618,
  subSequence: true
};

// symbols/designSystem/timing.js
var timing_default = {
  defaultBezier: "cubic-bezier(.29, .67, .51, .97)"
};

// symbols/designSystem/index.js
var designSystem_default = { color: color_default, theme: theme_default, typography: typography_default, spacing: spacing_default, timing: timing_default };

// symbols/pages/main.js
var main = {
  extends: "Page",
  position: "relative",
  flow: "y",
  width: "100%",
  minHeight: "100vh",
  overflow: "hidden",
  theme: "document",
  metadata: {
    title: "{{ appMetaTitle | polyglot }}",
    description: "{{ appMetaDescription | polyglot }}"
  },
  // ---- start screen -------------------------------------------------------
  Picker: {
    display: (el, s) => s.screen === "picker" ? "flex" : "none",
    flow: "y",
    align: "center center",
    width: "100%",
    minHeight: "100vh",
    padding: "C",
    GamePicker: {}
  },
  // ---- betting stage ------------------------------------------------------
  Stage: {
    display: (el, s) => s.screen === "playing" ? "block" : "none",
    position: "relative",
    width: "100%",
    minHeight: "100vh",
    Surface: {
      tag: "video",
      position: "absolute",
      inset: "0 0 0 0",
      width: "100%",
      height: "100%",
      objectFit: "cover",
      attr: {
        playsinline: "true",
        preload: "auto",
        muted: "true"
      },
      src: (el, s) => s.game ? `/videos/${s.game.slug === "water_200g" ? "water" : "banana"}.mov` : null
    },
    Scrim: {
      position: "absolute",
      inset: "0 0 0 0",
      background: "rgba(0,0,0,.42)"
    },
    TopLeft: {
      position: "absolute",
      top: "B",
      left: "B",
      flow: "y",
      gap: "Y",
      CrowdCounter: {}
    },
    TopCentre: {
      position: "absolute",
      top: "B",
      left: "50%",
      transform: "translateX(-50%)",
      flow: "y",
      align: "center center",
      gap: "Y",
      TimerChip: {},
      ObjectiveBanner: {}
    },
    TopRight: {
      position: "absolute",
      top: "B",
      right: "B",
      BalanceChip: {}
    },
    RightRail: {
      position: "absolute",
      top: "30%",
      right: "B",
      HistoryPanel: {}
    },
    BottomCentre: {
      position: "absolute",
      bottom: "B",
      left: "50%",
      transform: "translateX(-50%)",
      flow: "y",
      align: "center center",
      gap: "Y",
      ErrorBanner: {},
      BetPanel: {}
    },
    Centre: {
      display: (el, s) => s.phase === "results" ? "flex" : "none",
      position: "absolute",
      inset: "0 0 0 0",
      align: "center center",
      ResultsCard: {}
    }
  }
};

// symbols/pages/index.js
var pages_default = {
  "/": main
};

// symbols/state.js
var state_default = {
  // 'picker' — GamePicker is shown. 'playing' — BettingStage is shown.
  screen: "picker",
  // { slug, title, objectiveLine, guessMin, guessMax, guessStep, resultUnit }
  game: null,
  // { id, roundIndex, bettingOpensAt, bettingClosesAt, revealAt,
  //   resultsEndAt, videoBetOpenS, videoRevealS, videoPauseS }
  round: null,
  // 'preview' | 'betting' | 'locked' | 'reveal' | 'results'
  phase: "preview",
  // Countdown for the current phase, in whole seconds.
  secondsLeft: 0,
  // Live player count for the current round (pre-lock: ticking; post-lock:
  // equal to state.frozen.playerCount).
  playerCount: 0,
  // Live pot for the current round (pre-lock: ticking; post-lock: equal to
  // state.frozen.pot).
  pot: 0,
  // { playerCount, pot } snapshot taken the instant phase first becomes
  // 'locked'. null before that moment. This freeze is the product's core
  // demonstration — once set, playerCount/pot stop changing on screen.
  frozen: null,
  // The guess currently selected in BetPanel, before it is submitted.
  myGuess: null,
  // { guess, stake } once the caller's bet for this round is confirmed by
  // the server. null until then.
  myBet: null,
  // { value, unit } — set once the round enters 'reveal'. null before that.
  result: null,
  // { winnerCount, multiplier, payout, iWon, myPayout } — set once the
  // round enters 'results' and settlement has been fetched. null before
  // that.
  settlement: null,
  // Current chip balance, from the ledger-backed `balances` cache.
  balance: 0,
  // Last N results for the current game, newest first.
  history: [],
  // Human-readable message for the last failed action (most importantly: a
  // bet the server rejected). null when there is nothing to show. Never
  // swallowed — see docs/integrity.md §3's acceptance test.
  error: null
};

// symbols/config.js
var config_default = {
  useReset: true,
  useVariable: true,
  useFontImport: true,
  useIconSprite: true,
  useSvgSprite: true,
  useDefaultConfig: true,
  useDocumentTheme: true,
  verbose: false,
  polyglot: {
    defaultLang: "en",
    languages: ["en"],
    storageLangKey: "zse_lang",
    storagePrefix: "zse_t_",
    translations: {
      en: {
        appMetaTitle: "Zero Sum Entertainment",
        appMetaDescription: "Guess how far off the attempt lands. Closest ten percent split the pot.",
        brandName: "Zero Sum Entertainment",
        navWork: "Work",
        navAbout: "About",
        heroTagline: "Stories where somebody has to lose.",
        heroLead: "An independent production house making film and television with teeth.",
        heroAction: "About the company",
        workTitle: "Selected productions",
        contactTitle: "Bring us a story",
        contactLead: "We read everything. Development, co-production, and finishing enquiries all welcome.",
        aboutTitle: "About Zero Sum",
        aboutBody: "We develop and produce a small number of projects each year, and we stay on them from first draft to final mix. No slate padding, no work for hire we do not believe in.",
        backHome: "Back to the work",
        homeMetaTitle: "Zero Sum Entertainment",
        homeMetaDescription: "Independent film and television production. Selected work and contact.",
        aboutMetaTitle: "About \u2014 Zero Sum Entertainment",
        aboutMetaDescription: "How Zero Sum Entertainment develops and produces film and television.",
        pickerKicker: "Zero Sum",
        pickerTitle: "Pick your game",
        pickerLead: "A host attempts a precise physical task. You bet on how far off it lands. The closest guesses split the pot.",
        pickerHonesty: "Once betting locks, nothing can change \u2014 not the bets, not the crowd, not the pot, not the result.",
        bananaTitle: "Banana Cut",
        bananaObjective: "One cut, exactly in half. Bet on how many grams off the cut lands.",
        waterTitle: "Water Pour",
        waterObjective: "One pour, exactly 200 g. Bet on how many grams off the pour lands.",
        gameRange: "Guess \u221220 to +20 g",
        gameStake: "Fixed stake 20 chips",
        playNow: "Play \u2192",
        timerPreview: "Bets open in",
        timerBetting: "Bets close in",
        timerLocked: "Locked",
        timerResults: "Next round in",
        objectiveKicker: "Objective",
        rakeNote: "Closest 10% split the pot \xB7 5% rake",
        crowdTitle: "The crowd",
        liveBadge: "Live",
        lockedBadge: "Locked",
        lockedNote: "Frozen at lock",
        playersLabel: "Players",
        potLabel: "Pot",
        chipsUnit: "chips",
        betPrompt: "How far off?",
        placeBet: "Place bet (20 chips)",
        betPlaced: "Bet placed",
        yourGuess: "Your guess:",
        historyTitle: "Last results",
        historyEmpty: "No rounds yet",
        resultKicker: "Result",
        winnerOne: "player nailed it",
        winnerMany: "players nailed it",
        youWon: "You won",
        notThisTime: "Not this time. Next round is seconds away.",
        playersMeta: "players",
        potMeta: "pot",
        rakeMeta: "rake",
        multiplierMeta: "multiplier",
        balanceLabel: "Balance"
      }
    }
  }
};

// symbols/context.js
var context_default = {
  ...config_default,
  state: state_default,
  components: components_exports,
  functions: functions_exports,
  pages: pages_default,
  designSystem: designSystem_default
};
if (typeof window !== "undefined") {
  queueMicrotask(() => startEngine(state_default));
}
