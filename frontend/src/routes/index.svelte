<script lang="ts">
    import { onMount, onDestroy } from "svelte"
    import { invoke } from "@tauri-apps/api/core"

    import SearchBar from "@/components/elements/SearchBar.svelte"
    import ArcReactor from "@/components/elements/ArcReactor.svelte"
    import Stats from "@/components/elements/Stats.svelte"
    import {
        isJarvisRunning,
        updateJarvisStats,
        enableIpc,
        disableIpc,
        translate,
        translations
    } from "@/stores"

    $: t = (key: string) => translate($translations, key)

    let processRunning = false
    let launching = false
    let wasRunning = false

    isJarvisRunning.subscribe((value) => {
        processRunning = value
        if (value) {
            enableIpc()
            wasRunning = true
        } else if (wasRunning) {
            disableIpc()
            wasRunning = false
        }
    })

    onMount(() => {
        updateJarvisStats()
    })

    onDestroy(() => {
        disableIpc()
    })

    async function runAssistant() {
        launching = true
        try {
            await invoke("run_jarvis_app")
            setTimeout(async () => {
                await updateJarvisStats()
                launching = false
            }, 2500)
        } catch (err) {
            console.error("Failed to run jarvis-app:", err)
            launching = false
        }
    }
</script>

<div class="assist-page">
    <div class="search-section">
        <SearchBar />
    </div>

    <div class="reactor-section">
        <div class="reactor-group">
            <div class="reactor-wrapper">
                <ArcReactor />
            </div>

            {#if !processRunning}
                <div class="offline-badge">
                    <span class="offline-icon">⚠</span>
                    <span class="offline-text">{t('assistant-not-running')}</span>
                    <small>{t('assistant-offline-hint')}</small>
                </div>
                <button
                    class="start-button"
                    on:click={runAssistant}
                    disabled={launching}
                >
                    {launching ? t('btn-starting') : t('btn-start')}
                </button>
            {/if}
        </div>
    </div>

    <footer class="stats-footer">
        <Stats />
    </footer>
</div>

<style lang="scss">
.assist-page {
    display: flex;
    flex-direction: column;
    height: calc(100vh - var(--header-h));
}

.search-section {
    padding-top: 20px;
    padding-bottom: 4px;
    flex-shrink: 0;
}

.reactor-section {
    flex: 1;
    overflow: hidden;
    position: relative;
}

.reactor-group {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-bottom: 96px;
    transform: translateY(20px);
}

.stats-footer {
    flex-shrink: 0;
}
</style>
