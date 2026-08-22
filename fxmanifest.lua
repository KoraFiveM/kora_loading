fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'qb-loading'
author 'Jamie'
version '1.0.0'
description 'qblib-themed loading screen'

dependency 'qblib'

loadscreen 'html/index.html'
loadscreen_manual_shutdown 'yes'

files {
    'html/index.html',
    'html/style.css',
    'html/app.js',
}

-- Required to reach QB.theme/QB.nui -- see qblib's own AGENTS.md for why this
-- is how a consumer resource pulls in the QB proxy (init.lua).
shared_script '@qblib/init.lua'

shared_scripts { 'config.lua' }
client_script 'client.lua'
