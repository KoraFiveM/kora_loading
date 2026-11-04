fx_version 'cerulean'
game 'gta5'
lua54 'yes'
use_experimental_fxv2_oal 'yes'

name 'kora_loading'
-- Keep the legacy resource name resolvable for exports['qbloading'] callers.
provide 'qbloading'
author 'Jamie'
version '1.0.0'
description 'qbtheme-styled loading screen'

dependency 'kora_theme'
dependency 'kora_lib'

loadscreen 'html/index.html'
loadscreen_manual_shutdown 'yes'

files {
    'html/index.html',
    'html/style.css',
    'html/app.js',
    -- Synced copies of kora_theme's theme.js, theme.json and fonts/ folder, so
    -- colours and fonts apply before the cfx-nui-kora_theme origin answers.
    -- Refresh with tools/sync-theme.mjs, never by hand.
    'html/kora_theme/**',
    'html/media/*',
}

-- Required to reach shared kora_lib APIs -- see kora_lib's own AGENTS.md for why this
-- is how a consumer resource pulls in the Kora proxy (init.lua).
shared_script '@kora_lib/init.lua'

shared_scripts { 'config.lua' }
client_scripts {
    'client.lua',
}
