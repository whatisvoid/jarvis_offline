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
    let vadInfo = ""

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
            vadInfo = await invoke<string>("db_read", { key: "vad" }) || "Vosk"
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
    <div class="stat-item">
        <span class="stat-dot" class:active={$isJarvisRunning} style="--color: #22c55e;"></span>
        <div class="stat-content">
            <span class="stat-label">{t('stats-microphone')}</span>
            <span class="stat-value" title="{microphoneName}">{truncate(microphoneName, 18)}</span>
        </div>
    </div>

    <div class="stat-item">
        <span class="stat-dot" class:active={$ipcConnected} style="--color: #f97316;"></span>
        <div class="stat-content">
            <span class="stat-label">{t('stats-neural-networks')}</span>
            <span class="stat-value">
                <span title="Wake Word Engine">{wakeWordEngine}</span> + <span title="Speech To Text">{sttEngine}</span>
            </span>
            <span class="stat-value-sub">{#if vadInfo !== "None"}VAD: {vadInfo}{/if}</span>
        </div>
    </div>

    <div class="stat-item">
        <span class="stat-dot" class:active={$ipcConnected} style="--color: #3b82f6;"></span>
        <div class="stat-content">
            <span class="stat-label">{t('stats-resources')}</span>
            <span class="stat-value">{#if $jarvisRamUsage}RAM {$jarvisRamUsage}mb{:else}—{/if}</span>
        </div>
    </div>
</div>

<style lang="scss">
    .stats-bar {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        padding: 14px 0 10px;
        border-top: 1px solid var(--border-section);
    }

    .stat-item {
        display: flex;
        align-items: flex-start;
        gap: 8px;
    }

    .stat-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        margin-top: 5px;
        background: rgba(255,255,255,0.12);
        flex-shrink: 0;
        transition: all 0.4s ease;

        &.active {
            background: var(--color);
            box-shadow: 0 0 8px var(--color);
        }
    }

    .stat-content {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .stat-label {
        font-size: 0.68rem;
        font-weight: 700;
        color: var(--text-sub);
        text-transform: uppercase;
        letter-spacing: 0.08em;
    }

    .stat-value {
        font-size: 0.65rem;
        color: var(--text-muted);
        line-height: 1.3;
    }

    .stat-value-sub {
        font-size: 0.6rem;
        color: rgba(110,123,135,0.7);
    }
</style>
