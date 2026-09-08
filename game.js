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

  function lockPiece() {
    const cells = cellsOf(current);
    for (const { x, y } of cells) {
      if (y < 0) {
        endGame();
        return;
      }
      grid[y][x] = current.type;
    }
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
      if (newLevel !== level) {
        level = newLevel;
        dropInterval = Math.max(100, 1000 - (level - 1) * 80);
      }
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
    lockPiece();
  }

  function move(dx) {
    if (!current || gameOver || paused) return;
    if (valid(current, dx, 0)) current.x += dx;
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
    showOverlay("游戏结束", "Game Over — 按 R 或点击重新开始", true);
    drawBoard();
  }

  function togglePause() {
    if (gameOver || !running) return;
    paused = !paused;
    if (paused) {
      btnPause.textContent = "继续";
      showOverlay("暂停", "按 P 继续 / Press P to resume", false);
    } else {
      btnPause.textContent = "暂停";
      hideOverlay();
      lastTime = performance.now();
    }
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
  window.addEventListener("keydown", onKey);

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
  [btnRestart, btnRestartSide, btnPause].forEach((btn) => {
    if (!btn) return;
    btn.addEventListener("pointerup", () => btn.blur());
  });

  // boot
  resetGame();
})();
