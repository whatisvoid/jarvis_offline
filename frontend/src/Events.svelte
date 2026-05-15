<script lang="ts">
    import { onMount, onDestroy } from "svelte"
    import { listen } from "@tauri-apps/api/event"
    import { invoke } from "@tauri-apps/api/core"
    import { assistantVoice } from "@/stores"

    let voiceVal = "jarvis-og"
    const unsubVoice = assistantVoice.subscribe(value => {
        voiceVal = value || "jarvis-og"
    })

    const SAFE_NAME = /^[a-zA-Z0-9_-]+$/

    let unlisteners: (() => void)[] = []

    onMount(async () => {
        const unlistenAudio = await listen<{ data: string }>("audio-play", async (event) => {
            const voice = voiceVal || "jarvis-remake"
            const rawName = event.payload.data

            if (!SAFE_NAME.test(rawName) || !SAFE_NAME.test(voice)) {
                console.error("[Events] invalid sound path:", voice, rawName)
                return
            }

            const filename = `sound/${voice}/${rawName}.wav`

            try {
                await invoke("play_sound", { filename, sleep: true })
            } catch (err: unknown) {
                console.error("failed to play sound:", err)
            }
        })

        const unlistenGreet = await listen("assistant-greet", () => {
            document.getElementById("arc-reactor")?.classList.add("active")
        })

        const unlistenWaiting = await listen("assistant-waiting", () => {
            document.getElementById("arc-reactor")?.classList.remove("active")
        })

        unlisteners = [unlistenAudio, unlistenGreet, unlistenWaiting]
    })

    onDestroy(() => {
        unsubVoice()
        unlisteners.forEach(fn => fn())
    })
</script>
