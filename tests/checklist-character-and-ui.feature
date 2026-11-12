# Converted from the communitybot legacy tests by kora-qa-panel/scripts/convert-legacy.mjs.
# The """ block under each Scenario is the original test text, verbatim. Review before applying.
Feature: kora_loading — Character & UI

  @kora_loading @checklist @checklist:kora_loading:background-media @cat:character-and-ui @manual
  Scenario: Background images/video/music
    """
    Checklist test: With Config.media set, images slideshow, video loops muted and music plays at the set volume with the dim overlay.
    """
    When I manually: connect with Config.media set and watch the loading screen
    Then I confirm: images slideshow (only applies when images are configured)
    And I confirm: the video loops muted (only applies when a video is configured)
    And I confirm: music plays at the set volume (only applies when music is configured)
    And I confirm: the dim overlay is visible over the background

  @kora_loading @checklist @checklist:kora_loading:shutdown-handoff @cat:character-and-ui @manual
  Scenario: Loading screen dismisses at the right time
    """
    Checklist test: Connect and select a character: screen stays until character load/spawn completes (OnPlayerLoaded or spawnComplete), then disappears.
    """
    When I manually: connect and select a character
    Then I confirm: the loading screen stays until character load and spawn complete, then disappears
