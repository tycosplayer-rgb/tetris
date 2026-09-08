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
| R | Restart |

On phones, use the on-screen control pad (hold left/right/soft-drop to repeat). Tap **编辑布局** to rearrange buttons; layout is saved in `localStorage`.

## Mobile

- Portrait: large board on the left, slim vertical right rail (score / level / lines / next / pause / restart); control pad below spanning width
- Landscape: board + pad with the same right rail when space allows
- Safe-area insets for notched devices; keyboard help collapses to a short tip on small screens

## Features

- All 7 tetrominoes with standard colors
- Wall kicks on rotation
- Score / level / lines HUD + next-piece preview
- Level up every 10 lines; fall speed increases
- Ghost piece, pause, game over + restart
- Chinese UI labels
- Editable on-screen pad layout (persisted)

## Files

- `index.html` — page structure
- `style.css` — dark modern UI + responsive breakpoints
- `game.js` — game logic, rendering, touch pad, board fit
- `LICENSE` — MIT License

## License

MIT © 2026 tycosplayer-rgb — see [`LICENSE`](LICENSE).
