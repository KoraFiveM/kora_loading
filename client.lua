-- NOTE: this resource has its own NUI frame (the `loadscreen` page), separate
-- from qblib's shared frame -- QB.nui.send/registerCallback would dispatch
-- into qblib's own resource VM (via the cross-resource export call) and so
-- target QBLIB's frame, not this one. Talk to this resource's own frame with
-- raw natives; qbtheme's imported bridge separately owns token delivery.

-- Pull-on-mount path for loading-screen content. Theme tokens use qbtheme's
-- separate qbtheme:ready callback from the imported bridge.
RegisterNUICallback('loadingscreen:getTheme', function(_, cb)
    cb({ serverName = Config.serverName, tips = Config.tips })
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
