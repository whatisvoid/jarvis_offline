<script lang="ts">
    import { onMount } from "svelte"
    import { dbRead } from "@/lib/api"
    import { isJarvisRunning, ipcConnected, tStore } from "@/stores"
    import { DB_KEYS } from "@/lib/db-keys"
    import { addToast } from "@/lib/toast"

    import SysOverview  from "@/components/system/SysOverview.svelte"
    import SysPipeline  from "@/components/system/SysPipeline.svelte"
    import SysTelemetry from "@/components/system/SysTelemetry.svelte"
    import SysEvents    from "@/components/system/SysEvents.svelte"
    import SysModels    from "@/components/system/SysModels.svelte"

    $: t = $tStore

    // ── Models (loaded from DB on mount) ──────────────────────────────────────
    const DEFAULT_WAKE_ENGINE   = "Rustpotter"
    const DEFAULT_STT_ENGINE    = "Vosk"
    const DEFAULT_STT_MODEL     = "Auto-detect"
    const DEFAULT_INTENT_ENGINE = "Intent Classifier"

    let wakeEngine   = ""
    let sttEngine    = ""
    let sttModel     = ""
    let intentEngine = ""
    let llmModel     = ""

    $: intentDisplay = (!intentEngine || intentEngine === 'none')
        ? 'NOT CONFIGURED'
        : intentEngine === 'intent-classifier'
        ? 'Intent Classifier'
        : intentEngine

    // ── Status derivation ─────────────────────────────────────────────────────
    $: wakeStatus     = $isJarvisRunning ? 'online'    : 'offline'
    $: sttStatus      = $ipcConnected    ? 'ready'     : ($isJarvisRunning ? 'loading' : 'offline')
    $: ttsStatus      = $ipcConnected    ? 'ready'     : ($isJarvisRunning ? 'loading' : 'offline')
    $: ollamaStatus   = llmModel         ? 'connected' : 'offline'
    $: pipelineStatus = ($isJarvisRunning && $ipcConnected) ? 'active' : ($isJarvisRunning ? 'loading' : 'offline')

    onMount(async () => {
        try {
            const [wake, stt, vosk, intent, llm] = await Promise.all([
                dbRead(DB_KEYS.wakeWordEngine),
                dbRead(DB_KEYS.sttEngine),
                dbRead(DB_KEYS.voskModel),
                dbRead(DB_KEYS.intentEngine),
                dbRead(DB_KEYS.ollamaModel),
            ])
            wakeEngine   = wake   || DEFAULT_WAKE_ENGINE
            sttEngine    = stt    || DEFAULT_STT_ENGINE
            sttModel     = vosk   || DEFAULT_STT_MODEL
            intentEngine = intent || DEFAULT_INTENT_ENGINE
            llmModel     = llm    || ""
        } catch (err: unknown) {
            console.error("System: failed to load models", err)
            addToast("Failed to load system configuration", "error")
        }
    })
</script>

<div class="system-layout">
    <div class="system-content">

        <div class="sys-section sys-section--primary">
            <span class="sys-section-label">OVERVIEW</span>
            <SysOverview
                {wakeStatus}
                {sttStatus}
                {ttsStatus}
                {ollamaStatus}
                {pipelineStatus}
            />
        </div>

        <div class="sys-section">
            <span class="sys-section-label">VOICE PIPELINE</span>
            <SysPipeline />
        </div>

        <div class="sys-section">
            <span class="sys-section-label">TELEMETRY</span>
            <SysTelemetry />
        </div>

        <div class="sys-section">
            <span class="sys-section-label">EVENTS</span>
            <SysEvents />
        </div>

        <div class="sys-section">
            <span class="sys-section-label">MODELS</span>
            <SysModels
                {wakeEngine}
                {sttEngine}
                {sttModel}
                {intentDisplay}
                {llmModel}
            />
        </div>

    </div>
</div>

<style lang="scss">
.system-layout {
    display: flex;
    flex-direction: column;
    padding-top: 16px;
    height: calc(100vh - var(--header-h));
    overflow: hidden;
}

.system-content {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding-right: 12px;
    padding-bottom: 8px;
}

.sys-section {
    margin-bottom: 14px;
}

.sys-section-label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: rgba(180,200,220,0.48);
    margin-bottom: 8px;

    &::before {
        content: '';
        flex-shrink: 0;
        width: 2px;
        height: 16px;
        background: var(--accent);
        border-radius: 2px;
        box-shadow: 0 0 8px rgba(0,229,255,0.35);
    }
}

.sys-section--primary .sys-section-label {
    color: rgba(220,235,245,0.78);
}
</style>
