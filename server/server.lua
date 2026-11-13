-- The client script only starts once the game has finished loading, so the loadingscreen:getTheme callback
-- answers far too late to style the screen. Handing the settings over while the player connects makes them
-- available to the page from its first frame as window.nuiHandoverData.kora_loading. handover needs no defer().
AddEventHandler('playerConnecting', function(_, _, deferrals)
    if not deferrals or not deferrals.handover then return end
    local ok, payload = pcall(KoraLoading.payload)
    if not ok then
        print(('^3[kora_loading] could not build the loading-screen settings: %s^7'):format(payload))
        return
    end
    deferrals.handover({ kora_loading = payload })
end)
