local function plainList(source)
    local out = {}
    for _, value in ipairs(source or {}) do out[#out + 1] = value end
    return out
end

-- The player's /theme colour lives in kora_theme's client KVP, which only kora_theme can read, and this script
-- only runs near the end of loading. So the page keeps its own copy (localStorage) for the next loading screen,
-- and this hands it the current value: a #RRGGBB string, or false for the server default.
local function playerTheme()
    local ok, colour = pcall(function() return exports.kora_theme:getPlayerTheme() end)
    return ok and type(colour) == 'string' and colour or false
end

-- Keep the loading screen's cached colour current: the sync page answers this once on load, and
-- kora_theme raises qbtheme:playerThemeChanged (local event) whenever /theme changes or resets.
RegisterNUICallback('loadingscreen:syncTheme', function(_, cb)
    cb({ colour = playerTheme() })
end)

AddEventHandler('qbtheme:playerThemeChanged', function()
    SendNUIMessage({ action = 'kora_loading:playerTheme', data = playerTheme() })
end)

RegisterNUICallback('loadingscreen:getTheme', function(_, cb)
    local media = {}
    for key, value in pairs(Config.media or {}) do media[key] = value end
    media.images = plainList(Config.media and Config.media.images)

    local player = {}
    for key, value in pairs(Config.musicPlayer or {}) do player[key] = value end
    player.tracks = plainList(Config.musicPlayer and Config.musicPlayer.tracks)

    cb({
        serverName = Config.serverName,
        tips = plainList(Config.tips),
        showProgressText = Config.showProgressText,
        theme = Config.theme,
        playerTheme = playerTheme(),
        media = media,
        musicPlayer = player,
    })
end)

local hasShutdown = false

local function shutdown()
    if hasShutdown then return end
    hasShutdown = true
    ShutdownLoadingScreen()
    ShutdownLoadingScreenNui()
end

RegisterNetEvent('QBCore:Client:OnPlayerLoaded', shutdown)
AddEventHandler('qbmultichar:client:spawnComplete', shutdown)
