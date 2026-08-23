(function () {
  const resourceName = window.GetParentResourceName ? window.GetParentResourceName() : "qbloading";

  const serverNameEl = document.getElementById("server-name");
  const tipEl = document.getElementById("tip");

  let tips = [];
  let tipIndex = 0;
  let tipTimer = null;

  function applyTokens(tokens) {
    if (!tokens) return;
    const root = document.documentElement.style;
    for (const [key, value] of Object.entries(tokens)) {
      root.setProperty(`--${key}`, value);
    }
  }

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

  function fetchNui(callback, data) {
    return fetch(`https://${resourceName}/${callback}`, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify(data || {}),
    })
      .then((resp) => resp.json())
      .catch(() => null);
  }

  // Pull-on-mount: gets the current theme/copy immediately rather than
  // waiting on the live push below, which may have already fired before
  // this script ran.
  fetchNui("loadingscreen:getTheme").then((result) => {
    if (!result) return;
    applyServerName(result.serverName);
    applyTokens(result.tokens);
    startTips(result.tips);
  });

  window.addEventListener("message", (event) => {
    // FiveM posts SendNUIMessage from the game's own NUI window, which
    // arrives here with origin "nui://game" (verified in-game -- see
    // qblib/web/src/lib/useNuiEvent.ts for the same finding). Anything else
    // (e.g. another page's script probing this frame) arrives with a
    // different origin, so this is a cheap defense-in-depth check -- NOT an
    // event.source check, which would wrongly reject the real game messages
    // too (see that same file for why).
    if (event.origin !== "nui://game") return;

    const { action, data } = event.data || {};
    if (action === "loadingscreen:theme") {
      applyTokens(data);
    }
  });

  window.addEventListener("beforeunload", () => {
    clearInterval(tipTimer);
  });
})();
