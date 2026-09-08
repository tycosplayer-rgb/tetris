/*
  Copyright (c) 2026 tycosplayer-rgb <326186931+tycosplayer-rgb@users.noreply.github.com>
  SPDX-License-Identifier: MIT
*/

/**
 * Procedural game audio via Web Audio API (no binary assets).
 * Exposes window.TetrisAudio for game.js / UI toggles.
 *
 * BGM: 10 distinct chiptune-style sequenced tracks (oscillators only).
 * Short-press cycles track; long-press toggles mute (handled in game.js).
 */
(() => {
  "use strict";

  const SFX_KEY = "tetris-sfx-enabled";
  const BGM_KEY = "tetris-bgm-enabled";
  const BGM_TRACK_KEY = "tetris-bgm-track";

  /**
   * 10 procedural BGM presets — audibly different tempo / scale / wave / pattern.
   * Chinese display names for UI title attributes.
   */
  const BGM_TRACKS = [
    {
      // 1 轻快 — bright major pentatonic, brisk square
      name: "轻快",
      stepMs: 240,
      volume: 0.045,
      wave: "square",
      wave2: "triangle",
      notes: [
        261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 293.66, 349.23, 440.0,
        349.23, 261.63, 329.63, 392.0, 329.63, 246.94, 311.13,
      ],
      bassEvery: 4,
      harmonyOctave: 2,
      harmonyGain: 0.22,
      melGain: 0.55,
      noteDur: 0.2,
    },
    {
      // 2 沉稳 — calm low triangle, slower
      name: "沉稳",
      stepMs: 380,
      volume: 0.04,
      wave: "triangle",
      wave2: "sine",
      notes: [
        146.83, 174.61, 196.0, 174.61, 130.81, 164.81, 196.0, 164.81, 110.0,
        146.83, 174.61, 146.83, 98.0, 123.47, 146.83, 123.47,
      ],
      bassEvery: 8,
      harmonyOctave: 1.5,
      harmonyGain: 0.18,
      melGain: 0.5,
      noteDur: 0.32,
    },
    {
      // 3 电子 — minor techno pulse, sawtooth
      name: "电子",
      stepMs: 200,
      volume: 0.042,
      wave: "sawtooth",
      wave2: "square",
      notes: [
        220.0, 233.08, 261.63, 293.66, 261.63, 233.08, 196.0, 220.0, 246.94,
        277.18, 246.94, 220.0, 185.0, 207.65, 233.08, 207.65,
      ],
      bassEvery: 2,
      harmonyOctave: 0.5,
      harmonyGain: 0.28,
      melGain: 0.42,
      noteDur: 0.14,
    },
    {
      // 4 像素 — classic 8-bit square arpeggio
      name: "像素",
      stepMs: 160,
      volume: 0.048,
      wave: "square",
      wave2: "square",
      notes: [
        523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 587.33, 698.46, 880.0,
        698.46, 523.25, 659.25, 783.99, 659.25, 493.88, 622.25,
      ],
      bassEvery: 4,
      harmonyOctave: 0.5,
      harmonyGain: 0.2,
      melGain: 0.5,
      noteDur: 0.12,
    },
    {
      // 5 梦幻 — sparse ambient sine pads
      name: "梦幻",
      stepMs: 420,
      volume: 0.038,
      wave: "sine",
      wave2: "triangle",
      notes: [
        196.0, 0, 246.94, 0, 293.66, 0, 369.99, 293.66, 246.94, 0, 220.0, 0,
        174.61, 0, 220.0, 261.63,
      ],
      bassEvery: 8,
      harmonyOctave: 2,
      harmonyGain: 0.3,
      melGain: 0.48,
      noteDur: 0.45,
    },
    {
      // 6 紧张 — fast tense intervals, saw
      name: "紧张",
      stepMs: 150,
      volume: 0.04,
      wave: "sawtooth",
      wave2: "triangle",
      notes: [
        311.13, 329.63, 349.23, 369.99, 392.0, 369.99, 349.23, 329.63, 277.18,
        293.66, 311.13, 329.63, 233.08, 246.94, 261.63, 277.18,
      ],
      bassEvery: 4,
      harmonyOctave: 1.5,
      harmonyGain: 0.15,
      melGain: 0.4,
      noteDur: 0.1,
    },
    {
      // 7 古典 — flowing major arpeggio, soft triangle
      name: "古典",
      stepMs: 300,
      volume: 0.042,
      wave: "triangle",
      wave2: "sine",
      notes: [
        261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 293.66, 349.23, 440.0,
        523.25, 440.0, 349.23, 246.94, 311.13, 369.99, 493.88,
      ],
      bassEvery: 4,
      harmonyOctave: 0.5,
      harmonyGain: 0.25,
      melGain: 0.52,
      noteDur: 0.26,
    },
    {
      // 8 夜行 — bluesy night stroll, low + soft square
      name: "夜行",
      stepMs: 340,
      volume: 0.04,
      wave: "triangle",
      wave2: "square",
      notes: [
        146.83, 174.61, 185.0, 196.0, 185.0, 174.61, 130.81, 155.56, 174.61,
        185.0, 174.61, 146.83, 110.0, 130.81, 146.83, 155.56,
      ],
      bassEvery: 4,
      harmonyOctave: 2,
      harmonyGain: 0.12,
      melGain: 0.48,
      noteDur: 0.28,
    },
    {
      // 9 赛博 — syncopated cyber pulse
      name: "赛博",
      stepMs: 180,
      volume: 0.043,
      wave: "square",
      wave2: "sawtooth",
      notes: [
        277.18, 0, 349.23, 415.3, 0, 349.23, 277.18, 311.13, 0, 369.99, 466.16,
        0, 233.08, 277.18, 349.23, 415.3,
      ],
      bassEvery: 2,
      harmonyOctave: 0.5,
      harmonyGain: 0.22,
      melGain: 0.45,
      noteDur: 0.11,
    },
    {
      // 10 田园 — pastoral folk pentatonic, gentle
      name: "田园",
      stepMs: 320,
      volume: 0.04,
      wave: "triangle",
      wave2: "sine",
      notes: [
        196.0, 220.0, 261.63, 293.66, 261.63, 220.0, 174.61, 196.0, 246.94,
        293.66, 246.94, 196.0, 146.83, 174.61, 220.0, 261.63,
      ],
      bassEvery: 4,
      harmonyOctave: 2,
      harmonyGain: 0.2,
      melGain: 0.5,
      noteDur: 0.28,
    },
  ];

  function readFlag(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      if (v === null || v === undefined) return fallback;
      return v === "1" || v === "true";
    } catch (_) {
      return fallback;
    }
  }

  function writeFlag(key, on) {
    try {
      localStorage.setItem(key, on ? "true" : "false");
    } catch (_) {
      /* ignore quota / private mode */
    }
  }

  function readTrackIndex() {
    try {
      const v = localStorage.getItem(BGM_TRACK_KEY);
      if (v === null || v === undefined) return 0;
      const n = parseInt(v, 10);
      if (!Number.isFinite(n)) return 0;
      // Accept 0–9 or legacy 1–10
      if (n >= 1 && n <= 10) return n - 1;
      if (n >= 0 && n < BGM_TRACKS.length) return n;
      return 0;
    } catch (_) {
      return 0;
    }
  }

  function writeTrackIndex(idx) {
    try {
      localStorage.setItem(BGM_TRACK_KEY, String(idx));
    } catch (_) {
      /* ignore */
    }
  }

  let sfxEnabled = readFlag(SFX_KEY, true);
  let bgmEnabled = readFlag(BGM_KEY, true);
  let bgmTrack = readTrackIndex();

  let ctx = null;
  let masterGain = null;
  let sfxGain = null;
  let bgmGain = null;
  let unlocked = false;
  let bgmPlaying = false;
  let bgmTimer = null;
  let bgmStep = 0;
  let gameActive = true; // running && !paused && !gameOver
  let lastSoftAt = 0;

  function currentTrack() {
    return BGM_TRACKS[bgmTrack] || BGM_TRACKS[0];
  }

  function bgmVolumeTarget() {
    return currentTrack().volume || 0.045;
  }

  function ensureContext() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = 1;
    masterGain.connect(ctx.destination);

    sfxGain = ctx.createGain();
    sfxGain.gain.value = sfxEnabled ? 0.85 : 0;
    sfxGain.connect(masterGain);

    bgmGain = ctx.createGain();
    bgmGain.gain.value = 0;
    bgmGain.connect(masterGain);
    return ctx;
  }

  function unlock() {
    const c = ensureContext();
    if (!c) return Promise.resolve(false);
    const p = c.state === "suspended" ? c.resume() : Promise.resolve();
    return p
      .then(() => {
        unlocked = true;
        syncBgm();
        return true;
      })
      .catch(() => false);
  }

  function tone(freq, dur, type, gainNode, when, peak, attack, release) {
    if (!ctx || !gainNode || !freq || freq <= 0) return;
    const t0 = when != null ? when : ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type || "square";
    osc.frequency.setValueAtTime(freq, t0);
    const pk = peak != null ? peak : 0.12;
    const atk = attack != null ? attack : 0.008;
    const rel = release != null ? release : Math.max(0.04, dur * 0.45);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(pk, t0 + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(atk + 0.01, dur - rel));
    osc.connect(g);
    g.connect(gainNode);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function noiseBurst(dur, peak, filterFreq) {
    if (!ctx || !sfxGain || !sfxEnabled) return;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = filterFreq || 1200;
    filter.Q.value = 0.8;
    const g = ctx.createGain();
    const t0 = ctx.currentTime;
    g.gain.setValueAtTime(peak || 0.08, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(sfxGain);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  function playSfx(name, detail) {
    if (!sfxEnabled) return;
    const c = ensureContext();
    if (!c || !unlocked) return;
    if (c.state === "suspended") {
      c.resume().catch(() => {});
    }
    const t = c.currentTime;
    switch (name) {
      case "move":
        tone(420, 0.045, "triangle", sfxGain, t, 0.06, 0.004, 0.03);
        break;
      case "rotate":
        tone(520, 0.05, "square", sfxGain, t, 0.05, 0.004, 0.03);
        tone(780, 0.06, "square", sfxGain, t + 0.03, 0.04, 0.004, 0.035);
        break;
      case "soft": {
        const nowMs = performance.now();
        if (nowMs - lastSoftAt < 70) break;
        lastSoftAt = nowMs;
        tone(280, 0.03, "triangle", sfxGain, t, 0.028, 0.003, 0.02);
        break;
      }
      case "hard":
        tone(180, 0.08, "sawtooth", sfxGain, t, 0.1, 0.004, 0.05);
        tone(90, 0.12, "triangle", sfxGain, t + 0.02, 0.08, 0.005, 0.07);
        noiseBurst(0.06, 0.05, 600);
        break;
      case "lock":
        tone(160, 0.07, "triangle", sfxGain, t, 0.07, 0.005, 0.04);
        noiseBurst(0.04, 0.03, 900);
        break;
      case "clear": {
        const n = Math.max(1, Math.min(4, detail | 0 || 1));
        const base = 440;
        for (let i = 0; i < n; i++) {
          tone(
            base * (1 + i * 0.28),
            0.1 + i * 0.04,
            "square",
            sfxGain,
            t + i * 0.055,
            0.07,
            0.006,
            0.06
          );
        }
        if (n >= 4) {
          tone(880, 0.22, "triangle", sfxGain, t + 0.18, 0.08, 0.01, 0.1);
          tone(1174, 0.28, "triangle", sfxGain, t + 0.26, 0.06, 0.01, 0.12);
        }
        break;
      }
      case "level":
        tone(523.25, 0.1, "square", sfxGain, t, 0.07, 0.008, 0.05);
        tone(659.25, 0.12, "square", sfxGain, t + 0.1, 0.07, 0.008, 0.06);
        tone(783.99, 0.16, "square", sfxGain, t + 0.2, 0.08, 0.008, 0.08);
        break;
      case "over":
        tone(392, 0.18, "sawtooth", sfxGain, t, 0.08, 0.01, 0.1);
        tone(311, 0.22, "sawtooth", sfxGain, t + 0.14, 0.08, 0.01, 0.12);
        tone(233, 0.35, "triangle", sfxGain, t + 0.3, 0.09, 0.01, 0.18);
        break;
      default:
        break;
    }
  }

  function clearBgmTimer() {
    if (bgmTimer != null) {
      clearInterval(bgmTimer);
      bgmTimer = null;
    }
  }

  function scheduleBgmNote() {
    if (!ctx || !bgmPlaying || !bgmEnabled) return;
    const tr = currentTrack();
    const notes = tr.notes;
    const freq = notes[bgmStep % notes.length];
    bgmStep++;
    if (!freq) return; // rest
    const t = ctx.currentTime;
    const dur = tr.noteDur || 0.2;
    const mel = tr.melGain != null ? tr.melGain : 0.55;
    const harm = tr.harmonyGain != null ? tr.harmonyGain : 0.22;
    const oct = tr.harmonyOctave != null ? tr.harmonyOctave : 2;
    tone(freq, dur, tr.wave || "square", bgmGain, t, mel, 0.01, dur * 0.45);
    if (oct && harm > 0) {
      tone(freq * oct, dur * 0.85, tr.wave2 || "triangle", bgmGain, t + 0.01, harm, 0.01, dur * 0.4);
    }
    const every = tr.bassEvery || 4;
    if (bgmStep % every === 1) {
      tone(freq / 2, dur * 1.35, "triangle", bgmGain, t, Math.min(0.4, mel * 0.65), 0.02, dur * 0.5);
    }
  }

  function fadeBgm(to, ms) {
    if (!ctx || !bgmGain) return;
    const now = ctx.currentTime;
    const sec = Math.max(0.02, (ms || 180) / 1000);
    bgmGain.gain.cancelScheduledValues(now);
    bgmGain.gain.setValueAtTime(Math.max(0.0001, bgmGain.gain.value), now);
    bgmGain.gain.linearRampToValueAtTime(Math.max(0.0001, to), now + sec);
  }

  function startBgm() {
    const c = ensureContext();
    if (!c || !unlocked || !bgmEnabled || !gameActive) return;
    if (c.state === "suspended") {
      c.resume().catch(() => {});
    }
    if (!bgmPlaying) {
      bgmPlaying = true;
      bgmStep = 0;
      clearBgmTimer();
      scheduleBgmNote();
      bgmTimer = setInterval(scheduleBgmNote, currentTrack().stepMs || 280);
    }
    fadeBgm(bgmVolumeTarget(), 220);
  }

  function stopBgm(immediate) {
    clearBgmTimer();
    bgmPlaying = false;
    if (!bgmGain || !ctx) return;
    if (immediate) {
      const now = ctx.currentTime;
      bgmGain.gain.cancelScheduledValues(now);
      bgmGain.gain.setValueAtTime(0.0001, now);
    } else {
      fadeBgm(0.0001, 160);
    }
  }

  function restartBgmIfPlaying() {
    if (!bgmEnabled || !unlocked || !gameActive) return;
    const was = bgmPlaying;
    stopBgm(true);
    if (was || (bgmEnabled && gameActive)) {
      startBgm();
    }
  }

  function syncBgm() {
    if (bgmEnabled && unlocked && gameActive) startBgm();
    else stopBgm(true);
  }

  function setSfxEnabled(on) {
    sfxEnabled = !!on;
    writeFlag(SFX_KEY, sfxEnabled);
    ensureContext();
    if (sfxGain && ctx) {
      const now = ctx.currentTime;
      sfxGain.gain.cancelScheduledValues(now);
      sfxGain.gain.setValueAtTime(sfxEnabled ? 0.85 : 0, now);
    }
  }

  function setBgmEnabled(on) {
    bgmEnabled = !!on;
    writeFlag(BGM_KEY, bgmEnabled);
    if (!bgmEnabled) stopBgm(true);
    else if (unlocked) syncBgm();
  }

  function setBgmTrack(index) {
    let idx = index | 0;
    if (idx < 0) idx = 0;
    if (idx >= BGM_TRACKS.length) idx = idx % BGM_TRACKS.length;
    const changed = idx !== bgmTrack;
    bgmTrack = idx;
    writeTrackIndex(bgmTrack);
    if (changed && bgmEnabled && bgmPlaying) {
      restartBgmIfPlaying();
    }
    return bgmTrack;
  }

  function nextBgmTrack() {
    return setBgmTrack((bgmTrack + 1) % BGM_TRACKS.length);
  }

  function getBgmTrack() {
    return bgmTrack;
  }

  function getBgmTrackName() {
    return currentTrack().name;
  }

  function getBgmTrackInfo() {
    const tr = currentTrack();
    return {
      index: bgmTrack,
      number: bgmTrack + 1,
      name: tr.name,
      count: BGM_TRACKS.length,
    };
  }

  function setGameMusicActive(active) {
    gameActive = !!active;
    syncBgm();
  }

  // Auto-unlock on first user gesture
  function onFirstGesture() {
    unlock();
  }
  const gestureOpts = { capture: true, passive: true };
  ["pointerdown", "keydown", "touchstart"].forEach((ev) => {
    window.addEventListener(ev, onFirstGesture, gestureOpts);
  });

  window.TetrisAudio = {
    SFX_KEY,
    BGM_KEY,
    BGM_TRACK_KEY,
    BGM_TRACK_COUNT: BGM_TRACKS.length,
    TRACKS: BGM_TRACKS.map((t, i) => ({ index: i, name: t.name })),
    unlock,
    play: playSfx,
    isSfxEnabled: () => sfxEnabled,
    isBgmEnabled: () => bgmEnabled,
    setSfxEnabled,
    setBgmEnabled,
    getBgmTrack,
    getBgmTrackName,
    getBgmTrackInfo,
    setBgmTrack,
    nextBgmTrack,
    setGameMusicActive,
    isUnlocked: () => unlocked,
  };
})();
