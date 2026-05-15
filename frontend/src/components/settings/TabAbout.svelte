<script lang="ts">
    import { showInExplorer } from "@/functions"

    export let t: (key: string) => string
    export let appVersion: string
    export let authorName: string
    export let feedbackLink: string
    export let logFilePath: string
    export let tgLink: string
    export let repoLink: string
    export let boostyLink: string
    export let patreonLink: string
    export let currentLanguage: string
</script>

<div class="beta-panel">
    <div class="beta-panel-header">
        <span class="beta-panel-dot"></span>
        <span class="beta-panel-title">{t('settings-beta-title')}</span>
    </div>
    <p class="beta-panel-body">{t('settings-beta-desc')}</p>
    <p class="beta-panel-body">{t('settings-beta-feedback')} <a href={feedbackLink} target="_blank" rel="noopener noreferrer" class="beta-panel-link">{t('settings-beta-bot')}</a>.</p>
    <button class="btn-secondary btn-sm btn-logs" disabled={!logFilePath} on:click={() => logFilePath && showInExplorer(logFilePath)}>
        {t('settings-open-logs')}
    </button>
</div>

<div class="settings-section about-section">
    <span class="section-label">{t('settings-about')}</span>
    <div class="about-card">
        <div class="about-version-row">
            <span class="about-card-name">JARVIS</span>
            <span class="about-card-ver">v{appVersion}</span>
            <span class="ver-badge">BETA</span>
        </div>
        <p class="about-card-copy">© 2026 · {authorName}</p>
    </div>
</div>

<div class="settings-section about-section">
    <span class="section-label">LINKS</span>
    <div class="link-rows">
        {#if currentLanguage === "ru" || currentLanguage === "ua"}
            <a href={tgLink} target="_blank" rel="noopener noreferrer" class="link-row">
                <span class="link-name">{t('footer-telegram')}</span>
                <span class="link-arrow">→</span>
            </a>
        {/if}
        <a href={repoLink} target="_blank" rel="noopener noreferrer" class="link-row">
            <span class="link-name">{t('footer-github')}</span>
            <span class="link-arrow">→</span>
        </a>
        {#if currentLanguage === "ru"}
            <a href={boostyLink} target="_blank" rel="noopener noreferrer" class="link-row">
                <span class="link-name">Boosty</span>
                <span class="link-arrow">→</span>
            </a>
        {:else if currentLanguage === "ua" || currentLanguage === "en"}
            <a href={patreonLink} target="_blank" rel="noopener noreferrer" class="link-row">
                <span class="link-name">Patreon</span>
                <span class="link-arrow">→</span>
            </a>
        {/if}
    </div>
</div>
