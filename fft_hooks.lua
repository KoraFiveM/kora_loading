-- Optional FFT development hooks (client). Listed last in fxmanifest.lua and
-- inert unless `setr fft_kora_hooks true`. No other file references FFT.
--
-- kora_loading's only runtime Lua surface is two NUI callbacks its own pages
-- fetch (loadingscreen:getTheme and loadingscreen:syncTheme). The suite now
-- calls them with a real fetch (FFT's K.nui), because a script-fired
-- __cfx_nui event is never answered, so this hook no longer drives anything.
-- It is kept only so the manifest entry stays valid; it can be deleted together
-- with that entry.
if GetConvar('fft_kora_hooks', 'false') ~= 'true' then return end

local RUNNER = 'fft'
local VERSION = 2

local function session()
    if GetResourceState(RUNNER) ~= 'started' then return nil end
    local id = LocalPlayer.state.fftSession
    return type(id) == 'string' and id or nil
end

-- No actions: the suite needs nothing from inside this resource any more.
local actions = {}

exports('fftVersion', function() return VERSION end)
exports('fftAction', function(action, ...)
    if GetInvokingResource() ~= RUNNER or not session() then
        return false, 'FFT hooks are disabled or session is not authorised'
    end
    local handler = actions[action]
    if not handler then return false, 'Unsupported FFT action: ' .. tostring(action) end
    return handler(...)
end)
