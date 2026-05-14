<script lang="ts">
    import { invoke } from "@tauri-apps/api/core"
    import { onMount } from "svelte"
    import {
        isJarvisRunning,
        jarvisRamUsage,
        jarvisCpuUsage,
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

<div class="stats-bar">
    <div class="stats-separator"></div>

    <div class="telemetry-grid">
        <div class="stat-item">
            <div class="stat-label-row">
                <span class="stat-dot"
                    class:dot-online={$isJarvisRunning}
                    class:dot-offline={!$isJarvisRunning}
                ></span>
                <span class="stat-label">{t('stats-microphone')}</span>
            </div>
            <span class="stat-value" title="{microphoneName}">{truncate(microphoneName, 18)}</span>
        </div>

        <div class="stat-item">
            <div class="stat-label-row">
                <span class="stat-dot"
                    class:dot-idle={$ipcConnected}
                    class:dot-warning={$isJarvisRunning && !$ipcConnected}
                    class:dot-offline={!$isJarvisRunning && !$ipcConnected}
                ></span>
                <span class="stat-label">{t('stats-neural-networks')}</span>
            </div>
            <span class="stat-value">{neuralLabel}</span>
        </div>

        <div class="stat-item">
            <div class="stat-label-row">
                <span class="stat-dot"
                    class:dot-idle={!!$jarvisRamUsage}
                    class:dot-offline={!$jarvisRamUsage}
                ></span>
                <span class="stat-label">{t('stats-resources')}</span>
            </div>
            <span class="stat-value">{$jarvisRamUsage ? `RAM ${$jarvisRamUsage}mb` : '—'}</span>
        </div>
    </div>
</div>

<style lang="scss">
.stats-bar {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-bottom: 24px;
}

.stats-separator {
    height: 1px;
    width: calc(100% + 48px);
    margin-left: -24px;
    background: var(--shell-separator);
    margin-bottom: 18px;
}

.telemetry-grid {
    width: 440px;
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
}

.stat-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    flex-shrink: 0;
    transition: background 0.4s ease, box-shadow 0.4s ease;

    &.dot-online {
        background: rgba(0,255,170,0.85);
        box-shadow: 0 0 8px rgba(0,255,170,0.25);
    }

    &.dot-idle {
        background: rgba(0,229,255,0.65);
        box-shadow: 0 0 8px rgba(0,229,255,0.18);
    }

    &.dot-warning {
        background: rgba(255,170,60,0.85);
        box-shadow: 0 0 8px rgba(255,170,60,0.22);
    }

    &.dot-offline {
        background: rgba(120,135,150,0.45);
        box-shadow: none;
    }
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
    color: rgba(160,180,200,0.46);
    line-height: 1.3;
}
</style>
