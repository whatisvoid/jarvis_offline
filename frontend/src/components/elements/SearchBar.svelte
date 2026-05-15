<script lang="ts">
    import { tStore, isJarvisRunning, ipcConnected, sendTextCommand } from "@/stores"

    $: t = $tStore

    let searchQuery = ""
    let isProcessing = false
    let statusMessage = ""

    function handleSubmit(e: Event) {
        e.preventDefault()

        const command = searchQuery.trim()
        if (!command || isProcessing) return

        if (!$isJarvisRunning || !$ipcConnected) {
            statusMessage = t('search-error-not-running')
            setTimeout(() => statusMessage = "", 3000)
            return
        }

        isProcessing = true
        statusMessage = ""

        try {
            const sent = sendTextCommand(command)
            if (!sent) {
                statusMessage = t('search-error-not-running')
                setTimeout(() => statusMessage = "", 3000)
            } else {
                searchQuery = ""
            }
        } catch (err: unknown) {
            console.error("Failed to send command:", err)
            statusMessage = t('search-error-failed')
            setTimeout(() => statusMessage = "", 3000)
        } finally {
            isProcessing = false
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") {
            searchQuery = ""
        }
    }
</script>

<div id="search-form" class="search" class:active={searchQuery !== ""} class:processing={isProcessing}>
    <form on:submit={handleSubmit}>
        <input
            bind:value={searchQuery}
            on:keydown={handleKeydown}
            type="text"
            name="q"
            placeholder={t('search-placeholder')}
            autocomplete="off"
            minlength="1"
            maxlength="200"
            disabled={isProcessing}
        />
        <small>{isProcessing ? '...' : 'Enter'}</small>
    </form>
    {#if statusMessage}
        <div class="search-status">{statusMessage}</div>
    {/if}
</div>

<style lang="scss">
    .search.processing input {
        opacity: 0.55;
        cursor: wait;
    }

    .search-status {
        position: absolute;
        bottom: -22px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 0.72rem;
        color: rgba(var(--accent-rgb),0.8);
        white-space: nowrap;
        animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateX(-50%) translateY(-4px); }
        to   { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
</style>
