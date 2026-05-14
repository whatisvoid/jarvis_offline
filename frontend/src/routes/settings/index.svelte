<script lang="ts">
    import { onMount } from "svelte"
    import { invoke } from "@tauri-apps/api/core"
    import { goto } from "@roxi/routify"
    import { setTimeout } from "worker-timers"

    import { showInExplorer } from "@/functions"
    import { appInfo, assistantVoice, currentLanguage, setLanguage, translations, translate } from "@/stores"

    import {
        Notification,
        Text,
        Space,
        Alert,
        Input,
        InputWrapper,
        NativeSelect,
        Switch
    } from "@svelteuidev/core"

    import {
        Check,
        Code,
        QuestionMarkCircled,
        CrossCircled
    } from "radix-icons-svelte"

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

    async function selectVoice(voiceId: string) {
        voiceVal = voiceId
        try {
            await invoke("preview_voice", { voiceId })
        } catch (err) {
            console.error("Failed to preview voice:", err)
        }
    }

    interface MicrophoneOption {
        label: string
        value: string
    }

    let availableMicrophones: MicrophoneOption[] = []
    let availableVoskModels: { label: string; value: string }[] = []
    let availableGlinerModels: { label: string; value: string }[] = []
    let settingsSaved = false
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
        { code: "ru", label: "RU", flag: "🇷🇺", name: "Русский" },
        { code: "en", label: "EN", flag: "🇬🇧", name: "English" },
        { code: "ua", label: "UA", flag: "🇺🇦", name: "Українська" },
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
        } catch (err: any) {
            ollamaError = err?.toString() ?? t('settings-ollama-error')
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
    <Space h="sm" />
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
            <div class="settings-section">
                <span class="section-label">{t('settings-language')}</span>
                <div class="lang-options">
                    {#each languages as lang}
                        <button
                            type="button"
                            class="lang-option"
                            class:selected={lang.code === $currentLanguage}
                            on:click={() => selectLanguage(lang.code)}
                        >
                            <img src="/media/flags/{lang.label}.png" width="20" alt={lang.flag} />
                            <span>{lang.name}</span>
                        </button>
                    {/each}
                </div>
            </div>

            <div class="section-divider"></div>

            <div class="settings-section">
                <span class="section-label">{t('settings-voice')}</span>
                <p class="section-desc">{t('settings-voice-desc')}</p>
                <div class="voice-list">
                    {#each availableVoices as voice}
                        <button
                            type="button"
                            class="voice-item"
                            class:selected={voiceVal === voice.id}
                            on:click={() => selectVoice(voice.id)}
                        >
                            <div class="voice-info">
                                <span class="voice-name">{voice.name}</span>
                                {#if voice.author}
                                    <span class="voice-author">by {voice.author}</span>
                                {/if}
                            </div>
                            <div class="voice-langs">
                                {#each voice.languages as l}
                                    <img src="/media/flags/{l.toUpperCase()}.png" alt={l} width="18" title={l} />
                                {/each}
                            </div>
                        </button>
                    {/each}
                    {#if availableVoices.length === 0}
                        <p class="empty-hint">{t('settings-no-voices')}</p>
                    {/if}
                </div>
            </div>

        {:else if activeTab === 'devices'}
            <div class="settings-section">
                <NativeSelect
                    data={availableMicrophones}
                    label={t('settings-microphone')}
                    description={t('settings-microphone-desc')}
                    variant="filled"
                    bind:value={selectedMicrophone}
                />
            </div>

        {:else if activeTab === 'neural'}
            <div class="settings-section">
                <NativeSelect
                    data={[
                        { label: "Rustpotter", value: "Rustpotter" },
                        { label: "Vosk", value: "Vosk" },
                        { label: "Picovoice Porcupine", value: "Picovoice" }
                    ]}
                    label={t('settings-wake-word-engine')}
                    description={t('settings-wake-word-desc')}
                    variant="filled"
                    bind:value={selectedWakeWordEngine}
                />

                {#if selectedWakeWordEngine === "picovoice"}
                    <Space h="sm" />
                    <Alert title={t('settings-attention')} color="#868E96" variant="outline">
                        <Notification
                            title={t('settings-picovoice-warning')}
                            icon={CrossCircled}
                            color="orange"
                            withCloseButton={false}
                        >
                            {t('settings-picovoice-waiting')}
                        </Notification>
                        <Space h="sm" />
                        <Text size="sm" color="gray">
                            {t('settings-picovoice-key-desc')}
                            <a href="https://console.picovoice.ai/" target="_blank">Picovoice Console</a>.
                        </Text>
                        <Space h="sm" />
                        <Input
                            icon={Code}
                            placeholder={t('settings-picovoice-key')}
                            variant="filled"
                            autocomplete="off"
                            bind:value={apiKeyPicovoice}
                        />
                    </Alert>
                {/if}

                <div class="field-gap"></div>
                {#key availableVoskModels}
                <NativeSelect
                    data={[{ label: t('settings-auto-detect'), value: "" }, ...availableVoskModels]}
                    label={t('settings-vosk-model')}
                    description={t('settings-vosk-model-desc')}
                    variant="filled"
                    bind:value={selectedVoskModel}
                />
                {/key}

                {#if availableVoskModels.length === 0}
                    <Space h="sm" />
                    <Alert title={t('settings-models-not-found')} color="orange" variant="outline">
                        <Text size="sm" color="gray">{t('settings-models-hint')}</Text>
                    </Alert>
                {/if}

                <div class="field-gap"></div>
                <NativeSelect
                    data={[
                        { label: "Intent Classifier", value: "IntentClassifier" },
                        { label: "Embedding Classifier", value: "EmbeddingClassifier" }
                    ]}
                    label={t('settings-intent-engine')}
                    description={t('settings-intent-engine-desc')}
                    variant="filled"
                    bind:value={selectedIntentRecognitionEngine}
                />

                <div class="field-gap"></div>
                <NativeSelect
                    data={[
                        { label: t('settings-disabled'), value: "None" },
                        { label: "GLiNER (NER)", value: "GLiNER" }
                    ]}
                    label={t('settings-slot-engine')}
                    description={t('settings-slot-engine-desc')}
                    variant="filled"
                    bind:value={selectedSlotExtractionEngine}
                />

                {#if selectedSlotExtractionEngine === "GLiNER"}
                    <Space h="sm" />
                    {#key availableGlinerModels}
                    <NativeSelect
                        data={[{ label: t('settings-auto-detect'), value: "" }, ...availableGlinerModels]}
                        label={t('settings-gliner-model')}
                        description={t('settings-gliner-model-desc')}
                        variant="filled"
                        bind:value={selectedGlinerModel}
                    />
                    {/key}
                    {#if availableGlinerModels.length === 0}
                        <Space h="sm" />
                        <Alert title={t('settings-models-not-found')} color="orange" variant="outline">
                            <Text size="sm" color="gray">{t('settings-gliner-models-hint')}</Text>
                        </Alert>
                    {/if}
                {/if}

                <div class="field-gap"></div>
                <NativeSelect
                    data={[
                        { label: t('settings-disabled'), value: "None" },
                        { label: "Nnnoiseless", value: "Nnnoiseless" }
                    ]}
                    label={t('settings-noise-suppression')}
                    description={t('settings-noise-suppression-desc')}
                    variant="filled"
                    bind:value={selectedNoiseSuppression}
                />

                <Space h="md" />
                <NativeSelect
                    data={[
                        { label: t('settings-disabled'), value: "None" },
                        { label: "Energy", value: "Energy" },
                        { label: "Nnnoiseless", value: "Nnnoiseless" }
                    ]}
                    label={t('settings-vad')}
                    description={t('settings-vad-desc')}
                    variant="filled"
                    bind:value={selectedVad}
                />

                <Space h="md" />
                <InputWrapper label={t('settings-gain-normalizer')}>
                    <Text size="sm" color="gray">{t('settings-gain-normalizer-desc')}</Text>
                    <Space h="xs" />
                    <Switch
                        label={gainNormalizerEnabled ? t('settings-enabled') : t('settings-disabled')}
                        bind:checked={gainNormalizerEnabled}
                    />
                </InputWrapper>

                <div class="field-gap"></div>
                <div class="ollama-section">
                    <div class="ollama-header">
                        <span class="ollama-title">Ollama</span>
                        <span class="ollama-badge">LOCAL LLM</span>
                    </div>
                    <Text size="sm" color="gray">{t('settings-ollama-desc')}</Text>
                    <Space h="sm" />
                    <div class="ollama-field">
                        <label for="ollama-url-input" class="ollama-label">{t('settings-ollama-url')}</label>
                        <small class="ollama-desc">{t('settings-ollama-url-desc')}</small>
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
                    </div>

                    {#if ollamaError}
                        <Space h="xs" />
                        <Text size="sm" color="red">{ollamaError}</Text>
                    {/if}

                    {#if availableOllamaModels.length > 0}
                        <Space h="sm" />
                        {#key availableOllamaModels}
                        <NativeSelect
                            data={availableOllamaModels}
                            label={t('settings-ollama-model')}
                            description={t('settings-ollama-model-desc')}
                            variant="filled"
                            bind:value={ollamaModel}
                        />
                        {/key}
                    {:else if ollamaModelsLoaded}
                        <Space h="xs" />
                        <Alert title={t('settings-ollama-no-models')} color="orange" variant="outline" />
                    {/if}
                </div>
            </div>

        {:else if activeTab === 'about'}
            <div class="settings-section">
                <Notification
                    title={t('settings-beta-title')}
                    icon={QuestionMarkCircled}
                    color="blue"
                    withCloseButton={false}
                >
                    {t('settings-beta-desc')}<br />
                    {t('settings-beta-feedback')} <a href={feedbackLink} target="_blank">{t('settings-beta-bot')}</a>.
                    <Space h="sm" />
                    <button class="btn-secondary btn-sm" on:click={() => showInExplorer(logFilePath)}>
                        {t('settings-open-logs')}
                    </button>
                </Notification>

                <Space h="lg" />

                <div class="about-block">
                    <div class="about-version">
                        <span class="about-name">JARVIS</span>
                        <div class="about-version-row">
                            <span class="about-ver">v{appVersion}</span>
                            <span class="about-badge">BETA</span>
                        </div>
                    </div>

                    <p class="about-copyright">© 2026. {t('footer-author')}: <b>{authorName}</b></p>

                    <div class="about-links">
                        {#if $currentLanguage === "ru" || $currentLanguage === "ua"}
                        <a href={tgLink} target="_blank" class="about-link">
                            <img src="/media/icons/telegram.webp" alt="Telegram" width="16" />
                            <span>{t('footer-telegram')}</span>
                        </a>
                        {/if}
                        <a href={repoLink} target="_blank" class="about-link">
                            <img src="/media/icons/github-logo.png" alt="GitHub" width="16" />
                            <span>{t('footer-github')}</span>
                        </a>
                    </div>

                    <div class="about-support">
                        {#if $currentLanguage === "ru"}
                        <p>{t('footer-support')} <a href={boostyLink} target="_blank" class="about-link about-link--inline">
                            <img src="/media/icons/boosty.webp" alt="Boosty" width="16" />
                            <span>Boosty</span>
                        </a>.</p>
                        {:else if $currentLanguage === "ua" || $currentLanguage === "en"}
                        <p>{t('footer-support')} <a href={patreonLink} target="_blank" class="about-link about-link--inline">
                            <img src="/media/icons/patreon.png" alt="Patreon" width="16" />
                            <span>Patreon</span>
                        </a>.</p>
                        {/if}
                    </div>
                </div>
            </div>
        {/if}
    </div>
</div>

<div class="settings-actions">
    <button class="btn-save" on:click={saveSettings} disabled={saveButtonDisabled}>
        {t('settings-save')}
    </button>
    <button class="btn-back" on:click={() => $goto("/")}>
        {t('settings-back')}
    </button>
</div>

<style lang="scss">
/* ===== LAYOUT ===== */
.settings-layout {
    display: flex;
    flex-direction: column;
    gap: 0;
    padding-top: 16px;
    position: relative;

    &::before, &::after {
        content: '';
        position: absolute;
        width: 6px;
        height: 6px;
        border-color: rgba(0,229,255,0.3);
        border-style: solid;
        pointer-events: none;
    }

    &::before {
        top: 16px;
        left: 0;
        border-width: 1px 0 0 1px;
    }

    &::after {
        top: 16px;
        right: 0;
        border-width: 1px 1px 0 0;
    }
}

/* ===== TABS ===== */
.settings-nav {
    display: flex;
    flex-direction: row;
    flex-shrink: 0;
    height: 44px;
    border-radius: var(--r-lg);
    overflow: hidden;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.05);
    position: relative;
}

.nav-item {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    height: 100%;
    padding: 0 0.5rem;
    background: transparent;
    border: none;
    border-right: 1px solid rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.35);
    font-size: 0.64rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    cursor: pointer;
    transition: var(--ease);
    white-space: nowrap;

    &:last-child { border-right: none; }

    &:hover {
        background: rgba(255,255,255,0.03);
        color: rgba(255,255,255,0.65);
    }

    &.active {
        background: linear-gradient(180deg, rgba(0,229,255,0.10), rgba(0,229,255,0.03));
        border-right-color: rgba(0,229,255,0.12);
        color: var(--accent);
        box-shadow: 0 0 20px rgba(0,229,255,0.08);

        &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, transparent, var(--accent), transparent);
            opacity: 0.7;
        }
    }
}

/* ===== CONTENT AREA ===== */
.settings-content {
    flex: 1;
    overflow-y: auto;
    max-height: calc(100vh - 295px);
    padding-top: 4px;

    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-track { background: transparent; }
    &::-webkit-scrollbar-thumb {
        background: rgba(255,255,255,0.1);
        border-radius: 2px;
    }
}

.settings-section {
    padding: 16px;
    border-radius: 10px;
    background: linear-gradient(180deg, rgba(255,255,255,0.022), rgba(255,255,255,0.010));
    border: 1px solid rgba(255,255,255,0.04);
    margin-bottom: 8px;
}

.section-divider { display: none; }

.field-gap { height: 18px; }

/* ===== LABELS ===== */
.section-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--text-sub);
    margin-bottom: 12px;

    &::before {
        content: '';
        display: inline-block;
        width: 2px;
        height: 14px;
        background: var(--accent);
        border-radius: 1px;
        opacity: 0.75;
        flex-shrink: 0;
    }
}

.section-desc {
    font-size: 0.7rem;
    color: var(--text-muted);
    margin: -8px 0 12px 10px;
    line-height: 1.5;
    white-space: pre-line;
}

/* ===== LANGUAGE OPTIONS ===== */
.lang-options {
    display: flex;
    gap: 6px;
}

.lang-option {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: var(--bg-input);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    cursor: pointer;
    color: rgba(255,255,255,0.5);
    font-size: 0.78rem;
    font-weight: 500;
    transition: var(--ease);
    opacity: 0.55;

    img { border-radius: 2px; opacity: 0.6; transition: opacity 140ms ease; }

    &:hover {
        background: var(--bg-hover);
        border-color: var(--border-strong);
        color: var(--text);
        opacity: 1;
        img { opacity: 1; }
    }

    &.selected {
        background: rgba(0,229,255,0.12);
        border-color: rgba(0,229,255,0.38);
        color: var(--accent);
        box-shadow: 0 0 18px rgba(0,229,255,0.08);
        opacity: 1;
        img { opacity: 1; }
    }
}

/* ===== VOICE LIST ===== */
.voice-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 196px;
    overflow-y: auto;

    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-track { background: transparent; }
    &::-webkit-scrollbar-thumb {
        background: rgba(255,255,255,0.12);
        border-radius: 2px;
    }
}

.voice-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 56px;
    padding: 0 14px 0 12px;
    background: linear-gradient(90deg, rgba(0,229,255,0.03), rgba(255,255,255,0.01));
    border: none;
    border-left: 2px solid transparent;
    border-radius: var(--r-md);
    cursor: pointer;
    transition: var(--ease);
    text-align: left;
    width: 100%;

    &:hover {
        background: linear-gradient(90deg, rgba(0,229,255,0.06), rgba(255,255,255,0.02));
        border-left-color: rgba(0,229,255,0.25);
        transform: translateX(2px);
    }

    &.selected {
        background: linear-gradient(90deg, rgba(0,229,255,0.10), rgba(0,229,255,0.02));
        border-left-color: var(--accent);
    }
}

.voice-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.voice-name {
    font-size: 0.82rem;
    color: var(--text);
    font-weight: 500;
}

.voice-author {
    font-size: 0.68rem;
    color: var(--text-muted);
}

.voice-langs {
    display: flex;
    gap: 5px;
    img { opacity: 0.75; border-radius: 2px; }
}

.empty-hint {
    font-size: 0.78rem;
    color: var(--text-muted);
    font-style: italic;
    padding: 8px 0;
}

/* ===== OLLAMA SECTION ===== */
.ollama-section {
    border: 1px solid rgba(255,255,255,0.05);
    border-left: 2px solid rgba(0,229,255,0.2);
    border-radius: var(--r-md);
    padding: 14px 14px 14px 12px;
    background: rgba(255,255,255,0.015);
    margin-top: 4px;
}

.ollama-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
}

.ollama-title {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text);
}

.ollama-badge {
    font-size: 0.58rem;
    font-weight: 700;
    letter-spacing: 0.8px;
    color: var(--accent);
    border: 1px solid rgba(0,229,255,0.4);
    border-radius: var(--r-sm);
    padding: 1px 5px;
    opacity: 0.85;
    text-transform: uppercase;
}

.ollama-field { margin-bottom: 4px; }

.ollama-label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-sub);
    margin-bottom: 3px;
}

.ollama-desc {
    display: block;
    font-size: 0.68rem;
    color: var(--text-muted);
    margin-bottom: 8px;
    line-height: 1.4;
}

.ollama-url-row {
    display: flex;
    gap: 8px;
    align-items: center;
}

.field-input {
    flex: 1;
    height: 40px;
    background: var(--bg-input);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    color: var(--text);
    font-size: 0.82rem;
    padding: 0 12px;
    transition: var(--ease);

    &::placeholder { color: var(--text-muted); }
    &:focus { border-color: rgba(0,229,255,0.5); }
}

/* ===== ABOUT ===== */
.about-block {
    text-align: center;
    color: var(--text-muted);
    font-size: 0.82rem;
    line-height: 1.8;
}

.about-version {
    margin-bottom: 16px;
}

.about-name {
    display: block;
    font-size: 1.5rem;
    font-weight: 800;
    letter-spacing: 0.35em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.8);
    font-family: var(--font-mono);
    margin-bottom: 6px;
}

.about-version-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.about-ver {
    font-size: 0.88rem;
    font-family: var(--font-mono);
    color: rgba(0,229,255,0.65);
    letter-spacing: 1px;
}

.about-badge {
    font-size: 0.58rem;
    font-weight: 700;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    color: rgba(0,229,255,0.55);
    border: 1px solid rgba(0,229,255,0.3);
    border-radius: var(--r-sm);
    padding: 1px 5px;
}

.about-copyright {
    margin: 0 0 12px;
    color: var(--text-muted);
    b { color: rgba(255,255,255,0.5); }
}

.about-links {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
}

.about-support p { margin: 0; }

.about-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--text-muted);
    text-decoration: none;
    transition: var(--ease);

    img { opacity: 0.45; transition: opacity 140ms ease; margin-top: -2px; }

    span {
        color: #1a6b8a;
        border-bottom: 1px solid #1a6b8a;
        transition: color 140ms ease, border-color 140ms ease;
        font-size: 0.8rem;
    }

    &:hover {
        img { opacity: 1; }
        span { color: var(--accent); border-color: var(--accent); }
    }

    &--inline { vertical-align: middle; }
}

/* ===== BUTTONS ===== */
.settings-actions {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px 0 6px;
}

.btn-save {
    width: 100%;
    height: 44px;
    background: linear-gradient(180deg, rgba(0,229,255,0.16), rgba(0,180,255,0.08));
    border: 1px solid rgba(0,229,255,0.25);
    border-radius: var(--r-md);
    color: var(--accent);
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
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    cursor: pointer;
    transition: var(--ease);
    opacity: 0.55;

    &:hover {
        opacity: 1;
        border-color: var(--border-strong);
        color: rgba(255,255,255,0.6);
        background: rgba(255,255,255,0.03);
    }
}

.btn-secondary {
    height: 36px;
    padding: 0 14px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    color: rgba(255,255,255,0.5);
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    cursor: pointer;
    transition: var(--ease);
    white-space: nowrap;

    &:hover:not(:disabled) {
        border-color: var(--border-strong);
        color: rgba(255,255,255,0.75);
        background: var(--bg-hover);
    }

    &:disabled { opacity: 0.4; cursor: not-allowed; }
}

.btn-sm { height: 30px; font-size: 0.65rem; padding: 0 10px; }

/* ===== SVELTEUI NATIVE SELECT OVERRIDES ===== */
:global(.svelteui-NativeSelect-root),
:global(.svelteui-Input-wrapper) {
    width: 100% !important;
}

:global(.svelteui-InputWrapper-root) {
    width: 100% !important;
}

:global(.svelteui-InputWrapper-label) {
    font-family: var(--font) !important;
    font-size: 0.72rem !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.1em !important;
    color: var(--text-sub) !important;
    margin-bottom: 6px !important;
    line-height: 1.3 !important;
}

:global(.svelteui-InputWrapper-description) {
    font-family: var(--font) !important;
    font-size: 0.68rem !important;
    color: var(--text-muted) !important;
    margin-bottom: 8px !important;
    line-height: 1.45 !important;
    white-space: pre-line;
    opacity: 0.58;
}

:global(select.svelteui-Input-input) {
    font-family: var(--font) !important;
    height: 40px !important;
    background: rgba(255,255,255,0.03) !important;
    border: 1px solid rgba(255,255,255,0.08) !important;
    border-radius: var(--r-md) !important;
    color: var(--text) !important;
    font-size: 0.84rem !important;
    padding: 0 10px !important;
    transition: var(--ease) !important;
    cursor: pointer;

    &:focus {
        border-color: rgba(0,229,255,0.5) !important;
        background: rgba(255,255,255,0.04) !important;
    }
}

:global(.svelteui-Input-rightSection) {
    pointer-events: none;
    color: var(--text-muted) !important;
}
</style>
