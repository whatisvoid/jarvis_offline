<script lang="ts">
    import { onMount } from "svelte"
    import { invoke } from "@tauri-apps/api/core"
    import { Space } from "@svelteuidev/core"

    import { currentLanguage, translations, translate } from "@/stores"

    $: t = (key: string) => translate($translations, key)

    interface SlotDefinition {
        entity: string
        context: string[]
    }

    interface JCommand {
        id: string
        type: string
        description: string
        phrases: Record<string, string[]>
        slots: Record<string, SlotDefinition>
    }

    let commands: JCommand[] = []
    let searchQuery = ""
    let loading = true

    $: lang = $currentLanguage || "ru"

    function getPhrases(cmd: JCommand): string[] {
        return cmd.phrases[lang] ?? cmd.phrases["en"] ?? Object.values(cmd.phrases)[0] ?? []
    }

    $: filtered = commands.filter(cmd => {
        if (!searchQuery.trim()) return true
        const q = searchQuery.toLowerCase()
        return (
            cmd.id.toLowerCase().includes(q) ||
            getPhrases(cmd).some(p => p.toLowerCase().includes(q))
        )
    })

    const TYPE_COLORS: Record<string, string> = {
        lua:           "#00FFC6",
        ahk:           "#3b82f6",
        cli:           "#f97316",
        voice:         "#a855f7",
        terminate:     "#ef4444",
        stop_chaining: "#6b7280",
    }

    function typeColor(type: string): string {
        return TYPE_COLORS[type.toLowerCase()] ?? "#6b7280"
    }

    onMount(async () => {
        try {
            commands = await invoke<JCommand[]>("get_commands_list")
        } catch (err) {
            console.error("Failed to load commands:", err)
        } finally {
            loading = false
        }
    })
</script>

<Space h="md" />

<div class="commands-header">
    <input
        class="search-input"
        type="text"
        placeholder={t('commands-search')}
        bind:value={searchQuery}
    />
</div>

{#if loading}
    <div class="empty-state">{t('stats-loading')}</div>
{:else if commands.length === 0}
    <div class="empty-state">Нет доступных команд</div>
{:else if filtered.length === 0}
    <div class="empty-state">{t('error-not-found')}</div>
{:else}
    <div class="commands-list">
        {#each filtered as cmd (cmd.id)}
            {@const phrases = getPhrases(cmd)}
            <div class="command-card">
                <div class="card-header">
                    <span class="cmd-id">{cmd.id}</span>
                    <span class="cmd-type-badge" style="--type-color: {typeColor(cmd.type)}">
                        {cmd.type}
                    </span>
                </div>

                {#if cmd.description}
                    <p class="cmd-description">{cmd.description}</p>
                {/if}

                {#if phrases.length > 0}
                    <div class="cmd-phrases">
                        {#each phrases as phrase}
                            <span class="phrase-chip">{phrase}</span>
                        {/each}
                    </div>
                {/if}

                {#if Object.keys(cmd.slots).length > 0}
                    <div class="cmd-slots">
                        {#each Object.entries(cmd.slots) as [name, slot]}
                            <span class="slot-chip" title={slot.context.join(', ')}>
                                ❰{name}: {slot.entity}❱
                            </span>
                        {/each}
                    </div>
                {/if}
            </div>
        {/each}
    </div>
{/if}

<style lang="scss">
.commands-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 10px;
}

.search-input {
    flex: 1;
    height: 36px;
    background: var(--bg-input);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    color: var(--text);
    font-size: 0.82rem;
    padding: 0 12px;
    outline: none;
    transition: var(--ease);

    &::placeholder { color: var(--text-muted); }
    &:focus { border-color: rgba(0,229,255,0.5); }
}

.empty-state {
    text-align: center;
    color: var(--text-muted);
    font-size: 0.82rem;
    padding: 2.5rem 0;
    font-style: italic;
}

.commands-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-bottom: 1rem;
    overflow-y: auto;
    max-height: calc(100vh - var(--header-h) - 80px);
}

.command-card {
    background: rgba(255,255,255,0.018);
    border: 1px solid rgba(255,255,255,0.045);
    border-radius: var(--r-md);
    padding: 10px 14px;
    transition: var(--ease);

    &:hover {
        background: rgba(0,229,255,0.018);
        border-color: rgba(0,229,255,0.08);
    }
}

.card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 5px;
}

.cmd-id {
    font-size: 0.78rem;
    font-weight: 600;
    color: rgba(255,255,255,0.75);
    font-family: var(--font-mono);
    letter-spacing: 0.3px;
}

.cmd-type-badge {
    font-size: 0.6rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--type-color);
    border: 1px solid var(--type-color);
    border-radius: var(--r-sm);
    padding: 1px 5px;
    opacity: 0.82;
}

.cmd-description {
    font-size: 0.72rem;
    color: var(--text-muted);
    margin: 0 0 5px;
    font-style: italic;
}

.cmd-phrases {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 3px;
}

.phrase-chip {
    font-size: 0.67rem;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: var(--r-sm);
    padding: 2px 7px;
    color: rgba(255,255,255,0.38);
    font-style: italic;
    opacity: 0.78;
}

.cmd-slots {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 5px;
}

.slot-chip {
    font-size: 0.65rem;
    background: rgba(168,85,247,0.045);
    border: 1px solid rgba(168,85,247,0.14);
    border-radius: var(--r-sm);
    padding: 1px 6px;
    color: rgba(168,85,247,0.72);
    font-family: var(--font-mono);
    cursor: help;
    opacity: 0.78;
}
</style>
