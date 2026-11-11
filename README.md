# Монстроферма · Monster Ranch

An idle/incremental game for **Yandex Games**: raise cute monsters, tap the big slime, harvest goo (Слизь 🟢) and climb three prestige layers.
Pure HTML5 + Canvas/DOM and vanilla JS. No engines, no CDN, no external requests, no images. The build is three files (~190 KB total).

```
index.html   — markup, loads /sdk.js (Yandex) and game.js
style.css    — all visuals (mobile-first, desktop two-column layout)
game.js      — CONFIG + game modules (comments in Russian)
```

## Concept

**Тон:** friendly night-time ranch, light humor in every description ("Will work for brains. The union is concerned.").
**Visual identity:** dusk-purple sky, slime-green (#8be37a) and gold (#ffd166) accents, rounded "squishy" cards. A big wobbly canvas-drawn monster squishes, blinks and follows your taps. Its color shifts with every rebirth/ascension, and bought creatures walk along the fence.

Currencies: **Слизь / Goo 🟢** (main), **Мутаген / Mutagen 🧪** (prestige 1), **Лунные камни / Moonstones 🌙** (prestige 2), **Руны / Runes 🔮** (prestige 3).

## Content

* **15 buildings** (see the balance table): Goo Worm → Void Leviathan.
* **Upgrades:** 90 building upgrades (x2 at 10/25/50, x3 at 100/200/400), 12 global, 10 tap upgrades.
* **Helpers:** auto-tapper (10 levels) + one manager per building (auto-buy, on/off toggle).
* **Prestige 1, Rebirth:** `floor(sqrt(run_earned / 1e12))` mutagen. Each point gives +1% income. Mutation Tree has 24 nodes with dependencies.
* **Prestige 2, Ascension:** unlocks after 8 rebirths. `floor((lg(mutagen/3e4)+1)^1.5)` moonstones, +25% income each. Moon Tree has 13 nodes.
* **Prestige 3, Awakening of the Ancients:** after 5 ascensions. `floor((lg(moonstones/1000)+1)^1.5)` runes, +100% income each. Rune Tree has 8 nodes.
* **52 achievements** (+1% income each, never reset), toast notifications.
* **Daily:** 3 tasks per day (+1 ad slot), weekly challenge (x2 income for 2 h + reward), 7-day login streak.
* **Golden slime:** every 1–3 min. Gives either x3 income for 30 s or an instant reward of 5 min of income. A missed slime can be brought back with an ad.
* **Offline income:** 2 h cap at 50% efficiency (the trees raise both). "While you were away" window with **Claim x2 (ad)**.
* **Other:** combo multiplier for fast taps (up to x2, extendable), BigNum (`BN` class, mantissa/exponent), K/M/B/T/Qa… suffixes then scientific notation, statistics, settings (sound, music, RU/EN, reset with double confirm), Web Audio SFX + generative music, 60 s tutorial then non-intrusive tips.

## Balance

All constants live in `CONFIG` at the top of `game.js`. Cost of the n-th unit = `base * growth^n` (1.15 for early buildings, rising to 1.25 for late ones).

| # | Building | | 1st unit cost | Growth | Goo/sec | Payback, s | 10th unit | 25th unit | 100th unit | x2 upgrade (10 owned) |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Слизевик / Goo Worm | 🐛 | 10 | 1.15 | 0.5 | 20 | 35.2 | 286.3 | 1.02e7 | 242.7 |
| 2 | Грибной гоблин / Shroom Goblin | 🍄 | 120 | 1.15 | 3.5 | 34 | 422.1 | 3.44e3 | 1.23e8 | 2.91e3 |
| 3 | Мышиный курятник / Bat Coop | 🦇 | 1.5e3 | 1.15 | 25 | 60 | 5.28e3 | 4.29e4 | 1.53e9 | 3.64e4 |
| 4 | Жабозавр / Toadzilla | 🐸 | 2e4 | 1.15 | 160 | 125 | 7.04e4 | 5.73e5 | 2.04e10 | 4.85e5 |
| 5 | Паучья ткацкая / Spider Loom | 🕷️ | 3e5 | 1.15 | 1e3 | 300 | 1.06e6 | 8.59e6 | 3.06e11 | 7.28e6 |
| 6 | Призрачная дойка / Ghost Dairy | 👻 | 4.5e6 | 1.16 | 6.5e3 | 692 | 1.71e7 | 1.59e8 | 1.08e13 | 1.19e8 |
| 7 | Щупальцевый сад / Tentacle Garden | 🐙 | 7e7 | 1.17 | 4.2e4 | 1667 | 2.88e8 | 3.03e9 | 3.94e14 | 2.02e9 |
| 8 | Зомби-сад / Zombie Orchard | 🧟 | 1.1e9 | 1.18 | 2.7e5 | 4074 | 4.88e9 | 5.84e10 | 1.44e16 | 3.45e10 |
| 9 | Дино-ранчо / Dino Ranch | 🦖 | 1.8e10 | 1.19 | 1.8e6 | 1e4 | 8.61e10 | 1.17e12 | 5.43e17 | 6.15e11 |
| 10 | Драконий инкубатор / Dragon Hatchery | 🐲 | 3e11 | 1.2 | 1.2e7 | 2.5e4 | 1.55e12 | 2.38e13 | 2.07e19 | 1.11e13 |
| 11 | Мельница огров / Ogre Mill | 👹 | 1e13 | 1.21 | 6e7 | 1.7e5 | 5.56e13 | 9.7e14 | 1.57e21 | 4.04e14 |
| 12 | Аквариум кракена / Kraken Tank | 🦑 | 4e14 | 1.22 | 3e8 | 1.3e6 | 2.39e15 | 4.73e16 | 1.42e23 | 1.75e16 |
| 13 | Инопланетный амбар / Alien Barn | 👾 | 2e16 | 1.23 | 1.5e9 | 1.3e7 | 1.29e17 | 2.88e18 | 1.59e25 | 9.51e17 |
| 14 | Лавовая кузня / Lava Forge | 🌋 | 1e18 | 1.24 | 7.5e9 | 1.3e8 | 6.93e18 | 1.75e20 | 1.77e27 | 5.16e19 |
| 15 | Левиафан Пустоты / Void Leviathan | 🌌 | 6e19 | 1.25 | 3.5e10 | 1.7e9 | 4.47e20 | 1.27e22 | 2.36e29 | 3.35e21 |

Late buildings look useless at base payback. They become worth buying once the global upgrades and prestige multipliers stack up, which is what stretches progression over weeks.

**Simulation results** (a greedy bot playing against the real `game.js` economy: taps 4/s for the first 10 min, then less; catches every golden slime; no ads):

| Milestone | Target | Bot result |
|---|---|---|
| First purchases | every 10–20 s | 3, 5, 6, 8, 10, 12, 23 s… |
| First upgrade | ~30 s | 38 s |
| First rebirth (1e12 goo) | 30–60 min | 40–42 min |
| Ascension unlock | 6–12 h | ~4 h for an always-online optimal bot (≈16 rebirths); a real player with breaks and offline at 50% lands in the 6–12 h window |
| Awakening | weeks | 5 ascensions + 1000 moonstones; the bot had 242 moonstones after 30 h |

## Yandex SDK integration

* `<script src="/sdk.js">` and `YaGames.init()` inside the `YandexPlatform` implementation. A `StubPlatform` with the same API (`init, showRewarded, showInterstitial, save, load, getLang, gameplayStart, gameplayStop, ready`) is used automatically when the SDK is missing (local debug, fake 1 s "ad" overlay).
* `LoadingAPI.ready()` is called exactly once, after the save is loaded and the first frame is ready.
* `GameplayAPI.start()/stop()` follow the real state: stopped for modals/menus, ads, hidden tab or lost focus, and SDK `game_api_pause`.
* Language comes from `ysdk.environment.i18n.lang` (ru/be/kk/uk/uz → ru, everything else → en) and can be overridden in Settings.
* Saves go to `player.setData/getData` (throttled to once per 30 s, forced on prestige/hide) with a localStorage backup. The newer save wins. Each save is versioned (`saveVersion`) and passed through migrations, then deep-merged with defaults and sanitized (NaN, Infinity, negatives, unknown ids).
* Rewarded ads use `showRewardedVideo`, and the reward is applied **only in `onRewarded`**. Per-reward cooldowns are shown as bars. Errors show a polite toast.
* Fullscreen ads use `showFullscreenAdv` at most once per 3.5 min, never in the first 3 min, and only after prestige or closing the offline window.
* Sound and the game loop pause during ads, on `visibilitychange`/`blur`, and resume afterwards. Missed time is credited through the offline logic.
* Context menu, text selection, drag, double-tap and pinch zoom are disabled.

## Run locally

```bash
python3 -m http.server 8080   # then open http://localhost:8080
```

`/sdk.js` 404s locally. That is expected: the stub platform takes over.

## Checklist before submitting to Yandex moderation

- [ ] Upload a zip containing `index.html`, `style.css` and `game.js` at the archive root (not inside a folder).
- [ ] The game starts in the Yandex draft preview, the loading screen disappears and the first frame is interactive. `LoadingAPI.ready` shows in the console/draft checks.
- [ ] Rewarded ads: each of the 6 buttons pays out only after a full view. Closing early gives no reward. Sound is muted during the ad.
- [ ] Fullscreen ads are not shown more than once per ~3.5 min and never right after a tap/purchase.
- [ ] Minimize the tab or switch apps: music stops, and the game resumes correctly (offline window after >60 s).
- [ ] Language: open the draft with `?lang=en` and `?lang=ru`. No mixed-language strings.
- [ ] Cloud save: play, reload on another device/browser with the same account, and confirm progress is restored.
- [ ] Mobile portrait (360×640 and 390×844) and desktop (1280×720): no cut-off buttons, no page scrolling, no zoom on double tap.
- [ ] No `alert/confirm/prompt`, no external requests (check the Network tab), no errors in the console.
- [ ] Achievements, daily tasks, login bonus and golden slime all work after a reload.
- [ ] Turn off sound and music in Settings, reload, and confirm the settings are kept.

## What to replace or configure

* **Name:** "Монстроферма" / "Monster Ranch" (change `title` in `I18N` and `<title>` if you rename the game).
* **Icon (512×512)** and **cover (800×470)**: export the canvas monster (screenshot) or draw them in your own style. The platform requires them in the console.
* **Description and promo texts** (RU/EN) for the catalog page, plus 3–5 screenshots (portrait and landscape).
* **Age rating:** 0+ (no violence; cartoon monsters).
* **Save key:** `CONFIG.saveKey`. Bump `CONFIG.saveVersion` and add a `MIGRATIONS[n]` entry when the save format changes.
* **Balance:** everything is in `CONFIG` (buildings, upgrades, trees, golden slime, offline, ads cooldowns/intervals).
* In the Yandex console, enable **cloud saves** (player data). No authorization scope is requested (`getPlayer({ scopes: false })`).
