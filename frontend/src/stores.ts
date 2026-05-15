import { writable } from "svelte/store"
import { invoke } from "@tauri-apps/api/core"
import type { JarvisStats, AppInfo } from "./types"
import { DB_KEYS } from "./lib/db-keys"

// ### RE-EXPORT IPC STORES
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
    sendIpcMessage,
    sendTextCommand,
    stopJarvisApp,
    reloadCommands
} from "./lib/ipc"

// re-export i18n
export {
    translations,
    currentLanguage,
    translate,
    loadTranslations,
    setLanguage,
    loadLanguage,
    getSupportedLanguages
} from "./lib/i18n"

// ### RUNNING STATE
export const isJarvisRunning = writable(false)
export const jarvisRamUsage = writable(0)
export const jarvisCpuUsage = writable(0)

// ### ASSISTANT VOICE
export const assistantVoice = writable("")

// ### APP INFO
export const appInfo = writable<AppInfo>({
    tgOfficialLink: "",
    feedbackLink: "",
    repositoryLink: "",
    boostySupportLink: "",
    patreonSupportLink: "",
    logFilePath: ""
})

// ### INIT FUNCTIONS (call these from a component)
export async function loadVoiceSetting() {
    try {
        const voice = await invoke<string>("db_read", { key: DB_KEYS.voice })
        assistantVoice.set(voice)
    } catch (err: unknown) {
        console.error("failed to load voice setting:", err)
    }
}

export async function loadAppInfo() {
    try {
        const [tg, feedback, repo, boosty, patreon, logPath] = await Promise.all([
            invoke<string>("get_tg_official_link"),
            invoke<string>("get_feedback_link"),
            invoke<string>("get_repository_link"),
            invoke<string>("get_boosty_link"),
            invoke<string>("get_patreon_link"),
            invoke<string>("get_log_file_path")
        ])

        appInfo.set({
            tgOfficialLink: tg,
            feedbackLink: feedback,
            repositoryLink: repo,
            boostySupportLink: boosty,
            patreonSupportLink: patreon,
            logFilePath: logPath
        })
    } catch (err: unknown) {
        console.error("failed to load app info:", err)
    }
}

export async function updateJarvisStats() {
    try {
        const stats = await invoke<JarvisStats>("get_jarvis_app_stats")
        isJarvisRunning.set(stats.running)
        jarvisRamUsage.set(stats.ram_mb)
        jarvisCpuUsage.set(stats.cpu_usage)
    } catch (err: unknown) {
        console.error("failed to get jarvis stats:", err)
    }
}

// polling manager
let statsInterval: ReturnType<typeof setInterval> | null = null

export function startStatsPolling(intervalMs = 5000) {
    if (statsInterval) return // already running
    
    updateJarvisStats()
    statsInterval = setInterval(updateJarvisStats, intervalMs)
}

export function stopStatsPolling() {
    if (statsInterval) {
        clearInterval(statsInterval)
        statsInterval = null
    }
}