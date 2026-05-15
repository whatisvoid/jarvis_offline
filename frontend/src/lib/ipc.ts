import { writable } from "svelte/store"
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

const RECONNECT_BASE_MS    = 1000
const RECONNECT_MAX_MS     = 30000
const HEARTBEAT_INTERVAL_MS = 30000
const HEARTBEAT_TIMEOUT_MS  = 5000

let ws: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let heartbeatTimer: ReturnType<typeof setInterval> | null = null
let heartbeatTimeoutTimer: ReturnType<typeof setTimeout> | null = null
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
        startHeartbeat()
        console.log("[IPC] connected")
    }

    ws.onclose = () => {
        ipcConnected.set(false)
        jarvisState.set("disconnected")
        stopHeartbeat()
        scheduleReconnect()
        console.log("[IPC] disconnected")
    }

    ws.onerror = (err) => {
        console.error("[IPC] error:", err)
    }

    ws.onmessage = (event) => {
        try {
            const raw = JSON.parse(event.data)
            if (typeof raw?.event === "string") {
                handleEvent(raw as IpcMessage)
            }
        } catch (err: unknown) {
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
    stopHeartbeat()

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

function startHeartbeat() {
    stopHeartbeat()
    heartbeatTimer = setInterval(() => {
        if (ws?.readyState !== WebSocket.OPEN) return
        ws.send(JSON.stringify({ action: "ping" }))
        heartbeatTimeoutTimer = setTimeout(() => {
            console.warn("[IPC] heartbeat timeout — forcing reconnect")
            ws?.close()
        }, HEARTBEAT_TIMEOUT_MS)
    }, HEARTBEAT_INTERVAL_MS)
}

function stopHeartbeat() {
    if (heartbeatTimer) {
        clearInterval(heartbeatTimer)
        heartbeatTimer = null
    }
    if (heartbeatTimeoutTimer) {
        clearTimeout(heartbeatTimeoutTimer)
        heartbeatTimeoutTimer = null
    }
}

// ### EVENT HANDLING ###

type IpcMessage =
    | { event: "wake_word_detected" }
    | { event: "listening" }
    | { event: "speech_recognized"; text: string }
    | { event: "command_executed"; id: string }
    | { event: "idle" }
    | { event: "error"; message: string }
    | { event: "started" }
    | { event: "stopping" }
    | { event: "pong" }
    | { event: "reveal_window" }

function handleEvent(data: IpcMessage) {
    console.log("IPC: Event", data.event, data)

    switch (data.event) {
        case "wake_word_detected":
        case "listening":
            jarvisState.set("listening")
            break

        case "speech_recognized":
            lastRecognizedText.set(data.text)
            jarvisState.set("processing")
            break

        case "command_executed":
            lastExecutedCommand.set(data.id)
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
            if (heartbeatTimeoutTimer) {
                clearTimeout(heartbeatTimeoutTimer)
                heartbeatTimeoutTimer = null
            }
            break

        case "reveal_window":
            revealWindow()
            break
    }
}

// ### ACTIONS ###

type IpcOutgoing =
    | { action: "stop" }
    | { action: "reload_commands" }
    | { action: "text_command"; text: string }

function sendAction(msg: IpcOutgoing): boolean {
    if (ws?.readyState !== WebSocket.OPEN) return false
    ws.send(JSON.stringify(msg))
    return true
}

export function stopJarvisApp() {
    return sendAction({ action: "stop" })
}

export function reloadCommands() {
    return sendAction({ action: "reload_commands" })
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
        } catch (err: unknown) {
            reject(err)
        }
    })
}

export function sendTextCommand(text: string): boolean {
    return sendAction({ action: "text_command", text })
}

async function revealWindow() {
    try {
        const window = getCurrentWindow()
        await window.show()
        await window.unminimize()
        await window.setFocus()
    } catch (err: unknown) {
        console.error("[IPC] Failed to reveal window:", err)
    }
}
