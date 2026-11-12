-- Builds the settings table the loading page reads. Shared so the server can hand it to the page while the
-- player is still connecting (server.lua) and the client can answer loadingscreen:getTheme with the same shape.
KoraLoading = KoraLoading or {}

local function plainList(source)
    local out = {}
    for _, value in ipairs(source or {}) do out[#out + 1] = value end
    return out
end

local function plainCopy(source)
    local out = {}
    for key, value in pairs(source or {}) do out[key] = value end
    return out
end

KoraLoading.plainList = plainList

function KoraLoading.payload()
    local media = plainCopy(Config.media)
    media.images = plainList(Config.media and Config.media.images)
    media.videos = plainList(Config.media and Config.media.videos)

    local player = plainCopy(Config.musicPlayer)
    player.tracks = plainList(Config.musicPlayer and Config.musicPlayer.tracks)

    return {
        serverName = Config.serverName,
        tips = plainList(Config.tips),
        showProgressText = Config.showProgressText,
        theme = plainCopy(Config.theme),
        media = media,
        musicPlayer = player,
    }
end
