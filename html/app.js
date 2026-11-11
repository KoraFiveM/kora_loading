(function () {
  // A loadscreen page reports its parent resource as "loadingscreen", which no
  // NUI callback is registered under, so the real resource name is fixed here.
  const resourceName = "kora_loading";

  // The player's /theme colour, remembered from the last loading screen. This runs before the deferred
  // theme.js copies, so they pick it up on their first paint (see KoraThemePagePrimary in kora_theme/theme.js).
  const playerThemeKey = "kora_loading:playerTheme";
  const hexColour = /^#[0-9a-f]{6}$/i;
  window.KoraThemePagePrimary = hexColour.test(stored(playerThemeKey) || "") ? stored(playerThemeKey) : null;

  // From client.lua once it runs: a #RRGGBB colour, or false for the server default. Saved for next time.
  function applyPlayerTheme(colour) {
    const next = typeof colour === "string" && hexColour.test(colour) ? colour : null;
    if (next) remember(playerThemeKey, next);
    else forget(playerThemeKey);
    if (next === window.KoraThemePagePrimary) return;
    window.KoraThemePagePrimary = next;
    window.dispatchEvent(new Event("kora_theme:page-primary"));
  }

  const serverNameEl = document.getElementById("server-name");
  const tipEl = document.getElementById("tip");
  const percentEl = document.getElementById("progress-percent");
  const statusEl = document.getElementById("progress-status");
  const fillEl = document.getElementById("progress-fill");
  const backdropEl = document.getElementById("backdrop");
  const slidesEl = document.getElementById("slides");
  const videoLayerEl = document.getElementById("videos");
  const soundToggleEl = document.getElementById("sound-toggle");
  const musicEl = document.getElementById("music");
  const musicTitleEl = document.getElementById("music-title");
  const musicArtistEl = document.getElementById("music-artist");
  const musicToggleEl = document.getElementById("music-toggle");
  const musicNextEl = document.getElementById("music-next");
  const musicMuteEl = document.getElementById("music-mute");
  const musicVolumeEl = document.getElementById("music-volume");
  const musicHintEl = document.getElementById("music-hint");

  let tips = [];
  let tipIndex = 0;
  let tipTimer = null;
  let slideTimer = null;
  let audio = null;

  let progress = 0;
  let sawFraction = false;
  let showText = true;
  const initTotals = {};

  const stages = {
    INIT_CORE: { from: 0, to: 0.1, label: "Starting game" },
    INIT_BEFORE_MAP_LOADED: { from: 0.1, to: 0.35, label: "Preparing world" },
    MAP: { from: 0.35, to: 0.75, label: "Loading map" },
    INIT_AFTER_MAP_LOADED: { from: 0.75, to: 0.9, label: "Finishing map" },
    INIT_SESSION: { from: 0.9, to: 1, label: "Joining session" },
  };

  function setProgress(fraction) {
    if (typeof fraction !== "number" || !isFinite(fraction)) return;
    const percent = Math.max(progress, Math.min(100, Math.max(0, fraction * 100)));
    if (percent === progress && fillEl.style.transform) return;
    progress = percent;
    fillEl.style.transform = `scaleX(${progress / 100})`;
    percentEl.textContent = `${Math.floor(progress)}%`;
  }

  function setStatus(text) {
    if (text) statusEl.textContent = text;
  }

  function setStage(type, index, total) {
    const stage = stages[type];
    if (!stage) return;
    setStatus(stage.label);
    if (sawFraction || !total) return;
    setProgress(stage.from + (stage.to - stage.from) * Math.min(1, index / total));
  }

  const handlers = {
    loadProgress(data) {
      if (typeof data.loadFraction !== "number") return;
      if (data.loadFraction > 0) sawFraction = true;
      setProgress(data.loadFraction);
    },
    startInitFunctionOrder(data) {
      initTotals[data.type] = data.count;
      setStage(data.type, 0, data.count);
    },
    initFunctionInvoking(data) {
      setStage(data.type, data.idx, initTotals[data.type]);
    },
    startDataFileEntries(data) {
      initTotals.MAP = data.count;
      setStage("MAP", 0, data.count);
    },
    performMapLoadFunction(data) {
      setStage("MAP", data.idx, initTotals.MAP);
    },
    endDataFileEntries() {
      setStage("MAP", 1, 1);
    },
  };

  window.addEventListener("message", (event) => {
    const data = event.data;
    if (!data || typeof data !== "object") return;
    const handler = handlers[data.eventName];
    if (handler) handler(data);
  });

  function applyServerName(name) {
    if (!name) return;
    const rail = serverNameEl.querySelector(".rail");
    serverNameEl.textContent = "";
    serverNameEl.appendChild(rail);
    serverNameEl.appendChild(document.createTextNode(name));
  }

  function showTip(index) {
    if (!tips.length) return;
    tipEl.classList.add("fading");
    setTimeout(() => {
      tipEl.textContent = tips[index % tips.length];
      tipEl.classList.remove("fading");
    }, 400);
  }

  let tipsKey = null;

  function startTips(list) {
    const key = JSON.stringify(list);
    if (key === tipsKey) return;
    tipsKey = key;
    tips = Array.isArray(list) ? list : [];
    if (!tips.length) return;
    tipIndex = 0;
    showTip(tipIndex);
    clearInterval(tipTimer);
    tipTimer = setInterval(() => {
      tipIndex += 1;
      showTip(tipIndex);
    }, 6000);
  }

  const fontSlots = ["font-sans", "font-heading", "font-mono"];

  function applyTheme(theme) {
    if (!theme || theme.fonts !== false) return;
    for (const slot of fontSlots) {
      document.body.style.setProperty(`--${slot}`, slot === "font-mono" ? "var(--kora-mono)" : "var(--kora-sans)");
    }
  }

  function mediaUrl(value, base) {
    if (typeof value !== "string") return null;
    const url = value.trim();
    if (/^(https:\/\/|nui:\/\/)/i.test(url)) return url;
    if (!/^[\w][\w./ %-]*$/.test(url) || url.includes("..")) return null;
    return base ? base + url : url;
  }

  let slidesKey = null;

  function startSlides(urls, seconds) {
    // Config can arrive more than once (built-in defaults, handover, NUI callback): only rebuild on a real change.
    const key = JSON.stringify([urls, seconds]);
    if (key === slidesKey) return;
    slidesKey = key;
    clearInterval(slideTimer);
    setSlidesShown(false);
    slidesEl.textContent = "";
    if (!urls.length) return;

    let index = 0;
    const nodes = [];
    const ready = () => nodes.filter((node) => node.dataset.ready === "1");

    function show() {
      const list = ready();
      if (!list.length) return;
      const node = list[index % list.length];
      index += 1;
      for (const other of list) other.classList.toggle("active", other === node);
      setSlidesShown(true);
    }

    for (const url of urls) {
      const slide = document.createElement("div");
      slide.className = "slide";
      slidesEl.appendChild(slide);
      nodes.push(slide);
      const probe = new Image();
      probe.addEventListener("load", () => {
        slide.style.backgroundImage = `url("${probe.src}")`;
        slide.dataset.ready = "1";
        if (!slidesEl.querySelector(".slide.active")) show();
      });
      probe.addEventListener("error", () => {
        console.warn(`[kora_loading] wallpaper could not be loaded: ${url}`);
      });
      probe.src = encodeURI(url);
    }

    if (urls.length < 2) return;
    slideTimer = setInterval(show, Math.max(2, Number(seconds) || 8) * 1000);
  }

  function clampNumber(value, min, max, fallback) {
    if (value === undefined || value === null || value === "") return fallback;
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
  }

  // The playlist from config. Each row of Config.media.videos is { video, image, audio, seconds }:
  //   video   - a WebM clip. Its own soundtrack plays when "Play video sound" is on.
  //   image   - a still or animated image instead of a video (ignored when video is set).
  //   audio   - replaces the clip's sound: plays over the video (muting the video's own track) or the image.
  //   seconds - how long the clip runs. Default: the video's length, the audio's length for an image with
  //             audio, or "Seconds per image" otherwise. A video shorter than this loops until it is up.
  // A plain string row is treated as { video = row }, and the legacy single Config.media.video still works.
  function clipEntries(media) {
    const out = [];
    const rows = toList(media.videos).slice();
    if (!rows.length && media.video) rows.push(media.video);
    for (const raw of rows) {
      const row = typeof raw === "string" ? { video: raw } : raw && typeof raw === "object" ? raw : null;
      if (!row) continue;
      const video = mediaUrl(row.video);
      const image = video ? null : mediaUrl(row.image);
      const audio = mediaUrl(row.audio);
      if (!video && !image) {
        console.warn(`[kora_loading] playlist row skipped, it needs a video or an image: ${JSON.stringify(raw)}`);
        continue;
      }
      const seconds = clampNumber(row.seconds, 0, 3600, 0);
      out.push({ key: JSON.stringify([video, image, audio, seconds]), video, image, audio, seconds });
    }
    return out;
  }

  function videoSettings(media) {
    const clips = clipEntries(media);
    return {
      clips,
      keys: clips.map((clip) => clip.key),
      byKey: new Map(clips.map((clip) => [clip.key, clip])),
      order: ["sequential", "shuffle", "random"].includes(media.videoOrder) ? media.videoOrder : "sequential",
      randomStart: media.videoRandomStart === true,
      pinFirst: media.videoPinFirst === true,
      overlap: clampNumber(media.videoOverlap, 0, 10, 0),
      fadeIn: clampNumber(media.videoFadeIn, 0, 5, 0.6),
      maxSeconds: clampNumber(media.videoMaxSeconds, 0, 3600, 0),
      speed: clampNumber(media.videoSpeed, 0.25, 2, 1),
      fit: media.videoFit === "contain" ? "contain" : "cover",
      sound: media.videoSound === true,
      volume: clampNumber(media.videoVolume, 0, 1, 0.5),
      soundButton: media.videoSoundButton !== false,
      imageSeconds: clampNumber(media.slideSeconds, 2, 3600, 8),
    };
  }

  // Plays the playlist back to back on two stacked layers. The hidden layer preloads the next clip and is
  // started a moment before the visible one ends, but only made visible once its first frame has actually
  // been painted. Until then the outgoing clip keeps showing (frozen on its last frame at worst), so a
  // hand-over never shows a black frame, a restart or a jump. With an overlap the incoming layer fades in
  // over the outgoing one, and its sound fades in as the outgoing sound fades out.
  const videoPlayer = (() => {
    // Seconds of the outgoing clip given up on a cut so the incoming one is already decoding frames.
    const cutLead = 0.05;
    // Extra lead for a crossfade so the incoming clip is running by the time the fade starts.
    const fadeLead = 0.15;
    // Wait after a hand-over before loading the following clip, so its decoder start-up never lands on the cut.
    const refillDelay = 400;
    const soundMutedKey = "kora_loading:clipSoundMuted";

    const layers = [0, 1].map((index) => {
      const box = document.createElement("div");
      box.className = "bg-video";
      const video = document.createElement("video");
      video.className = "bg-clip-video";
      video.muted = true;
      video.playsInline = true;
      video.preload = "auto";
      video.disablePictureInPicture = true;
      video.setAttribute("playsinline", "");
      const image = document.createElement("div");
      image.className = "bg-clip-image";
      box.appendChild(video);
      box.appendChild(image);
      videoLayerEl.appendChild(box);
      const audio = new Audio();
      audio.preload = "auto";
      const layer = { box, video, image, audio, index, clip: null, need: null, token: 0, startedAt: 0, audioFailed: false };

      const loaded = (part) => () => {
        if (layer.need) layer.need[part] = false;
      };
      video.addEventListener("canplaythrough", loaded("video"));
      audio.addEventListener("canplaythrough", loaded("audio"));
      video.addEventListener("error", () => {
        if (layer.clip && layer.clip.video) broken(layer);
      });
      audio.addEventListener("error", () => {
        if (!layer.clip || !layer.clip.audio || layer.audioFailed) return;
        // Replacement audio that will not play is dropped; the clip itself still plays, silent.
        console.warn(`[kora_loading] clip audio could not be played: ${layer.clip.audio}`);
        layer.audioFailed = true;
        if (layer.need) layer.need.audio = false;
      });
      return layer;
    });

    let settings = null;
    let active = null; // layer on screen
    let incoming = null; // layer being started / faded in
    let fadeStartedAt = 0;
    let fadeEndsAt = 0;
    let refillAt = 0;
    let running = false;
    let last = null;
    let bag = [];
    let sequenceIndex = -1;
    let introPlayed = false;
    let userMuted = stored(soundMutedKey) === "1";
    let soundBlocked = false;
    const dead = new Set();

    const other = (layer) => layers[1 - layer.index];
    // The layer the next clip goes on: the hidden one, or with nothing on screen whichever already holds a clip.
    const standbyLayer = () => (active ? other(active) : layers.find((layer) => layer.clip) || layers[0]);
    const alive = () => settings.keys.filter((key) => !dead.has(key));
    const isReady = (layer) => layer.need && !layer.need.video && !layer.need.image && !layer.need.audio;

    function shuffled(list) {
      for (let i = list.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
      return list;
    }

    // With "always start with the first video" the first entry is an intro: it plays once, and the order
    // setting then applies to the rest. A list of just the intro (or with every other entry broken) loops it.
    const pinned = () => settings.pinFirst && settings.keys.length > 1;
    const rotation = () => (pinned() ? settings.keys.slice(1) : settings.keys);

    function pick() {
      const intro = settings.keys[0];
      if (pinned() && !introPlayed) {
        introPlayed = true;
        if (!dead.has(intro)) {
          last = intro;
          return intro;
        }
      }
      let pool = rotation().filter((key) => !dead.has(key));
      if (!pool.length && pinned() && !dead.has(intro)) pool = [intro];
      let choice = null;
      if (pool.length <= 1) {
        choice = pool[0] || null;
      } else if (settings.order === "random") {
        do choice = pool[Math.floor(Math.random() * pool.length)]; while (choice === last);
      } else if (settings.order === "shuffle") {
        bag = bag.filter((key) => pool.includes(key));
        if (!bag.length) {
          bag = shuffled(pool.slice());
          if (bag[0] === last) bag.push(bag.shift());
        }
        choice = bag.shift();
      } else {
        const keys = rotation();
        for (let step = 1; step <= keys.length; step += 1) {
          const index = (sequenceIndex + step) % keys.length;
          if (!dead.has(keys[index])) {
            sequenceIndex = index;
            choice = keys[index];
            break;
          }
        }
      }
      if (choice) last = choice;
      return choice;
    }

    // ---- sound ----

    // Which element carries this clip's sound: its replacement audio, else the video's own track if enabled.
    function soundOf(layer) {
      const clip = layer.clip;
      if (!clip) return null;
      if (clip.audio && !layer.audioFailed) return layer.audio;
      if (clip.video && settings.sound) return layer.video;
      return null;
    }

    const anySound = () => settings && settings.clips.some((clip) => clip.audio || (clip.video && settings.sound));

    function setLevel(layer, level) {
      const source = soundOf(layer);
      if (layer.video !== source) layer.video.muted = true;
      if (!source) return;
      source.volume = Math.min(1, Math.max(0, settings.volume * level));
      source.muted = userMuted || soundBlocked;
    }

    function refreshSoundButton() {
      const show = Boolean(settings && settings.soundButton && anySound() && running);
      soundToggleEl.hidden = !show;
      const silent = userMuted || soundBlocked;
      soundToggleEl.classList.toggle("muted", silent);
      soundToggleEl.setAttribute("aria-label", silent ? "Unmute" : "Mute");
    }

    function relevel() {
      for (const layer of layers) {
        if (layer === active || layer === incoming) setLevel(layer, layer === incoming && fadeEndsAt ? fadeLevel() : 1);
      }
      refreshSoundButton();
    }

    // Unmuted autoplay can be refused until the player clicks. The clip then carries on silently and the
    // first click anywhere on the screen turns the sound on.
    function blockSound() {
      if (soundBlocked) return;
      soundBlocked = true;
      relevel();
      document.addEventListener("pointerdown", () => {
        soundBlocked = false;
        relevel();
        for (const layer of [active, incoming]) {
          const source = layer && soundOf(layer);
          if (source && source.paused && source === layer.audio) source.play().catch(() => {});
        }
      }, { once: true, capture: true });
    }

    function playPart(layer, el, token) {
      const started = el.play();
      if (!started || typeof started.catch !== "function") return;
      started.catch((error) => {
        if (token !== layer.token || (error && error.name === "AbortError")) return;
        if (error && error.name === "NotAllowedError" && !el.muted) {
          blockSound();
          el.muted = true;
          el.play().catch(() => {});
          return;
        }
        if (el === layer.video) broken(layer);
      });
    }

    soundToggleEl.addEventListener("click", () => {
      if (soundBlocked) {
        soundBlocked = false;
        userMuted = false;
      } else {
        userMuted = !userMuted;
      }
      remember(soundMutedKey, userMuted ? "1" : "0");
      relevel();
    });

    // ---- layers ----

    function hide(layer) {
      layer.box.style.transition = "none";
      layer.box.classList.remove("shown");
      layer.box.style.zIndex = "0";
    }

    function silence(layer) {
      layer.video.pause();
      layer.audio.pause();
    }

    function unload(layer) {
      layer.token += 1;
      layer.clip = null;
      layer.need = null;
      silence(layer);
      layer.video.removeAttribute("src");
      layer.video.load();
      layer.audio.removeAttribute("src");
      layer.audio.load();
      layer.image.style.backgroundImage = "";
    }

    function load(layer, key) {
      const clip = settings.byKey.get(key);
      layer.token += 1;
      const token = layer.token;
      layer.clip = clip;
      layer.audioFailed = false;
      layer.need = { video: Boolean(clip.video), image: Boolean(clip.image), audio: Boolean(clip.audio) };
      hide(layer);
      silence(layer);
      layer.box.classList.toggle("is-image", !clip.video);

      layer.video.muted = true;
      layer.video.loop = false;
      if (clip.video) {
        layer.video.defaultPlaybackRate = settings.speed;
        layer.video.src = clip.video;
        layer.video.load();
      } else {
        layer.video.removeAttribute("src");
        layer.video.load();
      }

      if (clip.audio) {
        layer.audio.src = encodeURI(clip.audio);
        layer.audio.load();
      } else {
        layer.audio.removeAttribute("src");
        layer.audio.load();
      }

      layer.image.style.backgroundImage = "";
      if (clip.image) {
        const probe = new Image();
        probe.addEventListener("load", () => {
          if (token !== layer.token) return;
          layer.image.style.backgroundImage = `url("${probe.src}")`;
          layer.need.image = false;
        });
        probe.addEventListener("error", () => {
          if (token === layer.token) broken(layer);
        });
        probe.src = encodeURI(clip.image);
      }
    }

    function fill(layer) {
      const key = pick();
      if (key) load(layer, key);
      else if (!active && !incoming) stop();
    }

    function broken(layer) {
      if (!layer.clip) return;
      const clip = layer.clip;
      console.warn(`[kora_loading] clip could not be played: ${clip.video || clip.image}`);
      dead.add(clip.key);
      const wasOnScreen = layer === active;
      unload(layer);
      if (layer === incoming) incoming = null;
      if (wasOnScreen) {
        hide(layer);
        active = null;
      }
      if (!alive().length && !active) stop();
    }

    // Where the clip is and where it ends, in the clip's own seconds (video time for a video, audio time
    // for an image with audio, wall-clock time for a silent image).
    function clock(layer, now) {
      const clip = layer.clip;
      if (clip.video) {
        const el = layer.video;
        const duration = Number.isFinite(el.duration) && el.duration > 0 ? el.duration : Infinity;
        let end = duration;
        if (clip.seconds > 0) end = clip.seconds;
        else if (settings.maxSeconds > 0) end = Math.min(duration, settings.maxSeconds);
        const looping = el.loop;
        const elapsed = looping ? (now - layer.startedAt) / 1000 * settings.speed : el.currentTime;
        return { t: elapsed, end, ended: !looping && el.ended, rate: settings.speed };
      }
      if (clip.audio && !layer.audioFailed) {
        const el = layer.audio;
        const duration = Number.isFinite(el.duration) && el.duration > 0 ? el.duration : Infinity;
        const end = clip.seconds > 0 ? Math.min(clip.seconds, duration) : duration;
        return { t: el.currentTime, end, ended: el.ended, rate: 1 };
      }
      const end = clip.seconds > 0 ? clip.seconds : settings.imageSeconds;
      return { t: (now - layer.startedAt) / 1000, end, ended: false, rate: 1 };
    }

    function fadeLevel() {
      if (!fadeEndsAt) return 1;
      const span = fadeEndsAt - fadeStartedAt;
      return span > 0 ? Math.min(1, Math.max(0, (performance.now() - fadeStartedAt) / span)) : 1;
    }

    // Starts `layer` and shows it once its first frame is on screen, fading over `fade` seconds.
    function begin(layer, fade) {
      const from = active;
      const token = layer.token;
      const clip = layer.clip;
      incoming = layer;
      layer.box.style.zIndex = "2";
      if (from) from.box.style.zIndex = "1";

      let revealed = false;
      const reveal = () => {
        if (revealed || token !== layer.token || incoming !== layer) return;
        revealed = true;
        layer.box.style.transition = fade > 0 ? `opacity ${fade}s linear` : "none";
        layer.box.classList.add("shown");
        setVideoShown(true);
        fadeStartedAt = performance.now();
        fadeEndsAt = fadeStartedAt + fade * 1000;
        if (fade <= 0) finish();
      };

      layer.startedAt = performance.now();
      // On a crossfade the incoming sound starts silent and rises with the picture (see tick).
      setLevel(layer, fade > 0 && from ? 0 : 1);
      if (clip.audio && !layer.audioFailed) playPart(layer, layer.audio, token);

      if (clip.video) {
        layer.video.playbackRate = settings.speed;
        // A video shorter than its row's seconds loops until the time is up.
        const duration = layer.video.duration;
        layer.video.loop = clip.seconds > 0 && Number.isFinite(duration) && duration < clip.seconds;
        if (typeof layer.video.requestVideoFrameCallback === "function") {
          layer.video.requestVideoFrameCallback(() => reveal());
        }
        // Safety net for a browser without frame callbacks, or one that skips the first callback.
        layer.video.addEventListener("playing", () => requestAnimationFrame(() => requestAnimationFrame(reveal)), { once: true });
        playPart(layer, layer.video, token);
      } else {
        // The image is already decoded (it was loaded through an Image probe), so it can show next frame.
        requestAnimationFrame(reveal);
      }
    }

    // The incoming layer is fully visible: retire the outgoing one and queue the following clip on it.
    function finish() {
      const from = active;
      active = incoming;
      incoming = null;
      fadeStartedAt = 0;
      fadeEndsAt = 0;
      setLevel(active, 1);
      if (from && from !== active) {
        hide(from);
        silence(from);
        from.clip = null;
        from.need = null;
        refillAt = performance.now() + refillDelay;
      } else {
        refillAt = performance.now();
      }
      refreshSoundButton();
    }

    function tick(now) {
      if (!running) return;
      requestAnimationFrame(tick);
      if (!settings || !settings.keys.length) return;

      if (incoming) {
        if (fadeEndsAt) {
          // Crossfade the sound with the picture.
          const level = fadeLevel();
          setLevel(incoming, level);
          if (active) setLevel(active, 1 - level);
          if (now >= fadeEndsAt && incoming.box.classList.contains("shown")) finish();
        }
        return;
      }

      const standby = standbyLayer();
      if (!standby.clip) {
        if (now < refillAt) return;
        fill(standby);
        return;
      }

      if (!active) {
        const nearlyReady = standby.need && !standby.need.image && !standby.need.audio && (!standby.need.video || standby.video.readyState >= 3);
        if (isReady(standby) || nearlyReady) begin(standby, settings.fadeIn);
        return;
      }

      const time = clock(active, now);
      const atEnd = time.ended || time.t >= time.end;
      const remaining = (time.end - time.t) / time.rate;
      const overlap = Math.min(settings.overlap, (Number.isFinite(time.end) ? time.end / time.rate : Infinity) / 2);
      const lead = overlap > 0 ? overlap + fadeLead : cutLead;
      const ready = isReady(standby)
        || (atEnd && standby.need && !standby.need.image && (!standby.need.video || standby.video.readyState >= 3));

      if ((atEnd || remaining <= lead) && ready) {
        // A crossfade ends as the outgoing clip does; if the hand-over is late, it fades over a frozen last frame.
        const fade = overlap > 0 ? (remaining > 0.1 ? Math.min(overlap, remaining) : overlap) : 0;
        begin(standby, fade);
        return;
      }
      // A clip past its end is held on its last frame, silent, until the next one can take over.
      if (atEnd) {
        if (active.clip.video && !active.video.paused && !active.video.ended) active.video.pause();
        if (!active.audio.paused) active.audio.pause();
      }
    }

    function stop() {
      running = false;
      incoming = null;
      active = null;
      for (const layer of layers) {
        layer.box.style.transition = "opacity 600ms ease";
        layer.box.classList.remove("shown");
        setTimeout(() => {
          if (!running) unload(layer);
        }, 650);
      }
      setVideoShown(false);
      refreshSoundButton();
    }

    function apply(next) {
      const previous = settings;
      settings = next;
      videoLayerEl.style.setProperty("--video-fit", next.fit);
      for (const layer of layers) {
        layer.video.defaultPlaybackRate = next.speed;
        layer.video.playbackRate = next.speed;
      }

      const listChanged = !previous
        || previous.keys.join("\n") !== next.keys.join("\n")
        || previous.order !== next.order
        || previous.randomStart !== next.randomStart
        || previous.pinFirst !== next.pinFirst;

      if (listChanged) {
        bag = [];
        // Clip records come from the settings object, so re-point layers at the new list's records.
        for (const layer of layers) {
          if (layer.clip) layer.clip = next.byKey.get(layer.clip.key) || layer.clip;
        }
        const current = (incoming && incoming.clip && incoming.clip.key) || (active && active.clip && active.clip.key);
        // Once anything is on screen the opening slot is used: a late list never inserts the intro mid-way.
        introPlayed = Boolean(current);
        const list = rotation();
        sequenceIndex = current ? list.indexOf(current) : -1;
        if (!current && next.randomStart && next.order === "sequential") {
          sequenceIndex = Math.floor(Math.random() * list.length) - 1;
        }
        if (!current && next.order !== "sequential") last = null;
        // Swap the queued-up clip for one from the new list. The clip on screen plays out untouched and the
        // new list takes over at the next hand-over, so a late settings update never interrupts playback.
        if (!incoming) {
          const standby = standbyLayer();
          if (standby.clip && standby !== active) unload(standby);
          refillAt = 0;
        }
      }

      if (!next.keys.length) {
        if (active || incoming) stop();
        return;
      }
      if (!running) {
        running = true;
        requestAnimationFrame(tick);
      }
      relevel();
    }

    return { apply };
  })();

  let videoShown = false;
  let slidesShown = false;

  function setVideoShown(shown) {
    videoShown = shown;
    document.body.classList.toggle("has-media", videoShown || slidesShown);
  }

  function setSlidesShown(shown) {
    slidesShown = shown;
    document.body.classList.toggle("has-media", videoShown || slidesShown);
  }

  function wallpapers(media, themeWallpaper) {
    const configured = (Array.isArray(media.images) ? media.images : []).map((value) => mediaUrl(value)).filter(Boolean);
    if (configured.length) return configured;
    if (clipEntries(media).length || media.backdrop === false) return [];
    const themed = (Array.isArray(themeWallpaper) ? themeWallpaper : [themeWallpaper])
      .map((value) => mediaUrl(value, "https://cfx-nui-kora_theme/"))
      .filter(Boolean);
    if (themed.length) return themed;
    return [mediaUrl(media.defaultWallpaper)].filter(Boolean);
  }

  function themeFile() {
    return fetch("kora_theme/theme.json")
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null);
  }

  const volumeKey = "kora_loading:volume";
  const mutedKey = "kora_loading:muted";

  let tracks = [];
  let trackIndex = 0;
  let lastVolume = 0.3;
  let waitingForClick = false;

  const text = (value) => (typeof value === "string" ? value.trim().slice(0, 120) : "");

  function stored(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (_) {
      return null;
    }
  }

  function remember(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (_) {
    }
  }

  function forget(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (_) {
    }
  }

  function fileName(url) {
    const path = url.split(/[?#]/)[0];
    const last = path.slice(path.lastIndexOf("/") + 1).replace(/\.[a-z0-9]+$/i, "");
    try {
      return text(decodeURIComponent(last));
    } catch (_) {
      return text(last);
    }
  }

  function playlistFrom(player, media) {
    const configured = Array.isArray(player && player.tracks) ? player.tracks : [];
    const list = [];
    for (const entry of configured) {
      const track = typeof entry === "string" ? { url: entry } : entry;
      const url = track && mediaUrl(track.url);
      if (!url) continue;
      list.push({ url, title: text(track.title) || fileName(url), artist: text(track.artist) });
    }
    if (list.length) return list;
    const single = mediaUrl(media && media.music);
    return single ? [{ url: single, title: fileName(single), artist: "" }] : [];
  }

  function setPaused(paused) {
    musicEl.classList.toggle("paused", paused);
    musicToggleEl.setAttribute("aria-label", paused ? "Play" : "Pause");
  }

  function setVolume(volume, persist) {
    const value = Math.min(1, Math.max(0, Number(volume) || 0));
    audio.volume = value;
    musicVolumeEl.value = String(Math.round(value * 100));
    if (value > 0) lastVolume = value;
    if (persist) remember(volumeKey, String(value));
  }

  function setMuted(muted, persist) {
    audio.muted = muted;
    musicEl.classList.toggle("muted", muted);
    musicMuteEl.setAttribute("aria-label", muted ? "Unmute" : "Mute");
    if (persist) remember(mutedKey, muted ? "1" : "0");
  }

  function armGesture() {
    if (waitingForClick) return;
    waitingForClick = true;
    musicHintEl.hidden = false;
    musicEl.addEventListener("pointerdown", () => {
      waitingForClick = false;
      musicHintEl.hidden = true;
      if (audio.paused) startPlayback();
    }, { once: true });
  }

  function startPlayback() {
    audio.play().then(() => {
      musicHintEl.hidden = true;
      setPaused(false);
    }).catch((error) => {
      setPaused(true);
      if (error && error.name === "NotSupportedError") return dropTrack();
      armGesture();
    });
  }

  function dropTrack() {
    const track = tracks[trackIndex];
    if (!track || track.dead) return;
    console.warn(`[kora_loading] track could not be played: ${track.url}`);
    track.dead = true;
    advance();
  }

  function advance() {
    for (let step = 1; step <= tracks.length; step += 1) {
      const index = (trackIndex + step) % tracks.length;
      if (!tracks[index].dead) return loadTrack(index);
    }
    musicEl.hidden = true;
  }

  function loadTrack(index) {
    if (!tracks.length) return;
    trackIndex = ((index % tracks.length) + tracks.length) % tracks.length;
    const track = tracks[trackIndex];
    musicTitleEl.textContent = track.title || "Unknown track";
    musicArtistEl.textContent = track.artist;
    musicArtistEl.hidden = !track.artist;
    audio.loop = tracks.length === 1;
    audio.src = encodeURI(track.url);
    startPlayback();
  }

  function showPlayer(player, media) {
    audio = new Audio();
    audio.preload = "auto";
    const saved = stored(volumeKey);
    const savedVolume = saved ? Number(saved) : NaN;
    setVolume(Number.isFinite(savedVolume) ? savedVolume : volumeOf(player && player.volume, media && media.musicVolume), false);
    setMuted(stored(mutedKey) === "1", false);

    musicToggleEl.addEventListener("click", () => {
      if (!audio.paused) {
        audio.pause();
        setPaused(true);
        return;
      }
      startPlayback();
    });
    musicNextEl.addEventListener("click", () => advance());
    musicMuteEl.addEventListener("click", () => {
      if (!audio.muted) return setMuted(true, true);
      setMuted(false, true);
      if (audio.volume === 0) setVolume(lastVolume || 0.3, true);
    });
    musicVolumeEl.addEventListener("input", () => {
      const value = Number(musicVolumeEl.value) / 100;
      const silent = value === 0;
      setVolume(value, true);
      if (silent !== audio.muted) setMuted(silent, true);
    });

    audio.addEventListener("playing", () => setPaused(false));
    audio.addEventListener("pause", () => setPaused(true));
    audio.addEventListener("ended", () => advance());
    audio.addEventListener("error", dropTrack);

    musicEl.hidden = false;
    loadTrack(0);
  }

  function volumeOf(...values) {
    for (const value of values) {
      if (value === undefined || value === null || value === "") continue;
      const volume = Number(value);
      if (Number.isFinite(volume)) return Math.min(1, Math.max(0, volume));
    }
    return 0.3;
  }

  function startMusic(player, media) {
    tracks = playlistFrom(player, media);
    if (!tracks.length) return;
    if (player && player.enabled !== false) return showPlayer(player, media);
    audio = new Audio(encodeURI(tracks[0].url));
    audio.loop = true;
    audio.volume = volumeOf(media && media.musicVolume);
    audio.play().catch(() => {});
  }

  function applyMedia(media, useThemeWallpaper) {
    if (!media) return;
    backdropEl.classList.toggle("transparent", media.backdrop === false);
    backdropEl.style.setProperty("--dim", String(Math.min(1, Math.max(0, Number(media.dim) || 0))));
    videoPlayer.apply(videoSettings(media));
    const theme = useThemeWallpaper ? themeFile() : Promise.resolve(null);
    theme.then((payload) => startSlides(wallpapers(media, payload && payload.wallpaper), media.slideSeconds));
  }

  function fetchNui(callback, data) {
    const abort = new AbortController();
    setTimeout(() => abort.abort(), 1500);
    return fetch(`https://${resourceName}/${callback}`, {
      signal: abort.signal,
      method: "POST",
      headers: { "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify(data || {}),
    })
      .then((resp) => resp.json())
      .catch(() => null);
  }

  // Lua tables that were wrapped by the config layer can reach the page as
  // objects instead of arrays, which would silently empty the tips and images.
  function toList(value) {
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") return Object.values(value);
    return [];
  }

  // Shown only if the resource's client script has not answered yet, so the
  // screen is never bare while waiting. Real config replaces it on arrival.
  const fallbackConfig = {
    tips: [
      "Tip: press F1 to open the phone.",
      "Tip: you can holster your weapon to avoid drawing attention.",
      "Tip: type /report in chat if you run into a bug.",
      "Tip: robbing a store alerts nearby police.",
      "Tip: buy a house to unlock private storage.",
    ],
    showProgressText: true,
    media: {
      backdrop: true,
      images: [],
      themeWallpaper: true,
      defaultWallpaper:
        "https://cdn.discordapp.com/banners/1565098239345303633/a_997cab204dc43b4a941d8e341aed5d34.webp?size=480&animated=true",
      slideSeconds: 8,
      // Keep in step with Config.media in config.lua: only used if the server's handover never arrives.
      videos: [
        "media/intro.webm",
        "media/ambulance.webm",
        "media/atv.webm",
        "media/bank.webm",
        "media/burgershot.webm",
        "media/club.webm",
        "media/mechanic.webm",
        "media/police.webm",
        "media/spraypaint.webm",
        "media/taxi.webm",
      ],
      videoOrder: "shuffle",
      videoRandomStart: false,
      videoPinFirst: true,
      videoOverlap: 0,
      videoFadeIn: 0.6,
      videoMaxSeconds: 0,
      videoSpeed: 1,
      videoFit: "cover",
      videoSound: true,
      videoVolume: 0.5,
      videoSoundButton: true,
      dim: 0.45,
    },
  };

  // Config can arrive up to three times: the built-in defaults above, the server's handover (as soon as the
  // page opens) and the NUI callback (only near the end of loading). applyConfig is safe to repeat: anything
  // unchanged is left running, and a changed video list takes over at the next clip without interrupting.
  let gotRealConfig = false;
  let gotNuiConfig = false;
  let fallbackApplied = false;
  let musicStarted = false;

  function applyConfig(result, real) {
    startTips(toList(result.tips));
    if (result.serverName) applyServerName(result.serverName);
    showText = result.showProgressText !== false;
    document.body.classList.toggle("no-progress-text", !showText);
    const media = Object.assign({}, result.media);
    media.images = toList(media.images);
    applyTheme(result.theme);
    applyMedia(media, media.themeWallpaper !== false);
    if (real) {
      if (Object.prototype.hasOwnProperty.call(result, "playerTheme")) applyPlayerTheme(result.playerTheme);
      if (!musicStarted) {
        musicStarted = true;
        const player = Object.assign({}, result.musicPlayer);
        player.tracks = toList(player.tracks);
        startMusic(player, media);
      }
    }
  }

  // server.lua hands the settings over while the player connects (deferrals.handover), so they are normally
  // here from the first frame. Checked again briefly in case the client injects them a moment late.
  function applyHandover() {
    if (gotRealConfig) return true;
    const data = window.nuiHandoverData;
    const config = data && typeof data === "object" ? data.kora_loading : null;
    if (!config || typeof config !== "object") return false;
    gotRealConfig = true;
    applyConfig(config, true);
    return true;
  }

  if (!applyHandover()) {
    let checks = 0;
    const poll = setInterval(() => {
      checks += 1;
      if (applyHandover() || checks >= 40) clearInterval(poll);
    }, 100);
  }

  // Without a handover (e.g. the resource was started after the player connected) the NUI callback only
  // exists once the client script runs near the end of loading. Show the built-in defaults until then.
  function showFallback() {
    if (gotRealConfig || fallbackApplied) return;
    fallbackApplied = true;
    console.warn("[kora_loading] no handover data and getTheme not available yet, using built-in defaults");
    applyConfig(fallbackConfig, false);
  }

  setTimeout(showFallback, 300);

  function loadConfig(attemptsLeft, tried) {
    fetchNui("loadingscreen:getTheme").then((result) => {
      if (!result) {
        showFallback();
        if (attemptsLeft > 0) setTimeout(() => loadConfig(attemptsLeft - 1, tried + 1), 1500);
        return;
      }
      if (gotNuiConfig) return;
      gotNuiConfig = true;
      gotRealConfig = true;
      applyConfig(result, true);
    });
  }

  loadConfig(80, 0);

  window.addEventListener("beforeunload", () => {
    clearInterval(tipTimer);
    clearInterval(slideTimer);
    if (audio) audio.pause();
  });
})();
