<script lang="ts">
    import { jarvisRamUsage, jarvisCpuUsage } from "@/stores"

    $: cpuDisplay = $jarvisCpuUsage ? `${Math.round($jarvisCpuUsage * 10) / 10}%` : null
    $: ramDisplay = $jarvisRamUsage ? `${$jarvisRamUsage} MB` : null

    const STATIC_METRICS = [
        { key: 'WAKE LAT'  },
        { key: 'STT LAT'   },
        { key: 'MODEL RESP' },
    ]
</script>

<div class="telemetry-grid">
    <div class="telemetry-card">
        <span class="telemetry-key">CPU</span>
        {#if cpuDisplay}
            <span class="telemetry-val">{cpuDisplay}</span>
        {:else}
            <span class="telemetry-val unavailable">—</span>
        {/if}
    </div>
    <div class="telemetry-card">
        <span class="telemetry-key">RAM</span>
        {#if ramDisplay}
            <span class="telemetry-val">{ramDisplay}</span>
        {:else}
            <span class="telemetry-val unavailable">—</span>
        {/if}
    </div>
    {#each STATIC_METRICS as m}
        <div class="telemetry-card" title="Not yet available">
            <span class="telemetry-key">{m.key}</span>
            <span class="telemetry-val unavailable">N/A</span>
        </div>
    {/each}
</div>

<style lang="scss">
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
</style>
