<script lang="ts">
    import { createEventDispatcher } from "svelte"
    import Select from "@/components/ui/Select.svelte"

    export let t: (key: string) => string
    export let selectedWakeWordEngine: string
    export let selectedIntentRecognitionEngine: string
    export let selectedSlotExtractionEngine: string
    export let selectedGlinerModel: string
    export let selectedVoskModel: string
    export let selectedNoiseSuppression: string
    export let selectedVad: string
    export let gainNormalizerEnabled: boolean
    export let apiKeyPicovoice: string
    export let ollamaUrl: string
    export let ollamaModel: string
    export let availableVoskModels: { label: string; value: string }[]
    export let availableGlinerModels: { label: string; value: string }[]
    export let availableOllamaModels: { label: string; value: string }[]
    export let ollamaLoading: boolean
    export let ollamaError: string
    export let ollamaModelsLoaded: boolean

    const dispatch = createEventDispatcher<{ loadOllama: void }>()
</script>

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
                type="password"
                style="margin-top: 10px; width: 100%;"
                placeholder={t('settings-picovoice-key')}
                autocomplete="new-password"
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
            on:click={() => dispatch('loadOllama')}
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
