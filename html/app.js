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
  // Only a path inside this resource's html folder or an https:// / nui:// URL is accepted.
  function mediaUrl(value) {
    if (typeof value !== "string") return null;
    const url = value.trim();
    if (/^(https:\/\/|nui:\/\/)/i.test(url)) return url;
    return /^[\w][\w./ %-]*$/.test(url) && !url.includes("..") ? url : null;
  }

  function startSlides(images, seconds) {
    const urls = (Array.isArray(images) ? images : []).map(mediaUrl).filter(Boolean);
    clearInterval(slideTimer);
    slidesEl.textContent = "";
    if (!urls.length) return;
    const nodes = urls.map((url) => {
      const slide = document.createElement("div");
      slide.className = "slide";
      slide.style.backgroundImage = `url("${encodeURI(url)}")`;
      slidesEl.appendChild(slide);
      return slide;
    });
    let current = 0;
    nodes[0].classList.add("active");
    if (nodes.length < 2) return;
    slideTimer = setInterval(() => {
      nodes[current].classList.remove("active");
      current = (current + 1) % nodes.length;
      nodes[current].classList.add("active");
    }, Math.max(2, Number(seconds) || 8) * 1000);
  }

  function startVideo(value) {
    const url = mediaUrl(value);
    if (!url) return;
    videoEl.muted = true;
    videoEl.loop = true;
    videoEl.src = url;
    videoEl.classList.add("active");
    videoEl.addEventListener("error", () => videoEl.classList.remove("active"), { once: true });
    videoEl.play().catch(() => {});
  }

  function startMusic(value, volume) {
    const url = mediaUrl(value);
    if (!url) return;
    audio = new Audio(url);
    audio.loop = true;
    audio.volume = Math.min(1, Math.max(0, Number(volume) || 0));
    audio.play().catch(() => {});
  }

  function applyMedia(media) {
    if (!media) return;
    if (media.backdrop === false) backdropEl.classList.add("transparent");
    backdropEl.style.setProperty("--dim", String(Math.min(1, Math.max(0, Number(media.dim) || 0))));
    startSlides(media.images, media.slideSeconds);
    startVideo(media.video);
    startMusic(media.music, media.musicVolume);
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
      applyMedia(result.media);
    });
  }

  loadConfig(80);

  window.addEventListener("beforeunload", () => {
    clearInterval(tipTimer);
    clearInterval(slideTimer);
    if (audio) audio.pause();
  });
})();
