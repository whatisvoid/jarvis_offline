import { writable } from "svelte/store"
import type { JarvisState } from "./types"

export const jarvisState        = writable<JarvisState>("disconnected")
export const ipcConnected       = writable(false)
export const lastRecognizedText = writable("")
export const lastExecutedCommand = writable("")
export const lastError          = writable("")
