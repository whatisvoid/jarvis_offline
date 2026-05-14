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
        lua:           "#8AC832",
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
    margin-bottom: 0.5rem;
}

.commands-count {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.35);
    white-space: nowrap;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.search-input {
    flex: 1;
    height: 32px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 6px;
    color: #ccc;
    font-size: 0.82rem;
    padding: 0 0.75rem;
    outline: none;
    transition: border-color 0.2s;

    &::placeholder { color: rgba(255,255,255,0.25); }
    &:focus { border-color: rgba(138,200,50,0.5); }
}

.empty-state {
    text-align: center;
    color: rgba(255,255,255,0.25);
    font-size: 0.85rem;
    padding: 2rem 0;
    font-style: italic;
}

.commands-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-bottom: 1rem;
}

.command-card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 8px;
    padding: 0.65rem 0.85rem;
    transition: border-color 0.2s;

    &:hover {
        border-color: rgba(255,255,255,0.14);
    }
}

.card-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.4rem;
}

.cmd-id {
    font-size: 0.8rem;
    font-weight: 600;
    color: rgba(255,255,255,0.75);
    font-family: monospace;
    letter-spacing: 0.3px;
}

.cmd-type-badge {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--type-color);
    border: 1px solid var(--type-color);
    border-radius: 3px;
    padding: 0.1rem 0.35rem;
    opacity: 0.85;
}

.cmd-description {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.45);
    margin: 0 0 0.4rem;
    font-style: italic;
}

.cmd-phrases {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    margin-top: 0.2rem;
}

.phrase-chip {
    font-size: 0.72rem;
    background: rgba(138,200,50,0.08);
    border: 1px solid rgba(138,200,50,0.2);
    border-radius: 4px;
    padding: 0.15rem 0.5rem;
    color: rgba(138,200,50,0.8);
    font-style: italic;
}

.cmd-slots {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    margin-top: 0.35rem;
}

.slot-chip {
    font-size: 0.68rem;
    background: rgba(168,85,247,0.08);
    border: 1px solid rgba(168,85,247,0.25);
    border-radius: 4px;
    padding: 0.1rem 0.45rem;
    color: rgba(168,85,247,0.8);
    font-family: monospace;
    cursor: help;
}
</style>
