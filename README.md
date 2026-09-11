# 俄罗斯方块 · Tetris

Classic 10×20 Tetris — vanilla HTML / CSS / JS, no build step.

## Open / Play

**Option A — open the file**

```bash
# macOS
open /workspace/tetris/index.html
# Linux
xdg-open /workspace/tetris/index.html
```

Or double-click `index.html` in a file browser.

**Option B — local server (recommended)**

```bash
cd /workspace/tetris
python3 -m http.server 8080
```

Then visit http://localhost:8080/

## Controls

| Key | Action |
|-----|--------|
| ← → / A D | Move |
| ↓ / S | Soft drop |
| ↑ / X / W | Rotate CW |
| Z | Rotate CCW |
| Space | Hard drop |
| P | Pause |
| R | Start / Restart |

On phones, use the on-screen control pad (hold left/right/soft-drop to repeat). Tap **编辑布局** to rearrange buttons; layout is saved in `localStorage`. Game does **not** auto-start — press **开始** (side rail / overlay; becomes **重新开始** while a run is in progress).

**Board gestures** (only on the playfield / `#board`, not the whole page):

| Gesture | Action |
|---------|--------|
| Swipe left / right | Move piece one cell (drag further to keep stepping) |
| Tap (little movement) | Hard drop |
| Vertical swipe | Ignored (does not hard-drop) |

Right HUD rail: **自动** (AI plays for highest score / fastest clears; first button), pause / **开始·重新开始**, audio, and **预览** (toggle next-piece preview).

## Mobile

- Portrait: large board on the left, slim vertical right rail (score / level / lines / next / pause / restart); control pad below spanning width
- Landscape: board + pad with the same right rail when space allows
- Safe-area insets for notched devices; keyboard help collapses to a short tip on small screens

## Features

- All 7 tetrominoes with standard colors
- Wall kicks on rotation
- Score / level / lines HUD + next-piece preview (toggleable via **预览**; `tetris-preview-enabled`, default on)
- Level up every 10 lines; fall speed increases
- Ghost piece, pause, game over; must press **开始** on load (no auto-start); mid-run button reads **重新开始**
- Chinese UI labels
- Editable on-screen pad layout (persisted)
- Procedural SFX (Web Audio API) + **CC0 real-audio BGM** loops under `music/`
- Right-rail **自动** mode (heuristic AI hard-drops for score/speed; `tetris-auto-mode`), **音效** toggle + **音乐** (10 CC0 tracks: short tap cycles, long press mutes) persisted in `localStorage`

## Files

- `index.html` — page structure
- `style.css` — dark modern UI + responsive breakpoints
- `game.js` — game logic, rendering, touch pad, board fit
- `audio.js` — procedural SFX + HTMLAudio BGM + preference helpers
- `music/` — 10 CC0 loops as **MP3 + OGG** (`01.mp3`/`01.ogg` … `10.mp3`/`10.ogg`) + [`music/CREDITS.md`](music/CREDITS.md)
- `LICENSE` — MIT License

## Audio

- **SFX** — generated in the browser with the **Web Audio API** (procedural; no SFX files).
- **BGM** — 10 real **CC0 / public-domain** audio loops under `music/` (`01`…`10` as **`.mp3` + `.ogg`**). Browsers prefer **MP3** (`canPlayType('audio/mpeg')`) for Safari/iOS/WeChat compatibility; OGG is the fallback. Full titles, authors, and source URLs are in [`music/CREDITS.md`](music/CREDITS.md).

| Control | localStorage key | Default |
|---------|------------------|---------|
| 自动 (Auto) | `tetris-auto-mode` | off (`false`) |
| 预览 (Next piece) | `tetris-preview-enabled` | on (`true`) |
| 音效 (SFX) | `tetris-sfx-enabled` | on (`true`) |
| 音乐 on/off | `tetris-bgm-enabled` | on (`true`) |
| 音乐曲目 | `tetris-bgm-track` | `0` (曲目 1) |

**音乐** button (right HUD rail):

- **Short tap** — cycle track `1→2→…→10→1`. If music is on, the new track starts immediately; if off, only the selection changes.
- **Long press** (~520ms) — toggle music on/off. Cancelled if the pointer moves too far.

Track names: 轻快 / 沉稳 / 电子 / 像素 / 梦幻 / 紧张 / 探索 / 夜行 / 赛博 / 田园.

SFX stays a simple click toggle. Preferences survive refresh. Browsers block autoplay until a gesture — AudioContext + HTMLAudio unlock on first tap/key, then BGM starts if enabled. Pause and game over stop BGM; resume / restart bring it back when music is on.

## License

MIT © 2026 tycosplayer-rgb — see [`LICENSE`](LICENSE).
