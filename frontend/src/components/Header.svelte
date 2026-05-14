<script lang="ts">
    import { onMount } from "svelte"
    import { goto } from "@roxi/routify"
    import { translations, translate } from "@/stores"

    $: t = (key: string) => translate($translations, key)

    let currentPath = "/"

    onMount(() => {
        currentPath = window.location.pathname
    })

    function navigate(path: string) {
        $goto(path)
        currentPath = path
    }
</script>

<header class="header">
    <div class="header-left">
        <a class="logo" href="/" title="JARVIS" on:click|preventDefault={() => navigate('/')}>
            <svg class="logo-icon" width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="18" cy="18" r="15.5" stroke="currentColor" stroke-width="1" opacity="0.38"/>
                <circle cx="18" cy="18" r="10" stroke="currentColor" stroke-width="1.5" opacity="0.7"/>
                <circle cx="18" cy="18" r="4" fill="currentColor"/>
                <line x1="18" y1="2" x2="18" y2="8" stroke="currentColor" stroke-width="1" opacity="0.45"/>
                <line x1="18" y1="28" x2="18" y2="34" stroke="currentColor" stroke-width="1" opacity="0.45"/>
                <line x1="2" y1="18" x2="8" y2="18" stroke="currentColor" stroke-width="1" opacity="0.45"/>
                <line x1="28" y1="18" x2="34" y2="18" stroke="currentColor" stroke-width="1" opacity="0.45"/>
            </svg>
            <span class="logo-name">JARVIS</span>
        </a>
    </div>

    <nav class="header-nav">
        <button
            class="nav-btn"
            class:active={currentPath === '/commands'}
            on:click={() => navigate('/commands')}
        >
            {t('header-commands')}
        </button>
        <button
            class="nav-btn"
            class:active={currentPath === '/settings'}
            on:click={() => navigate('/settings')}
        >
            {t('header-settings')}
        </button>
    </nav>
</header>

<style lang="scss">
.header {
    height: var(--header-h);
    background: var(--header-bg);
    border-bottom: var(--header-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    flex-shrink: 0;
    position: relative;
    z-index: 100;
}

.logo {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    color: var(--accent);
    transition: var(--ease);

    &:hover { opacity: 0.82; }
}

.logo-icon {
    filter: drop-shadow(0 0 7px rgba(0,229,255,0.3));
    flex-shrink: 0;
}

.logo-name {
    font-size: 0.95rem;
    font-weight: 700;
    letter-spacing: 0.24em;
    color: var(--text);
    text-transform: uppercase;
}

.header-nav {
    display: flex;
    align-items: center;
    gap: 2px;
}

.nav-btn {
    position: relative;
    height: 34px;
    padding: 0 14px;
    background: transparent;
    border: none;
    border-radius: var(--r-md);
    color: rgba(255,255,255,0.42);
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    cursor: pointer;
    transition: var(--ease);

    &::after {
        content: '';
        position: absolute;
        bottom: 4px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 2px;
        background: var(--accent);
        border-radius: 1px;
        transition: width 140ms ease;
    }

    &:hover {
        color: rgba(255,255,255,0.72);
        background: rgba(255,255,255,0.04);
    }

    &.active {
        color: var(--text);

        &::after { width: calc(100% - 20px); }
    }
}
</style>
