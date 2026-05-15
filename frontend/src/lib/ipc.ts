import { writable, get } from "svelte/store"
import { invoke } from "@tauri-apps/api/core"
import { getCurrentWindow } from "@tauri-apps/api/window"

// ### IPC STORES ###

export type JarvisState = "disconnected" | "idle" | "listening" | "processing"

export const jarvisState = writable<JarvisState>("disconnected")
export const ipcConnected = writable(false)
export const lastRecognizedText = writable("")
export const lastExecutedCommand = writable("")
export const lastError = writable("")

// ### CONNECTION ###

const RECONNECT_BASE_MS  = 1000
const RECONNECT_MAX_MS   = 30000

let ws: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let reconnectAttempt = 0
let manualDisconnect = false
let enabled = false  // only connect when enabled

export function enableIpc() {
    enabled = true
    connectIpc()
}

export function disableIpc() {
    enabled = false
    disconnectIpc()
}

export function connectIpc(port: number = 9712) {
    if (ws?.readyState === WebSocket.OPEN) return
    manualDisconnect = false

    ws = new WebSocket(`ws://127.0.0.1:${port}`)

    ws.onopen = () => {
        ipcConnected.set(true)
        jarvisState.set("idle")
        reconnectAttempt = 0
        console.log("[IPC] connected")
    }

    ws.onclose = () => {
        ipcConnected.set(false)
        jarvisState.set("disconnected")
        scheduleReconnect()
        console.log("[IPC] disconnected")
    }

    ws.onerror = (err) => {
        console.error("[IPC] error:", err)
    }

    ws.onmessage = (event) => {
        try {
            const msg = JSON.parse(event.data)
            handleEvent(msg)
        } catch (err) {
            console.error("[IPC] failed to parse message:", err)
        }
    }
}

function scheduleReconnect() {
    if (reconnectTimer || manualDisconnect || !enabled) return

    const delay = Math.min(RECONNECT_BASE_MS * Math.pow(2, reconnectAttempt), RECONNECT_MAX_MS)
    reconnectAttempt++
    console.log(`[IPC] Reconnecting in ${delay / 1000}s (attempt ${reconnectAttempt})...`)
    reconnectTimer = setTimeout(() => {
        reconnectTimer = null
        connectIpc()
    }, delay)
}

export function disconnectIpc() {
    manualDisconnect = true
    reconnectAttempt = 0

    if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
    }

    if (ws) {
        ws.close()
        ws = null
    }

    ipcConnected.set(false)
    jarvisState.set("disconnected")
}

// ### EVENT HANDLING ###

interface IpcMessage {
    event: string
    text?: string
    id?: string
    message?: string
}

function handleEvent(data: IpcMessage) {
    console.log("IPC: Event", data.event, data)

    switch (data.event) {
        case "wake_word_detected":
        case "listening":
            jarvisState.set("listening")
            break

        case "speech_recognized":
            lastRecognizedText.set(data.text || "")
            jarvisState.set("processing")
            break

        case "command_executed":
            lastExecutedCommand.set(data.id || "")
            break

        case "idle":
            jarvisState.set("idle")
            break

        case "error":
            lastError.set(data.message || "Unknown error")
            break

        case "started":
            jarvisState.set("idle")
            break

        case "stopping":
            jarvisState.set("disconnected")
            break

        case "pong":
            // connection verified
            break

        case "reveal_window":
            // bring window to foreground
            revealWindow()
            break
    }
}

// ### ACTIONS ###

export function sendAction(action: string, payload: Record<string, any> = {}) {
    if (ws?.readyState !== WebSocket.OPEN) {
        return false
    }

    ws.send(JSON.stringify({ action, ...payload }))
    return true
}

export function stopJarvisApp() {
    return sendAction("stop")
}

export function reloadCommands() {
    return sendAction("reload_commands")
}

export function sendIpcMessage(message: object): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            reject(new Error("IPC not connected"))
            return
        }

        try {
            ws.send(JSON.stringify(message))
            resolve()
        } catch (err) {
            reject(err)
        }
    })
}

export function sendTextCommand(text: string): boolean {
    return sendAction("text_command", { text })
}

async function revealWindow() {
    try {
        const window = getCurrentWindow()
        await window.show()
        await window.unminimize()
        await window.setFocus()
    } catch (err) {
        console.error("[IPC] Failed to reveal window:", err)
    }
}
