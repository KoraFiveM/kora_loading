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

  function wallpapers(media, themeWallpaper) {
    const configured = (Array.isArray(media.images) ? media.images : []).map((value) => mediaUrl(value)).filter(Boolean);
    if (configured.length) return configured;
    if (mediaUrl(media.video) || media.backdrop === false) return [];
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
    if (media.backdrop === false) backdropEl.classList.add("transparent");
    backdropEl.style.setProperty("--dim", String(Math.min(1, Math.max(0, Number(media.dim) || 0))));
    startVideo(media.video);
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
      video: "media/loading.webm",
      dim: 0.45,
    },
  };

  let gotRealConfig = false;
  let fallbackApplied = false;

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
      const player = Object.assign({}, result.musicPlayer);
      player.tracks = toList(player.tracks);
      startMusic(player, media);
    }
  }

  // This resource's client script only starts after the game has finished
  // loading, so during the real loading screen the NUI callback does not exist
  // yet. Show the built-in defaults at once; the real config replaces them.
  function showFallback() {
    if (gotRealConfig || fallbackApplied) return;
    fallbackApplied = true;
    console.warn("[kora_loading] getTheme not available yet, using built-in defaults");
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
      if (gotRealConfig) return;
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
