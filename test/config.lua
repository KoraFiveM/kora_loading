-- F#243: loading tips must not name a phone key that differs from kora_phone's default (M).
Config = nil
dofile("config.lua")
assert(type(Config.tips) == "table" and #Config.tips > 0, "Config.tips is a non-empty list")
for _, tip in ipairs(Config.tips) do
  assert(type(tip) == "string" and tip ~= "", "every tip is a string")
  if tip:lower():find("phone", 1, true) then
    assert(not tip:find("F1", 1, true), "phone tip must not say F1: " .. tip)
  end
end
print("kora_loading config: ok")
