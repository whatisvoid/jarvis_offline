import { writable } from "svelte/store"
import { getAudioDevices } from "@/lib/api"

export const audioDevices = writable<string[]>([])
let _loaded = false

export async function loadAudioDevices() {
    if (_loaded) return
    try {
        const devices = await getAudioDevices()
        audioDevices.set(devices)
        _loaded = true
    } catch (err: unknown) {
        console.error("failed to load audio devices:", err)
    }
}
