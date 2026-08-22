(function () {
  const resourceName = window.GetParentResourceName ? window.GetParentResourceName() : "loadingscreen";

  function applyTokens(tokens) {
    if (!tokens) return;
    const root = document.documentElement.style;
    for (const [key, value] of Object.entries(tokens)) {
      root.setProperty(`--${key}`, value);
    }
  }

  function applyServerName(name) {
    if (!name) return;
    const el = document.getElementById("server-name");
    if (el) el.textContent = name;
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

  // Pull-on-mount: gets the current theme immediately rather than waiting on
  // the live push below, which may have already fired before this script ran.
  fetchNui("loadingscreen:getTheme").then((result) => {
    if (!result) return;
    applyServerName(result.serverName);
    applyTokens(result.tokens);
  });

  window.addEventListener("message", (event) => {
    const { action, data } = event.data || {};
    if (action === "loadingscreen:theme") {
      applyTokens(data);
    }
  });
})();
