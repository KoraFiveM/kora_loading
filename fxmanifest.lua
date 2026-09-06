fx_version 'cerulean'
game 'gta5'
lua54 'yes'
use_experimental_fxv2_oal 'yes'

name 'qbloading'
author 'Jamie'
version '1.0.0'
description 'qbtheme-styled loading screen'

dependency 'qbtheme'
dependency 'qblib'

loadscreen 'html/index.html'
loadscreen_manual_shutdown 'yes'

files {
    'html/index.html',
    'html/style.css',
    'html/app.js',
}

-- Required to reach shared qblib APIs -- see qblib's own AGENTS.md for why this
-- is how a consumer resource pulls in the QB proxy (init.lua).
shared_script '@qblib/init.lua'

shared_scripts { 'config.lua' }
client_scripts {
    '@qbtheme/client/bridge.lua',
    'client.lua',
}
