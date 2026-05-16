import { writable } from "svelte/store"
import { addToast } from "@/lib/toast"
import { dbRead } from "@/lib/api"
import { DB_KEYS } from "@/lib/db-keys"

export const assistantVoice = writable("")

export async function loadVoiceSetting() {
    try {
        const voice = await dbRead(DB_KEYS.voice)
        assistantVoice.set(voice)
    } catch (err: unknown) {
        console.error("failed to load voice setting:", err)
        addToast("Failed to load voice setting", "error")
    }
}
