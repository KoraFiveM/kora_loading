-- NOTE: this resource has its own NUI frame (the `loadscreen` page), separate
-- from qblib's shared frame -- QB.nui.send/registerCallback would dispatch
-- into qblib's own resource VM (via the cross-resource export call) and so
-- target QBLIB's frame, not this one. Talk to this resource's own frame with
-- the raw natives directly; QB.theme.tokens() is safe to call either way
-- since it's pure Lua math with no NUI natives involved.

-- Pull-on-mount path: the page fetches this once as soon as its JS runs, so
-- it doesn't have to race the push message below to get the right colours.
RegisterNUICallback('loadingscreen:getTheme', function(_, cb)
    cb({ serverName = Config.serverName, tokens = QB.theme.tokens() })
end)

-- Live-push path: covers a theme change without a full loading-screen reload
-- (the page is already visible by the time this resource's scripts run).
SendNUIMessage({ action = 'loadingscreen:theme', data = QB.theme.tokens() })

-- No shutdown call lives here on purpose: `loadscreen_manual_shutdown 'yes'`
-- in fxmanifest.lua hands ownership of "when to hide" to whichever consumer
-- needs the loading screen down (see the multichar resource, which calls the
-- ShutdownLoadingScreen native once character data has arrived). On a server
-- without that resource installed, spawnmanager's own spawnPlayer() still
-- calls ShutdownLoadingScreen() as part of its native spawn sequence.
