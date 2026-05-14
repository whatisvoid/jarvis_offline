<script lang="ts">
    import { tick, createEventDispatcher } from 'svelte'

    export let data: { label: string; value: string }[] = []
    export let value: string = ""
    export let label: string = ""
    export let description: string = ""
    export const variant: string = ""  // for NativeSelect compat, unused

    const dispatch = createEventDispatcher<{ change: string }>()

    let open = false
    let triggerEl: HTMLButtonElement
    let listEl: HTMLUListElement | null = null
    let dropdownTop = 0
    let dropdownLeft = 0
    let dropdownWidth = 0
    let focusedIndex = 0

    $: selectedLabel = data.find(d => d.value === value)?.label ?? data[0]?.label ?? "—"

    $: if (open && listEl && focusedIndex >= 0) {
        const item = listEl.children[focusedIndex] as HTMLElement | undefined
        item?.scrollIntoView({ block: 'nearest' })
    }

    async function openDropdown() {
        if (!triggerEl) return
        const rect = triggerEl.getBoundingClientRect()
        dropdownTop = rect.bottom + 2
        dropdownLeft = rect.left
        dropdownWidth = rect.width
        focusedIndex = Math.max(0, data.findIndex(d => d.value === value))
        open = true
        await tick()
        listEl?.focus()
    }

    function closeDropdown() {
        open = false
    }

    function selectItem(val: string) {
        value = val
        open = false
        triggerEl?.focus()
        dispatch('change', val)
    }

    function handleTriggerKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
            e.preventDefault()
            openDropdown()
        }
    }

    function handleListKeydown(e: KeyboardEvent) {
        switch (e.key) {
            case 'Escape':
                closeDropdown()
                triggerEl?.focus()
                break
            case 'ArrowDown':
                e.preventDefault()
                focusedIndex = Math.min(focusedIndex + 1, data.length - 1)
                break
            case 'ArrowUp':
                e.preventDefault()
                focusedIndex = Math.max(focusedIndex - 1, 0)
                break
            case 'Enter':
                if (focusedIndex >= 0) selectItem(data[focusedIndex].value)
                break
        }
    }

    function handleWindowClick(e: MouseEvent) {
        if (!open) return
        const target = e.target as Node
        if (!triggerEl?.contains(target) && !listEl?.contains(target)) {
            closeDropdown()
        }
    }

    function handleWindowScroll() {
        if (open) closeDropdown()
    }
</script>

<svelte:window on:click={handleWindowClick} on:scroll|passive={handleWindowScroll} />

<div class="select-root">
    {#if label}
        <span class="select-label">{label}</span>
    {/if}
    {#if description}
        <span class="select-desc">{description}</span>
    {/if}

    <button
        class="select-trigger"
        bind:this={triggerEl}
        on:click={openDropdown}
        on:keydown={handleTriggerKeydown}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls="select-dropdown-{label}"
    >
        <span class="select-value">{selectedLabel}</span>
        <svg class="select-arrow" class:open width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    </button>
</div>

{#if open}
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <ul
        id="select-dropdown-{label}"
        class="select-dropdown"
        style="top: {dropdownTop}px; left: {dropdownLeft}px; width: {dropdownWidth}px;"
        bind:this={listEl}
        role="listbox"
        tabindex="-1"
        on:keydown={handleListKeydown}
    >
        {#each data as item, i}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <li
                class="select-item"
                class:focused={i === focusedIndex}
                class:selected={item.value === value}
                role="option"
                aria-selected={item.value === value}
                on:click={() => selectItem(item.value)}
                on:mouseenter={() => { focusedIndex = i }}
            >
                <span>{item.label}</span>
                {#if item.value === value}
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                        <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                {/if}
            </li>
        {/each}
    </ul>
{/if}

<style lang="scss">
.select-root {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0;
}

.select-label {
    display: block;
    font-family: var(--font);
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-sub);
    margin-bottom: 6px;
    line-height: 1.3;
}

.select-desc {
    display: block;
    font-family: var(--font);
    font-size: 0.68rem;
    color: var(--text-muted);
    margin-bottom: 8px;
    line-height: 1.45;
    white-space: pre-line;
    opacity: 0.58;
}

.select-trigger {
    width: 100%;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 14px;
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: var(--r-md);
    color: rgba(230,245,255,0.92);
    font-family: var(--font);
    font-size: 0.84rem;
    cursor: pointer;
    transition: var(--ease);
    text-align: left;

    &:hover {
        background: rgba(0,229,255,0.025);
        border-color: rgba(0,229,255,0.22);
    }

    &:focus-visible {
        outline: none;
        border-color: rgba(0,229,255,0.42);
        box-shadow: 0 0 14px rgba(0,229,255,0.08);
    }

    &[aria-expanded="true"] {
        border-color: rgba(0,229,255,0.4);
        background: rgba(255,255,255,0.04);
    }
}

.select-value {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.select-arrow {
    color: var(--text-muted);
    flex-shrink: 0;
    transition: transform 140ms ease;

    &.open { transform: rotate(180deg); }
}

.select-dropdown {
    position: fixed;
    z-index: 9999;
    background: rgba(8,12,18,0.98);
    border: 1px solid rgba(0,229,255,0.18);
    border-radius: var(--r-md);
    padding: 4px;
    margin: 0;
    list-style: none;
    max-height: 220px;
    overflow-y: auto;
    outline: none;
    box-shadow: 0 12px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,229,255,0.06);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);

    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-track { background: transparent; }
    &::-webkit-scrollbar-thumb {
        background: rgba(255,255,255,0.12);
        border-radius: 2px;
    }
    &::-webkit-scrollbar-thumb:hover {
        background: rgba(0,229,255,0.24);
    }
}

.select-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 36px;
    padding: 0 14px;
    border-radius: 4px;
    font-family: var(--font);
    font-size: 0.82rem;
    color: rgba(220,235,245,0.82);
    cursor: pointer;
    transition: background 100ms ease, color 100ms ease;
    user-select: none;

    &.focused {
        background: rgba(0,229,255,0.06);
        color: var(--text);
    }

    &.selected {
        color: #00e5ff;
        background: rgba(0,229,255,0.08);

        svg { color: #00e5ff; }
    }

    &.focused.selected {
        background: rgba(0,229,255,0.10);
    }
}
</style>
