<script lang="ts">
    import { onDestroy } from "svelte"
    import { jarvisState, lastExecutedCommand, isJarvisRunning } from "@/stores"

    const STAGES = [
        { id: 'WAKE',     label: 'WAKE' },
        { id: 'STT',      label: 'STT'  },
        { id: 'INTENT',   label: 'INTENT' },
        { id: 'EXEC',     label: 'EXEC' },
        { id: 'RESPONSE', label: 'RESP' },
    ]

    const RESPONSE_ACTIVE_MS = 2000

    let responseActive = false
    let responseTimer: ReturnType<typeof setTimeout> | null = null

    $: activeStages = new Set<string>(
        $jarvisState === 'listening'  ? ['WAKE'] :
        $jarvisState === 'processing' ? ['STT', 'INTENT', 'EXEC'] :
        responseActive                ? ['RESPONSE'] :
        []
    )

    const unsubCmd = lastExecutedCommand.subscribe(cmd => {
        if (!cmd) return
        responseActive = true
        if (responseTimer) clearTimeout(responseTimer)
        responseTimer = setTimeout(() => { responseActive = false }, RESPONSE_ACTIVE_MS)
    })

    onDestroy(() => {
        unsubCmd()
        if (responseTimer) clearTimeout(responseTimer)
    })
</script>

<div class="pipeline-card">
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

<style lang="scss">
.pipeline-card {
    min-height: 68px;
    display: flex;
    align-items: center;
    padding: 16px 18px;
    border-radius: var(--r-xl);
    background: linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.012));
    border: 1px solid rgba(255,255,255,0.055);
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
        animation: pipeline-pulse 2.2s ease-in-out infinite;
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

@keyframes pipeline-pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.58; }
}
</style>
