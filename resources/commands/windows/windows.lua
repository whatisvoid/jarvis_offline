local id = jarvis.context.command_id

if id == "win_minimize" then
    jarvis.system.exec("powershell -NoProfile -c \"(New-Object -ComObject Shell.Application).MinimizeAll()\"")

elseif id == "win_trash" then
    jarvis.system.exec("powershell -NoProfile -c \"Clear-RecycleBin -Force -ErrorAction SilentlyContinue\"")

elseif id == "win_screenshot" then
    -- Send PrintScreen key to copy full screen to clipboard
    jarvis.system.exec("powershell -NoProfile -c \"Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('{PRTSC}')\"")

elseif id == "win_lock" then
    -- Lock workstation via Windows API
    jarvis.system.exec("rundll32.exe user32.dll,LockWorkStation")

elseif id == "win_sleep" then
    -- Suspend (sleep) the system
    jarvis.system.exec("rundll32.exe powrprof.dll,SetSuspendState 0,1,0")

elseif id == "win_clipboard" then
    -- Open clipboard history (Win+V equivalent via settings)
    jarvis.system.open("ms-settings:clipboard")

elseif id == "win_language" then
    -- Switch keyboard layout via Alt+Shift
    jarvis.system.exec("powershell -NoProfile -c \"(New-Object -ComObject WScript.Shell).SendKeys('%+')\"")
end

return { chain = false }
