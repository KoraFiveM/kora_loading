Config = {}

Config.serverName = 'Roleplay Server Name'

Config.tips = {
    'Tip: press F1 to open the phone.',
    'Tip: you can holster your weapon to avoid drawing attention.',
    'Tip: type /report in chat if you run into a bug.',
    'Tip: robbing a store alerts nearby police.',
    'Tip: buy a house to unlock private storage.',
}

-- Shows the percentage and the current load stage next to the progress bar.
Config.showProgressText = true

-- How closely the screen follows kora_theme. Colours always come from
-- kora_theme's theme.json; this only decides whether its font choice is used
-- too. With fonts = false the screen keeps the plain built-in stack even when
-- theme.json picks a font.
Config.theme = {
    fonts = true,
}

-- Background media. Every option is optional: with nothing set, a background themed with
-- the kora_theme colours is shown. A path is relative to this resource's html/ folder
-- (put your files in html/media/, e.g. 'media/city.jpg') or a full https:// URL.
Config.media = {
    backdrop = true,    -- paint the themed background; false leaves the page transparent
    images = {},        -- one or more images; several are shown as a slideshow
    slideSeconds = 8,   -- seconds each image is shown
    video = '',         -- looping, muted background video (mp4/webm); drawn over the images
    music = '',         -- looping music (ogg/mp3)
    musicVolume = 0.3,  -- 0 to 1
    dim = 0.45,         -- 0 to 1, how much the background is darkened so text stays readable
}

-- Registers this resource-owned configuration with kora_lib without changing its public Config table.
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
        description = 'Images shown behind the loading screen, one per row. Use a path inside this resource such as media/city.jpg (place the file in the html/media folder) or a full https:// address. Several images play as a slideshow. Leave empty to use the themed background.',
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
        description = 'Looping music played while loading, as a path inside this resource such as media/theme.ogg or a full https:// address. Leave empty for no music.',
    })
    Config.media.musicVolume = Kora.config.number(Config.media.musicVolume, {
        label = 'Music volume', min = 0, max = 1,
        description = 'Volume of the background music, from 0 (silent) to 1 (full).',
    })
    Config.media.dim = Kora.config.number(Config.media.dim, {
        label = 'Background darkening', min = 0, max = 1,
        description = 'How much the background images and video are darkened so the text stays readable, from 0 (none) to 1 (black).',
    })
    Config = Kora.config.adopt(Config)
end
