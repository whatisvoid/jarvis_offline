<script lang="ts">
    import { onMount, onDestroy } from "svelte"
    import { invoke } from "@tauri-apps/api/core"
    import { goto } from "@roxi/routify"
    import { appInfo, assistantVoice, currentLanguage, setLanguage, translations, translate } from "@/stores"
    import { DB_KEYS } from "@/lib/db-keys"
    import type { VoiceMeta, VoiceConfig, SelectOption } from "@/types"

    import { Notification } from "@svelteuidev/core"
    import { Check } from "radix-icons-svelte"

    import TabGeneral from "@/components/settings/TabGeneral.svelte"
    import TabDevices from "@/components/settings/TabDevices.svelte"
    import TabNeural from "@/components/settings/TabNeural.svelte"
    import TabAbout from "@/components/settings/TabAbout.svelte"

    $: t = (key: string) => translate($translations, key)

    let activeTab = "general"

    let availableVoices: VoiceMeta[] = []
    let availableMicrophones: SelectOption[] = []
    let availableVoskModels: SelectOption[] = []
    let availableGlinerModels: SelectOption[] = []
    let settingsSaved = false
    let saveError = false
    let saveButtonDisabled = false

    let voiceVal = ""
    let selectedMicrophone = ""
    let selectedWakeWordEngine = ""
    let selectedIntentRecognitionEngine = ""
    let selectedSlotExtractionEngine = ""
    let selectedGlinerModel = ""
    let selectedVoskModel = ""
    let selectedNoiseSuppression = ""
    let selectedVad = ""
    let gainNormalizerEnabled = false
    let apiKeyPicovoice = ""
    let ollamaUrl = "http://localhost:11434"
    let ollamaModel = ""
    let availableOllamaModels: SelectOption[] = []
    let ollamaLoading = false
    let ollamaError = ""
    let ollamaModelsLoaded = false

    const languages = [
        { code: "ru", name: "Русский" },
        { code: "en", name: "English" },
        { code: "ua", name: "Українська" },
    ]

    async function selectLanguage(code: string) {
        await setLanguage(code)
    }

    async function loadOllamaModels() {
        ollamaLoading = true
        ollamaError = ""
        ollamaModelsLoaded = false
        try {
            const models = await invoke<string[]>("list_ollama_models", { url: ollamaUrl })
            availableOllamaModels = models.map(m => ({ label: m, value: m }))
            ollamaModelsLoaded = true
            if (models.length > 0 && !ollamaModel) {
                ollamaModel = models[0]
            }
        } catch (err: unknown) {
            ollamaError = err instanceof Error ? err.message : t('settings-ollama-error')
            availableOllamaModels = []
        } finally {
            ollamaLoading = false
        }
    }

    const unsubVoice = assistantVoice.subscribe(value => {
        voiceVal = value
    })

    let feedbackLink = ""
    let logFilePath = ""
    let tgLink = ""
    let repoLink = ""
    let boostyLink = ""
    let patreonLink = ""
    let authorName = ""
    let appVersion = ""
    const unsubAppInfo = appInfo.subscribe(info => {
        feedbackLink = info.feedbackLink
        logFilePath = info.logFilePath
        tgLink = info.tgOfficialLink
        repoLink = info.repositoryLink
        boostyLink = info.boostySupportLink
        patreonLink = info.patreonSupportLink
    })

    async function saveSettings() {
        saveButtonDisabled = true
        settingsSaved = false

        try {
            await Promise.all([
                invoke("db_write", { key: DB_KEYS.voice, val: voiceVal }),
                invoke("db_write", { key: DB_KEYS.microphone, val: selectedMicrophone }),
                invoke("db_write", { key: DB_KEYS.wakeWordEngine, val: selectedWakeWordEngine }),
                invoke("db_write", { key: DB_KEYS.intentEngine, val: selectedIntentRecognitionEngine }),
                invoke("db_write", { key: DB_KEYS.slotEngine, val: selectedSlotExtractionEngine }),
                invoke("db_write", { key: DB_KEYS.glinerModel, val: selectedGlinerModel }),
                invoke("db_write", { key: DB_KEYS.voskModel, val: selectedVoskModel }),
                invoke("db_write", { key: DB_KEYS.noiseSuppression, val: selectedNoiseSuppression }),
                invoke("db_write", { key: DB_KEYS.vad, val: selectedVad }),
                invoke("db_write", { key: DB_KEYS.gainNormalizer, val: gainNormalizerEnabled.toString() }),
                invoke("db_write", { key: DB_KEYS.picovoiceApiKey, val: apiKeyPicovoice }),
                invoke("db_write", { key: DB_KEYS.ollamaUrl, val: ollamaUrl }),
                invoke("db_write", { key: DB_KEYS.ollamaModel, val: ollamaModel })
            ])

            assistantVoice.set(voiceVal)
            settingsSaved = true
            setTimeout(() => { settingsSaved = false }, 5000)
        } catch (err: unknown) {
            console.error("failed to save settings:", err)
            saveError = true
            setTimeout(() => { saveError = false }, 5000)
        }

        setTimeout(() => { saveButtonDisabled = false }, 1000)
    }

    onDestroy(() => {
        unsubVoice()
        unsubAppInfo()
    })

    onMount(async () => {
        try {
            authorName = await invoke<string>("get_author_name")
            appVersion = await invoke<string>("get_app_version")
        } catch (err: unknown) {
            console.error("failed to get author name:", err)
        }

        try {
            const voices = await invoke<VoiceConfig[]>("list_voices")
            availableVoices = voices.map(v => v.voice)
        } catch (err: unknown) {
            console.error("Failed to load voices:", err)
            availableVoices = []
        }

        try {
            const mics = await invoke<string[]>("pv_get_audio_devices")
            availableMicrophones = [
                { label: t('settings-mic-default'), value: "-1" },
                ...mics.map((name, idx) => ({ label: name, value: String(idx) }))
            ]

            const languageNames: Record<string, string> = {
                us: 'English', ru: 'Русский', uk: 'Українська',
                de: 'German', fr: 'French', es: 'Spanish',
            }
            const voskModels = await invoke<{ name: string; language: string; size: string }[]>("list_vosk_models")
            availableVoskModels = voskModels.map(m => ({
                label: `${m.name} (${languageNames[m.language] ?? m.language}, ${m.size})`,
                value: m.name
            }))

            const glinerModels = await invoke<{ display_name: string; value: string }[]>("list_gliner_models")
            availableGlinerModels = glinerModels.map(m => ({ label: m.display_name, value: m.value }))

            const settled = await Promise.allSettled([
                invoke<string>("db_read", { key: DB_KEYS.microphone }),
                invoke<string>("db_read", { key: DB_KEYS.wakeWordEngine }),
                invoke<string>("db_read", { key: DB_KEYS.intentEngine }),
                invoke<string>("db_read", { key: DB_KEYS.slotEngine }),
                invoke<string>("db_read", { key: DB_KEYS.glinerModel }),
                invoke<string>("db_read", { key: DB_KEYS.voskModel }),
                invoke<string>("db_read", { key: DB_KEYS.noiseSuppression }),
                invoke<string>("db_read", { key: DB_KEYS.vad }),
                invoke<string>("db_read", { key: DB_KEYS.gainNormalizer }),
                invoke<string>("db_read", { key: DB_KEYS.picovoiceApiKey }),
                invoke<string>("db_read", { key: DB_KEYS.ollamaUrl }),
                invoke<string>("db_read", { key: DB_KEYS.ollamaModel })
            ])

            const val = (i: number): string => settled[i].status === 'fulfilled' ? (settled[i] as PromiseFulfilledResult<string>).value : ""

            selectedMicrophone               = val(0)
            selectedWakeWordEngine           = val(1)
            selectedIntentRecognitionEngine  = val(2)
            selectedSlotExtractionEngine     = val(3)
            selectedGlinerModel              = val(4)
            selectedVoskModel                = val(5)
            selectedNoiseSuppression         = val(6)
            selectedVad                      = val(7)
            gainNormalizerEnabled            = val(8) === "true"
            apiKeyPicovoice                  = val(9)
            if (val(10)) ollamaUrl           = val(10)
            ollamaModel                      = val(11)
        } catch (err: unknown) {
            console.error("failed to load settings:", err)
        }
    })
</script>

{#if settingsSaved}
    <Notification
        title={t('notification-saved')}
        icon={Check}
        color="teal"
        on:close={() => { settingsSaved = false }}
    />
{/if}
{#if saveError}
    <Notification
        title={t('notification-error')}
        color="red"
        on:close={() => { saveError = false }}
    />
{/if}

<div class="settings-layout">
    <nav class="settings-nav">
        <button class="nav-item" class:active={activeTab === 'general'} on:click={() => activeTab = 'general'}>
            {t('settings-general')}
        </button>
        <button class="nav-item" class:active={activeTab === 'devices'} on:click={() => activeTab = 'devices'}>
            {t('settings-devices')}
        </button>
        <button class="nav-item" class:active={activeTab === 'neural'} on:click={() => activeTab = 'neural'}>
            {t('settings-neural-networks')}
        </button>
        <button class="nav-item" class:active={activeTab === 'about'} on:click={() => activeTab = 'about'}>
            {t('settings-about')}
        </button>
    </nav>

    <div class="settings-content">
        {#if activeTab === 'general'}
            <TabGeneral
                {t}
                {languages}
                currentLanguage={$currentLanguage || "ru"}
                {availableVoices}
                bind:voiceVal
                on:languageChange={(e) => selectLanguage(e.detail)}
            />
        {:else if activeTab === 'devices'}
            <TabDevices
                {t}
                {availableMicrophones}
                bind:selectedMicrophone
            />
        {:else if activeTab === 'neural'}
            <TabNeural
                {t}
                bind:selectedWakeWordEngine
                bind:selectedIntentRecognitionEngine
                bind:selectedSlotExtractionEngine
                bind:selectedGlinerModel
                bind:selectedVoskModel
                bind:selectedNoiseSuppression
                bind:selectedVad
                bind:gainNormalizerEnabled
                bind:apiKeyPicovoice
                bind:ollamaUrl
                bind:ollamaModel
                {availableVoskModels}
                {availableGlinerModels}
                {availableOllamaModels}
                {ollamaLoading}
                {ollamaError}
                {ollamaModelsLoaded}
                on:loadOllama={loadOllamaModels}
            />
        {:else if activeTab === 'about'}
            <TabAbout
                {t}
                {appVersion}
                {authorName}
                {feedbackLink}
                {logFilePath}
                {tgLink}
                {repoLink}
                {boostyLink}
                {patreonLink}
                currentLanguage={$currentLanguage || "en"}
            />
        {/if}
    </div>

    <div class="settings-actions">
        <button class="btn-save" on:click={saveSettings} disabled={saveButtonDisabled}>
            {t('settings-save')}
        </button>
        <button class="btn-back" on:click={() => $goto("/")}>
            {t('settings-back')}
        </button>
    </div>
</div>

<style lang="scss">
/* ===== LAYOUT ===== */
.settings-layout {
    display: flex;
    flex-direction: column;
    gap: 0;
    padding-top: 16px;
    height: calc(100vh - var(--header-h));
    overflow: hidden;
}

/* ===== TABS ===== */
.settings-nav {
    display: flex;
    flex-direction: row;
    flex-shrink: 0;
    height: 38px;
    border-radius: var(--r-lg);
    overflow: hidden;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.05);
    position: relative;
    margin-bottom: 12px;
}

.nav-item {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    height: 100%;
    padding: 0 16px;
    background: transparent;
    border: none;
    border-right: 1px solid rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.35);
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.10em;
    cursor: pointer;
    transition: var(--ease);
    white-space: nowrap;

    &:last-child { border-right: none; }

    &:hover {
        background: rgba(0,229,255,0.035);
        color: rgba(255,255,255,0.65);
    }

    &.active {
        background: rgba(0,229,255,0.06);
        border-right-color: rgba(0,229,255,0.12);
        color: var(--accent);
        box-shadow: 0 0 12px rgba(0,229,255,0.05);
    }
}

/* ===== CONTENT AREA ===== */
.settings-content {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding-right: 12px;
    padding-bottom: 8px;
}

/* ===== ACTIONS ===== */
.settings-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 18px 0 24px;
    flex-shrink: 0;
    border-top: 1px solid rgba(255,255,255,0.05);
    background: transparent;
}

.btn-save {
    width: 100%;
    height: 44px;
    background: linear-gradient(180deg, rgba(0,229,255,0.16), rgba(0,180,255,0.08));
    border: 1px solid rgba(0,229,255,0.25);
    border-radius: var(--r-md);
    color: var(--accent);
    font-family: var(--font);
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    cursor: pointer;
    transition: var(--ease);
    box-shadow: inset 0 0 20px rgba(0,229,255,0.08), 0 0 20px rgba(0,229,255,0.06);

    &:hover:not(:disabled) {
        background: linear-gradient(180deg, rgba(0,229,255,0.22), rgba(0,180,255,0.12));
        border-color: rgba(0,229,255,0.4);
        box-shadow: inset 0 0 24px rgba(0,229,255,0.12), 0 0 28px rgba(0,229,255,0.14);
        transform: translateY(-1px);
    }

    &:active:not(:disabled) { transform: scale(0.99); }

    &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
    }
}

.btn-back {
    width: 100%;
    height: 44px;
    background: transparent;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: var(--r-md);
    color: rgba(255,255,255,0.38);
    font-family: var(--font);
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    cursor: pointer;
    transition: var(--ease);
    opacity: 0.55;
    box-shadow: none;
    outline: none;

    &:hover {
        opacity: 1;
        border-color: rgba(255,255,255,0.08);
        color: rgba(255,255,255,0.55);
        background: rgba(255,255,255,0.025);
        box-shadow: none;
    }

    &::before, &::after { display: none; content: none; }
}

/* ===== GLOBAL STYLES FOR TAB CONTENT ===== */
:global(.settings-section) {
    padding: 18px;
    border-radius: 10px;
    background: linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.012));
    border: 1px solid rgba(255,255,255,0.055);
    margin-bottom: 8px;
}

:global(.section-label) {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--text-sub);
    margin-bottom: 12px;

    &::before {
        content: '';
        flex-shrink: 0;
        width: 2px;
        height: 16px;
        background: var(--accent);
        border-radius: 2px;
        box-shadow: 0 0 8px rgba(0,229,255,0.35);
    }
}

:global(.section-desc) {
    font-size: 0.7rem;
    color: var(--text-muted);
    opacity: 0.7;
    margin: -6px 0 12px 12px;
    line-height: 1.5;
    white-space: pre-line;
}

:global(.voice-meta) {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 8px;
    padding-left: 2px;
}

:global(.voice-meta-author) {
    font-size: 0.68rem;
    color: var(--text-muted);
    opacity: 0.7;
}

:global(.voice-meta-langs) {
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    color: rgba(0,229,255,0.45);
    font-family: var(--font-mono);
}

:global(.sub-field) {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid rgba(255,255,255,0.04);
}

:global(.field-label) {
    display: block;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-sub);
    margin-bottom: 4px;
    opacity: 0.8;
}

:global(.field-desc) {
    display: block;
    font-size: 0.67rem;
    color: var(--text-muted);
    opacity: 0.65;
    margin-bottom: 8px;
    line-height: 1.4;
}

:global(.empty-hint),
:global(.info-hint) {
    font-size: 0.72rem;
    color: var(--text-muted);
    font-style: italic;
    padding: 8px 0 0;
    opacity: 0.65;
}

:global(.error-text) {
    font-size: 0.72rem;
    color: rgba(255,80,80,0.85);
    padding: 6px 0 0;
}

:global(.warn-panel) {
    margin-top: 12px;
    padding: 14px;
    border-radius: 8px;
    background: rgba(255,190,90,0.04);
    border: 1px solid rgba(255,190,90,0.14);
}

:global(.warn-panel-text) {
    font-size: 0.72rem;
    color: rgba(255,190,90,0.82);
    line-height: 1.5;
    margin: 0 0 4px;
}

:global(.warn-link) {
    color: rgba(255,190,90,0.9);
    text-decoration: underline;
    text-underline-offset: 2px;
}

:global(.toggle-row) {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    margin-top: 2px;
}

:global(.toggle-state) {
    font-size: 13px;
    color: rgba(210,230,245,0.78);
}

:global(.toggle-btn) {
    position: relative;
    width: 38px;
    height: 22px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.06);
    cursor: pointer;
    transition: background 200ms ease, border-color 200ms ease;
    flex-shrink: 0;

    &.on {
        background: rgba(0,229,255,0.22);
        border-color: rgba(0,229,255,0.4);
    }
}

:global(.toggle-thumb) {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: rgba(255,255,255,0.4);
    transition: transform 200ms ease, background 200ms ease;
}

:global(.toggle-btn.on .toggle-thumb) {
    transform: translateX(16px);
    background: #00e5ff;
}

:global(.ollama-url-row) {
    display: flex;
    gap: 8px;
    align-items: center;
}

:global(.field-input) {
    flex: 1;
    height: 40px;
    background: rgba(255,255,255,0.025);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    color: rgba(230,245,255,0.92);
    font-family: var(--font);
    font-size: 0.82rem;
    padding: 0 14px;
    transition: var(--ease);
    outline: none;

    &::placeholder { color: var(--text-muted); opacity: 0.5; }
    &:focus {
        border-color: var(--border-focus);
        background: rgba(0,229,255,0.02);
        box-shadow: var(--glow-sm);
    }
}

:global(.picovoice-key-input) {
    margin-top: 10px;
    width: 100%;
}

:global(.btn-secondary) {
    height: 36px;
    padding: 0 14px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    color: rgba(255,255,255,0.5);
    font-family: var(--font);
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    cursor: pointer;
    transition: var(--ease);
    white-space: nowrap;

    &:hover:not(:disabled) {
        border-color: rgba(255,255,255,0.16);
        color: rgba(255,255,255,0.75);
        background: rgba(255,255,255,0.04);
    }

    &:disabled { opacity: 0.4; cursor: not-allowed; }
}

:global(.btn-sm) { height: 30px; font-size: 0.65rem; padding: 0 10px; }

:global(.beta-panel) {
    padding: 12px;
    border-radius: 10px;
    background: rgba(255,190,90,0.032);
    border: 1px solid rgba(255,190,90,0.10);
    margin-bottom: 8px;
}

:global(.beta-panel-header) {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
}

:global(.beta-panel-dot) {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(255,190,90,0.9);
    box-shadow: 0 0 6px rgba(255,190,90,0.5);
    flex-shrink: 0;
}

:global(.beta-panel-title) {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: rgba(255,190,90,0.92);
}

:global(.beta-panel-body) {
    font-size: 0.72rem;
    color: rgba(255,190,90,0.7);
    line-height: 1.45;
    margin: 0 0 3px;
}

:global(.btn-logs) {
    margin-top: 8px;
}

:global(.beta-panel-link) {
    color: rgba(255,190,90,0.9);
    text-decoration: underline;
    text-underline-offset: 2px;
}

:global(.about-section) {
    padding: 14px 16px;
}

:global(.about-card) {
    display: flex;
    flex-direction: column;
    gap: 3px;
}

:global(.about-version-row) {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: nowrap;
}

:global(.about-card-name) {
    font-size: 1rem;
    font-weight: 800;
    letter-spacing: 0.18em;
    color: rgba(255,255,255,0.82);
    font-family: var(--font-mono);
}

:global(.about-card-ver) {
    font-size: 0.75rem;
    font-family: var(--font-mono);
    color: rgba(0,229,255,0.6);
}

:global(.ver-badge) {
    font-size: 0.56rem;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: rgba(0,229,255,0.55);
    border: 1px solid rgba(0,229,255,0.28);
    border-radius: var(--r-sm);
    padding: 1px 5px;
}

:global(.about-card-copy) {
    font-size: 0.68rem;
    color: var(--text-muted);
    opacity: 0.55;
    margin: 4px 0 0;
}

:global(.link-rows) {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

:global(.link-row) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 34px;
    padding: 0 12px;
    border-radius: 8px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.04);
    text-decoration: none;
    transition: var(--ease);
}

:global(.link-row:hover) {
    background: rgba(0,229,255,0.04);
    border-color: rgba(0,229,255,0.14);
}

:global(.link-name) {
    font-size: 0.78rem;
    color: rgba(255,255,255,0.55);
    transition: color 140ms ease;
}

:global(.link-arrow) {
    font-size: 0.85rem;
    color: rgba(255,255,255,0.2);
    opacity: 0.6;
    transition: color 140ms ease, opacity 140ms ease;
}
</style>
