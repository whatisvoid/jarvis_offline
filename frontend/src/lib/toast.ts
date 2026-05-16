import { writable } from "svelte/store"

export type ToastType = "error" | "success" | "info"

export interface Toast {
    id:      number
    type:    ToastType
    message: string
}

let _nextId = 0
const DURATION_MS = 4500

export const toasts = writable<Toast[]>([])

export function addToast(message: string, type: ToastType = "error") {
    const id = _nextId++
    // prepend so newest renders at the top of the stack
    toasts.update(ts => [{ id, type, message }, ...ts])
    setTimeout(() => removeToast(id), DURATION_MS)
}

export function removeToast(id: number) {
    toasts.update(ts => ts.filter(t => t.id !== id))
}
