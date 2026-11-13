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
        locale = {
            loading = Kora.lang('Ui.loading'),
            fallback_server_name = Kora.lang('Ui.server_name'),
            now_playing = Kora.lang('Ui.now_playing'),
            pause = Kora.lang('Ui.pause'),
            play = Kora.lang('Ui.play'),
            next_track = Kora.lang('Ui.next_track'),
            mute = Kora.lang('Ui.mute'),
            unmute = Kora.lang('Ui.unmute'),
            volume = Kora.lang('Ui.volume'),
            video_volume = Kora.lang('Ui.video_volume'),
            play_to_start_music = Kora.lang('Ui.play_to_start_music'),
            progress = {
                starting_game = Kora.lang('Progress.starting_game'),
                preparing_world = Kora.lang('Progress.preparing_world'),
                loading_map = Kora.lang('Progress.loading_map'),
                finishing_map = Kora.lang('Progress.finishing_map'),
                joining_session = Kora.lang('Progress.joining_session'),
            },
        },
    }
end
