<script lang="ts">
    import { onMount } from "svelte"
    import { invoke } from "@tauri-apps/api/core"
    import { goto } from "@roxi/routify"
    import { showInExplorer } from "@/functions"
    import { appInfo, assistantVoice, currentLanguage, setLanguage, translations, translate } from "@/stores"

    import { Notification } from "@svelteuidev/core"
    import { Check } from "radix-icons-svelte"
    import Select from "@/components/ui/Select.svelte"

    $: t = (key: string) => translate($translations, key)

    let activeTab = "general"

    interface VoiceMeta {
        id: string
        name: string
        author: string
        languages: string[]
    }

    interface VoiceConfig {
        voice: VoiceMeta
    }

    let availableVoices: VoiceMeta[] = []

    interface MicrophoneOption {
        label: string
        value: string
    }

    let availableMicrophones: MicrophoneOption[] = []
    let availableVoskModels: { label: string; value: string }[] = []
    let availableGlinerModels: { label: string; value: string }[] = []
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
    let availableOllamaModels: { label: string; value: string }[] = []
    let ollamaLoading = false
    let ollamaError = ""
    let ollamaModelsLoaded = false

    const languages = [
        { code: "ru", name: "Русский" },
        { code: "en", name: "English" },
        { code: "ua", name: "Українська" },
    ]

    $: selectedVoiceMeta = availableVoices.find(v => v.id === voiceVal)

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

    assistantVoice.subscribe(value => {
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
    appInfo.subscribe(info => {
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
                invoke("db_write", { key: "assistant_voice", val: voiceVal }),
                invoke("db_write", { key: "selected_microphone", val: selectedMicrophone }),
                invoke("db_write", { key: "selected_wake_word_engine", val: selectedWakeWordEngine }),
                invoke("db_write", { key: "selected_intent_recognition_engine", val: selectedIntentRecognitionEngine }),
                invoke("db_write", { key: "selected_slot_extraction_engine", val: selectedSlotExtractionEngine }),
                invoke("db_write", { key: "selected_gliner_model", val: selectedGlinerModel }),
                invoke("db_write", { key: "selected_vosk_model", val: selectedVoskModel }),
                invoke("db_write", { key: "noise_suppression", val: selectedNoiseSuppression }),
                invoke("db_write", { key: "vad", val: selectedVad }),
                invoke("db_write", { key: "gain_normalizer", val: gainNormalizerEnabled.toString() }),
                invoke("db_write", { key: "api_key__picovoice", val: apiKeyPicovoice }),
                invoke("db_write", { key: "ollama_url", val: ollamaUrl }),
                invoke("db_write", { key: "ollama_model", val: ollamaModel })
            ])

            assistantVoice.set(voiceVal)
            settingsSaved = true
            setTimeout(() => { settingsSaved = false }, 5000)
        } catch (err) {
            console.error("failed to save settings:", err)
            saveError = true
            setTimeout(() => { saveError = false }, 5000)
        }

        setTimeout(() => { saveButtonDisabled = false }, 1000)
    }

    onMount(async () => {
        try {
            authorName = await invoke<string>("get_author_name")
            appVersion = await invoke<string>("get_app_version")
        } catch (err) {
            console.error("failed to get author name:", err)
        }

        try {
            const voices = await invoke<VoiceConfig[]>("list_voices")
            availableVoices = voices.map(v => v.voice)
        } catch (err) {
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

            const [mic, wakeWord, intentReco, slotEngine, glinerModel, voskModel,
                   noiseSuppression, vad, gainNormalizer, pico, savedOllamaUrl, savedOllamaModel] = await Promise.all([
                invoke<string>("db_read", { key: "selected_microphone" }),
                invoke<string>("db_read", { key: "selected_wake_word_engine" }),
                invoke<string>("db_read", { key: "selected_intent_recognition_engine" }),
                invoke<string>("db_read", { key: "selected_slot_extraction_engine" }),
                invoke<string>("db_read", { key: "selected_gliner_model" }),
                invoke<string>("db_read", { key: "selected_vosk_model" }),
                invoke<string>("db_read", { key: "noise_suppression" }),
                invoke<string>("db_read", { key: "vad" }),
                invoke<string>("db_read", { key: "gain_normalizer" }),
                invoke<string>("db_read", { key: "api_key__picovoice" }),
                invoke<string>("db_read", { key: "ollama_url" }),
                invoke<string>("db_read", { key: "ollama_model" })
            ])

            selectedMicrophone = mic
            selectedWakeWordEngine = wakeWord
            selectedIntentRecognitionEngine = intentReco
            selectedSlotExtractionEngine = slotEngine
            selectedVoskModel = voskModel
            selectedGlinerModel = glinerModel
            selectedNoiseSuppression = noiseSuppression
            selectedVad = vad
            gainNormalizerEnabled = gainNormalizer === "true"
            apiKeyPicovoice = pico
            if (savedOllamaUrl) ollamaUrl = savedOllamaUrl
            ollamaModel = savedOllamaModel
        } catch (err) {
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

        <!-- ===== GENERAL ===== -->
        {#if activeTab === 'general'}

            <div class="settings-section">
                <span class="section-label">{t('settings-language')}</span>
                <Select
                    data={languages.map(l => ({ value: l.code, label: l.name }))}
                    value={$currentLanguage || "ru"}
                    on:change={(e) => selectLanguage(e.detail)}
                />
            </div>

            <div class="settings-section">
                <span class="section-label">{t('settings-voice')}</span>
                <p class="section-desc">{t('settings-voice-desc')}</p>
                {#if availableVoices.length > 0}
                    <Select
                        data={availableVoices.map(v => ({ value: v.id, label: v.name }))}
                        bind:value={voiceVal}
                        on:change={(e) => invoke("preview_voice", { voiceId: e.detail }).catch(err => console.error("Failed to preview voice:", err))}
                    />
                    {#if selectedVoiceMeta}
                        <div class="voice-meta">
                            {#if selectedVoiceMeta.author}
                                <span class="voice-meta-author">by {selectedVoiceMeta.author}</span>
                            {/if}
                            {#if selectedVoiceMeta.languages.length > 0}
                                <span class="voice-meta-langs">{selectedVoiceMeta.languages.map(l => l.toUpperCase()).join(' · ')}</span>
                            {/if}
                        </div>
                    {/if}
                {:else}
                    <p class="empty-hint">{t('settings-no-voices')}</p>
                {/if}
            </div>

        <!-- ===== DEVICES ===== -->
        {:else if activeTab === 'devices'}

            <div class="settings-section">
                <span class="section-label">{t('settings-microphone')}</span>
                <p class="section-desc">{t('settings-microphone-desc')}</p>
                <Select
                    data={availableMicrophones}
                    bind:value={selectedMicrophone}
                />
            </div>

        <!-- ===== NEURAL ===== -->
        {:else if activeTab === 'neural'}

            <div class="settings-section">
                <span class="section-label">{t('settings-wake-word-engine')}</span>
                <p class="section-desc">{t('settings-wake-word-desc')}</p>
                <Select
                    data={[
                        { label: "Rustpotter", value: "Rustpotter" },
                        { label: "Vosk", value: "Vosk" },
                        { label: "Picovoice Porcupine", value: "Picovoice" }
                    ]}
                    bind:value={selectedWakeWordEngine}
                />
                {#if selectedWakeWordEngine === "Picovoice"}
                    <div class="warn-panel">
                        <p class="warn-panel-text">{t('settings-picovoice-warning')}</p>
                        <p class="warn-panel-text">{t('settings-picovoice-key-desc')} <a href="https://console.picovoice.ai/" target="_blank" class="warn-link">Picovoice Console</a>.</p>
                        <input
                            class="field-input"
                            style="margin-top: 10px; width: 100%;"
                            placeholder={t('settings-picovoice-key')}
                            autocomplete="off"
                            bind:value={apiKeyPicovoice}
                        />
                    </div>
                {/if}
            </div>

            <div class="settings-section">
                <span class="section-label">{t('settings-vosk-model')}</span>
                <p class="section-desc">{t('settings-vosk-model-desc')}</p>
                <Select
                    data={[{ label: t('settings-auto-detect'), value: "" }, ...availableVoskModels]}
                    bind:value={selectedVoskModel}
                />
                {#if availableVoskModels.length === 0}
                    <p class="info-hint">{t('settings-models-hint')}</p>
                {/if}
            </div>

            <div class="settings-section">
                <span class="section-label">{t('settings-intent-engine')}</span>
                <p class="section-desc">{t('settings-intent-engine-desc')}</p>
                <Select
                    data={[
                        { label: "Intent Classifier", value: "IntentClassifier" },
                        { label: "Embedding Classifier", value: "EmbeddingClassifier" }
                    ]}
                    bind:value={selectedIntentRecognitionEngine}
                />
            </div>

            <div class="settings-section">
                <span class="section-label">{t('settings-slot-engine')}</span>
                <p class="section-desc">{t('settings-slot-engine-desc')}</p>
                <Select
                    data={[
                        { label: t('settings-disabled'), value: "None" },
                        { label: "GLiNER (NER)", value: "GLiNER" }
                    ]}
                    bind:value={selectedSlotExtractionEngine}
                />
                {#if selectedSlotExtractionEngine === "GLiNER"}
                    <div class="sub-field">
                        <span class="field-label">{t('settings-gliner-model')}</span>
                        <p class="field-desc">{t('settings-gliner-model-desc')}</p>
                        <Select
                            data={[{ label: t('settings-auto-detect'), value: "" }, ...availableGlinerModels]}
                            bind:value={selectedGlinerModel}
                        />
                        {#if availableGlinerModels.length === 0}
                            <p class="info-hint">{t('settings-gliner-models-hint')}</p>
                        {/if}
                    </div>
                {/if}
            </div>

            <div class="settings-section">
                <span class="section-label">{t('settings-noise-suppression')}</span>
                <p class="section-desc">{t('settings-noise-suppression-desc')}</p>
                <Select
                    data={[
                        { label: t('settings-disabled'), value: "None" },
                        { label: "Nnnoiseless", value: "Nnnoiseless" }
                    ]}
                    bind:value={selectedNoiseSuppression}
                />
            </div>

            <div class="settings-section">
                <span class="section-label">{t('settings-vad')}</span>
                <p class="section-desc">{t('settings-vad-desc')}</p>
                <Select
                    data={[
                        { label: t('settings-disabled'), value: "None" },
                        { label: "Energy", value: "Energy" },
                        { label: "Nnnoiseless", value: "Nnnoiseless" }
                    ]}
                    bind:value={selectedVad}
                />
            </div>

            <div class="settings-section">
                <span class="section-label">{t('settings-gain-normalizer')}</span>
                <p class="section-desc">{t('settings-gain-normalizer-desc')}</p>
                <div class="toggle-row">
                    <button
                        type="button"
                        class="toggle-btn"
                        class:on={gainNormalizerEnabled}
                        on:click={() => gainNormalizerEnabled = !gainNormalizerEnabled}
                        aria-pressed={gainNormalizerEnabled}
                    >
                        <span class="toggle-thumb"></span>
                    </button>
                    <span class="toggle-state">{gainNormalizerEnabled ? t('settings-enabled') : t('settings-disabled')}</span>
                </div>
            </div>

            <div class="settings-section">
                <span class="section-label">OLLAMA</span>
                <p class="section-desc">{t('settings-ollama-desc')}</p>
                <div class="ollama-url-row">
                    <input
                        id="ollama-url-input"
                        class="field-input"
                        placeholder="http://localhost:11434"
                        bind:value={ollamaUrl}
                    />
                    <button
                        class="btn-secondary btn-sm"
                        on:click={loadOllamaModels}
                        disabled={ollamaLoading}
                    >
                        {ollamaLoading ? '...' : t('settings-ollama-load-models')}
                    </button>
                </div>
                {#if ollamaError}
                    <p class="error-text">{ollamaError}</p>
                {/if}
                {#if availableOllamaModels.length > 0}
                    <div class="sub-field">
                        <Select
                            data={availableOllamaModels}
                            bind:value={ollamaModel}
                        />
                    </div>
                {:else if ollamaModelsLoaded}
                    <p class="info-hint">{t('settings-ollama-no-models')}</p>
                {/if}
            </div>

        <!-- ===== ABOUT ===== -->
        {:else if activeTab === 'about'}

            <div class="beta-panel">
                <div class="beta-panel-header">
                    <span class="beta-panel-dot"></span>
                    <span class="beta-panel-title">{t('settings-beta-title')}</span>
                </div>
                <p class="beta-panel-body">{t('settings-beta-desc')}</p>
                <p class="beta-panel-body">{t('settings-beta-feedback')} <a href={feedbackLink} target="_blank" class="beta-panel-link">{t('settings-beta-bot')}</a>.</p>
                <button class="btn-secondary btn-sm btn-logs" on:click={() => showInExplorer(logFilePath)}>
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
                    {#if $currentLanguage === "ru" || $currentLanguage === "ua"}
                        <a href={tgLink} target="_blank" class="link-row">
                            <span class="link-name">{t('footer-telegram')}</span>
                            <span class="link-arrow">→</span>
                        </a>
                    {/if}
                    <a href={repoLink} target="_blank" class="link-row">
                        <span class="link-name">{t('footer-github')}</span>
                        <span class="link-arrow">→</span>
                    </a>
                    {#if $currentLanguage === "ru"}
                        <a href={boostyLink} target="_blank" class="link-row">
                            <span class="link-name">Boosty</span>
                            <span class="link-arrow">→</span>
                        </a>
                    {:else if $currentLanguage === "ua" || $currentLanguage === "en"}
                        <a href={patreonLink} target="_blank" class="link-row">
                            <span class="link-name">Patreon</span>
                            <span class="link-arrow">→</span>
                        </a>
                    {/if}
                </div>
            </div>

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

/* ===== SECTION PANEL ===== */
.settings-section {
    padding: 18px;
    border-radius: 10px;
    background: linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.012));
    border: 1px solid rgba(255,255,255,0.055);
    margin-bottom: 8px;
}

/* ===== SECTION TITLE ===== */
.section-label {
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

.section-desc {
    font-size: 0.7rem;
    color: var(--text-muted);
    opacity: 0.7;
    margin: -6px 0 12px 12px;
    line-height: 1.5;
    white-space: pre-line;
}

/* ===== VOICE META ===== */
.voice-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 8px;
    padding-left: 2px;
}

.voice-meta-author {
    font-size: 0.68rem;
    color: var(--text-muted);
    opacity: 0.7;
}

.voice-meta-langs {
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    color: rgba(0,229,255,0.45);
    font-family: var(--font-mono);
}

/* ===== SUB-FIELDS (nested within a section) ===== */
.sub-field {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid rgba(255,255,255,0.04);
}

.field-label {
    display: block;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-sub);
    margin-bottom: 4px;
    opacity: 0.8;
}

.field-desc {
    display: block;
    font-size: 0.67rem;
    color: var(--text-muted);
    opacity: 0.65;
    margin-bottom: 8px;
    line-height: 1.4;
}

/* ===== HINT / ERROR TEXT ===== */
.empty-hint,
.info-hint {
    font-size: 0.72rem;
    color: var(--text-muted);
    font-style: italic;
    padding: 8px 0 0;
    opacity: 0.65;
}

.error-text {
    font-size: 0.72rem;
    color: rgba(255,80,80,0.85);
    padding: 6px 0 0;
}

/* ===== WARN PANEL (picovoice) ===== */
.warn-panel {
    margin-top: 12px;
    padding: 14px;
    border-radius: 8px;
    background: rgba(255,190,90,0.04);
    border: 1px solid rgba(255,190,90,0.14);
}

.warn-panel-text {
    font-size: 0.72rem;
    color: rgba(255,190,90,0.82);
    line-height: 1.5;
    margin: 0 0 4px;
}

.warn-link {
    color: rgba(255,190,90,0.9);
    text-decoration: underline;
    text-underline-offset: 2px;
}

/* ===== TOGGLE ===== */
.toggle-row {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    margin-top: 2px;
}

.toggle-state {
    font-size: 13px;
    color: rgba(210,230,245,0.78);
}

.toggle-btn {
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

.toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: rgba(255,255,255,0.4);
    transition: transform 200ms ease, background 200ms ease;

    .on & {
        transform: translateX(16px);
        background: #00e5ff;
    }
}

/* ===== OLLAMA URL ROW ===== */
.ollama-url-row {
    display: flex;
    gap: 8px;
    align-items: center;
}

/* ===== FIELD INPUT ===== */
.field-input {
    flex: 1;
    height: 40px;
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: var(--r-md);
    color: rgba(230,245,255,0.92);
    font-family: var(--font);
    font-size: 0.82rem;
    padding: 0 14px;
    transition: var(--ease);
    outline: none;

    &::placeholder { color: var(--text-muted); opacity: 0.5; }
    &:focus {
        border-color: rgba(0,229,255,0.42);
        background: rgba(0,229,255,0.02);
        box-shadow: 0 0 14px rgba(0,229,255,0.06);
    }
}

/* ===== BETA PANEL ===== */
.beta-panel {
    padding: 12px;
    border-radius: 10px;
    background: rgba(255,190,90,0.032);
    border: 1px solid rgba(255,190,90,0.10);
    margin-bottom: 8px;
}

.beta-panel-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
}

.beta-panel-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(255,190,90,0.9);
    box-shadow: 0 0 6px rgba(255,190,90,0.5);
    flex-shrink: 0;
}

.beta-panel-title {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: rgba(255,190,90,0.92);
}

.beta-panel-body {
    font-size: 0.72rem;
    color: rgba(255,190,90,0.7);
    line-height: 1.45;
    margin: 0 0 3px;
}

.btn-logs {
    margin-top: 8px;
}

.beta-panel-link {
    color: rgba(255,190,90,0.9);
    text-decoration: underline;
    text-underline-offset: 2px;
}

/* ===== ABOUT CARD ===== */
.about-section {
    padding: 14px 16px;
}

.about-card {
    display: flex;
    flex-direction: column;
    gap: 3px;
}

.about-version-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: nowrap;
}

.about-card-name {
    font-size: 1rem;
    font-weight: 800;
    letter-spacing: 0.18em;
    color: rgba(255,255,255,0.82);
    font-family: var(--font-mono);
}

.about-card-ver {
    font-size: 0.75rem;
    font-family: var(--font-mono);
    color: rgba(0,229,255,0.6);
}

.ver-badge {
    font-size: 0.56rem;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: rgba(0,229,255,0.55);
    border: 1px solid rgba(0,229,255,0.28);
    border-radius: var(--r-sm);
    padding: 1px 5px;
}

.about-card-copy {
    font-size: 0.68rem;
    color: var(--text-muted);
    opacity: 0.55;
    margin: 4px 0 0;
}

/* ===== LINKS ===== */
.link-rows {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.link-row {
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

    &:hover {
        background: rgba(0,229,255,0.04);
        border-color: rgba(0,229,255,0.14);

        .link-arrow { color: var(--accent); opacity: 1; }
        .link-name { color: rgba(255,255,255,0.82); }
    }
}

.link-name {
    font-size: 0.78rem;
    color: rgba(255,255,255,0.55);
    transition: color 140ms ease;
}

.link-arrow {
    font-size: 0.85rem;
    color: rgba(255,255,255,0.2);
    opacity: 0.6;
    transition: color 140ms ease, opacity 140ms ease;
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

.btn-secondary {
    height: 36px;
    padding: 0 14px;
    background: transparent;
    border: 1px solid rgba(255,255,255,0.08);
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

.btn-sm { height: 30px; font-size: 0.65rem; padding: 0 10px; }
</style>
