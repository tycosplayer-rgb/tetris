/*
  Copyright (c) 2026 tycosplayer-rgb <326186931+tycosplayer-rgb@users.noreply.github.com>
  SPDX-License-Identifier: MIT
*/

/**
 * Game audio: procedural SFX (Web Audio API) + file-based CC0 BGM (HTMLAudioElement).
 * Exposes window.TetrisAudio for game.js / UI toggles.
 *
 * BGM: 10 CC0 loops under music/01.mp3 … music/10.mp3 (and .ogg fallback).
 * Browsers that support MP3 (Safari/iOS/WeChat) prefer MPEG; others may use OGG.
 * Short-press cycles track; long-press toggles mute (handled in game.js).
 */
(() => {
  "use strict";

  const SFX_KEY = "tetris-sfx-enabled";
  const BGM_KEY = "tetris-bgm-enabled";
  const BGM_TRACK_KEY = "tetris-bgm-track";

  /**
   * Prefer MP3 (Safari / iOS / WeChat / most browsers); fall back to OGG
   * only when audio/mpeg is unsupported.
   */
  const PREFERRED_EXT = (function () {
    try {
      const probe = document.createElement("audio");
      if (probe.canPlayType && probe.canPlayType("audio/mpeg")) {
        return "mp3";
      }
    } catch (_) {
      /* ignore */
    }
    return "ogg";
  })();

  const FALLBACK_EXT = PREFERRED_EXT === "mp3" ? "ogg" : "mp3";

  /** Resolve music path relative to the page URL directory (not audio.js). */
  function musicUrl(file) {
    try {
      const u = new URL(window.location.href);
      u.hash = "";
      u.search = "";
      let path = u.pathname || "/";
      if (!path.endsWith("/")) {
        // Strip filename (e.g. index.html) so we resolve from the page directory
        path = path.substring(0, path.lastIndexOf("/") + 1);
      }
      u.pathname = path;
      return new URL("music/" + file, u).href;
    } catch (_) {
      return "music/" + file;
    }
  }

  function trackFile(base, ext) {
    return base + "." + ext;
  }

  /**
   * 10 CC0 BGM tracks — display names match music/CREDITS.md.
   * `base` is the stem (01…10); extension chosen at runtime.
   */
  const BGM_TRACKS = [
    { name: "轻快", base: "01", volume: 0.10 },
    { name: "沉稳", base: "02", volume: 0.10 },
    { name: "电子", base: "03", volume: 0.09 },
    { name: "像素", base: "04", volume: 0.10 },
    { name: "梦幻", base: "05", volume: 0.11 },
    { name: "紧张", base: "06", volume: 0.09 },
    { name: "探索", base: "07", volume: 0.10 },
    { name: "夜行", base: "08", volume: 0.10 },
    { name: "赛博", base: "09", volume: 0.09 },
    { name: "田园", base: "10", volume: 0.11 },
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
      // Stored as 0-based index 0–9. Legacy sole exception: "10" meant track 10.
      if (n >= 0 && n < BGM_TRACKS.length) return n;
      if (n === 10) return BGM_TRACKS.length - 1;
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
  let unlocked = false;
  let gameActive = true; // running && !paused && !gameOver
  let lastSoftAt = 0;
  let gestureListenersAttached = true;

  /** @type {HTMLAudioElement|null} */
  let bgmAudio = null;
  let bgmWantPlay = false;
  let bgmLoadError = false;
  /** Extension currently loaded for the active track ("mp3" | "ogg"). */
  let bgmActiveExt = PREFERRED_EXT;
  /** Whether we already tried the alternate extension for this track load. */
  let bgmTriedFallback = false;

  function currentTrack() {
    return BGM_TRACKS[bgmTrack] || BGM_TRACKS[0];
  }

  function currentFile(ext) {
    const tr = currentTrack();
    return trackFile(tr.base, ext || bgmActiveExt);
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
    sfxGain.gain.value = sfxEnabled ? 4.6 : 0;
    sfxGain.connect(masterGain);
    return ctx;
  }

  function applySfxGain() {
    if (!sfxGain || !ctx) return;
    const now = ctx.currentTime;
    sfxGain.gain.cancelScheduledValues(now);
    sfxGain.gain.setValueAtTime(sfxEnabled ? 4.6 : 0, now);
  }

  function resumeContext() {
    const c = ensureContext();
    if (!c) return Promise.resolve(null);
    if (c.state === "suspended") {
      return c.resume().then(() => c).catch(() => c);
    }
    return Promise.resolve(c);
  }

  function ensureBgmElement() {
    if (bgmAudio) return bgmAudio;
    const a = new Audio();
    a.loop = true;
    a.preload = "auto";
    a.volume = currentTrack().volume != null ? currentTrack().volume : 0.10;
    a.addEventListener("error", () => {
      const failedFile = currentFile(bgmActiveExt);
      const errMsg = a.error && a.error.message;
      if (!bgmTriedFallback) {
        bgmTriedFallback = true;
        const alt = FALLBACK_EXT;
        try {
          console.warn(
            "[TetrisAudio] BGM failed to load:",
            failedFile,
            errMsg,
            "— trying alternate extension ." + alt
          );
        } catch (_) {
          /* ignore */
        }
        bgmActiveExt = alt;
        bgmLoadError = false;
        const url = musicUrl(currentFile(alt));
        try {
          a.pause();
        } catch (_) {
          /* ignore */
        }
        a.src = url;
        try {
          a.load();
        } catch (_) {
          /* ignore */
        }
        return;
      }
      bgmLoadError = true;
      try {
        console.warn(
          "[TetrisAudio] BGM failed to load (gave up after alternate):",
          failedFile,
          errMsg
        );
      } catch (_) {
        /* ignore */
      }
    });
    function onReady() {
      bgmLoadError = false;
      if (bgmWantPlay || (bgmEnabled && unlocked && gameActive)) {
        playBgmElement();
      }
    }
    a.addEventListener("canplay", onReady);
    a.addEventListener("loadeddata", onReady);
    bgmAudio = a;
    loadCurrentTrackSrc(false);
    return a;
  }

  function loadCurrentTrackSrc(autoPlay) {
    const a = ensureBgmElement();
    const tr = currentTrack();
    bgmActiveExt = PREFERRED_EXT;
    bgmTriedFallback = false;
    const file = currentFile(bgmActiveExt);
    const url = musicUrl(file);
    bgmLoadError = false;
    a.loop = true;
    a.volume = tr.volume != null ? tr.volume : 0.10;
    // Match either preferred or fallback stem so we don't reload needlessly
    const stem = "/" + tr.base + ".";
    const already =
      a.src &&
      (a.src.indexOf(stem + "mp3") !== -1 || a.src.indexOf(stem + "ogg") !== -1);
    if (!already) {
      try {
        a.pause();
      } catch (_) {
        /* ignore */
      }
      a.src = url;
      try {
        a.load();
      } catch (_) {
        /* ignore */
      }
    }
    try {
      a.currentTime = 0;
    } catch (_) {
      /* ignore */
    }
    if (autoPlay) {
      playBgmElement();
    }
  }

  function playBgmElement() {
    if (!bgmEnabled || !unlocked || !gameActive) return;
    const a = ensureBgmElement();
    a.loop = true;
    a.muted = false;
    a.volume = currentTrack().volume != null ? currentTrack().volume : 0.10;
    bgmWantPlay = true;
    const p = a.play();
    if (p && typeof p.then === "function") {
      p.catch((err) => {
        try {
          console.warn("[TetrisAudio] BGM play blocked/failed:", err && err.message);
        } catch (_) {
          /* ignore */
        }
      });
    }
  }

  function pauseBgmElement(reset) {
    bgmWantPlay = false;
    if (!bgmAudio) return;
    // muted=true is the reliable instant cut (volume alone is ignored on some mobile browsers)
    try {
      bgmAudio.muted = true;
    } catch (_) {
      /* ignore */
    }
    try {
      bgmAudio.volume = 0;
    } catch (_) {
      /* ignore */
    }
    try {
      bgmAudio.pause();
    } catch (_) {
      /* ignore */
    }
    if (reset) {
      try {
        bgmAudio.currentTime = 0;
      } catch (_) {
        /* ignore */
      }
    }
  }

  function removeGestureListeners() {
    if (!gestureListenersAttached) return;
    gestureListenersAttached = false;
    ["pointerdown", "keydown", "touchstart"].forEach((ev) => {
      window.removeEventListener(ev, onFirstGesture, gestureOpts);
    });
  }

  /**
   * Unlock audio from a user gesture.
   * Sets `unlocked` synchronously so SFX/BGM gated on the flag work immediately
   * while AudioContext.resume() finishes asynchronously.
   */
  function unlock() {
    // Always mark unlocked up-front — callers run from user gestures.
    unlocked = true;
    removeGestureListeners();

    const c = ensureContext();
    ensureBgmElement();
    applySfxGain();

    const resumeCtx =
      c && c.state === "suspended"
        ? c.resume().catch(() => {})
        : Promise.resolve();

    return resumeCtx
      .then(() => {
        // After context is running, sync BGM if it should be audible.
        // Do NOT use a muted play/pause prime — that races with real BGM play
        // and can pause music that was just started.
        syncBgm();
        return true;
      })
      .catch(() => {
        syncBgm();
        return false;
      });
  }

  // Limit concurrent Web Audio voices — fall SFX used to spawn unbounded
  // oscillators until the browser silently stopped producing sound.
  const MAX_SFX_VOICES = 14;
  let activeVoices = 0;

  function trackVoice(stopper, holdSec) {
    if (activeVoices >= MAX_SFX_VOICES) {
      try {
        stopper();
      } catch (_) {}
      return false;
    }
    activeVoices++;
    let released = false;
    const done = () => {
      if (released) return;
      released = true;
      activeVoices = Math.max(0, activeVoices - 1);
    };
    // Fallback timer in case ended never fires
    setTimeout(done, Math.max(50, Math.ceil(holdSec * 1000) + 80));
    return done;
  }

  function tone(freq, dur, type, gainNode, when, peak, attack, release) {
    if (!ctx || !gainNode || !freq || freq <= 0) return;
    if (ctx.state !== "running") return;
    if (activeVoices >= MAX_SFX_VOICES) return;
    const t0 = when != null ? when : ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type || "square";
    osc.frequency.setValueAtTime(freq, t0);
    const pk = peak != null ? peak : 0.12;
    const atk = attack != null ? attack : 0.008;
    const rel = release != null ? release : Math.max(0.04, dur * 0.45);
    const endAt = t0 + Math.max(atk + 0.01, dur) + 0.03;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(pk, t0 + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(atk + 0.01, dur - rel));
    osc.connect(g);
    g.connect(gainNode);
    const releaseVoice = trackVoice(() => {
      try {
        osc.stop(0);
      } catch (_) {}
    }, endAt - t0);
    if (!releaseVoice) return;
    const cleanup = () => {
      try {
        osc.disconnect();
      } catch (_) {}
      try {
        g.disconnect();
      } catch (_) {}
      releaseVoice();
    };
    osc.onended = cleanup;
    try {
      osc.start(t0);
      osc.stop(endAt);
    } catch (_) {
      cleanup();
    }
  }

  function noiseBurst(dur, peak, filterFreq) {
    if (!ctx || !sfxGain || !sfxEnabled) return;
    if (ctx.state !== "running") return;
    if (activeVoices >= MAX_SFX_VOICES) return;
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
    const endAt = t0 + dur + 0.03;
    g.gain.setValueAtTime(peak || 0.14, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(sfxGain);
    const releaseVoice = trackVoice(() => {
      try {
        src.stop(0);
      } catch (_) {}
    }, dur + 0.05);
    if (!releaseVoice) return;
    const cleanup = () => {
      try {
        src.disconnect();
      } catch (_) {}
      try {
        filter.disconnect();
      } catch (_) {}
      try {
        g.disconnect();
      } catch (_) {}
      releaseVoice();
    };
    src.onended = cleanup;
    try {
      src.start(t0);
      src.stop(endAt);
    } catch (_) {
      cleanup();
    }
  }

  function fireSfx(name, detail) {
    if (!ctx || !sfxGain) return;
    if (ctx.state !== "running") return;
    const t = ctx.currentTime;
    switch (name) {
      case "move":
        tone(420, 0.045, "triangle", sfxGain, t, 0.11, 0.004, 0.03);
        break;
      case "rotate":
        tone(520, 0.05, "square", sfxGain, t, 0.1, 0.004, 0.03);
        tone(780, 0.06, "square", sfxGain, t + 0.03, 0.08, 0.004, 0.035);
        break;
      case "soft": {
        const nowMs = performance.now();
        if (nowMs - lastSoftAt < 70) break;
        lastSoftAt = nowMs;
        tone(280, 0.03, "triangle", sfxGain, t, 0.055, 0.003, 0.02);
        break;
      }
      case "hard":
        tone(180, 0.08, "sawtooth", sfxGain, t, 0.18, 0.004, 0.05);
        tone(90, 0.12, "triangle", sfxGain, t + 0.02, 0.14, 0.005, 0.07);
        noiseBurst(0.06, 0.09, 600);
        break;
      case "lock":
        tone(160, 0.07, "triangle", sfxGain, t, 0.13, 0.005, 0.04);
        noiseBurst(0.04, 0.06, 900);
        break;
      // —— 加减方块：口字 K / 日字 R / 三格竖线 V 各自差异化 ——
      // 口字：偏高、空灵（穿层感）
      case "fallK": {
        const nowMs = performance.now();
        if (nowMs - lastSoftAt < 90) break;
        lastSoftAt = nowMs;
        tone(980, 0.03, "sine", sfxGain, t, 0.07, 0.002, 0.022);
        break;
      }
      case "softK": {
        const nowMs = performance.now();
        if (nowMs - lastSoftAt < 50) break;
        lastSoftAt = nowMs;
        tone(880, 0.04, "sine", sfxGain, t, 0.1, 0.002, 0.03);
        tone(1320, 0.045, "triangle", sfxGain, t + 0.015, 0.06, 0.002, 0.03);
        break;
      }
      case "hardK":
        tone(1100, 0.07, "sine", sfxGain, t, 0.14, 0.003, 0.05);
        tone(1650, 0.08, "triangle", sfxGain, t + 0.03, 0.1, 0.003, 0.06);
        noiseBurst(0.04, 0.05, 1800);
        break;
      case "lockK":
        tone(1200, 0.06, "sine", sfxGain, t, 0.12, 0.003, 0.04);
        tone(900, 0.09, "triangle", sfxGain, t + 0.04, 0.09, 0.004, 0.06);
        break;
      // 日字：中音、短促金属感（打格感）
      case "fallR": {
        const nowMs = performance.now();
        if (nowMs - lastSoftAt < 90) break;
        lastSoftAt = nowMs;
        tone(520, 0.025, "square", sfxGain, t, 0.07, 0.002, 0.018);
        break;
      }
      case "softR": {
        const nowMs = performance.now();
        if (nowMs - lastSoftAt < 50) break;
        lastSoftAt = nowMs;
        tone(560, 0.035, "square", sfxGain, t, 0.09, 0.002, 0.025);
        tone(840, 0.03, "square", sfxGain, t + 0.018, 0.05, 0.002, 0.02);
        break;
      }
      case "hardR":
        tone(400, 0.07, "square", sfxGain, t, 0.15, 0.003, 0.045);
        tone(600, 0.08, "sawtooth", sfxGain, t + 0.03, 0.12, 0.004, 0.05);
        noiseBurst(0.05, 0.07, 1000);
        break;
      case "lockR":
        tone(700, 0.05, "square", sfxGain, t, 0.12, 0.003, 0.035);
        tone(350, 0.1, "triangle", sfxGain, t + 0.035, 0.1, 0.004, 0.07);
        noiseBurst(0.035, 0.045, 1100);
        break;
      // 三格竖线：偏低、厚实脉冲（加格感）
      case "fallV": {
        const nowMs = performance.now();
        if (nowMs - lastSoftAt < 90) break;
        lastSoftAt = nowMs;
        tone(240, 0.035, "triangle", sfxGain, t, 0.08, 0.003, 0.025);
        break;
      }
      case "softV": {
        const nowMs = performance.now();
        if (nowMs - lastSoftAt < 50) break;
        lastSoftAt = nowMs;
        tone(220, 0.04, "triangle", sfxGain, t, 0.1, 0.003, 0.03);
        tone(330, 0.045, "sawtooth", sfxGain, t + 0.02, 0.06, 0.003, 0.03);
        break;
      }
      case "hardV":
        tone(160, 0.09, "sawtooth", sfxGain, t, 0.16, 0.004, 0.06);
        tone(100, 0.14, "triangle", sfxGain, t + 0.04, 0.14, 0.005, 0.09);
        noiseBurst(0.06, 0.08, 500);
        break;
      case "lockV":
        tone(180, 0.08, "triangle", sfxGain, t, 0.13, 0.004, 0.05);
        tone(90, 0.12, "sine", sfxGain, t + 0.05, 0.1, 0.005, 0.08);
        noiseBurst(0.04, 0.05, 600);
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
            0.13,
            0.006,
            0.06
          );
        }
        if (n >= 4) {
          tone(880, 0.22, "triangle", sfxGain, t + 0.18, 0.14, 0.01, 0.1);
          tone(1174, 0.28, "triangle", sfxGain, t + 0.26, 0.11, 0.01, 0.12);
        }
        break;
      }
      case "level":
        tone(523.25, 0.1, "square", sfxGain, t, 0.13, 0.008, 0.05);
        tone(659.25, 0.12, "square", sfxGain, t + 0.1, 0.13, 0.008, 0.06);
        tone(783.99, 0.16, "square", sfxGain, t + 0.2, 0.15, 0.008, 0.08);
        break;
      case "boom":
        noiseBurst(0.18, 0.22, 400);
        tone(120, 0.16, "sawtooth", sfxGain, t, 0.22, 0.004, 0.1);
        tone(70, 0.28, "triangle", sfxGain, t + 0.04, 0.18, 0.008, 0.16);
        tone(220, 0.1, "square", sfxGain, t + 0.08, 0.1, 0.004, 0.08);
        noiseBurst(0.12, 0.14, 900);
        break;
      case "over":
        tone(392, 0.18, "sawtooth", sfxGain, t, 0.15, 0.01, 0.1);
        tone(311, 0.22, "sawtooth", sfxGain, t + 0.14, 0.15, 0.01, 0.12);
        tone(233, 0.35, "triangle", sfxGain, t + 0.3, 0.16, 0.01, 0.18);
        break;
      default:
        break;
    }
  }

  let resumeInFlight = null;

  function ensureRunningContext() {
    const c = ensureContext();
    if (!c) return Promise.resolve(null);
    if (c.state === "running") {
      applySfxGain();
      return Promise.resolve(c);
    }
    if (!resumeInFlight) {
      resumeInFlight = c
        .resume()
        .then(() => {
          resumeInFlight = null;
          applySfxGain();
          return c;
        })
        .catch(() => {
          resumeInFlight = null;
          return c;
        });
    }
    return resumeInFlight;
  }

  /** Called when the tab/app returns to the foreground. */
  function onPageForeground() {
    return ensureRunningContext().then(() => {
      applySfxGain();
      if (bgmEnabled && unlocked && gameActive) {
        // Force unmute + play after leave muted the element.
        playBgmElement();
      }
      return ctx;
    });
  }

  function playSfx(name, detail) {
    if (!sfxEnabled) return;

    // If somehow not unlocked yet but SFX is on, take the unlock path
    // (safe when called from a gesture; no-ops harmlessly otherwise).
    if (!unlocked) {
      unlock();
    }

    const c = ensureContext();
    if (!c) return;

    if (c.state === "suspended" || c.state === "interrupted") {
      // Resume once; fire after so tones aren't scheduled into a dead context.
      ensureRunningContext().then((running) => {
        if (sfxEnabled && running && running.state === "running") {
          fireSfx(name, detail);
        }
      });
      return;
    }

    fireSfx(name, detail);
  }

  function startBgm() {
    if (!unlocked || !bgmEnabled || !gameActive) return;
    ensureBgmElement();
    playBgmElement();
  }

  function stopBgm(immediate) {
    pauseBgmElement(!!immediate);
  }

  function syncBgm() {
    if (bgmEnabled && unlocked && gameActive) startBgm();
    else stopBgm(false);
  }

  function setSfxEnabled(on) {
    sfxEnabled = !!on;
    writeFlag(SFX_KEY, sfxEnabled);
    ensureContext();
    applySfxGain();
    if (sfxEnabled) {
      // Turning SFX back on: ensure context is live (gesture usually already called unlock).
      if (!unlocked) unlock();
      else resumeContext().then(() => applySfxGain());
    }
  }

  function setBgmEnabled(on) {
    bgmEnabled = !!on;
    writeFlag(BGM_KEY, bgmEnabled);
    if (!bgmEnabled) {
      stopBgm(true);
      return;
    }
    // Enabling: unlock/resume as needed, then force a play attempt.
    if (!unlocked) {
      unlock();
      return;
    }
    resumeContext().then(() => {
      ensureBgmElement();
      // Force play even if previously paused / bgmWantPlay was cleared by stopBgm.
      bgmWantPlay = true;
      syncBgm();
      playBgmElement();
    });
  }

  function setBgmTrack(index) {
    let idx = index | 0;
    if (idx < 0) idx = 0;
    if (idx >= BGM_TRACKS.length) idx = idx % BGM_TRACKS.length;
    const changed = idx !== bgmTrack;
    bgmTrack = idx;
    writeTrackIndex(bgmTrack);
    if (changed) {
      loadCurrentTrackSrc(false);
      if (bgmEnabled && unlocked && gameActive) {
        playBgmElement();
      }
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
    const file = currentFile(bgmActiveExt);
    return {
      index: bgmTrack,
      number: bgmTrack + 1,
      name: tr.name,
      count: BGM_TRACKS.length,
      file: file,
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

  // Pause BGM when leaving the tab/app; restore AudioContext + BGM on return.
  function pauseBgmForLeave() {
    pauseBgmElement(false);
  }

  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.visibilityState === "hidden") {
        pauseBgmForLeave();
        return;
      }
      if (document.visibilityState === "visible") {
        onPageForeground();
      }
    },
    true
  );

  window.addEventListener("pagehide", pauseBgmForLeave, true);
  window.addEventListener("pageshow", () => {
    onPageForeground();
  }, true);
  document.addEventListener("freeze", pauseBgmForLeave, true);

  window.TetrisAudio = {
    SFX_KEY,
    BGM_KEY,
    BGM_TRACK_KEY,
    BGM_TRACK_COUNT: BGM_TRACKS.length,
    TRACKS: BGM_TRACKS.map((t, i) => ({
      index: i,
      name: t.name,
      file: trackFile(t.base, PREFERRED_EXT),
      base: t.base,
    })),
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
