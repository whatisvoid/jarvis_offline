<script lang="ts">
    import { onMount } from "svelte"
    import { goto } from "@roxi/routify"
    import { translations, translate } from "@/stores"
    import WindowFrame from "@/components/layout/WindowFrame.svelte"

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

<header class="header" data-tauri-drag-region>
    <div class="header-left">
        <a class="logo" href="/" title="JARVIS" on:click|preventDefault={() => navigate('/')}>
            <svg class="logo-icon" width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" stroke="currentColor" stroke-width="0.75" opacity="0.28"/>
                <g class="logo-spin">
                    <circle cx="20" cy="20" r="13" stroke="currentColor" stroke-width="1"
                            stroke-dasharray="3.5 4.5" opacity="0.55"/>
                </g>
                <circle cx="20" cy="20" r="8" stroke="currentColor" stroke-width="1.25" opacity="0.75"/>
                <circle cx="20" cy="20" r="3.5" fill="currentColor"/>
                <line x1="20" y1="2" x2="20" y2="7" stroke="currentColor" stroke-width="1" opacity="0.4"/>
                <line x1="20" y1="33" x2="20" y2="38" stroke="currentColor" stroke-width="1" opacity="0.4"/>
                <line x1="2" y1="20" x2="7" y2="20" stroke="currentColor" stroke-width="1" opacity="0.4"/>
                <line x1="33" y1="20" x2="38" y2="20" stroke="currentColor" stroke-width="1" opacity="0.4"/>
            </svg>
            <span class="logo-name">JARVIS</span>
        </a>
    </div>

    <div class="header-right">
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
        <WindowFrame />
    </div>

    <div class="scan-line" aria-hidden="true"></div>
</header>

<style lang="scss">
.header {
    height: var(--header-h);
    background: linear-gradient(180deg, #0A0F18 0%, #05070B 100%);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0 0 24px;
    flex-shrink: 0;
    position: relative;
    z-index: 100;
    -webkit-app-region: drag;
    box-shadow: inset 0 1px 0 rgba(0,229,255,0.18);

    &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent 5%, rgba(0,229,255,0.38) 40%, rgba(0,229,255,0.38) 60%, transparent 95%);
        pointer-events: none;
    }
}

.scan-line {
    position: absolute;
    bottom: -1px;
    left: -20%;
    width: 40%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0,229,255,0.55), transparent);
    animation: scan-sweep 8s linear infinite;
    pointer-events: none;
}

@keyframes scan-sweep {
    from { left: -40%; }
    to   { left: 120%; }
}

.header-left {
    -webkit-app-region: no-drag;
    flex-shrink: 0;
}

.logo {
    display: flex;
    align-items: center;
    gap: 11px;
    text-decoration: none;
    color: var(--accent);
    transition: var(--ease);
    position: relative;

    &::before {
        content: '';
        position: absolute;
        left: -4px;
        top: 50%;
        transform: translateY(-50%);
        width: 48px;
        height: 48px;
        background: radial-gradient(circle, rgba(0,229,255,0.12), transparent 70%);
        pointer-events: none;
        border-radius: 50%;
    }

    &:hover { opacity: 0.8; }
}

.logo-icon {
    filter: drop-shadow(0 0 8px rgba(0,229,255,0.32));
    flex-shrink: 0;
}

.logo-spin {
    transform-origin: 20px 20px;
    animation: logo-spin 18s linear infinite;
}

@keyframes logo-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
}

.logo-name {
    font-size: 0.92rem;
    font-weight: 700;
    letter-spacing: 0.26em;
    color: var(--text);
    text-transform: uppercase;
}

.header-right {
    display: flex;
    align-items: center;
    -webkit-app-region: no-drag;
    flex-shrink: 0;
}

.header-nav {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 0 8px;
}

.nav-btn {
    position: relative;
    height: 34px;
    padding: 0 14px;
    background: transparent;
    border: none;
    border-radius: var(--r-md);
    color: rgba(255,255,255,0.4);
    font-size: 0.68rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    cursor: pointer;
    transition: var(--ease);
    -webkit-app-region: no-drag;

    &::after {
        content: '';
        position: absolute;
        bottom: 5px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 1.5px;
        background: var(--accent);
        border-radius: 1px;
        transition: width 160ms ease;
        opacity: 0.85;
    }

    &:hover {
        color: rgba(255,255,255,0.7);
        background: rgba(255,255,255,0.04);
    }

    &.active {
        color: var(--text);

        &::after { width: calc(100% - 18px); }
    }
}
</style>
