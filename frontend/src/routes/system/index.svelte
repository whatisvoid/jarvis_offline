<script lang="ts">
    import { onMount, onDestroy } from "svelte"
    import { invoke } from "@tauri-apps/api/core"

    import {
        isJarvisRunning,
        jarvisRamUsage,
        jarvisCpuUsage,
        ipcConnected,
        jarvisState,
        lastRecognizedText,
        lastExecutedCommand,
        lastError,
        translations,
        translate
    } from "@/stores"

    $: t = (key: string) => translate($translations, key)

    // ── Models ──────────────────────────────────────────────────────────────
    let wakeEngine = ""
    let sttEngine = ""
    let sttModel = ""
    let intentEngine = ""
    let llmModel = ""

    // ── Status derivation ────────────────────────────────────────────────────
    $: wakeStatus     = $isJarvisRunning ? 'online'    : 'offline'
    $: sttStatus      = $ipcConnected    ? 'ready'     : ($isJarvisRunning ? 'loading' : 'offline')
    $: ttsStatus      = $ipcConnected    ? 'ready'     : ($isJarvisRunning ? 'loading' : 'offline')
    $: ollamaStatus   = llmModel         ? 'connected' : 'offline'
    $: pipelineStatus = ($isJarvisRunning && $ipcConnected) ? 'active' : ($isJarvisRunning ? 'loading' : 'offline')

    const STATUS_LABEL: Record<string, string> = {
        online:    'ONLINE',
        ready:     'READY',
        loading:   'LOADING',
        connected: 'CONNECTED',
        active:    'ACTIVE',
        offline:   'INACTIVE',
    }

    // ── Telemetry display ────────────────────────────────────────────────────
    $: cpuDisplay = $jarvisCpuUsage ? `${Math.round($jarvisCpuUsage * 10) / 10}%` : null
    $: ramDisplay = $jarvisRamUsage ? `${$jarvisRamUsage} MB` : null

    // ── Pipeline ─────────────────────────────────────────────────────────────
    const STAGES = [
        { id: 'WAKE',     label: 'WAKE' },
        { id: 'STT',      label: 'STT' },
        { id: 'INTENT',   label: 'INTENT' },
        { id: 'EXEC',     label: 'EXEC' },
        { id: 'RESPONSE', label: 'RESP' },
    ]

    let responseActive = false
    let responseTimer: ReturnType<typeof setTimeout> | null = null

    $: activeStages = new Set<string>(
        $jarvisState === 'listening'   ? ['WAKE'] :
        $jarvisState === 'processing'  ? ['STT', 'INTENT', 'EXEC'] :
        responseActive                 ? ['RESPONSE'] :
        []
    )

    // ── Events ───────────────────────────────────────────────────────────────
    interface RuntimeEvent { id: number; title: string; detail: string; time: string }
    const EVENTS_MAX = 15
    let events: RuntimeEvent[] = []
    let nextId = 0

    function addEvent(title: string, detail = '') {
        const d = new Date()
        const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
        events = [{ id: nextId++, title, detail, time }, ...events].slice(0, EVENTS_MAX)
    }

    function pad(n: number) { return String(n).padStart(2, '0') }

    // ── Lifecycle ─────────────────────────────────────────────────────────────
    const unsubs: (() => void)[] = []

    onMount(async () => {
        try {
            const [wake, stt, vosk, intent, llm] = await Promise.all([
                invoke<string>("db_read", { key: "selected_wake_word_engine" }),
                invoke<string>("db_read", { key: "selected_stt_engine" }),
                invoke<string>("db_read", { key: "selected_vosk_model" }),
                invoke<string>("db_read", { key: "selected_intent_recognition_engine" }),
                invoke<string>("db_read", { key: "ollama_model" }),
            ])
            wakeEngine   = wake   || "Rustpotter"
            sttEngine    = stt    || "Vosk"
            sttModel     = vosk   || "Auto-detect"
            intentEngine = intent || "Intent Classifier"
            llmModel     = llm    || ""
        } catch (e) {
            console.error("System: failed to load models", e)
        }

        function skipFirst<T>(cb: (v: T) => void) {
            let first = true
            return (v: T) => { if (first) { first = false; return } cb(v) }
        }

        unsubs.push(jarvisState.subscribe(skipFirst(state => {
            if (state === 'listening')   addEvent('WAKE WORD DETECTED')
            if (state === 'processing')  addEvent('PROCESSING SPEECH')
            if (state === 'idle')        addEvent('SYSTEM IDLE')
        })))

        unsubs.push(lastRecognizedText.subscribe(skipFirst(text => {
            if (text) addEvent('SPEECH RECOGNIZED', text)
        })))

        unsubs.push(lastExecutedCommand.subscribe(skipFirst(cmd => {
            if (cmd) {
                addEvent('COMMAND EXECUTED', cmd)
                responseActive = true
                if (responseTimer) clearTimeout(responseTimer)
                responseTimer = setTimeout(() => { responseActive = false }, 2000)
            }
        })))

        unsubs.push(lastError.subscribe(skipFirst(err => {
            if (err) addEvent('ERROR', err)
        })))
    })

    onDestroy(() => {
        unsubs.forEach(u => u())
        if (responseTimer) clearTimeout(responseTimer)
    })
</script>

<div class="system-layout">
    <div class="system-content">

        <!-- ═══ SECTION 1: OVERVIEW ═══ -->
        <div class="sys-section sys-section--primary">
            <span class="sys-section-label">OVERVIEW</span>
            <div class="sys-card sys-card--primary">
                <div class="sys-status-row">
                    <span class="sys-row-name">WAKE ENGINE</span>
                    <span class="sys-row-status st-{wakeStatus}">{STATUS_LABEL[wakeStatus]}</span>
                </div>
                <div class="sys-status-row">
                    <span class="sys-row-name">STT</span>
                    <span class="sys-row-status st-{sttStatus}">{STATUS_LABEL[sttStatus]}</span>
                </div>
                <div class="sys-status-row">
                    <span class="sys-row-name">TTS</span>
                    <span class="sys-row-status st-{ttsStatus}">{STATUS_LABEL[ttsStatus]}</span>
                </div>
                <div class="sys-status-row">
                    <span class="sys-row-name">OLLAMA</span>
                    <span class="sys-row-status st-{ollamaStatus}">{STATUS_LABEL[ollamaStatus]}</span>
                </div>
                <div class="sys-status-row">
                    <span class="sys-row-name">VOICE PIPELINE</span>
                    <span class="sys-row-status st-{pipelineStatus}">{STATUS_LABEL[pipelineStatus]}</span>
                </div>
            </div>
        </div>

        <!-- ═══ SECTION 2: VOICE PIPELINE ═══ -->
        <div class="sys-section">
            <span class="sys-section-label">VOICE PIPELINE</span>
            <div class="sys-card pipeline-card">
                <div class="pipeline">
                    {#each STAGES as stage, i}
                        <span
                            class="pipeline-stage"
                            class:active={activeStages.has(stage.id)}
                            class:dim={!$isJarvisRunning}
                        >
                            {stage.label}
                        </span>
                        {#if i < STAGES.length - 1}
                            <span class="pipeline-sep" aria-hidden="true">›</span>
                        {/if}
                    {/each}
                </div>
            </div>
        </div>

        <!-- ═══ SECTION 3: TELEMETRY ═══ -->
        <div class="sys-section">
            <span class="sys-section-label">TELEMETRY</span>
            <div class="telemetry-grid">
                <div class="telemetry-card">
                    <span class="telemetry-key">CPU</span>
                    {#if cpuDisplay}
                        <span class="telemetry-val">{cpuDisplay}</span>
                    {:else}
                        <span class="telemetry-val unavailable">NO DATA</span>
                    {/if}
                </div>
                <div class="telemetry-card">
                    <span class="telemetry-key">RAM</span>
                    {#if ramDisplay}
                        <span class="telemetry-val">{ramDisplay}</span>
                    {:else}
                        <span class="telemetry-val unavailable">NO DATA</span>
                    {/if}
                </div>
                <div class="telemetry-card">
                    <span class="telemetry-key">WAKE LAT</span>
                    <span class="telemetry-val unavailable">NO DATA</span>
                </div>
                <div class="telemetry-card">
                    <span class="telemetry-key">STT LAT</span>
                    <span class="telemetry-val unavailable">NO DATA</span>
                </div>
                <div class="telemetry-card">
                    <span class="telemetry-key">MODEL RESP</span>
                    <span class="telemetry-val unavailable">NO DATA</span>
                </div>
            </div>
        </div>

        <!-- ═══ SECTION 4: EVENTS ═══ -->
        <div class="sys-section">
            <span class="sys-section-label">EVENTS</span>
            {#if events.length === 0}
                <div class="sys-empty">
                    <span class="sys-empty-icon">◌</span>
                    <span class="sys-empty-title">NO RUNTIME EVENTS</span>
                    <span class="sys-empty-hint">Start JARVIS to see activity</span>
                </div>
            {:else}
                <div class="events-list">
                    {#each events as ev (ev.id)}
                        <div class="event-card">
                            <span class="event-title">{ev.title}</span>
                            {#if ev.detail}
                                <span class="event-detail">{ev.detail}</span>
                            {/if}
                            <span class="event-time">{ev.time}</span>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>

        <!-- ═══ SECTION 5: MODELS ═══ -->
        <div class="sys-section">
            <span class="sys-section-label">MODELS</span>
            <div class="sys-card">
                <div class="sys-status-row sys-status-row--sm">
                    <span class="sys-row-name">WAKE ENGINE</span>
                    <span class="sys-row-value">{wakeEngine || '—'}</span>
                </div>
                <div class="sys-status-row sys-status-row--sm">
                    <span class="sys-row-name">STT ENGINE</span>
                    <span class="sys-row-value">{sttEngine || '—'}</span>
                </div>
                <div class="sys-status-row sys-status-row--sm">
                    <span class="sys-row-name">STT MODEL</span>
                    <span class="sys-row-value">{sttModel || '—'}</span>
                </div>
                <div class="sys-status-row sys-status-row--sm">
                    <span class="sys-row-name">INTENT</span>
                    <span class="sys-row-value">{intentEngine || '—'}</span>
                </div>
                <div class="sys-status-row sys-status-row--sm">
                    <span class="sys-row-name">LLM</span>
                    <span class="sys-row-value">{llmModel || 'NOT CONFIGURED'}</span>
                </div>
            </div>
        </div>

    </div>
</div>

<style lang="scss">
/* ── Layout ──────────────────────────────────────────────────────────────── */
.system-layout {
    display: flex;
    flex-direction: column;
    padding-top: 16px;
    height: calc(100vh - var(--header-h));
    overflow: hidden;
    position: relative;

    &::before, &::after {
        content: '';
        position: absolute;
        width: 6px;
        height: 6px;
        border-color: rgba(0,229,255,0.3);
        border-style: solid;
        pointer-events: none;
    }
    &::before { top: 16px; left: 0; border-width: 1px 0 0 1px; }
    &::after  { top: 16px; right: 0; border-width: 1px 1px 0 0; }
}

.system-content {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding-bottom: 8px;
}

/* ── Section structure ───────────────────────────────────────────────────── */
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

/* ── Card ────────────────────────────────────────────────────────────────── */
.sys-card {
    padding: 4px 18px;
    border-radius: 10px;
    background: linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.012));
    border: 1px solid rgba(255,255,255,0.055);
}

.sys-card--primary {
    padding: 20px 22px;
}

/* ── Overview rows ───────────────────────────────────────────────────────── */
.sys-status-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: 42px;
    padding: 4px 0;
    border-bottom: 1px solid rgba(255,255,255,0.038);

    &:last-child { border-bottom: none; }
}

.sys-status-row--sm {
    min-height: 38px;
}

.sys-row-name {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.10em;
    color: rgba(220,235,245,0.88);
}

.sys-card:not(.sys-card--primary) .sys-row-name {
    color: rgba(210,230,245,0.58);
}

.sys-row-status {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;

    &.st-online    { color: rgba(0,229,255,0.82); }
    &.st-ready     { color: rgba(0,229,255,0.65); }
    &.st-connected { color: rgba(0,229,255,0.75); }
    &.st-active    { color: rgba(0,229,255,0.82); }
    &.st-loading   { color: rgba(255,190,90,0.72); }
    &.st-offline   { color: rgba(180,190,205,0.46); }
}

.sys-row-value {
    font-size: 10px;
    color: rgba(180,200,220,0.58);
    font-family: var(--font-mono);
    text-align: right;
    max-width: 58%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* ── Pipeline ────────────────────────────────────────────────────────────── */
.pipeline-card {
    min-height: 68px;
    display: flex;
    align-items: center;
    padding: 16px 18px;
}

.pipeline {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0;
    width: 100%;
}

.pipeline-stage {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.22);
    padding: 5px 8px;
    border-radius: 4px;
    transition: color 260ms ease, background 260ms ease, opacity 260ms ease, text-shadow 260ms ease;

    &.active {
        color: rgba(0,229,255,0.92);
        background: rgba(0,229,255,0.06);
        text-shadow: 0 0 10px rgba(0,229,255,0.12);
        animation: sys-pulse 2.2s ease-in-out infinite;
    }

    &.dim {
        color: rgba(255,255,255,0.22);
        opacity: 0.38;
    }
}

.pipeline-sep {
    font-size: 10px;
    color: rgba(255,255,255,0.12);
    padding: 0 4px;
    flex-shrink: 0;
    user-select: none;
}

@keyframes sys-pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.58; }
}

/* ── Telemetry ────────────────────────────────────────────────────────────── */
.telemetry-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
}

.telemetry-card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px 16px;
    border-radius: 8px;
    background: rgba(255,255,255,0.022);
    border: 1px solid rgba(255,255,255,0.048);
}

.telemetry-key {
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: rgba(200,220,235,0.45);
}

.telemetry-val {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: rgba(220,240,255,0.88);
    font-family: var(--font-mono);
    line-height: 1;

    &.unavailable {
        font-size: 9px;
        font-weight: 600;
        letter-spacing: 0.10em;
        color: rgba(150,170,190,0.28);
    }
}

/* ── Events ──────────────────────────────────────────────────────────────── */
.sys-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 72px;
    padding: 12px 0;
}

.sys-empty-icon {
    font-size: 18px;
    color: rgba(150,170,190,0.25);
    line-height: 1;
}

.sys-empty-title {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(180,200,220,0.38);
}

.sys-empty-hint {
    font-size: 10px;
    color: rgba(150,170,190,0.28);
}

.events-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.event-card {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 10px 14px;
    border-radius: 8px;
    background: rgba(255,255,255,0.018);
    border: 1px solid rgba(255,255,255,0.04);
    transition: var(--ease);

    &:hover { background: rgba(0,229,255,0.018); border-color: rgba(0,229,255,0.07); }
}

.event-title {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(220,235,245,0.82);
}

.event-detail {
    font-size: 10px;
    color: rgba(160,180,200,0.55);
    font-family: var(--font-mono);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.event-time {
    font-size: 9px;
    color: rgba(150,170,185,0.32);
    font-family: var(--font-mono);
    letter-spacing: 0.06em;
    margin-top: 2px;
}
</style>
