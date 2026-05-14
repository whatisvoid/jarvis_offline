<script lang="ts">
    import { invoke } from "@tauri-apps/api/core"
    import { onMount } from "svelte"
    import {
        isJarvisRunning,
        jarvisRamUsage,
        ipcConnected,
        translations,
        translate
    } from "@/stores"

    $: t = (key: string) => translate($translations, key)

    let microphoneName = ""
    let wakeWordEngine = "Rustpotter"
    let sttEngine = "Vosk"

    $: neuralLabel = wakeWordEngine === sttEngine ? wakeWordEngine : `${wakeWordEngine} + ${sttEngine}`

    onMount(async () => {
        microphoneName = t('stats-loading')

        try {
            const micIndex = await invoke<string>("db_read", { key: "selected_microphone" })
            if (micIndex && micIndex !== "-1") {
                const devices = await invoke<string[]>("pv_get_audio_devices")
                const idx = parseInt(micIndex)
                if (devices[idx]) microphoneName = devices[idx]
            } else {
                microphoneName = t('stats-system-default')
            }

            wakeWordEngine = await invoke<string>("db_read", { key: "selected_wake_word_engine" }) || "Rustpotter"
            sttEngine = await invoke<string>("db_read", { key: "selected_stt_engine" }) || "Vosk"
        } catch (err) {
            console.error("Failed to load stats:", err)
            microphoneName = t('stats-not-selected')
        }
    })

    function truncate(str: string, max: number): string {
        return str.length > max ? str.slice(0, max) + "..." : str
    }
</script>

<div class="footer-separator"></div>

<div class="telemetry-grid">
    <div class="stat-item">
        <div class="stat-label-row">
            <span class="footer-status-dot"></span>
            <span class="stat-label">{t('stats-microphone')}</span>
        </div>
        <span class="stat-value" title="{microphoneName}">{truncate(microphoneName, 18)}</span>
    </div>

    <div class="stat-item">
        <div class="stat-label-row">
            <span class="footer-status-dot"></span>
            <span class="stat-label">{t('stats-neural-networks')}</span>
        </div>
        <span class="stat-value">{neuralLabel}</span>
    </div>

    <div class="stat-item">
        <div class="stat-label-row">
            <span class="footer-status-dot"></span>
            <span class="stat-label">{t('stats-resources')}</span>
        </div>
        <span class="stat-value">{$jarvisRamUsage ? `RAM ${$jarvisRamUsage}mb` : '—'}</span>
    </div>
</div>

<style lang="scss">
.footer-separator {
    height: 1px;
    width: calc(100% + 48px);
    margin-left: -24px;
    background: var(--shell-separator);
    margin-bottom: 18px;
}

.telemetry-grid {
    width: 440px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    column-gap: 48px;
    align-items: start;
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 3px;
}

.stat-label-row {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
}

.footer-status-dot {
    width: 5px;
    height: 5px;
    border-radius: 999px;
    background: rgba(0, 229, 255, 0.75);
    box-shadow: 0 0 6px rgba(0, 229, 255, 0.18);
    flex-shrink: 0;
}

.stat-label {
    font-size: 11px;
    font-weight: 600;
    color: rgba(210,230,245,0.78);
    text-transform: uppercase;
    letter-spacing: 0.08em;
}

.stat-value {
    margin-left: 13px;
    font-size: 10px;
    color: rgba(160,180,200,0.52);
    line-height: 1.35;
}
</style>
