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
    video = 'media/loading.mp4',
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
        description = 'When enabled, the loading screen paints a background using your kora_theme colours underneath any images or video. Disable it to leave the page transparent.',
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
        description = 'How many seconds each background image is shown before fading to the next. Only used when more than one image is listed.',
    })
    Config.media.video = Kora.config.string(Config.media.video, {
        label = 'Background video',
        description = 'A muted, looping video drawn behind the text, as a path inside this resource such as media/intro.mp4 or a full https:// address. Leave empty for no video.',
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
        description = 'The songs the loading screen plays, one row each, with the fields url, title and artist. Use a url inside this resource such as media/song.mp3 (place the file in the html/media folder) or a full https:// address; mp3, ogg, wav, m4a, flac, webm and mp4 all work. The title and artist are shown while that song plays. Leave empty for no music player.',
    })
    Config.media.dim = Kora.config.number(Config.media.dim, {
        label = 'Background darkening', min = 0, max = 1,
        description = 'How much the background images and video are darkened so the text stays readable, from 0 (none) to 1 (black).',
    })
    Config = Kora.config.adopt(Config)
end
