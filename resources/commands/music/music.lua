local MUSIC_DIR = "F:\\temp\\jarvis_offline\\music"
local id = jarvis.context.command_id

local function send_media_key(key_code)
    jarvis.system.exec(string.format(
        "powershell -NoProfile -c \"(New-Object -ComObject WScript.Shell).SendKeys([char]%d)\"",
        key_code
    ))
end

if id == "music_play" then
    local files = jarvis.fs.list(MUSIC_DIR)
    local tracks = {}
    for _, f in ipairs(files) do
        if f.is_file then
            local ext = f.name:lower():match("%.([^%.]+)$")
            if ext == "mp3" or ext == "wav" or ext == "flac" or ext == "m4a" or ext == "ogg" then
                table.insert(tracks, f.path)
            end
        end
    end
    if #tracks == 0 then
        jarvis.log("warn", "[music] No tracks found in " .. MUSIC_DIR)
        return { chain = false }
    end
    math.randomseed(tonumber(jarvis.context.time.timestamp))
    local track = tracks[math.random(#tracks)]
    jarvis.log("info", "[music] Playing: " .. track)
    jarvis.system.open(track)

elseif id == "music_stop" then
    local players = { "wmplayer.exe", "vlc.exe", "Music.UI.exe", "MediaPlayer.exe" }
    for _, p in ipairs(players) do
        jarvis.system.exec("taskkill /F /IM " .. p)
    end

elseif id == "music_pause" then
    send_media_key(179)  -- VK_MEDIA_PLAY_PAUSE

elseif id == "music_next" then
    send_media_key(176)  -- VK_MEDIA_NEXT_TRACK

elseif id == "music_prev" then
    send_media_key(177)  -- VK_MEDIA_PREV_TRACK
end

return { chain = false }
