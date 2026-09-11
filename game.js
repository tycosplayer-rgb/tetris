/*
  Copyright (c) 2026 tycosplayer-rgb <326186931+tycosplayer-rgb@users.noreply.github.com>
  SPDX-License-Identifier: MIT
*/

(() => {
  "use strict";

  const COLS = 10;
  const ROWS = 20;
  const BLOCK = 30; // board canvas: 300x600

  // Standard SRS colors
  const COLORS = {
    I: "#00f0f0",
    O: "#f0f000",
    T: "#a000f0",
    S: "#00f000",
    Z: "#f00000",
    J: "#0000f0",
    L: "#f0a000",
    GHOST: "rgba(255,255,255,0.18)",
    GRID: "#141a24",
  };

  // Each piece: 4 rotation states as [row][col] matrices (relative 4x4 or smaller)
  // Using classic shapes; O is 2x2, others fit in 3x3 or 4x4
  const SHAPES = {
    I: [
      [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
      ],
      [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
      ],
      [
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
      ],
    ],
    O: [
      [
        [1, 1],
        [1, 1],
      ],
      [
        [1, 1],
        [1, 1],
      ],
      [
        [1, 1],
        [1, 1],
      ],
      [
        [1, 1],
        [1, 1],
      ],
    ],
    T: [
      [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      [
        [0, 1, 0],
        [0, 1, 1],
        [0, 1, 0],
      ],
      [
        [0, 0, 0],
        [1, 1, 1],
        [0, 1, 0],
      ],
      [
        [0, 1, 0],
        [1, 1, 0],
        [0, 1, 0],
      ],
    ],
    S: [
      [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0],
      ],
      [
        [0, 1, 0],
        [0, 1, 1],
        [0, 0, 1],
      ],
      [
        [0, 0, 0],
        [0, 1, 1],
        [1, 1, 0],
      ],
      [
        [1, 0, 0],
        [1, 1, 0],
        [0, 1, 0],
      ],
    ],
    Z: [
      [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0],
      ],
      [
        [0, 0, 1],
        [0, 1, 1],
        [0, 1, 0],
      ],
      [
        [0, 0, 0],
        [1, 1, 0],
        [0, 1, 1],
      ],
      [
        [0, 1, 0],
        [1, 1, 0],
        [1, 0, 0],
      ],
    ],
    J: [
      [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      [
        [0, 1, 1],
        [0, 1, 0],
        [0, 1, 0],
      ],
      [
        [0, 0, 0],
        [1, 1, 1],
        [0, 0, 1],
      ],
      [
        [0, 1, 0],
        [0, 1, 0],
        [1, 1, 0],
      ],
    ],
    L: [
      [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0],
      ],
      [
        [0, 1, 0],
        [0, 1, 0],
        [0, 1, 1],
      ],
      [
        [0, 0, 0],
        [1, 1, 1],
        [1, 0, 0],
      ],
      [
        [1, 1, 0],
        [0, 1, 0],
        [0, 1, 0],
      ],
    ],
  };

  const TYPES = Object.keys(SHAPES);

  // Basic wall-kick offsets (simplified SRS-like)
  const KICKS = {
    JLSTZ: [
      [
        [0, 0],
        [-1, 0],
        [-1, 1],
        [0, -2],
        [-1, -2],
      ], // 0->R
      [
        [0, 0],
        [1, 0],
        [1, -1],
        [0, 2],
        [1, 2],
      ], // R->2
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, -2],
        [1, -2],
      ], // 2->L
      [
        [0, 0],
        [-1, 0],
        [-1, -1],
        [0, 2],
        [-1, 2],
      ], // L->0
    ],
    I: [
      [
        [0, 0],
        [-2, 0],
        [1, 0],
        [-2, -1],
        [1, 2],
      ],
      [
        [0, 0],
        [-1, 0],
        [2, 0],
        [-1, 2],
        [2, -1],
      ],
      [
        [0, 0],
        [2, 0],
        [-1, 0],
        [2, 1],
        [-1, -2],
      ],
      [
        [0, 0],
        [1, 0],
        [-2, 0],
        [1, -2],
        [-2, 1],
      ],
    ],
  };

  // Counter-clockwise kicks derived from inverse of CW tests
  const KICKS_CCW = {
    JLSTZ: [
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, -2],
        [1, -2],
      ], // 0->L
      [
        [0, 0],
        [1, 0],
        [1, -1],
        [0, 2],
        [1, 2],
      ], // R->0
      [
        [0, 0],
        [-1, 0],
        [-1, 1],
        [0, -2],
        [-1, -2],
      ], // 2->R
      [
        [0, 0],
        [-1, 0],
        [-1, -1],
        [0, 2],
        [-1, 2],
      ], // L->2
    ],
    I: [
      [
        [0, 0],
        [-1, 0],
        [2, 0],
        [-1, 2],
        [2, -1],
      ],
      [
        [0, 0],
        [2, 0],
        [-1, 0],
        [2, 1],
        [-1, -2],
      ],
      [
        [0, 0],
        [1, 0],
        [-2, 0],
        [1, -2],
        [-2, 1],
      ],
      [
        [0, 0],
        [-2, 0],
        [1, 0],
        [-2, -1],
        [1, 2],
      ],
    ],
  };

  const SCORE_TABLE = [0, 100, 300, 500, 800];

  const boardCanvas = document.getElementById("board");
  const nextCanvas = document.getElementById("next");
  const boardCtx = boardCanvas.getContext("2d");
  const nextCtx = nextCanvas.getContext("2d");

  const elScore = document.getElementById("score");
  const elLevel = document.getElementById("level");
  const elLines = document.getElementById("lines");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayMsg = document.getElementById("overlay-msg");
  const btnRestart = document.getElementById("btn-restart");
  const btnRestartSide = document.getElementById("btn-restart-side");
  const btnPause = document.getElementById("btn-pause");
  const btnRotate = document.getElementById("btn-rotate");
  const btnAuto = document.getElementById("btn-auto");


  const AudioFX = window.TetrisAudio || null;

  function sfx(name, detail) {
    if (AudioFX) AudioFX.play(name, detail);
  }

  function syncMusicState() {
    if (!AudioFX) return;
    const active = running && !paused && !gameOver;
    AudioFX.setGameMusicActive(active);
  }


  let grid; // ROWS x COLS, null or type letter
  let bag = [];
  let current = null;
  let nextType = null;
  let score = 0;
  let level = 1;
  let lines = 0;
  let dropInterval = 1000;
  let dropAccumulator = 0;
  let lastTime = 0;
  let running = false;
  let paused = false;
  let gameOver = false;
  let animId = 0;

  const AUTO_STORAGE_KEY = "tetris-auto-mode";
  let autoMode = false;
  try {
    autoMode = localStorage.getItem(AUTO_STORAGE_KEY) === "true";
  } catch (_) {
    autoMode = false;
  }
  let autoBusy = false; // prevent re-entry while placing

  function emptyGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  function refillBag() {
    const pieces = [...TYPES];
    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    }
    bag.push(...pieces);
  }

  function takeFromBag() {
    if (bag.length === 0) refillBag();
    return bag.shift();
  }

  function spawnX(type) {
    // Center roughly: I and O need slight offset
    if (type === "O") return 4;
    if (type === "I") return 3;
    return 3;
  }

  function createPiece(type) {
    return {
      type,
      rot: 0,
      x: spawnX(type),
      y: 0,
    };
  }

  function matrixOf(piece) {
    return SHAPES[piece.type][piece.rot];
  }

  function cellsOf(piece, ox = 0, oy = 0, rot = piece.rot) {
    const m = SHAPES[piece.type][rot];
    const cells = [];
    for (let r = 0; r < m.length; r++) {
      for (let c = 0; c < m[r].length; c++) {
        if (m[r][c]) cells.push({ x: piece.x + c + ox, y: piece.y + r + oy });
      }
    }
    return cells;
  }

  function valid(piece, ox = 0, oy = 0, rot = piece.rot) {
    const cells = cellsOf(piece, ox, oy, rot);
    for (const { x, y } of cells) {
      if (x < 0 || x >= COLS || y >= ROWS) return false;
      if (y < 0) continue; // allow spawn above board
      if (grid[y][x]) return false;
    }
    return true;
  }

  function lockPiece(opts) {
    const fromHard = opts && opts.fromHard;
    const cells = cellsOf(current);
    for (const { x, y } of cells) {
      if (y < 0) {
        endGame();
        return;
      }
      grid[y][x] = current.type;
    }
    if (!fromHard) sfx("lock");
    clearLines();
    spawnNext();
  }

  function clearLines() {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (grid[r].every((c) => c !== null)) {
        grid.splice(r, 1);
        grid.unshift(Array(COLS).fill(null));
        cleared++;
        r++; // re-check same index after shift
      }
    }
    if (cleared > 0) {
      score += SCORE_TABLE[cleared] * level;
      lines += cleared;
      const newLevel = Math.floor(lines / 10) + 1;
      let leveled = false;
      if (newLevel !== level) {
        level = newLevel;
        dropInterval = Math.max(100, 1000 - (level - 1) * 80);
        leveled = true;
      }
      sfx("clear", cleared);
      if (leveled) sfx("level");
      updateHUD();
    }
  }

  function spawnNext() {
    const type = nextType || takeFromBag();
    nextType = takeFromBag();
    current = createPiece(type);
    if (!valid(current)) {
      endGame();
      return;
    }
    drawNext();
  }

  function softDrop() {
    if (!current || gameOver || paused) return;
    if (valid(current, 0, 1)) {
      current.y++;
      score += 1;
      updateHUD();
      sfx("soft");
    } else {
      lockPiece();
    }
  }

  function hardDrop() {
    if (!current || gameOver || paused) return;
    let dist = 0;
    while (valid(current, 0, dist + 1)) dist++;
    current.y += dist;
    score += dist * 2;
    updateHUD();
    sfx("hard");
    lockPiece({ fromHard: true });
  }

  function move(dx) {
    if (!current || gameOver || paused) return;
    if (valid(current, dx, 0)) {
      current.x += dx;
      sfx("move");
    }
  }

  function rotate(dir) {
    // dir: 1 = CW, -1 = CCW
    if (!current || gameOver || paused) return;
    if (current.type === "O") return;

    const from = current.rot;
    const to = (from + dir + 4) % 4;
    const kickSet =
      current.type === "I"
        ? dir === 1
          ? KICKS.I
          : KICKS_CCW.I
        : dir === 1
          ? KICKS.JLSTZ
          : KICKS_CCW.JLSTZ;

    // Index: for CW use `from`, for CCW use `to` as source of kick tests
    // Simplified: try kicks from appropriate table keyed by starting rotation for CW
    // and by target for CCW tables we defined relative to from
    const tests = dir === 1 ? kickSet[from] : kickSet[from];

    for (const [kx, ky] of tests) {
      // kick tables: [dx, dy] where dy positive is up in SRS; we use y+ down so negate
      const ox = kx;
      const oy = -ky;
      if (valid(current, ox, oy, to)) {
        current.rot = to;
        current.x += ox;
        current.y += oy;
        sfx("rotate");
        return;
      }
    }
  }

  function ghostY() {
    if (!current) return 0;
    let dy = 0;
    while (valid(current, 0, dy + 1)) dy++;
    return current.y + dy;
  }


  function playerInputBlocked() {
    return autoMode;
  }

  function cloneGrid(src) {
    return src.map((row) => row.slice());
  }

  function pieceFitsOn(g, type, rot, x, y) {
    const m = SHAPES[type][rot];
    for (let r = 0; r < m.length; r++) {
      for (let c = 0; c < m[r].length; c++) {
        if (!m[r][c]) continue;
        const px = x + c;
        const py = y + r;
        if (px < 0 || px >= COLS || py >= ROWS) return false;
        if (py < 0) continue;
        if (g[py][px]) return false;
      }
    }
    return true;
  }

  function simulateDrop(g, type, rot, x) {
    // Start above the board so tall stacks still work
    let y = -4;
    if (!pieceFitsOn(g, type, rot, x, y)) {
      // Try a few higher starts, then give up
      let ok = false;
      for (let start = -8; start <= 0; start++) {
        if (pieceFitsOn(g, type, rot, x, start)) {
          y = start;
          ok = true;
          break;
        }
      }
      if (!ok) return null;
    }
    while (pieceFitsOn(g, type, rot, x, y + 1)) y++;
    // Reject if entire piece is still above the board
    const m = SHAPES[type][rot];
    let anyOnBoard = false;
    for (let r = 0; r < m.length; r++) {
      for (let c = 0; c < m[r].length; c++) {
        if (m[r][c] && y + r >= 0) anyOnBoard = true;
      }
    }
    if (!anyOnBoard) return null;

    const ng = cloneGrid(g);
    for (let r = 0; r < m.length; r++) {
      for (let c = 0; c < m[r].length; c++) {
        if (!m[r][c]) continue;
        const px = x + c;
        const py = y + r;
        if (py < 0) return null; // would lock above → game over-ish
        ng[py][px] = type;
      }
    }

    let cleared = 0;
    for (let row = ROWS - 1; row >= 0; row--) {
      if (ng[row].every((cell) => cell !== null)) {
        ng.splice(row, 1);
        ng.unshift(Array(COLS).fill(null));
        cleared++;
        row++;
      }
    }
    return { grid: ng, cleared, landingY: y };
  }

  function evaluateBoard(g, linesCleared) {
    const heights = new Array(COLS).fill(0);
    let holes = 0;
    let holeDepth = 0; // covered empty cells: how deep each hole is buried
    let aggregateHeight = 0;
    let bumpiness = 0;

    for (let c = 0; c < COLS; c++) {
      let blockSeen = false;
      let h = 0;
      let blocksAboveHole = 0;
      for (let r = 0; r < ROWS; r++) {
        if (g[r][c]) {
          if (!blockSeen) {
            h = ROWS - r;
            blockSeen = true;
          }
          if (blockSeen) blocksAboveHole++;
        } else if (blockSeen) {
          holes++;
          // Extra cost for buried holes (more blocks sitting on top)
          holeDepth += blocksAboveHole;
        }
      }
      heights[c] = h;
      aggregateHeight += h;
    }

    for (let c = 0; c < COLS - 1; c++) {
      bumpiness += Math.abs(heights[c] - heights[c + 1]);
    }

    const maxHeight = heights.reduce((a, b) => Math.max(a, b), 0);

    // Wells: columns strictly lower than both neighbors (walls at edges).
    // Do NOT reward deep wells — they become unfillable shafts.
    // Allow at most one shallow edge well (depth 1–2) with a tiny bonus.
    let wellPenalty = 0;
    let shallowEdgeBonus = 0;
    let bestShallowEdge = 0; // depth of the best single edge well ≤2
    for (let c = 0; c < COLS; c++) {
      const left = c === 0 ? ROWS : heights[c - 1];
      const right = c === COLS - 1 ? ROWS : heights[c + 1];
      if (!(left > heights[c] && right > heights[c])) continue;
      const depth = Math.min(left, right) - heights[c];
      if (depth <= 0) continue;
      const isEdge = c === 0 || c === COLS - 1;
      const excess = Math.max(0, depth - 1);
      // Quadratic excess: depth 1 ≈ free, depth 2 mild, depth ≥3 harsh
      let cost = excess * excess * 28;
      if (!isEdge) cost += depth * depth * 18; // middle wells much worse
      else if (depth >= 3) cost += (depth - 2) * (depth - 2) * 40;
      wellPenalty += cost;
      if (isEdge && depth >= 1 && depth <= 2 && depth > bestShallowEdge) {
        bestShallowEdge = depth;
      }
    }
    // Small bonus for keeping ONE shallow edge well (I-piece lane), not deep
    if (bestShallowEdge > 0) shallowEdgeBonus = bestShallowEdge === 1 ? 6 : 4;

    // Tall isolated spikes / trenches between taller neighbors
    let spikePenalty = 0;
    for (let c = 0; c < COLS; c++) {
      const left = c === 0 ? heights[c] : heights[c - 1];
      const right = c === COLS - 1 ? heights[c] : heights[c + 1];
      const rise = heights[c] - Math.max(left, right);
      if (rise >= 2) spikePenalty += rise * rise * 6;
      // Deep trench between taller neighbors (even if not a strict well)
      const dropL = left - heights[c];
      const dropR = right - heights[c];
      if (dropL >= 2 && dropR >= 2) {
        const trench = Math.min(dropL, dropR);
        if (trench >= 3) spikePenalty += (trench - 2) * (trench - 2) * 12;
      }
    }

    // Line clears still good, but not worth digging a death well for Tetris
    const lineBonus = [0, 40, 120, 300, 520][linesCleared] || 0;

    // Almost-full rows encourage natural clears without shaft-building
    let nearComplete = 0;
    for (let r = ROWS - 1; r >= Math.max(0, ROWS - 6); r--) {
      let count = 0;
      for (let c = 0; c < COLS; c++) if (g[r][c]) count++;
      if (count === COLS - 1) nearComplete += 12;
      else if (count === COLS - 2) nearComplete += 4;
    }

    return (
      lineBonus +
      nearComplete +
      shallowEdgeBonus -
      wellPenalty -
      aggregateHeight * 0.65 -
      holes * 70 -
      holeDepth * 8 -
      bumpiness * 1.35 -
      spikePenalty -
      maxHeight * 2.2 -
      (maxHeight > 12 ? (maxHeight - 12) * 14 : 0) -
      (maxHeight > 16 ? (maxHeight - 16) * 25 : 0)
    );
  }

  function bestScoreForPieceOn(g, type) {
    let bestScore = -Infinity;
    for (let rot = 0; rot < 4; rot++) {
      if (type === "O" && rot > 0) continue;
      for (let x = -2; x < COLS; x++) {
        const sim = simulateDrop(g, type, rot, x);
        if (!sim) continue;
        const dropDist = Math.max(0, sim.landingY);
        const score =
          evaluateBoard(sim.grid, sim.cleared) + dropDist * 0.02;
        if (score > bestScore) bestScore = score;
      }
    }
    return bestScore;
  }

  function findBestPlacement(type) {
    let best = null;
    let bestScore = -Infinity;
    const g = grid;
    const LOOKAHEAD_WEIGHT = 0.55;
    const useLookahead = !!nextType;

    for (let rot = 0; rot < 4; rot++) {
      // O has identical rotations; skip duplicates lightly
      if (type === "O" && rot > 0) continue;
      for (let x = -2; x < COLS; x++) {
        const sim = simulateDrop(g, type, rot, x);
        if (!sim) continue;
        const dropDist = Math.max(0, sim.landingY);
        let score =
          evaluateBoard(sim.grid, sim.cleared) + dropDist * 0.02;
        // 1-piece lookahead: best placement of next piece on resulting board
        if (useLookahead) {
          const nextBest = bestScoreForPieceOn(sim.grid, nextType);
          if (nextBest > -Infinity) {
            score += LOOKAHEAD_WEIGHT * nextBest;
          } else {
            score -= 800; // next piece has nowhere to go → avoid
          }
        }
        if (score > bestScore) {
          bestScore = score;
          best = { rot, x, cleared: sim.cleared, score: bestScore };
        }
      }
    }
    return best;
  }

  function executeAutoPlacement() {
    if (!autoMode || !current || paused || gameOver || !running) return;
    if (autoBusy) return;
    autoBusy = true;
    try {
      const best = findBestPlacement(current.type);
      if (!best) {
        // No legal sim — just hard-drop in place
        hardDrop();
        return;
      }
      // Near-instant: set rotation + column, then hard drop
      current.rot = best.rot;
      current.x = best.x;
      // Lift piece toward top so hard-drop path is clean if gravity moved it
      if (!pieceFitsOn(grid, current.type, current.rot, current.x, current.y)) {
        current.y = 0;
        for (let start = -4; start <= 0; start++) {
          if (pieceFitsOn(grid, current.type, current.rot, current.x, start)) {
            current.y = start;
            break;
          }
        }
      }
      if (!pieceFitsOn(grid, current.type, current.rot, current.x, current.y)) {
        // Fallback: try moving from spawn with rotate/move APIs
        current.rot = 0;
        current.x = spawnX(current.type);
        current.y = 0;
        let guard = 0;
        while (current.rot !== best.rot && guard++ < 4) rotate(1);
        guard = 0;
        while (current.x < best.x && guard++ < COLS + 2) {
          if (!valid(current, 1, 0)) break;
          current.x += 1;
        }
        while (current.x > best.x && guard++ < COLS + 2) {
          if (!valid(current, -1, 0)) break;
          current.x -= 1;
        }
      }
      hardDrop();
    } finally {
      autoBusy = false;
    }
  }

  function drawBlock(ctx, x, y, color, size) {
    const pad = 1;
    const r = 4;
    const px = x * size + pad;
    const py = y * size + pad;
    const s = size - pad * 2;
    ctx.fillStyle = color;
    roundRect(ctx, px, py, s, s, r);
    ctx.fill();
    // highlight
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    roundRect(ctx, px + 2, py + 2, s * 0.4, s * 0.22, 2);
    ctx.fill();
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawBoard() {
    boardCtx.clearRect(0, 0, boardCanvas.width, boardCanvas.height);
    boardCtx.fillStyle = "#06080c";
    boardCtx.fillRect(0, 0, boardCanvas.width, boardCanvas.height);

    // grid lines
    boardCtx.strokeStyle = COLORS.GRID;
    boardCtx.lineWidth = 1;
    for (let c = 0; c <= COLS; c++) {
      boardCtx.beginPath();
      boardCtx.moveTo(c * BLOCK + 0.5, 0);
      boardCtx.lineTo(c * BLOCK + 0.5, ROWS * BLOCK);
      boardCtx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
      boardCtx.beginPath();
      boardCtx.moveTo(0, r * BLOCK + 0.5);
      boardCtx.lineTo(COLS * BLOCK, r * BLOCK + 0.5);
      boardCtx.stroke();
    }

    // locked cells
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const t = grid[r][c];
        if (t) drawBlock(boardCtx, c, r, COLORS[t], BLOCK);
      }
    }

    if (current && !gameOver) {
      // ghost
      const gy = ghostY();
      const m = matrixOf(current);
      for (let r = 0; r < m.length; r++) {
        for (let c = 0; c < m[r].length; c++) {
          if (m[r][c]) {
            const y = gy + r;
            if (y >= 0) drawBlock(boardCtx, current.x + c, y, COLORS.GHOST, BLOCK);
          }
        }
      }
      // active
      for (let r = 0; r < m.length; r++) {
        for (let c = 0; c < m[r].length; c++) {
          if (m[r][c]) {
            const y = current.y + r;
            if (y >= 0)
              drawBlock(boardCtx, current.x + c, y, COLORS[current.type], BLOCK);
          }
        }
      }
    }
  }

  function drawNext() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    nextCtx.fillStyle = "#0a0d13";
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    if (!nextType) return;
    const m = SHAPES[nextType][0];
    const size = 24;
    const w = m[0].length * size;
    const h = m.length * size;
    const ox = (nextCanvas.width - w) / 2 / size;
    const oy = (nextCanvas.height - h) / 2 / size;
    for (let r = 0; r < m.length; r++) {
      for (let c = 0; c < m[r].length; c++) {
        if (m[r][c]) {
          drawBlock(nextCtx, ox + c, oy + r, COLORS[nextType], size);
        }
      }
    }
  }

  function updateHUD() {
    elScore.textContent = String(score);
    elLevel.textContent = String(level);
    elLines.textContent = String(lines);
  }

  function showOverlay(title, msg, showBtn) {
    overlayTitle.textContent = title;
    overlayMsg.textContent = msg;
    btnRestart.style.display = showBtn ? "block" : "none";
    overlay.classList.remove("hidden");
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  function endGame() {
    gameOver = true;
    running = false;
    paused = false;
    btnPause.textContent = "暂停";
    sfx("over");
    syncMusicState();
    showOverlay("游戏结束", "Game Over — 点击重新开始", true);
    drawBoard();
  }

  function togglePause() {
    if (gameOver || !running) return;
    paused = !paused;
    if (paused) {
      btnPause.textContent = "继续";
      showOverlay("暂停", "点击继续或再次暂停", false);
    } else {
      btnPause.textContent = "暂停";
      hideOverlay();
      lastTime = performance.now();
    }
    syncMusicState();
  }

  function resetGame() {
    cancelAnimationFrame(animId);
    grid = emptyGrid();
    bag = [];
    refillBag();
    score = 0;
    level = 1;
    lines = 0;
    dropInterval = 1000;
    dropAccumulator = 0;
    gameOver = false;
    paused = false;
    running = true;
    btnPause.textContent = "暂停";
    hideOverlay();
    nextType = takeFromBag();
    spawnNext();
    updateHUD();
    syncMusicState();
    if (AudioFX) AudioFX.unlock();
    lastTime = performance.now();
    loop(lastTime);
  }

  function loop(now) {
    if (!running) return;
    animId = requestAnimationFrame(loop);
    if (paused || gameOver) {
      drawBoard();
      return;
    }
    // Auto mode: place one piece per frame (rAF-batched, non-blocking)
    if (autoMode && current) {
      lastTime = now;
      dropAccumulator = 0;
      executeAutoPlacement();
      drawBoard();
      return;
    }
    const dt = now - lastTime;
    lastTime = now;
    dropAccumulator += dt;
    while (dropAccumulator >= dropInterval) {
      dropAccumulator -= dropInterval;
      if (valid(current, 0, 1)) {
        current.y++;
      } else {
        lockPiece();
        break;
      }
    }
    drawBoard();
  }

  function onKey(e) {
    const key = e.key;
    const code = e.code;

    // prevent page scroll on game keys
    const gameKeys = [
      "ArrowLeft",
      "ArrowRight",
      "ArrowDown",
      "ArrowUp",
      "Space",
      "KeyW",
      "KeyA",
      "KeyS",
      "KeyD",
      "KeyX",
      "KeyZ",
      "KeyP",
      "KeyR",
    ];
    if (gameKeys.includes(code)) e.preventDefault();

    if (code === "KeyR" || key === "r" || key === "R") {
      resetGame();
      return;
    }
    if (code === "KeyP" || key === "p" || key === "P") {
      togglePause();
      return;
    }
    if (gameOver || paused) return;
    if (playerInputBlocked()) return;

    if (code === "ArrowLeft" || code === "KeyA") move(-1);
    else if (code === "ArrowRight" || code === "KeyD") move(1);
    else if (code === "ArrowDown" || code === "KeyS") softDrop();
    else if (code === "ArrowUp" || code === "KeyX" || code === "KeyW")
      rotate(1);
    else if (code === "KeyZ") rotate(-1);
    else if (code === "Space") hardDrop();

    drawBoard();
  }

  btnRestart.addEventListener("click", resetGame);
  btnRestartSide.addEventListener("click", resetGame);
  btnPause.addEventListener("click", togglePause);
  if (btnRotate) {
    btnRotate.addEventListener("click", () => {
      if (!playerInputBlocked()) {
        rotate(1);
        drawBoard();
      }
      btnRotate.blur();
    });
  }

  function refreshAutoButton() {
    if (!btnAuto) return;
    btnAuto.setAttribute("aria-pressed", autoMode ? "true" : "false");
    btnAuto.title = autoMode
      ? "自动模式：开（再点关闭）"
      : "自动模式：关（电脑自动打分）";
    btnAuto.textContent = "自动";
  }

  function setAutoMode(on) {
    autoMode = !!on;
    try {
      localStorage.setItem(AUTO_STORAGE_KEY, autoMode ? "true" : "false");
    } catch (_) {
      /* ignore */
    }
    refreshAutoButton();
    // Turning off mid-piece leaves the piece for the player (no extra action)
    if (!autoMode) {
      autoBusy = false;
      lastTime = performance.now();
      dropAccumulator = 0;
    }
  }

  function toggleAutoMode() {
    setAutoMode(!autoMode);
  }

  if (btnAuto) {
    btnAuto.addEventListener("click", () => {
      toggleAutoMode();
      btnAuto.blur();
    });
  }
  refreshAutoButton();
  window.addEventListener("keydown", onKey);

  // --- Audio toggles (right HUD rail) ---
  // 音效: short click toggle
  // 音乐: short tap cycles track; long press (~500ms) toggles on/off
  const btnSfx = document.getElementById("btn-sfx");
  const btnBgm = document.getElementById("btn-bgm");
  const BGM_LONG_MS = 520;
  const BGM_MOVE_CANCEL_PX = 14;

  function refreshAudioButtons() {
    if (!AudioFX) return;
    if (btnSfx) {
      const on = AudioFX.isSfxEnabled();
      btnSfx.setAttribute("aria-pressed", on ? "true" : "false");
      btnSfx.title = on ? "音效：开" : "音效：关";
      btnSfx.textContent = "音效";
    }
    if (btnBgm) {
      const on = AudioFX.isBgmEnabled();
      const info = AudioFX.getBgmTrackInfo
        ? AudioFX.getBgmTrackInfo()
        : { number: 1, name: "", count: 10 };
      const num = info.number || 1;
      const name = info.name || "";
      btnBgm.setAttribute("aria-pressed", on ? "true" : "false");
      btnBgm.textContent = on ? `音乐 ${num}` : "音乐";
      btnBgm.title = on
        ? `曲目${num} · ${name}（短按切换曲目 / 长按开关）`
        : `音乐关 · 已选曲目${num}${name ? " · " + name : ""}（短按切换 / 长按开启）`;
    }
  }

  function onSfxClick() {
    if (!AudioFX) return;
    AudioFX.unlock();
    AudioFX.setSfxEnabled(!AudioFX.isSfxEnabled());
    if (AudioFX.isSfxEnabled()) sfx("move");
    refreshAudioButtons();
  }

  function cycleBgmTrack() {
    if (!AudioFX) return;
    AudioFX.unlock();
    if (typeof AudioFX.nextBgmTrack === "function") {
      AudioFX.nextBgmTrack();
    }
    // If BGM is on, nextBgmTrack already restarts the new pattern.
    // If off, selection only changes for next time music is enabled.
    refreshAudioButtons();
  }

  function toggleBgmEnabled() {
    if (!AudioFX) return;
    AudioFX.unlock();
    AudioFX.setBgmEnabled(!AudioFX.isBgmEnabled());
    syncMusicState();
    refreshAudioButtons();
  }

  if (btnSfx) btnSfx.addEventListener("click", onSfxClick);

  if (btnBgm) {
    let longTimer = null;
    let longFired = false;
    let activePointer = null;
    let startX = 0;
    let startY = 0;
    let suppressClick = false;

    function clearLongTimer() {
      if (longTimer != null) {
        clearTimeout(longTimer);
        longTimer = null;
      }
    }

    function cancelBgmGesture() {
      clearLongTimer();
      activePointer = null;
      longFired = false;
      suppressClick = true;
    }

    btnBgm.addEventListener("pointerdown", (e) => {
      if (e.button != null && e.button !== 0) return;
      if (activePointer != null) return;
      activePointer = e.pointerId;
      longFired = false;
      suppressClick = false;
      startX = e.clientX;
      startY = e.clientY;
      try {
        btnBgm.setPointerCapture(e.pointerId);
      } catch (_) {
        /* ignore */
      }
      clearLongTimer();
      longTimer = setTimeout(() => {
        longTimer = null;
        if (activePointer == null) return;
        longFired = true;
        toggleBgmEnabled();
      }, BGM_LONG_MS);
    });

    btnBgm.addEventListener("pointermove", (e) => {
      if (activePointer == null || e.pointerId !== activePointer) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (dx * dx + dy * dy > BGM_MOVE_CANCEL_PX * BGM_MOVE_CANCEL_PX) {
        clearLongTimer();
        // Treat as cancelled: no short-tap cycle either
        longFired = true;
      }
    });

    function endBgmGesture(e) {
      if (activePointer == null || e.pointerId !== activePointer) return;
      const wasLong = longFired;
      clearLongTimer();
      activePointer = null;
      suppressClick = true;
      try {
        btnBgm.releasePointerCapture(e.pointerId);
      } catch (_) {
        /* ignore */
      }
      if (!wasLong) {
        cycleBgmTrack();
      }
      longFired = false;
    }

    btnBgm.addEventListener("pointerup", endBgmGesture);
    btnBgm.addEventListener("pointercancel", (e) => {
      if (activePointer == null || e.pointerId !== activePointer) return;
      cancelBgmGesture();
    });

    // Pointer path already handled the action; keyboard Enter/Space still cycles.
    btnBgm.addEventListener("click", (e) => {
      if (suppressClick) {
        suppressClick = false;
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      cycleBgmTrack();
    });
  }

  refreshAudioButtons();
  syncMusicState();


  // --- On-screen control pad (touch / mouse) ---
  const controlPad = document.getElementById("control-pad");
  const btnEditLayout = document.getElementById("btn-edit-layout");
  const btnResetLayout = document.getElementById("btn-reset-layout");
  const LAYOUT_STORAGE_KEY = "tetris-control-layout-v1";
  const DEFAULT_LAYOUT = ["ccw", "cw", "hard", "left", "down", "right"];
  const REPEAT_DELAY = 180; // ms before hold-repeat starts
  const REPEAT_RATE = 55; // ms between repeats
  let holdTimer = null;
  let holdInterval = null;
  let activeHoldBtn = null;
  let layoutEditMode = false;
  let dragBtn = null;
  let dragPointerId = null;
  let dragOverBtn = null;

  function runPadAction(action) {
    if (playerInputBlocked()) return;
    if (action === "left") move(-1);
    else if (action === "right") move(1);
    else if (action === "down") softDrop();
    else if (action === "cw") rotate(1);
    else if (action === "ccw") rotate(-1);
    else if (action === "hard") hardDrop();
    drawBoard();
  }

  function clearHold() {
    if (holdTimer != null) {
      clearTimeout(holdTimer);
      holdTimer = null;
    }
    if (holdInterval != null) {
      clearInterval(holdInterval);
      holdInterval = null;
    }
    if (activeHoldBtn) {
      activeHoldBtn.classList.remove("is-pressed");
      activeHoldBtn = null;
    }
  }

  function startHold(btn, action) {
    clearHold();
    activeHoldBtn = btn;
    btn.classList.add("is-pressed");
    runPadAction(action);
    if (!btn.dataset.repeat) return;
    holdTimer = setTimeout(() => {
      holdInterval = setInterval(() => runPadAction(action), REPEAT_RATE);
    }, REPEAT_DELAY);
  }

  function getPadButtons() {
    return Array.from(controlPad.querySelectorAll(".pad-btn"));
  }

  function getCurrentLayout() {
    return getPadButtons()
      .map((btn) => btn.dataset.action)
      .filter(Boolean);
  }

  function isValidLayout(order) {
    if (!Array.isArray(order) || order.length !== DEFAULT_LAYOUT.length) {
      return false;
    }
    const expected = new Set(DEFAULT_LAYOUT);
    const seen = new Set();
    for (const id of order) {
      if (typeof id !== "string" || !expected.has(id) || seen.has(id)) {
        return false;
      }
      seen.add(id);
    }
    return seen.size === expected.size;
  }

  function applyLayout(order) {
    if (!controlPad || !isValidLayout(order)) return false;
    const byAction = new Map();
    for (const btn of getPadButtons()) {
      byAction.set(btn.dataset.action, btn);
    }
    for (const action of order) {
      const btn = byAction.get(action);
      if (btn) controlPad.appendChild(btn);
    }
    return true;
  }

  function saveLayout() {
    try {
      localStorage.setItem(
        LAYOUT_STORAGE_KEY,
        JSON.stringify(getCurrentLayout())
      );
    } catch (_) {
      /* ignore quota / private mode */
    }
  }

  function loadLayout() {
    try {
      const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (!raw) {
        applyLayout(DEFAULT_LAYOUT);
        return;
      }
      const parsed = JSON.parse(raw);
      if (!applyLayout(parsed)) {
        localStorage.removeItem(LAYOUT_STORAGE_KEY);
        applyLayout(DEFAULT_LAYOUT);
      }
    } catch (_) {
      try {
        localStorage.removeItem(LAYOUT_STORAGE_KEY);
      } catch (__) {
        /* ignore */
      }
      applyLayout(DEFAULT_LAYOUT);
    }
  }

  function resetLayout() {
    clearDragState();
    applyLayout(DEFAULT_LAYOUT);
    try {
      localStorage.removeItem(LAYOUT_STORAGE_KEY);
    } catch (_) {
      /* ignore */
    }
  }

  function setEditMode(on) {
    const next = !!on;
    if (!next && layoutEditMode) {
      clearDragState();
      saveLayout();
    }
    layoutEditMode = next;
    clearHold();
    clearDragState();
    if (!controlPad) return;
    controlPad.classList.toggle("is-editing", layoutEditMode);
    if (btnEditLayout) {
      btnEditLayout.setAttribute(
        "aria-pressed",
        layoutEditMode ? "true" : "false"
      );
      btnEditLayout.textContent = layoutEditMode ? "完成编辑" : "编辑布局";
    }
  }

  function clearDragState() {
    if (dragBtn) {
      dragBtn.classList.remove("is-dragging");
      if (
        dragPointerId != null &&
        dragBtn.releasePointerCapture
      ) {
        try {
          dragBtn.releasePointerCapture(dragPointerId);
        } catch (_) {
          /* ignore */
        }
      }
    }
    if (dragOverBtn) {
      dragOverBtn.classList.remove("drop-target");
    }
    dragBtn = null;
    dragPointerId = null;
    dragOverBtn = null;
  }

  function reorderBefore(target) {
    if (!dragBtn || !target || dragBtn === target) return;
    const buttons = getPadButtons();
    const from = buttons.indexOf(dragBtn);
    const to = buttons.indexOf(target);
    if (from < 0 || to < 0) return;
    if (from < to) {
      controlPad.insertBefore(dragBtn, target.nextSibling);
    } else {
      controlPad.insertBefore(dragBtn, target);
    }
  }

  function onPadPointerDown(e) {
    const btn = e.target.closest(".pad-btn");
    if (!btn || !controlPad.contains(btn)) return;
    e.preventDefault();
    btn.blur();

    if (layoutEditMode) {
      clearHold();
      clearDragState();
      dragBtn = btn;
      dragPointerId = e.pointerId;
      dragBtn.classList.add("is-dragging");
      if (btn.setPointerCapture && e.pointerId != null) {
        try {
          btn.setPointerCapture(e.pointerId);
        } catch (_) {
          /* ignore */
        }
      }
      return;
    }

    const action = btn.dataset.action;
    if (!action) return;
    // Capture pointer so we get pointerup even if finger slides off
    if (btn.setPointerCapture && e.pointerId != null) {
      try {
        btn.setPointerCapture(e.pointerId);
      } catch (_) {
        /* ignore */
      }
    }
    startHold(btn, action);
  }

  function onPadPointerMove(e) {
    if (!layoutEditMode || !dragBtn) return;
    if (dragPointerId != null && e.pointerId !== dragPointerId) return;
    e.preventDefault();
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const over = el && el.closest ? el.closest(".pad-btn") : null;
    if (!over || !controlPad.contains(over) || over === dragBtn) {
      if (dragOverBtn) {
        dragOverBtn.classList.remove("drop-target");
        dragOverBtn = null;
      }
      return;
    }
    if (dragOverBtn && dragOverBtn !== over) {
      dragOverBtn.classList.remove("drop-target");
    }
    dragOverBtn = over;
    dragOverBtn.classList.add("drop-target");
    reorderBefore(over);
  }

  function onPadPointerUp(e) {
    if (layoutEditMode) {
      if (dragBtn) {
        e.preventDefault();
        clearDragState();
        saveLayout();
      }
      return;
    }
    const btn = e.target.closest(".pad-btn");
    if (!btn && !activeHoldBtn) return;
    e.preventDefault();
    clearHold();
  }

  if (controlPad) {
    loadLayout();
    controlPad.addEventListener("pointerdown", onPadPointerDown);
    controlPad.addEventListener("pointermove", onPadPointerMove);
    controlPad.addEventListener("pointerup", onPadPointerUp);
    controlPad.addEventListener("pointercancel", onPadPointerUp);
    controlPad.addEventListener("pointerleave", (e) => {
      // Only clear if leaving the pad entirely while holding
      if (!layoutEditMode && e.target === controlPad) clearHold();
    });
    // Prevent context menu / focus steal on long-press
    controlPad.addEventListener("contextmenu", (e) => e.preventDefault());
    // Keep keyboard usable: don't let buttons keep focus after click
    controlPad.addEventListener("focusin", (e) => {
      if (e.target && e.target.blur) e.target.blur();
    });
  }

  if (btnEditLayout) {
    btnEditLayout.addEventListener("click", () => {
      setEditMode(!layoutEditMode);
      btnEditLayout.blur();
    });
  }

  if (btnResetLayout) {
    btnResetLayout.addEventListener("click", () => {
      resetLayout();
      btnResetLayout.blur();
    });
  }

  // Also blur pause/restart so Space/arrows keep going to the game
  [btnRestart, btnRestartSide, btnPause, btnRotate].forEach((btn) => {
    if (!btn) return;
    btn.addEventListener("pointerup", () => btn.blur());
  });



  // --- Board gestures (touch / pointer on playfield only) ---
  // Swipe L/R → move; swipe up → rotate CW; tap → hard drop.
  const boardGestureTarget = boardCanvas;
  const TAP_MOVE_MAX = 14; // px — above this, not a tap
  const SWIPE_STEP_PX = 32; // px horizontal per cell while dragging
  const SWIPE_UP_PX = 28; // upward swipe threshold for rotate
  const AXIS_DOMINANCE = 1.15; // |primary| must exceed |secondary| * this

  let boardPtrId = null;
  let boardStartX = 0;
  let boardStartY = 0;
  let boardConsumedX = 0;
  let boardConsumedUp = 0;
  let boardDidSwipe = false;
  let boardDidRotateSwipe = false;

  function resetBoardGesture() {
    boardPtrId = null;
    boardDidSwipe = false;
    boardDidRotateSwipe = false;
    boardConsumedX = 0;
    boardConsumedUp = 0;
  }

  function onBoardPointerDown(e) {
    if (!boardGestureTarget) return;
    // Only primary button / one finger; ignore extra pointers
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (boardPtrId != null) return;
    // Don't steal clicks from overlay UI if somehow targeted
    if (e.target && e.target.closest && e.target.closest(".overlay")) return;

    boardPtrId = e.pointerId;
    boardStartX = e.clientX;
    boardStartY = e.clientY;
    boardConsumedX = 0;
    boardConsumedUp = 0;
    boardDidSwipe = false;
    boardDidRotateSwipe = false;
    e.preventDefault();
    try {
      boardGestureTarget.setPointerCapture(e.pointerId);
    } catch (_) {
      /* ignore */
    }
  }

  function onBoardPointerMove(e) {
    if (boardPtrId == null || e.pointerId !== boardPtrId) return;
    e.preventDefault();

    const dx = e.clientX - boardStartX;
    const dy = e.clientY - boardStartY; // positive = down
    if (playerInputBlocked()) return;

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    // Upward-dominant: rotate once per SWIPE_UP_PX of upward travel
    if (dy < 0 && absY >= absX * AXIS_DOMINANCE) {
      const up = -dy;
      while (up - boardConsumedUp >= SWIPE_UP_PX) {
        boardConsumedUp += SWIPE_UP_PX;
        boardDidRotateSwipe = true;
        rotate(1);
        drawBoard();
      }
      return;
    }

    // Horizontal-dominant: move left/right
    if (absX >= absY * AXIS_DOMINANCE) {
      while (dx - boardConsumedX >= SWIPE_STEP_PX) {
        boardConsumedX += SWIPE_STEP_PX;
        boardDidSwipe = true;
        move(1);
        drawBoard();
      }
      while (dx - boardConsumedX <= -SWIPE_STEP_PX) {
        boardConsumedX -= SWIPE_STEP_PX;
        boardDidSwipe = true;
        move(-1);
        drawBoard();
      }
    }
  }

  function onBoardPointerUp(e) {
    if (boardPtrId == null || e.pointerId !== boardPtrId) return;
    e.preventDefault();

    const dx = e.clientX - boardStartX;
    const dy = e.clientY - boardStartY;
    const dist = Math.hypot(dx, dy);
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    // If upward swipe ended without crossing step during move, still rotate once
    if (
      !playerInputBlocked() &&
      !boardDidRotateSwipe &&
      !boardDidSwipe &&
      dy < 0 &&
      absY >= SWIPE_UP_PX &&
      absY >= absX * AXIS_DOMINANCE
    ) {
      boardDidRotateSwipe = true;
      rotate(1);
      drawBoard();
    }

    const isTap =
      !boardDidSwipe &&
      !boardDidRotateSwipe &&
      dist <= TAP_MOVE_MAX &&
      absX <= TAP_MOVE_MAX &&
      absY <= TAP_MOVE_MAX;

    if (isTap && !playerInputBlocked()) {
      hardDrop();
      drawBoard();
    }

    try {
      if (boardGestureTarget.hasPointerCapture(e.pointerId)) {
        boardGestureTarget.releasePointerCapture(e.pointerId);
      }
    } catch (_) {
      /* ignore */
    }
    resetBoardGesture();
  }

  function onBoardPointerCancel(e) {
    if (boardPtrId == null || e.pointerId !== boardPtrId) return;
    try {
      if (boardGestureTarget.hasPointerCapture(e.pointerId)) {
        boardGestureTarget.releasePointerCapture(e.pointerId);
      }
    } catch (_) {
      /* ignore */
    }
    resetBoardGesture();
  }

  if (boardGestureTarget) {
    boardGestureTarget.addEventListener("pointerdown", onBoardPointerDown);
    boardGestureTarget.addEventListener("pointermove", onBoardPointerMove);
    boardGestureTarget.addEventListener("pointerup", onBoardPointerUp);
    boardGestureTarget.addEventListener("pointercancel", onBoardPointerCancel);
    boardGestureTarget.addEventListener("lostpointercapture", () => {
      resetBoardGesture();
    });
    boardGestureTarget.addEventListener("contextmenu", (e) => e.preventDefault());
  }


  // --- Responsive board sizing (CSS display size; canvas buffer stays 300×600) ---
  function fitBoard() {
    const wrap = boardCanvas && boardCanvas.parentElement;
    const play = wrap && wrap.closest(".play-area");
    const main = play && play.closest(".main");
    if (!boardCanvas || !wrap || !play) return;

    const mqNarrow = window.matchMedia("(max-width: 800px)").matches;
    const mqLandscape = window.matchMedia(
      "(max-width: 960px) and (orientation: landscape)"
    ).matches;

    // Desktop: CSS-driven size (larger default board)
    if (!mqNarrow && !mqLandscape) {
      boardCanvas.style.width = "";
      boardCanvas.style.height = "";
      return;
    }

    const vv = window.visualViewport;
    const viewW = vv ? vv.width : window.innerWidth;
    const viewH = vv ? vv.height : window.innerHeight;

    const padWrap =
      (main && main.querySelector(".control-pad-wrap")) ||
      document.querySelector(".control-pad-wrap");
    const styles = getComputedStyle(document.documentElement);
    const safeL = parseFloat(styles.getPropertyValue("--safe-left")) || 0;
    const safeR = parseFloat(styles.getPropertyValue("--safe-right")) || 0;
    const safeB = parseFloat(styles.getPropertyValue("--safe-bottom")) || 0;

    // Horizontal: play-area width (board left of slim right rail) — up to ~400px
    const playW = play.clientWidth || viewW;
    const sidePad = mqLandscape ? 12 : 8;
    const maxW = Math.min(400, playW - 4, viewW - safeL - safeR - sidePad);

    // Vertical: no top HUD — only compact header above board; pad sits below
    const padH = padWrap ? padWrap.getBoundingClientRect().height : 100;
    const boardTop = wrap.getBoundingClientRect().top;
    // Fallback top is smaller now (header only, no top stats bar)
    const top = boardTop > 0 && boardTop < viewH ? boardTop : 36;
    const gapBelow = mqLandscape ? 6 : 4;
    const reserveBelow = Math.max(safeB, 4) + (mqLandscape ? 4 : 2);
    const maxH = Math.max(
      240,
      viewH - top - padH - gapBelow - reserveBelow
    );

    // Aspect 10×20 → width = height / 2
    const byHeight = maxH / 2;
    const size = Math.floor(Math.max(168, Math.min(maxW, byHeight)));
    boardCanvas.style.width = size + "px";
    boardCanvas.style.height = size * 2 + "px";
  }

  let fitRaf = 0;
  function scheduleFitBoard() {
    if (fitRaf) cancelAnimationFrame(fitRaf);
    fitRaf = requestAnimationFrame(() => {
      fitRaf = 0;
      fitBoard();
    });
  }

  window.addEventListener("resize", scheduleFitBoard);
  window.addEventListener("orientationchange", () => {
    setTimeout(scheduleFitBoard, 100);
  });
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", scheduleFitBoard);
  }

  // boot
  fitBoard();
  resetGame();
  // Second pass after HUD/pad have final heights
  requestAnimationFrame(() => {
    fitBoard();
    requestAnimationFrame(fitBoard);
  });
})();
