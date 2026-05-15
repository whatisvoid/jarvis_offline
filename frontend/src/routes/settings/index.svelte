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
    import Button from "@/components/ui/Button.svelte"

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
        <Button variant="primary" on:click={saveSettings} disabled={saveButtonDisabled}>
            {t('settings-save')}
        </Button>
        <Button variant="ghost" on:click={() => $goto("/")}>
            {t('settings-back')}
        </Button>
    </div>
</div>

<style lang="scss">
.settings-layout {
    display: flex;
    flex-direction: column;
    gap: 0;
    padding-top: 16px;
    height: calc(100vh - var(--header-h));
    overflow: hidden;
}

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
        background: rgba(var(--accent-rgb),0.035);
        color: rgba(255,255,255,0.65);
    }

    &.active {
        background: rgba(var(--accent-rgb),0.06);
        border-right-color: rgba(var(--accent-rgb),0.12);
        color: var(--accent);
        box-shadow: 0 0 12px rgba(var(--accent-rgb),0.05);
    }
}

.settings-content {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding-right: 12px;
    padding-bottom: 8px;
}

.settings-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 18px 0 24px;
    flex-shrink: 0;
    border-top: 1px solid rgba(255,255,255,0.05);

    & > :global(*) { width: 100%; }
}
</style>