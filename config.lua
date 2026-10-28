Config = {}

Config.serverName = 'Roleplay Server Name'

Config.tips = {
    'Tip: press F1 to open the phone.',
    'Tip: you can holster your weapon to avoid drawing attention.',
    'Tip: type /report in chat if you run into a bug.',
    'Tip: robbing a store alerts nearby police.',
    'Tip: buy a house to unlock private storage.',
}

-- Registers this resource-owned configuration with kora_lib without changing its public Config table.
if QB and QB.config and QB.config.adopt then
    Config.serverName = QB.config.string(Config.serverName, {
        minLength = 1, label = 'Server name',
        description = 'The name shown on the loading screen while a player connects. After restarting this resource, newly opened loading screens use the new name; screens already open are not refreshed.',
    })
    Config.tips = QB.config.list(Config.tips, QB.config.string('', { minLength = 1 }), {
        advanced = false, label = 'Loading-screen tips',
        description = 'Helpful messages shown while players connect. Add one message per row and only mention commands or features enabled on your server. After restarting this resource, newly opened loading screens use this list.',
    })
    Config = QB.config.adopt(Config)
end
