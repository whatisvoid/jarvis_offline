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
            <svg class="logo-icon" width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" stroke="currentColor" stroke-width="0.75" opacity="0.22"/>
                <g class="logo-spin">
                    <circle cx="20" cy="20" r="13" stroke="currentColor" stroke-width="1"
                            stroke-dasharray="3.5 4.5" opacity="0.5"/>
                </g>
                <circle cx="20" cy="20" r="8" stroke="currentColor" stroke-width="1.25" opacity="0.7"/>
                <circle cx="20" cy="20" r="3.5" fill="currentColor"/>
                <line x1="20" y1="2" x2="20" y2="7" stroke="currentColor" stroke-width="1" opacity="0.35"/>
                <line x1="20" y1="33" x2="20" y2="38" stroke="currentColor" stroke-width="1" opacity="0.35"/>
                <line x1="2" y1="20" x2="7" y2="20" stroke="currentColor" stroke-width="1" opacity="0.35"/>
                <line x1="33" y1="20" x2="38" y2="20" stroke="currentColor" stroke-width="1" opacity="0.35"/>
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
/* ── Outer shell ── */
.header {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    position: relative;
    z-index: 100;
}

/* ── Level 1: System shell bar ── */
.shell-bar {
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0 0 20px;
    background: linear-gradient(180deg, rgba(10,15,24,0.98) 0%, rgba(6,10,16,0.96) 100%);
    box-shadow: inset 0 1px 0 rgba(0,229,255,0.12);
    -webkit-app-region: drag;
    flex-shrink: 0;

    &::after {
        content: '';
        position: absolute;
        top: 48px;
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
    gap: 12px;
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
        width: 44px;
        height: 44px;
        background: radial-gradient(circle, rgba(0,229,255,0.10), transparent 70%);
        border-radius: 50%;
        pointer-events: none;
    }

    &:hover { opacity: 0.75; }
}

.logo-icon {
    filter: drop-shadow(0 0 7px rgba(0,229,255,0.28));
    flex-shrink: 0;
}

.logo-spin {
    transform-origin: 20px 20px;
    animation: logo-spin 22s linear infinite;
}

@keyframes logo-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
}

.brand-name {
    font-size: 1.35rem;
    font-weight: 700;
    letter-spacing: 0.22em;
    color: var(--text);
    text-transform: uppercase;
    line-height: 1;
    padding-right: 0.08em;
}

/* ── Level 2: Navigation bar ── */
.nav-bar {
    height: 44px;
    display: flex;
    align-items: center;
    gap: 28px;
    padding: 0 20px;
    background: linear-gradient(180deg, rgba(7,10,17,0.97) 0%, rgba(5,8,14,0.96) 100%);
    position: relative;
    flex-shrink: 0;

    &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent 0%, rgba(0,229,255,0.22) 25%, rgba(0,229,255,0.22) 75%, transparent 100%);
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
    color: rgba(255,255,255,0.55);
    font-family: var(--font);
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    cursor: pointer;
    transition: color 140ms ease, opacity 140ms ease;
    white-space: nowrap;

    &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: var(--accent);
        box-shadow: 0 0 10px rgba(0,229,255,0.35);
        opacity: 0;
        transition: opacity 140ms ease;
    }

    &:hover {
        color: rgba(255,255,255,0.9);
    }

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
    width: 35%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0,229,255,0.5), transparent);
    animation: scan-sweep 8s linear infinite;
    pointer-events: none;
}

@keyframes scan-sweep {
    from { left: -35%; }
    to   { left: 110%; }
}
</style>
