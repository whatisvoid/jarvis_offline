// IPC — connection, state stores, actions
export {
    jarvisState,
    ipcConnected,
    lastRecognizedText,
    lastExecutedCommand,
    lastError,
    connectIpc,
    enableIpc,
    disableIpc,
    disconnectIpc,
    sendTextCommand,
    stopJarvisApp,
    reloadCommands
} from "./lib/ipc"

// i18n
export {
    translations,
    currentLanguage,
    tStore,
    translate,
    loadTranslations,
    setLanguage,
    loadLanguage,
    getSupportedLanguages
} from "./lib/i18n"

// Runtime process state + stats polling
export {
    isJarvisRunning,
    jarvisRamUsage,
    jarvisCpuUsage,
    updateJarvisStats,
    startStatsPolling,
    stopStatsPolling
} from "./lib/stores/runtime"

// App metadata links
export { appInfo, loadAppInfo } from "./lib/stores/app-info"

// Audio input devices
export { audioDevices, loadAudioDevices } from "./lib/stores/audio"

// Runtime events log
export { runtimeEvents, addRuntimeEvent } from "./lib/stores/events"

// Assistant voice selection
export { assistantVoice, loadVoiceSetting } from "./lib/stores/voice"
