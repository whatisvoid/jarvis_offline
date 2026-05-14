<script lang="ts">
    import { goto } from "@roxi/routify"
    import { invoke } from "@tauri-apps/api/core"
    import { onMount } from "svelte"
    import { translations, translate } from "@/stores"

    let appVersion = ""

    onMount(async () => {
        try {
            appVersion = await invoke<string>("get_app_version")
        } catch {
            // ignore
        }
    })

    $: t = (key: string) => translate($translations, key)
</script>

<header id="header" class="header">
    <div class="header-left">
        <div class="logo">
            <a href="/" title="JARVIS">
                <img src="/media/128x128.png" alt="Jarvis Logo" />
            </a>
            <div class="logo-text">
                <span class="logo-title"><a href="/" id="jarvis-logo">&nbsp;</a></span>
                <span class="logo-version"><small>v</small>{appVersion} <span class="v-badge">BETA</span></span>
            </div>
        </div>
    </div>

    <div class="header-right">
        <button class="header-btn" on:click={() => $goto('/commands')}>
            <span class="btn-text">{t('header-commands')}</span>
        </button>

        <button class="header-btn" on:click={() => $goto('/settings')}>
            <span class="btn-text">{t('header-settings')}</span>
        </button>
    </div>
</header>
