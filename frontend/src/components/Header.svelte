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

<header class="header">

    <!-- Level 1: System Shell -->
    <div class="shell-bar">
        <a class="logo" href="/" title="JARVIS" on:click|preventDefault={() => navigate('/')}>
            <svg class="logo-icon" width="26" height="26" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" stroke="currentColor" stroke-width="0.8" opacity="0.30"/>
                <g class="logo-spin">
                    <circle cx="20" cy="20" r="13" stroke="currentColor" stroke-width="1"
                            stroke-dasharray="3.5 4.5" opacity="0.60"/>
                </g>
                <circle cx="20" cy="20" r="8" stroke="currentColor" stroke-width="1.3" opacity="0.82"/>
                <circle cx="20" cy="20" r="3.5" fill="currentColor"/>
                <line x1="20" y1="2" x2="20" y2="7" stroke="currentColor" stroke-width="1" opacity="0.42"/>
                <line x1="20" y1="33" x2="20" y2="38" stroke="currentColor" stroke-width="1" opacity="0.42"/>
                <line x1="2" y1="20" x2="7" y2="20" stroke="currentColor" stroke-width="1" opacity="0.42"/>
                <line x1="33" y1="20" x2="38" y2="20" stroke="currentColor" stroke-width="1" opacity="0.42"/>
            </svg>
            <span class="brand-name">JARVIS</span>
        </a>
        <WindowFrame />
    </div>

    <!-- Level 2: Navigation -->
    <nav class="nav-bar">
        <button
            class="nav-tab"
            class:active={currentPath === '/commands'}
            on:click={() => navigate('/commands')}
        >
            {t('header-commands')}
        </button>
        <button
            class="nav-tab"
            class:active={currentPath === '/settings'}
            on:click={() => navigate('/settings')}
        >
            {t('header-settings')}
        </button>
        <div class="scan-line" aria-hidden="true"></div>
    </nav>

</header>

<style lang="scss">
.header {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    position: relative;
    z-index: 100;
}

/* ── Level 1: System shell ── */
.shell-bar {
    height: var(--shell-h);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0 0 16px;
    background: linear-gradient(180deg, rgba(8,12,18,0.98) 0%, rgba(5,8,12,0.97) 100%);
    box-shadow: inset 0 1px 0 rgba(0,229,255,0.10);
    -webkit-app-region: drag;
    position: relative;
    flex-shrink: 0;

    &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: rgba(255,255,255,0.04);
        pointer-events: none;
    }
}

/* ── Logo / brand ── */
.logo {
    display: flex;
    align-items: center;
    gap: 9px;
    text-decoration: none;
    color: var(--accent);
    -webkit-app-region: no-drag;
    position: relative;
    transition: opacity 140ms ease;

    &::before {
        content: '';
        position: absolute;
        left: -2px;
        top: 50%;
        transform: translateY(-50%);
        width: 36px;
        height: 36px;
        background: radial-gradient(circle, rgba(0,229,255,0.12), transparent 70%);
        border-radius: 50%;
        pointer-events: none;
    }

    &:hover { opacity: 0.72; }
}

.logo-icon {
    filter: drop-shadow(0 0 10px rgba(0,229,255,0.18));
    flex-shrink: 0;
}

.logo-spin {
    transform-origin: 20px 20px;
    animation: logo-spin 26s linear infinite;
}

@keyframes logo-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
}

.brand-name {
    font-size: 1.15rem;
    font-weight: 700;
    letter-spacing: 0.16em;
    color: var(--text);
    text-transform: uppercase;
    line-height: 1;
    padding-right: 0.06em;
}

/* ── Level 2: Navigation bar ── */
.nav-bar {
    height: var(--nav-h);
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 0 16px;
    background: linear-gradient(180deg, rgba(6,9,14,0.97) 0%, rgba(4,7,11,0.96) 100%);
    position: relative;
    flex-shrink: 0;

    &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent 0%, rgba(0,229,255,0.20) 30%, rgba(0,229,255,0.20) 70%, transparent 100%);
        pointer-events: none;
    }
}

/* ── Nav tabs ── */
.nav-tab {
    position: relative;
    height: 100%;
    padding: 0;
    background: transparent;
    border: none;
    color: rgba(255,255,255,0.52);
    font-family: var(--font);
    font-size: 0.62rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    cursor: pointer;
    transition: color 140ms ease;
    white-space: nowrap;

    &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: var(--accent);
        box-shadow: 0 0 8px rgba(0,229,255,0.28);
        opacity: 0;
        transition: opacity 140ms ease;
    }

    &:hover { color: rgba(255,255,255,0.88); }

    &.active {
        color: var(--text);
        font-weight: 700;

        &::after { opacity: 1; }
    }
}

/* ── Scan line ── */
.scan-line {
    position: absolute;
    bottom: 0;
    left: -30%;
    width: 30%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0,229,255,0.45), transparent);
    animation: scan-sweep 8s linear infinite;
    pointer-events: none;
}

@keyframes scan-sweep {
    from { left: -30%; }
    to   { left: 110%; }
}
</style>
