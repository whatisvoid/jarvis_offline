<script lang="ts">
    export let wakeStatus:     string
    export let sttStatus:      string
    export let ttsStatus:      string
    export let ollamaStatus:   string
    export let pipelineStatus: string

    const STATUS_LABEL: Record<string, string> = {
        online:    'ONLINE',
        ready:     'READY',
        loading:   'LOADING',
        connected: 'CONNECTED',
        active:    'ACTIVE',
        offline:   'INACTIVE',
    }

    const STATUS_ICON: Record<string, string> = {
        online:    '●',
        ready:     '●',
        loading:   '◌',
        connected: '●',
        active:    '▶',
        offline:   '○',
    }
</script>

<div class="sys-card sys-card--primary">
    {#each [
        { name: 'WAKE ENGINE',    status: wakeStatus     },
        { name: 'STT',            status: sttStatus      },
        { name: 'TTS',            status: ttsStatus      },
        { name: 'OLLAMA',         status: ollamaStatus   },
        { name: 'VOICE PIPELINE', status: pipelineStatus },
    ] as row}
        <div class="sys-status-row">
            <span class="sys-row-name">{row.name}</span>
            <span class="sys-row-status st-{row.status}" aria-label={STATUS_LABEL[row.status]}>
                <span class="status-icon" aria-hidden="true">{STATUS_ICON[row.status]}</span>
                {STATUS_LABEL[row.status]}
            </span>
        </div>
    {/each}
</div>

<style lang="scss">
.sys-card {
    padding: 4px 18px;
    border-radius: 10px;
    background: linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.012));
    border: 1px solid rgba(255,255,255,0.055);

    &--primary { padding: 20px 22px; }
}

.sys-status-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: 42px;
    padding: 4px 0;
    border-bottom: 1px solid rgba(255,255,255,0.038);

    &:last-child { border-bottom: none; }
}

.sys-row-name {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.10em;
    color: rgba(220,235,245,0.88);
}

.sys-row-status {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 5px;

    &.st-online    { color: rgba(0,229,255,0.82); }
    &.st-ready     { color: rgba(0,229,255,0.65); }
    &.st-connected { color: rgba(0,229,255,0.75); }
    &.st-active    { color: rgba(0,229,255,0.82); }
    &.st-loading   { color: rgba(255,190,90,0.72); }
    &.st-offline   { color: rgba(180,190,205,0.46); }
}

.status-icon {
    font-size: 8px;
    line-height: 1;
    flex-shrink: 0;
}
</style>
