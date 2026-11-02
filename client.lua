-- NOTE: this resource has its own NUI frame (the `loadscreen` page), separate
-- from kora_lib's shared frame -- Kora.nui.send/registerCallback would dispatch
-- into kora_lib's own resource VM (via the cross-resource export call) and so
-- target kora_lib's frame, not this one. Talk to this resource's own frame with
-- raw natives. Progress comes straight from FiveM's loadscreen message events in the page.
-- Colours come from kora_theme's theme.json through the synced copy in html/kora_theme
-- (tools/sync-theme.mjs), so no Lua theme bridge outlives the loading frame.

RegisterNUICallback('loadingscreen:getTheme', function(_, cb)
    cb({
        serverName = Config.serverName,
        tips = Config.tips,
        showProgressText = Config.showProgressText,
        media = Config.media,
    })
end)

-- `loadscreen_manual_shutdown 'yes'` gives the selection/spawn flow precise
-- control over the handoff. Keep an idempotent local fallback as well: a
-- failed or delayed cross-resource handoff must never leave this page above
-- gameplay after the player has loaded.
local hasShutdown = false

local function shutdown()
    if hasShutdown then return end
    hasShutdown = true
    ShutdownLoadingScreen()
    ShutdownLoadingScreenNui()
end

RegisterNetEvent('QBCore:Client:OnPlayerLoaded', shutdown)
AddEventHandler('qbmultichar:client:spawnComplete', shutdown)
