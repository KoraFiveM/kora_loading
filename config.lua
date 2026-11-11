Config = {}

Config.serverName = 'Roleplay Server Name'

Config.tips = {
    'Tip: press F1 to open the phone.',
    'Tip: you can holster your weapon to avoid drawing attention.',
    'Tip: type /report in chat if you run into a bug.',
    'Tip: robbing a store alerts nearby police.',
    'Tip: buy a house to unlock private storage.',
}

Config.showProgressText = true

Config.theme = {
    fonts = true,
}

Config.media = {
    backdrop = true,
    images = {},
    defaultWallpaper = 'https://cdn.discordapp.com/banners/1565098239345303633/a_997cab204dc43b4a941d8e341aed5d34.webp?size=480&animated=true',
    themeWallpaper = true,
    slideSeconds = 8,
    -- WebM (VP8/VP9) only: FiveM's browser ships without the H.264 and AAC decoders, so an .mp4 never plays.
    -- intro.webm (3s) opens every load and ends on the eye; the rest start and end on that same eye frame
    -- (media/hub.png), so straight cuts between them are invisible. Keep videoOverlap at 0 for these.
    --
    -- One row per clip. Every field except video/image is optional:
    --   video   = 'media/x.webm'  a clip; its own sound plays when videoSound is on
    --   image   = 'media/x.png'   a still/animated image instead of a video
    --   audio   = 'media/x.ogg'   replaces the clip's sound (over a video, or with an image)
    --   seconds = 20              clip length; default = the video, the audio (image + audio) or slideSeconds
    -- e.g. { video = 'media/city.webm', audio = 'media/theme.ogg' } or { image = 'media/hub.png', audio = 'media/theme.ogg' }
    videos = {
        { video = 'media/intro.webm' },
        { video = 'media/ambulance.webm' },
        { video = 'media/atv.webm' },
        { video = 'media/bank.webm' },
        { video = 'media/burgershot.webm' },
        { video = 'media/club.webm' },
        { video = 'media/mechanic.webm' },
        { video = 'media/police.webm' },
        { video = 'media/spraypaint.webm' },
        { video = 'media/taxi.webm' },
    },
    videoSound = true,          -- play each video's own soundtrack (a row's audio always replaces it)
    videoVolume = 0.5,          -- 0..1, for video sound and row audio
    videoSoundButton = true,    -- show a mute/unmute button while a clip can make sound
    videoOrder = 'shuffle',     -- 'sequential', 'shuffle' or 'random'
    videoRandomStart = false,   -- sequential only: begin at a random video instead of the first
    videoPinFirst = true,       -- the first video always plays first (once); the order applies to the rest
    videoOverlap = 0,           -- seconds the next video fades in over the current one; 0 = straight back-to-back cut
    videoFadeIn = 0.6,          -- seconds the very first video fades in from the background
    videoMaxSeconds = 0,        -- cut each video after this many seconds; 0 = play it to the end
    videoSpeed = 1,             -- playback speed, 1 = normal
    videoFit = 'cover',         -- 'cover' fills the screen (may crop), 'contain' shows the whole frame
    music = '',
    musicVolume = 0.3,
    dim = 0.45,
}

Config.musicPlayer = {
    enabled = true,
    volume = 0.3,
    tracks = {
    },
}

if Kora and Kora.config and Kora.config.adopt then
    Config.serverName = Kora.config.string(Config.serverName, {
        minLength = 1, label = 'Server name',
        description = 'The name shown on the loading screen while a player connects. After restarting this resource, newly opened loading screens use the new name; screens already open are not refreshed.',
    })
    Config.tips = Kora.config.list(Config.tips, Kora.config.string('', { minLength = 1 }), {
        advanced = false, label = 'Loading-screen tips',
        description = 'Helpful messages shown while players connect. Add one message per row and only mention commands or features enabled on your server. After restarting this resource, newly opened loading screens use this list.',
    })
    Config.showProgressText = Kora.config.boolean(Config.showProgressText, {
        label = 'Show progress text',
        description = 'When enabled, the loading percentage and the current load stage are shown above the progress bar. The bar itself is always shown. After restarting this resource, newly opened loading screens use this setting.',
    })
    Config.theme.fonts = Kora.config.boolean(Config.theme.fonts, {
        label = 'Use the theme fonts',
        description = 'When enabled, the loading screen uses the fonts chosen in kora_theme, so changing the theme font changes this screen too. Disable it to keep the plain built-in font. Colours always follow kora_theme either way.',
    })
    Config.media.backdrop = Kora.config.boolean(Config.media.backdrop, {
        label = 'Themed background',
        description = 'When enabled, the loading screen paints a solid dark background (#111315) underneath any images or video. Disable it to leave the page transparent.',
    })
    Config.media.images = Kora.config.list(Config.media.images, Kora.config.string('', { minLength = 1 }), {
        label = 'Background images',
        description = 'Images shown behind the loading screen, one per row. Use a path inside this resource such as media/city.jpg (place the file in the html/media folder) or a full https:// address. png, jpg, webp, gif, svg and avif all work, animated included. Several images play as a slideshow. Leave empty to use the default wallpaper.',
    })
    Config.media.defaultWallpaper = Kora.config.string(Config.media.defaultWallpaper, {
        label = 'Default wallpaper',
        description = 'The wallpaper used when no background image is listed above and your theme does not set one. Defaults to the animated Kora Discord banner. Use a path inside this resource such as media/banner.webp or a full https:// address, or leave it empty for the themed background only.',
    })
    Config.media.themeWallpaper = Kora.config.boolean(Config.media.themeWallpaper, {
        label = 'Allow a theme wallpaper',
        description = 'When enabled, a "wallpaper" entry in kora_theme\'s theme.json sets the loading-screen wallpaper, so your theme can change it without touching this resource. Any background image listed above still wins.',
    })
    Config.media.slideSeconds = Kora.config.number(Config.media.slideSeconds, {
        label = 'Seconds per image', min = 2, max = 120,
        description = 'How many seconds each background image is shown before fading to the next, when more than one image is listed. Also the length of an image clip in Background videos that has no audio and no seconds of its own.',
    })
    Config.media.videos = Kora.config.list(Config.media.videos, Kora.config.object({}), {
        advanced = false, live = true, label = 'Background videos',
        description = 'The clips played back to back behind the text, one row each, with the fields video, image, audio and seconds. video is a WebM file (VP8 or VP9; FiveM cannot play mp4) such as media/intro.webm in the html/media folder, or a full https:// address. image shows a picture instead of a video. audio replaces the clip\'s sound: over a video it mutes the video\'s own soundtrack, and with an image it plays alongside it (mp3, ogg, wav, flac or webm). seconds sets how long the clip runs; by default a video runs to its end, an image with audio runs for the length of the audio, and an image without audio uses Seconds per image. A video shorter than its seconds loops. A clip that fails to load is skipped. Leave empty for no clips. Applies to players who connect after saving.',
    })
    Config.media.videoSound = Kora.config.boolean(Config.media.videoSound, {
        live = true, label = 'Play video sound',
        description = 'When enabled, each video plays its own soundtrack. Disable it to play the videos muted. A clip with its own audio file always plays that audio instead of the video\'s soundtrack, whichever way this is set. If the music player is also playing, both are heard, so leave its tracks empty when using clip sound. Applies to players who connect after saving.',
    })
    Config.media.videoVolume = Kora.config.number(Config.media.videoVolume, {
        live = true, label = 'Clip volume', min = 0, max = 1, step = 0.05,
        description = 'Volume of the video soundtracks and clip audio files, from 0 (silent) to 1 (full). Applies to players who connect after saving.',
    })
    Config.media.videoSoundButton = Kora.config.boolean(Config.media.videoSoundButton, {
        live = true, label = 'Show the mute button',
        description = 'When enabled and a clip can make sound, a mute button is shown in the bottom-right corner. Each player\'s choice is remembered for their next connect. It is also how a player turns the sound on if their game refuses to start it automatically; clicking anywhere on the screen does that too. Applies to players who connect after saving.',
    })
    Config.media.videoOrder = Kora.config.enum(Config.media.videoOrder, {
        live = true, label = 'Video order',
        description = 'In order plays the list top to bottom and loops. Shuffle plays every video once in a random order, then reshuffles, never repeating the same video twice in a row. Random picks any video each time, also never the same one twice in a row. Applies to players who connect after saving.',
        options = {
            { value = 'sequential', label = 'In order' },
            { value = 'shuffle', label = 'Shuffle (each once per round)' },
            { value = 'random', label = 'Random' },
        },
    })
    Config.media.videoRandomStart = Kora.config.boolean(Config.media.videoRandomStart, {
        live = true, label = 'Start at a random video',
        description = 'With the order set to In order, each player starts at a random video in the list and then continues in order. Shuffle and Random always start at a random video. Applies to players who connect after saving.',
    })
    Config.media.videoPinFirst = Kora.config.boolean(Config.media.videoPinFirst, {
        live = true, label = 'Always start with the first video',
        description = 'When enabled, the first video in the list plays first on every loading screen, once, like an intro. The video order setting then applies to the rest of the list, so with Shuffle the remaining videos are reshuffled on every load. Applies to players who connect after saving.',
    })
    Config.media.videoOverlap = Kora.config.number(Config.media.videoOverlap, {
        live = true, label = 'Video crossfade (seconds)', min = 0, max = 10, step = 0.1,
        description = 'How long the next video fades in over the end of the current one. 0 plays them straight back to back with a clean cut and no gap. The fade is shortened automatically for videos too short to hold it. Applies to players who connect after saving.',
    })
    Config.media.videoFadeIn = Kora.config.number(Config.media.videoFadeIn, {
        live = true, label = 'First video fade-in (seconds)', min = 0, max = 5, step = 0.1,
        description = 'How long the first video takes to fade in over the background when the loading screen opens. 0 shows it instantly. Applies to players who connect after saving.',
    })
    Config.media.videoMaxSeconds = Kora.config.number(Config.media.videoMaxSeconds, {
        live = true, label = 'Maximum seconds per video', min = 0, max = 3600, step = 1,
        description = 'Moves on to the next video after this many seconds even if the current one is longer. 0 always plays each video to its end. Applies to players who connect after saving.',
    })
    Config.media.videoSpeed = Kora.config.number(Config.media.videoSpeed, {
        live = true, label = 'Video playback speed', min = 0.25, max = 2, step = 0.05,
        description = 'Playback speed of the background videos: 1 is normal, 0.5 half speed, 2 double speed. Applies to players who connect after saving.',
    })
    Config.media.videoFit = Kora.config.enum(Config.media.videoFit, {
        live = true, label = 'Video sizing',
        description = 'Fill screen covers the whole screen and crops the edges of a video whose shape does not match it. Show whole video keeps the full frame visible, with the background showing at the sides. Applies to players who connect after saving.',
        options = {
            { value = 'cover', label = 'Fill screen' },
            { value = 'contain', label = 'Show whole video' },
        },
    })
    Config.media.music = Kora.config.string(Config.media.music, {
        label = 'Background music',
        description = 'Looping music played while loading, as a path inside this resource such as media/theme.ogg or a full https:// address. Leave empty for no music. With the music player enabled and no tracks listed for it, this song is shown in the player; otherwise it plays with no controls.',
    })
    Config.media.musicVolume = Kora.config.number(Config.media.musicVolume, {
        label = 'Music volume', min = 0, max = 1,
        description = 'Volume of the background music above, from 0 (silent) to 1 (full). The music player has its own volume setting.',
    })
    Config.musicPlayer.enabled = Kora.config.boolean(Config.musicPlayer.enabled, {
        label = 'Music player',
        description = 'When enabled and at least one track is listed below, the loading screen shows a music player with the song title and artist, play/pause, skip, a volume slider and mute. With no tracks listed nothing is shown. Disable it to play the background music silently with no controls.',
    })
    Config.musicPlayer.volume = Kora.config.number(Config.musicPlayer.volume, {
        label = 'Music player volume', min = 0, max = 1,
        description = 'The volume the music starts at, from 0 (silent) to 1 (full). Players can change it with the slider and their choice is remembered for next time.',
    })
    Config.musicPlayer.tracks = Kora.config.list(Config.musicPlayer.tracks, Kora.config.object({}), {
        label = 'Music player tracks',
        description = 'The songs the loading screen plays, one row each, with the fields url, title and artist. Use a url inside this resource such as media/song.mp3 (place the file in the html/media folder) or a full https:// address; mp3, ogg, wav, flac and webm all work; m4a and mp4 (AAC) do not play in FiveM. The title and artist are shown while that song plays. Leave empty for no music player.',
    })
    Config.media.dim = Kora.config.number(Config.media.dim, {
        label = 'Background darkening', min = 0, max = 1,
        description = 'How much the background images and videos are darkened so the text stays readable, from 0 (none) to 1 (black).',
    })
    Config = Kora.config.adopt(Config)
end
