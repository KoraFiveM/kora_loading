(function () {
  // Must match playerThemeKey in app.js.
  const key = "kora_loading:playerTheme";
  const hexColour = /^#[0-9a-f]{6}$/i;

  function save(colour) {
    try {
      if (typeof colour === "string" && hexColour.test(colour)) window.localStorage.setItem(key, colour);
      else window.localStorage.removeItem(key);
    } catch (_) { /* storage blocked: the loading screen falls back to the server colour */ }
  }

  // Live changes: client.lua forwards kora_theme's kora_theme:playerThemeChanged.
  window.addEventListener("message", (event) => {
    if (event.data && event.data.action === "kora_loading:playerTheme") save(event.data.data);
  });

  // Initial value, for players who chose a colour before this page existed.
  fetch(`https://${GetParentResourceName()}/loadingscreen:syncTheme`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    body: "{}",
  }).then((r) => r.json()).then((payload) => save(payload && payload.colour)).catch(() => {});
})();
