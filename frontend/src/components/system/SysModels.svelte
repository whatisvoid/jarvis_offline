<script lang="ts">
    export let wakeEngine:    string
    export let sttEngine:     string
    export let sttModel:      string
    export let intentDisplay: string
    export let llmModel:      string
</script>

<div class="sys-card">
    {#each [
        { name: 'WAKE ENGINE', value: wakeEngine    || '—' },
        { name: 'STT ENGINE',  value: sttEngine     || '—' },
        { name: 'STT MODEL',   value: sttModel      || '—' },
        { name: 'INTENT',      value: intentDisplay        },
        { name: 'LLM',         value: llmModel || 'NOT CONFIGURED' },
    ] as row}
        <div class="sys-status-row sys-status-row--sm">
            <span class="sys-row-name">{row.name}</span>
            <span class="sys-row-value">{row.value}</span>
        </div>
    {/each}
</div>

<style lang="scss">
.sys-card {
    padding: 4px 18px;
    border-radius: 10px;
    background: linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.012));
    border: 1px solid rgba(255,255,255,0.055);
}

.sys-status-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: 42px;
    padding: 4px 0;
    border-bottom: 1px solid rgba(255,255,255,0.038);

    &:last-child { border-bottom: none; }

    &--sm { min-height: 38px; }
}

.sys-row-name {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.10em;
    color: rgba(210,230,245,0.58);
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
</style>
