<script lang="ts">
    import { onMount } from "svelte"
    import { invoke } from "@tauri-apps/api/core"
    import { goto } from "@roxi/routify"
    import { setTimeout } from "worker-timers"

    import { showInExplorer } from "@/functions"
    import { appInfo, assistantVoice, currentLanguage, setLanguage, translations, translate } from "@/stores"

    import {
        Notification,
        Button,
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
        Mix,
        Cube,
        Code,
        Gear,
        InfoCircled,
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

<Space h="xl" />

{#if settingsSaved}
    <Notification
        title={t('notification-saved')}
        icon={Check}
        color="teal"
        on:close={() => { settingsSaved = false }}
    />
    <Space h="md" />
{/if}

<div class="settings-layout">
    <nav class="settings-nav">
        <button class="nav-item" class:active={activeTab === 'general'} on:click={() => activeTab = 'general'}>
            <svelte:component this={Gear} size={15} />
            <span>{t('settings-general')}</span>
        </button>
        <button class="nav-item" class:active={activeTab === 'devices'} on:click={() => activeTab = 'devices'}>
            <svelte:component this={Mix} size={15} />
            <span>{t('settings-devices')}</span>
        </button>
        <button class="nav-item" class:active={activeTab === 'neural'} on:click={() => activeTab = 'neural'}>
            <svelte:component this={Cube} size={15} />
            <span>{t('settings-neural-networks')}</span>
        </button>
        <button class="nav-item" class:active={activeTab === 'about'} on:click={() => activeTab = 'about'}>
            <svelte:component this={InfoCircled} size={15} />
            <span>{t('settings-about')}</span>
        </button>
    </nav>

    <div class="settings-content">
        {#if activeTab === 'general'}
            <div class="lang-select">
                <label>{t('settings-language')}</label>
                <div class="lang-options">
                    {#each languages as lang}
                        <button
                            type="button"
                            class="lang-option"
                            class:selected={lang.code === $currentLanguage}
                            on:click={() => selectLanguage(lang.code)}
                        >
                            <img src="/media/flags/{lang.label}.png" width="22" alt={lang.flag} />
                            <span>{lang.name}</span>
                        </button>
                    {/each}
                </div>
            </div>
            <Space h="md" />
            <div class="voice-select">
                <label>{t('settings-voice')}</label>
                <p class="description">{t('settings-voice-desc')}</p>
                <div class="voice-options">
                    {#each availableVoices as voice}
                        <button
                            type="button"
                            class="voice-option"
                            class:selected={voiceVal === voice.id}
                            on:click={() => selectVoice(voice.id)}
                        >
                            <div class="voice-info">
                                <span class="voice-name">{voice.name}</span>
                                {#if voice.author}
                                    <span class="voice-author">by {voice.author}</span>
                                {/if}
                            </div>
                            <div class="voice-languages">
                                {#each voice.languages as lang}
                                    <img src="/media/flags/{lang.toUpperCase()}.png" alt={lang} width="20" title={lang} />
                                {/each}
                            </div>
                        </button>
                    {/each}
                    {#if availableVoices.length === 0}
                        <p class="no-voices">{t('settings-no-voices')}</p>
                    {/if}
                </div>
            </div>

        {:else if activeTab === 'devices'}
            <NativeSelect
                data={availableMicrophones}
                label={t('settings-microphone')}
                description={t('settings-microphone-desc')}
                variant="filled"
                bind:value={selectedMicrophone}
            />

        {:else if activeTab === 'neural'}
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

            <Space h="xl" />
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

            <Space h="xl" />
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

            <Space h="xl" />
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

            <Space h="xl" />
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

            <Space h="xl" />
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
                            class="ollama-input"
                            placeholder="http://localhost:11434"
                            bind:value={ollamaUrl}
                        />
                        <Button
                            color="gray"
                            radius="md"
                            size="sm"
                            uppercase
                            on:click={loadOllamaModels}
                            disabled={ollamaLoading}
                        >
                            {ollamaLoading ? '...' : t('settings-ollama-load-models')}
                        </Button>
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

        {:else if activeTab === 'about'}
            <Notification
                title={t('settings-beta-title')}
                icon={QuestionMarkCircled}
                color="blue"
                withCloseButton={false}
            >
                {t('settings-beta-desc')}<br />
                {t('settings-beta-feedback')} <a href={feedbackLink} target="_blank">{t('settings-beta-bot')}</a>.
                <Space h="sm" />
                <Button
                    color="gray"
                    radius="md"
                    size="xs"
                    uppercase
                    on:click={() => showInExplorer(logFilePath)}
                >
                    {t('settings-open-logs')}
                </Button>
            </Notification>
            <Space h="lg" />
            <div class="about-section">
                <div class="about-version-block">
                    <div class="about-version-name">JARVIS</div>
                    <div class="about-version-row">
                        <span class="about-version-num">v{appVersion}</span>
                        <span class="about-version-badge">BETA</span>
                    </div>
                </div>
                <p class="about-copyright">© 2026. {t('footer-author')}: <b>{authorName}</b></p>
                <div class="about-links">
                    {#if $currentLanguage === "ru" || $currentLanguage === "ua"}
                    <a href={tgLink} target="_blank" class="about-link">
                        <img src="/media/icons/telegram.webp" alt="Telegram" width="18" />
                        <span>{t('footer-telegram')}</span>
                    </a>
                    {/if}
                    <a href={repoLink} target="_blank" class="about-link">
                        <img src="/media/icons/github-logo.png" alt="GitHub" width="18" />
                        <span>{t('footer-github')}</span>
                    </a>
                </div>
                <div class="about-support">
                    {#if $currentLanguage === "ru"}
                    <p>{t('footer-support')} <a href={boostyLink} target="_blank" class="about-link about-link--inline">
                        <img src="/media/icons/boosty.webp" alt="Boosty" width="18" />
                        <span>Boosty</span>
                    </a>.</p>
                    {:else if $currentLanguage === "ua" || $currentLanguage === "en"}
                    <p>{t('footer-support')} <a href={patreonLink} target="_blank" class="about-link about-link--inline">
                        <img src="/media/icons/patreon.png" alt="Patreon" width="18" />
                        <span>Patreon</span>
                    </a>.</p>
                    {/if}
                </div>
            </div>
        {/if}
    </div>
</div>

<Space h="xl" />

<Button
    color="lime"
    radius="md"
    size="sm"
    uppercase
    ripple
    fullSize
    on:click={saveSettings}
    disabled={saveButtonDisabled}
>
    {t('settings-save')}
</Button>

<Space h="sm" />

<Button
    color="gray"
    radius="md"
    size="sm"
    uppercase
    fullSize
    on:click={() => $goto("/")}
>
    {t('settings-back')}
</Button>


<style lang="scss">
.settings-layout {
    display: flex;
    gap: 0;
    min-height: 0;
}

.settings-nav {
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 120px;
    flex-shrink: 0;
    border-right: 1px solid rgba(255,255,255,0.07);
    padding-right: 0.5rem;
}

.nav-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.55rem 0.65rem;
    background: transparent;
    border: none;
    border-radius: 6px;
    color: rgba(255,255,255,0.45);
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    text-align: left;
    transition: all 0.15s ease;
    white-space: nowrap;

    :global(svg) {
        flex-shrink: 0;
        opacity: 0.6;
    }

    &:hover {
        background: rgba(255,255,255,0.05);
        color: rgba(255,255,255,0.75);
        :global(svg) { opacity: 0.9; }
    }

    &.active {
        background: rgba(138,200,50,0.1);
        color: #8AC832;
        :global(svg) { opacity: 1; }
    }
}

.settings-content {
    flex: 1;
    padding-left: 1rem;
    overflow-y: auto;
    max-height: calc(100vh - 240px);

    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-track { background: transparent; }
    &::-webkit-scrollbar-thumb {
        background: rgba(255,255,255,0.15);
        border-radius: 2px;
    }
}

.lang-select {
    label {
        font-weight: 600;
        font-size: 0.85rem;
        color: rgba(255,255,255,0.7);
        display: block;
        margin-bottom: 0.5rem;
    }
}

.lang-options {
    display: flex;
    gap: 0.4rem;
}

.lang-option {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.45rem 0.75rem;
    background: rgba(30, 40, 45, 0.8);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    cursor: pointer;
    color: rgba(255,255,255,0.6);
    font-size: 0.78rem;
    font-weight: 500;
    transition: all 0.2s ease;

    img { border-radius: 2px; opacity: 0.75; }

    &:hover {
        background: rgba(40, 55, 60, 0.9);
        border-color: rgba(255,255,255,0.2);
        color: #fff;
        img { opacity: 1; }
    }

    &.selected {
        background: rgba(82, 254, 254, 0.1);
        border-color: rgba(82, 254, 254, 0.4);
        color: #52fefe;
        img { opacity: 1; }
    }
}

.voice-select {
    label {
        font-weight: 600;
        font-size: 0.85rem;
        color: rgba(255,255,255,0.7);
        display: block;
        margin-bottom: 0.25rem;
    }

    .description {
        font-size: 0.75rem;
        color: rgba(255,255,255,0.5);
        margin: 0 0 0.75rem;
        white-space: pre-line;
    }
}

$voice-item-height: 70px;
$voice-item-gap: 0.5rem;
$voice-max-visible: 3;

.voice-options {
    display: flex;
    flex-direction: column;
    gap: $voice-item-gap;
    max-height: $voice-item-height * $voice-max-visible;
    overflow-y: auto;

    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 3px; }
    &::-webkit-scrollbar-thumb {
        background: rgba(255,255,255,0.2);
        border-radius: 3px;
        &:hover { background: rgba(255,255,255,0.3); }
    }
}

.voice-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: rgba(30, 40, 45, 0.8);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    width: 100%;

    &:hover {
        background: rgba(40, 55, 60, 0.9);
        border-color: rgba(255,255,255,0.2);
    }

    &.selected {
        background: rgba(82, 254, 254, 0.1);
        border-color: rgba(82, 254, 254, 0.4);
    }
}

.voice-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.15rem;
}

.voice-name {
    font-size: 0.85rem;
    color: #fff;
    font-weight: 500;
}

.voice-author {
    font-size: 0.7rem;
    color: rgba(255,255,255,0.4);
}

.voice-languages {
    display: flex;
    gap: 0.35rem;
    img { opacity: 0.8; border-radius: 2px; }
}

.no-voices {
    font-size: 0.8rem;
    color: rgba(255,255,255,0.4);
    font-style: italic;
}

.ollama-section {
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 8px;
    padding: 0.85rem;
    background: rgba(255,255,255,0.02);
}

.ollama-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.4rem;
}

.ollama-title {
    font-size: 0.9rem;
    font-weight: 700;
    color: rgba(255,255,255,0.85);
}

.ollama-badge {
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.8px;
    color: #8AC832;
    border: 1px solid #8AC832;
    border-radius: 3px;
    padding: 0.1rem 0.35rem;
    opacity: 0.8;
}

.ollama-field {
    margin-bottom: 0.25rem;
}

.ollama-label {
    display: block;
    font-size: 0.82rem;
    font-weight: 600;
    color: rgba(255,255,255,0.75);
    margin-bottom: 0.2rem;
}

.ollama-desc {
    display: block;
    font-size: 0.72rem;
    color: rgba(255,255,255,0.35);
    margin-bottom: 0.5rem;
    line-height: 1.4;
}

.ollama-input {
    flex: 1;
    height: 34px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 6px;
    color: #d1d1d1;
    font-size: 0.82rem;
    padding: 0 0.75rem;
    outline: none;
    transition: border-color 0.2s;
    width: 100%;

    &::placeholder { color: rgba(255,255,255,0.2); }
    &:focus { border-color: rgba(82,254,254,0.4); }
}

.ollama-url-row {
    display: flex;
    gap: 0.5rem;
    align-items: flex-start;

    :global(.svelteui-Input-wrapper), :global(input) {
        flex: 1;
    }
}

.about-section {
    text-align: center;
    color: #6c6e71;
    font-size: 13px;
    line-height: 1.8em;

    .about-copyright {
        margin: 0 0 1rem;
        color: #6c6e71;
        b { color: #888; }
    }

    .about-links {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }

    .about-support p { margin: 0; }

    .about-link {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        color: #555759;
        text-decoration: none;
        transition: 0.3s;

        img { opacity: 0.5; transition: opacity 0.3s; margin-top: -2px; }

        span {
            color: #185876;
            border-bottom: 1px solid #185876;
            transition: color 0.3s, border-color 0.3s;
        }

        &:hover {
            img { opacity: 1; }
            span { color: #2A9CD0; border-color: #2A9CD0; }
        }

        &--inline { vertical-align: middle; }
    }
}
</style>
