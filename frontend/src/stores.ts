import { writable } from "svelte/store"
import type { RuntimeEvent, AppInfo } from "./types"
import { DB_KEYS } from "./lib/db-keys"
import { addToast } from "./lib/toast"
import {
    dbRead,
    getJarvisStats,
    getTgOfficialLink,
    getFeedbackLink,
    getRepositoryLink,
    getBoostyLink,
    getPatreonLink,
    getLogFilePath,
    getAudioDevices
} from "./lib/api"

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
    sendTextCommand,
    stopJarvisApp,
    reloadCommands
} from "./lib/ipc"

// re-export i18n
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

// ### RUNNING STATE
export const isJarvisRunning = writable(false)
export const jarvisRamUsage = writable(0)
export const jarvisCpuUsage = writable(0)

// ### AUDIO DEVICES (cached — loaded once, reused across components)
export const audioDevices = writable<string[]>([])
let _audioDevicesLoaded = false

export async function loadAudioDevices() {
    if (_audioDevicesLoaded) return
    try {
        const devices = await getAudioDevices()
        audioDevices.set(devices)
        _audioDevicesLoaded = true
    } catch (err: unknown) {
        console.error("failed to load audio devices:", err)
    }
}

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

// ### RUNTIME EVENTS LOG (persists across navigation)
const EVENTS_MAX = 15
let _nextEventId = 0

export const runtimeEvents = writable<RuntimeEvent[]>([])

export function addRuntimeEvent(title: string, detail = '') {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    runtimeEvents.update(evs => [{ id: _nextEventId++, title, detail, time }, ...evs].slice(0, EVENTS_MAX))
}

// ### INIT FUNCTIONS (call these from a component)
export async function loadVoiceSetting() {
    try {
        const voice = await dbRead(DB_KEYS.voice)
        assistantVoice.set(voice)
    } catch (err: unknown) {
        console.error("failed to load voice setting:", err)
        addToast("Failed to load voice setting", "error")
    }
}

export async function loadAppInfo() {
    try {
        const [tg, feedback, repo, boosty, patreon, logPath] = await Promise.all([
            getTgOfficialLink(),
            getFeedbackLink(),
            getRepositoryLink(),
            getBoostyLink(),
            getPatreonLink(),
            getLogFilePath()
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
        addToast("Failed to load app info", "error")
    }
}

export async function updateJarvisStats() {
    try {
        const stats = await getJarvisStats()
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