(function () {
  const resourceName = window.GetParentResourceName ? window.GetParentResourceName() : "qbloading";

  const serverNameEl = document.getElementById("server-name");
  const tipEl = document.getElementById("tip");

  let tips = [];
  let tipIndex = 0;
  let tipTimer = null;

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
    startTips(result.tips);
  });

  window.addEventListener("beforeunload", () => {
    clearInterval(tipTimer);
  });
})();
