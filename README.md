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

## Features

- All 7 tetrominoes with standard colors
- Wall kicks on rotation
- Score / level / lines HUD + next-piece preview
- Level up every 10 lines; fall speed increases
- Ghost piece, pause, game over + restart
- Chinese UI labels

## Files

- `index.html` — page structure
- `style.css` — dark modern UI
- `game.js` — game logic & rendering
