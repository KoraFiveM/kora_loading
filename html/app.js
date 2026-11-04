(function () {
  const resourceName = window.GetParentResourceName ? window.GetParentResourceName() : "kora_loading";

  const serverNameEl = document.getElementById("server-name");
  const tipEl = document.getElementById("tip");
  const percentEl = document.getElementById("progress-percent");
  const statusEl = document.getElementById("progress-status");
  const fillEl = document.getElementById("progress-fill");
  const backdropEl = document.getElementById("backdrop");
  const slidesEl = document.getElementById("slides");
  const videoEl = document.getElementById("bg-video");
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

  // ---- Progress -----------------------------------------------------------
  // FiveM posts loadscreen progress to this window as message events. The bar
  // only ever moves forward and is driven purely by those events; the CSS
  // transition on the fill makes the steps look continuous.
  let progress = 0;
  let sawFraction = false;
  let showText = true;
  const initTotals = {};

  // Rough share of the whole load each game stage covers, used only until the
  // engine starts sending loadProgress fractions.
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

  // ---- Server name and tips ----------------------------------------------
  function applyServerName(name) {
    if (!name) return;
    // Keep the accent rail element, just swap the trailing text node.
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

  function startTips(list) {
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

  // ---- Theme --------------------------------------------------------------
  // kora_theme's theme.js sets --font-sans/--font-heading/--font-mono inline on
  // :root, which outranks any stylesheet rule, and re-applies them whenever the
  // live script loads or the theme refreshes. Opting out therefore has to shadow
  // those three on <body>: custom properties resolve per element, so a body-level
  // value wins for the whole page without fighting :root or needing !important.
  const fontSlots = ["font-sans", "font-heading", "font-mono"];

  function applyTheme(theme) {
    if (!theme || theme.fonts !== false) return;
    for (const slot of fontSlots) {
      document.body.style.setProperty(`--${slot}`, slot === "font-mono" ? "var(--kora-mono)" : "var(--kora-sans)");
    }
  }

  // ---- Media --------------------------------------------------------------
  // Only a path inside this resource's html folder or an https:// / nui:// URL is
  // accepted. `base` turns a relative path into a URL on another resource's NUI
  // origin, used for wallpapers named in kora_theme's own theme.json.
  function mediaUrl(value, base) {
    if (typeof value !== "string") return null;
    const url = value.trim();
    if (/^(https:\/\/|nui:\/\/)/i.test(url)) return url;
    if (!/^[\w][\w./ %-]*$/.test(url) || url.includes("..")) return null;
    return base ? base + url : url;
  }

  // Any still or animated format the browser can paint works as a wallpaper
  // (png, jpeg, webp, gif, svg, avif), from html/media/ or from a CDN, so no
  // extension list is enforced here -- CDN URLs often have none. Each source is
  // preloaded instead: a dead link or a blocked CDN drops out of the rotation
  // rather than covering the themed backdrop with a blank layer.
  function startSlides(urls, seconds) {
    clearInterval(slideTimer);
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
      document.body.classList.add("has-media");
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

  function startVideo(value) {
    const url = mediaUrl(value);
    if (!url) return;
    videoEl.muted = true;
    videoEl.loop = true;
    videoEl.src = url;
    videoEl.classList.add("active");
    videoEl.addEventListener("loadeddata", () => document.body.classList.add("has-media"), { once: true });
    videoEl.addEventListener("error", () => videoEl.classList.remove("active"), { once: true });
    videoEl.play().catch(() => {});
  }

  // Wallpaper sources, most specific first: what config.lua lists, then what
  // kora_theme's theme.json asks for, then the built-in default. A configured
  // video owns the backdrop, and backdrop = false means "paint nothing", so
  // neither pulls in a default wallpaper nobody asked for.
  function wallpapers(media, themeWallpaper) {
    const configured = (Array.isArray(media.images) ? media.images : []).map((value) => mediaUrl(value)).filter(Boolean);
    if (configured.length) return configured;
    if (mediaUrl(media.video) || media.backdrop === false) return [];
    const themed = (Array.isArray(themeWallpaper) ? themeWallpaper : [themeWallpaper])
      // A bare path in theme.json names a file kora_theme ships, not one of ours.
      .map((value) => mediaUrl(value, "https://cfx-nui-kora_theme/"))
      .filter(Boolean);
    if (themed.length) return themed;
    return [mediaUrl(media.defaultWallpaper)].filter(Boolean);
  }

  // kora_theme's theme.json, from the copy synced into this resource by
  // tools/sync-theme.mjs -- the same copy the colours come from, so there is
  // nothing to wait for and no cross-origin fetch while the page is on screen.
  function themeFile() {
    return fetch("kora_theme/theme.json")
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null);
  }

  // ---- Music player -------------------------------------------------------
  // Any audio format the browser can decode works (mp3, ogg, wav, m4a/aac,
  // flac, webm, and the audio track of an mp4), so no extension list is
  // enforced -- a track that will not decode is skipped at runtime instead.
  //
  // The panel is mouse-only: a loadscreen never gets keyboard focus, and the
  // cursor comes from `loadscreen_cursor 'yes'` in fxmanifest.lua.
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
      // Storage can be unavailable; the player just forgets between connects.
    }
  }

  // Fallback "now playing" label for a track configured without a title.
  function fileName(url) {
    const path = url.split(/[?#]/)[0];
    const last = path.slice(path.lastIndexOf("/") + 1).replace(/\.[a-z0-9]+$/i, "");
    try {
      return text(decodeURIComponent(last));
    } catch (_) {
      return text(last);
    }
  }

  // A plain string is accepted alongside { url, title, artist } so the older
  // single Config.media.music keeps working as a one-track playlist.
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

  // Muting leaves the volume alone, so unmuting restores exactly what was set.
  function setMuted(muted, persist) {
    audio.muted = muted;
    musicEl.classList.toggle("muted", muted);
    musicMuteEl.setAttribute("aria-label", muted ? "Unmute" : "Mute");
    if (persist) remember(mutedKey, muted ? "1" : "0");
  }

  // Chromium can refuse to start audio without a user gesture. Rather than fail
  // silently, show the panel paused with a hint so the player can start it. The
  // listener sits on the panel, not the document: the rest of the page keeps
  // pointer-events: none, so a click anywhere else is never seen here.
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
      // A source the browser cannot decode is a dead track, not a blocked
      // autoplay: skip it instead of asking the player to press play.
      if (error && error.name === "NotSupportedError") return dropTrack();
      armGesture();
    });
  }

  // Tracks are marked dead rather than counted, so a playlist of bad paths can
  // never spin through an endless skip loop whatever order the media events
  // arrive in.
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
    // Nothing is playable -- a wrong path or a blocked CDN. Hide the panel
    // rather than leave dead controls on screen.
    musicEl.hidden = true;
  }

  function loadTrack(index) {
    if (!tracks.length) return;
    trackIndex = ((index % tracks.length) + tracks.length) % tracks.length;
    const track = tracks[trackIndex];
    musicTitleEl.textContent = track.title || "Unknown track";
    musicArtistEl.textContent = track.artist;
    musicArtistEl.hidden = !track.artist;
    // A lone track loops in place; a playlist advances on "ended" instead, so
    // reloading the same source never leaves a gap.
    audio.loop = tracks.length === 1;
    audio.src = encodeURI(track.url);
    startPlayback();
  }

  function showPlayer(player, media) {
    audio = new Audio();
    audio.preload = "auto";
    // A player's own volume wins over the configured one, but a missing or
    // unreadable value must not silence the music.
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
    // Dragging the slider to zero reads as muting, and off zero as unmuting.
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

  // First value that is actually set wins, so an unset option falls through to
  // the next instead of silencing the music.
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
    // Nothing configured: the panel never appears, so the player can stay
    // enabled on a server that wants a silent loading screen.
    if (!tracks.length) return;
    if (player && player.enabled !== false) return showPlayer(player, media);
    // Player off: keep the plain looping background music, at the volume that
    // has always belonged to it, with no panel and no controls.
    audio = new Audio(encodeURI(tracks[0].url));
    audio.loop = true;
    audio.volume = volumeOf(media && media.musicVolume);
    audio.play().catch(() => {});
  }

  function applyMedia(media, useThemeWallpaper) {
    if (!media) return;
    if (media.backdrop === false) backdropEl.classList.add("transparent");
    backdropEl.style.setProperty("--dim", String(Math.min(1, Math.max(0, Number(media.dim) || 0))));
    startVideo(media.video);
    const theme = useThemeWallpaper ? themeFile() : Promise.resolve(null);
    theme.then((payload) => startSlides(wallpapers(media, payload && payload.wallpaper), media.slideSeconds));
  }

  // ---- Config from Lua ----------------------------------------------------
  // The callback only exists once this resource's client script is running,
  // which is after the loadscreen page has loaded, so retry until it answers.
  function fetchNui(callback, data) {
    return fetch(`https://${resourceName}/${callback}`, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify(data || {}),
    })
      .then((resp) => resp.json())
      .catch(() => null);
  }

  function loadConfig(attemptsLeft) {
    fetchNui("loadingscreen:getTheme").then((result) => {
      if (!result) {
        if (attemptsLeft > 0) setTimeout(() => loadConfig(attemptsLeft - 1), 1500);
        return;
      }
      applyServerName(result.serverName);
      startTips(result.tips);
      showText = result.showProgressText !== false;
      document.body.classList.toggle("no-progress-text", !showText);
      applyTheme(result.theme);
      applyMedia(result.media, result.media && result.media.themeWallpaper !== false);
      startMusic(result.musicPlayer, result.media);
    });
  }

  loadConfig(80);

  window.addEventListener("beforeunload", () => {
    clearInterval(tipTimer);
    clearInterval(slideTimer);
    if (audio) audio.pause();
  });
})();
