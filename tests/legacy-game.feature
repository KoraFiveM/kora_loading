# Converted from the communitybot legacy tests by kora-qa-panel/scripts/convert-legacy.mjs.
# The """ block under each Scenario is the original test text, verbatim. Review before applying.
Feature: kora_loading — game tests

  @kora_loading @legacy:load-appears @target:3 @checklist @checklist:kora_loading:loadscreen-shows @cat:character-and-ui @manual
  Scenario: Loading screen shows on connect
    """
    1. Disconnect, then connect to the test server.
    2. Watch from the moment the FiveM connect screen ends.
    Expect: the Kora loading page (not the default FiveM one) is up the whole time: dark themed background, "LOADING 0%" at the top, server name, a tip and a progress bar along the bottom. No white or black flash.
    Also checklist kora_loading:loadscreen-shows (Loading screen appears on connect): Connect to the server: kora_loading page shows the server name over the themed background instead of the default FiveM screen.
    """
    When I manually: disconnect from the server, then connect to the test server
    And I manually: watch from the moment the FiveM connect screen ends
    Then I confirm: the Kora loading page (not the default FiveM one) is up the whole time
    And I confirm: the background is dark and themed
    And I confirm: "LOADING 0%" is at the top, with the server name, a tip and a progress bar along the bottom
    And I confirm: there is no white or black flash

  @kora_loading @legacy:load-server-name @target:3 @manual
  Scenario: Server name and accent rail
    """
    1. Connect and look at the large server name.
    Expect: it shows the name set in Config.serverName (default "Roleplay Server Name") in the heading font, with the small coloured accent rail in front of it. It is there within a few seconds of the page showing, never empty. If the name looks wrong, say what you saw.
    """
    When I manually: connect and look at the large server name
    Then I confirm: it shows the name set in Config.serverName (default "Roleplay Server Name") in the heading font
    And I confirm: a small coloured accent rail is in front of the name
    And I confirm: the name is there within a few seconds of the page showing and is never empty
    And I confirm: if the name looks wrong, I note what I saw in Feedback

  @kora_loading @legacy:load-progress-forward @target:3 @checklist @checklist:kora_loading:progress-bar @cat:character-and-ui @manual
  Scenario: Progress bar only moves forward
    """
    1. Connect and watch the bar and the percentage next to LOADING.
    2. Do it twice, once on a warm and once on a cold cache if you can.
    Expect: the bar fills smoothly left to right, the percentage only goes up (whole numbers, never goes back or flickers), and it gets close to 100% before the screen goes away. Report any jump back.
    Also checklist kora_loading:progress-bar (Progress bar and stage text): Watch while loading: bar fills only forward from FiveM load events with percentage and stage text (if showProgressText is on).
    """
    When I manually: connect and watch the bar and the percentage next to LOADING
    And I manually: repeat once on a warm cache and once on a cold cache if possible
    Then I confirm: the bar fills smoothly left to right
    And I confirm: the percentage only goes up in whole numbers, never goes back or flickers
    And I confirm: the bar gets close to 100% before the screen goes away

  @kora_loading @legacy:load-progress-stages @target:3 @manual
  Scenario: Stage text under the tips
    """
    1. Connect and read the small status line.
    Expect: it changes through the load: Starting game, Preparing world, Loading map, Finishing map, Joining session (some can pass too quickly to read). It never shows blank text for long or a raw code like INIT_CORE.
    """
    When I manually: connect and read the small status line
    Then I confirm: it changes through Starting game, Preparing world, Loading map, Finishing map, Joining session (some may pass too quickly to read)
    And I confirm: it never shows blank text for long or a raw code like INIT_CORE

  @kora_loading @legacy:load-progress-text-off @target:1 @needs:admin @manual
  Scenario: Hide progress text (config)
    """
    Admin only. 1. In config.lua set Config.showProgressText = false and restart kora_loading.
    2. Reconnect.
    Expect: the LOADING percentage and stage text are gone but the bar itself still fills. Set it back to true afterwards and check they return.
    """
    When I manually: set Config.showProgressText = false in config.lua and restart kora_loading
    And I manually: reconnect
    Then I confirm: the LOADING percentage and stage text are gone but the bar itself still fills
    When I manually: set Config.showProgressText back to true and reconnect
    Then I confirm: the LOADING percentage and stage text return

  @kora_loading @legacy:load-tips @target:3 @checklist @checklist:kora_loading:rotating-tips @cat:character-and-ui @manual
  Scenario: Tips rotate
    """
    1. Stay on the loading screen as long as you can (join while the server is busy, or open it a second time).
    2. Count tips for about 30 seconds.
    Expect: a tip is already showing early, it fades out and the next fades in about every 6 seconds, in the order listed in Config.tips, and loops back to the first. No overlapping text, no empty gap.
    Also checklist kora_loading:rotating-tips (Rotating tips): Wait on the loading screen: tips from config change about every 6 seconds.
    """
    When I manually: stay on the loading screen as long as possible (join while the server is busy, or open it a second time)
    And I manually: count tips for about 30 seconds
    Then I confirm: a tip is already showing early
    And I confirm: each tip fades out and the next fades in about every 6 seconds
    And I confirm: tips follow the order listed in Config.tips and loop back to the first
    And I confirm: there is no overlapping text and no empty gap

  @kora_loading @legacy:load-wallpaper-default @target:3 @manual
  Scenario: Default wallpaper and dimming
    """
    1. Connect with no wallpaper configured.
    Expect: the animated Kora Discord banner fills the background, darkened (Config.media.dim, default 0.45) so the text is easy to read. If the banner cannot load (blocked network) the themed background shows instead, never a blank or broken-image layer.
    """
    When I manually: connect with no wallpaper configured
    Then I confirm: the animated Kora Discord banner fills the background, darkened (Config.media.dim, default 0.45) so the text is easy to read
    And I confirm: if the banner cannot load (blocked network) the themed background shows instead, never a blank or broken-image layer

  @kora_loading @legacy:load-wallpaper-slideshow @target:1 @needs:admin @manual
  Scenario: Wallpaper slideshow (config)
    """
    Admin only. 1. Put 2-3 small images in html/media/ and list them in Config.media.images, slideSeconds = 4. Restart kora_loading and reconnect.
    2. Add one wrong path to the list and reconnect.
    Expect: the images fade between each other every 4 seconds. The wrong path is skipped silently (console warning only) and the others keep rotating.
    """
    When I manually: put 2-3 small images in html/media/, list them in Config.media.images, set slideSeconds = 4, restart kora_loading and reconnect
    Then I confirm: the images fade between each other every 4 seconds
    When I manually: add one wrong path to the list and reconnect
    Then I confirm: the wrong path is skipped silently (console warning only) and the other images keep rotating

  @kora_loading @legacy:load-video @target:1 @needs:admin @manual
  Scenario: Background video (config)
    """
    Admin only. 1. Put a short webm in html/media/ and set Config.media.videos to just its path. Restart and reconnect.
    2. Then set a bad path and reconnect.
    Expect: the video plays muted and loops behind the text with the dim applied, and no default wallpaper is fetched. A bad path leaves the themed background, not a black box.
    """
    When I manually: put a short webm in html/media/, set Background videos in /config to just its path and reconnect
    Then I confirm: the video plays muted and loops behind the text with the dim applied, with no visible jump or flash at the loop point
    And I confirm: no default wallpaper is fetched
    When I manually: set a bad video path and reconnect
    Then I confirm: the themed background shows, not a black box

  @kora_loading @target:1 @needs:admin @manual
  Scenario: Background video playlist (config)
    When I manually: put 3 short webm clips in html/media/, list them in Background videos in /config with Video order = In order, and reconnect
    Then I confirm: the clips play top to bottom and loop, back to back with no black frame, stutter or jump between them
    When I manually: set Video order = Shuffle and reconnect twice
    Then I confirm: every clip plays once per round, the starting clip differs between connects, and no clip plays twice in a row
    When I manually: set Video crossfade (seconds) = 1 and reconnect
    Then I confirm: each clip fades into the next over about a second, with no black between them
    When I manually: add one wrong path to the list and reconnect
    Then I confirm: the wrong path is skipped silently (console warning only) and the other clips keep playing

  @kora_loading @target:1 @needs:admin @manual
  Scenario: Clip sound and replacement audio (config)
    When I manually: connect with the default playlist and Play video sound on
    Then I confirm: each video's own sound plays and changes cleanly with the picture at every cut
    When I manually: click the mute button in the bottom-right corner, then reconnect
    Then I confirm: the sound is off and stays off after reconnecting, and clicking the button again turns it back on
    When I manually: add a row { video = 'media/police.webm', audio = '<an ogg or mp3 in html/media>' } and reconnect until it plays
    Then I confirm: that audio plays over the police clip instead of the clip's own sound
    When I manually: add a row { image = 'media/hub.png', audio = '<an ogg or mp3 in html/media>' } and reconnect until it plays
    Then I confirm: the image shows for as long as the audio lasts, then the next clip follows with no black frame

  @kora_loading @legacy:load-theme-colour @target:3 @checklist @checklist:kora_loading:theme-colours @cat:character-and-ui
  Scenario: Accent colour matches kora_theme
    """
    1. In game run /theme reset so your accent is the server default.
    2. Note the accent colour of other Kora UI (menus, buttons).
    3. Disconnect and reconnect, look at the progress bar fill, the glow and the accent rail.
    Expect: they all use the kora_theme primary colour from theme.json, the same as the rest of the Kora UI.
    Also checklist kora_loading:theme-colours (Matches kora_theme accent): Check the accent colour on the loading screen matches kora_theme primary colour from theme.json.
    """
    When I run the command "/theme reset"
    And I manually: note the accent colour of other Kora UI (menus, buttons)
    And I manually: disconnect and reconnect, then look at the progress bar fill, the glow and the accent rail
    Then I confirm: the progress bar fill, glow and accent rail all use the kora_theme primary colour from theme.json, the same as the rest of the Kora UI

  @kora_loading @legacy:load-theme-custom @target:3
  Scenario: Custom /theme accent on the loading screen
    """
    1. In game pick your own accent with /theme and note the colour.
    2. Disconnect and reconnect.
    Expect: say in Feedback which colour the loading screen used (server default or your own). Both can be right; we want to know what players actually get and whether it ever flashes one colour then the other.
    """
    When I run the command "/theme"
    And I manually: pick my own accent and note the colour
    And I manually: disconnect and reconnect
    Then I confirm: I state in Feedback which colour the loading screen used (server default or my own)
    And I confirm: I note in Feedback whether it ever flashes one colour then the other

  @kora_loading @legacy:load-fonts @target:3 @manual
  Scenario: Theme fonts from the first frame
    """
    1. Connect and look at the text as soon as the page appears.
    Expect: the heading font on the server name, the monospace font on the LOADING line, the body font on tips and status. The right font is there from the first frame: no flash of a plain default font that then swaps.
    """
    When I manually: connect and look at the text as soon as the page appears
    Then I confirm: the heading font is on the server name, the monospace font on the LOADING line, and the body font on tips and status
    And I confirm: the right font is there from the first frame, with no flash of a plain default font that then swaps

  @kora_loading @legacy:load-music-player @target:3 @manual
  Scenario: Music player panel (tracks configured)
    """
    Only when Config.musicPlayer.tracks has songs (ask in discussion if unsure). 1. Connect and look at the panel.
    Expect: a NOW PLAYING panel with the song title and artist (the file name if no title), a play/pause button, next, mute and a volume slider. With no tracks listed no panel is drawn at all: say so in Feedback instead of marking It works.
    """
    When I manually: connect and look at the panel (only applies when Config.musicPlayer.tracks has songs)
    Then I confirm: a NOW PLAYING panel shows the song title and artist (the file name if no title), a play/pause button, next, mute and a volume slider
    And I confirm: if no tracks are listed no panel is drawn at all, and I say so in Feedback instead of marking It works

  @kora_loading @legacy:load-music-controls @target:3 @manual
  Scenario: Music controls and remembered volume
    """
    1. Click pause, play, next, mute, unmute. Drag the volume slider.
    2. Set a different volume, mute, then reconnect.
    Expect: every button does what it says. Dragging the slider to 0 mutes, raising it unmutes. Unmuting with the volume at 0 jumps back to your last volume. Your volume and mute choice are still set after reconnecting.
    """
    When I manually: click pause, play, next, mute and unmute, then drag the volume slider
    Then I confirm: every button does what it says
    And I confirm: dragging the slider to 0 mutes and raising it unmutes
    And I confirm: unmuting with the volume at 0 jumps back to my last volume
    When I manually: set a different volume, mute, then reconnect
    Then I confirm: my volume and mute choice are still set after reconnecting

  @kora_loading @legacy:load-music-playlist @target:3 @manual
  Scenario: Playlist order and bad tracks
    """
    1. Let several tracks play or press next repeatedly.
    Expect: tracks play in the listed order and loop back to the first; one track loops by itself without a gap. A track that will not play is skipped. If none play the whole panel hides.
    """
    When I manually: let several tracks play or press next repeatedly
    Then I confirm: tracks play in the listed order and loop back to the first
    And I confirm: a single track loops by itself without a gap
    And I confirm: a track that will not play is skipped
    And I confirm: if none play the whole panel hides

  @kora_loading @legacy:load-music-autoplay @target:3 @manual
  Scenario: Blocked autoplay shows a hint
    """
    1. Connect and see if music starts by itself.
    Expect: either it plays, or the panel appears paused with "Press play to start the music". Clicking the panel starts the music and removes the hint. It never fails silently with a panel that looks like it is playing.
    """
    When I manually: connect to the server and watch the loading screen music panel
    Then I confirm: either the music plays, or the panel appears paused with "Press play to start the music" (only applies when music tracks are configured)
    When I manually: click the music panel
    Then I confirm: the music starts and the hint is removed
    And I confirm: the panel never looks like it is playing while no music is audible

  @kora_loading @legacy:load-cursor @target:3 @manual
  Scenario: Mouse cursor, no keyboard
    """
    1. Connect and move the mouse over the loading screen.
    2. Press some keyboard keys.
    Expect: a mouse cursor is visible and the music panel buttons are clickable. Keyboard input does nothing (a loadscreen gets no keyboard focus). Clicking elsewhere on the page does nothing odd.
    """
    When I manually: connect and move the mouse over the loading screen
    Then I confirm: a mouse cursor is visible and the music panel buttons are clickable (only applies when the music player is shown)
    When I manually: press some keyboard keys
    Then I confirm: keyboard input does nothing
    And I confirm: clicking elsewhere on the page does nothing odd

  @kora_loading @legacy:load-resolution @target:3 @manual
  Scenario: Layout at different resolutions
    """
    1. Connect at 1080p, then at 1440p or 4K, and in a small window (e.g. 1280x720) or ultrawide if you have one.
    Expect: the whole layout scales together: server name, tips, bar and music panel all fully on screen, readable, nothing clipped, overlapping or off the edge.
    """
    When I manually: connect at 1080p, then at 1440p or 4K, and in a small window such as 1280x720 or ultrawide if available
    Then I confirm: the whole layout scales together with server name, tips, bar and music panel fully on screen and readable
    And I confirm: nothing is clipped, overlapping or off the edge at any resolution

  @kora_loading @legacy:load-reconnect @target:3 @manual
  Scenario: Reconnect shows a fresh loading screen
    """
    1. Connect, spawn, disconnect and connect again, three times in a row.
    Expect: every time the loading screen appears fresh: progress starts at 0%, correct tip and server name, no stale page from the last time and no empty screen.
    """
    When I manually: connect, spawn, disconnect and connect again, three times in a row
    Then I confirm: every time the loading screen appears fresh with progress starting at 0%
    And I confirm: the correct tip and server name show each time
    And I confirm: there is no stale page from the previous time and no empty screen

  @kora_loading @legacy:load-handoff-select @target:3 @manual
  Scenario: Loading screen hands off to character select
    """
    1. Connect and watch the moment the loading screen ends.
    Expect: it goes away when the character select scene opens (the faded-in scene with your characters), with no long black gap and no loading page left behind or flickering on top of the select UI.
    """
    When I manually: connect and watch the moment the loading screen ends
    Then I confirm: the loading screen goes away when the character select scene opens with my characters faded in
    And I confirm: there is no long black gap
    And I confirm: no loading page is left behind or flickering on top of the select UI

  @kora_loading @legacy:load-no-stuck @target:3 @needs:admin @checklist @checklist:kora_loading:no-stuck-screen @cat:character-and-ui
  Scenario: Never stuck above gameplay
    """
    1. Connect, pick a character, spawn.
    2. Also try creating a new character and spawning, and /logout (admin) then spawn again.
    Expect: after you are in the world the loading page is completely gone: you can see the game, move, click and use menus. It never reappears over gameplay.
    Also checklist kora_loading:no-stuck-screen (Never stuck above gameplay): After spawning in the world confirm the loading page is fully gone and gameplay is visible and clickable.
    """
    When I manually: connect, pick a character and spawn
    Then I confirm: the loading page is completely gone and I can see the game, move, click and use menus
    When I manually: create a new character and spawn
    Then I confirm: the loading page is completely gone and I can see the game
    When I run the command "/logout"
    And I manually: spawn again
    Then I confirm: the loading page is completely gone and never reappears over gameplay

  @kora_loading @legacy:load-slow-config @target:3 @manual
  Scenario: Name and tips arrive on a slow start
    """
    1. Connect right after a server or resource restart, or on a cold cache, and watch the name and tips.
    Expect: even if the first moments are empty, the server name and tips fill in once the resource is up (the page keeps asking for up to two minutes). They never stay on the placeholder for the whole load.
    """
    When I manually: connect right after a server or resource restart, or on a cold cache, and watch the name and tips
    Then I confirm: the server name and tips fill in once the resource is up, even if the first moments are empty
    And I confirm: they never stay on the placeholder for the whole load
