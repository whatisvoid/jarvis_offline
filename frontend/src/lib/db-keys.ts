// Centralised database key constants — prevents typos and enables refactoring

export const DB_KEYS = {
    voice:              "assistant_voice",
    language:           "language",
    microphone:         "selected_microphone",
    wakeWordEngine:     "selected_wake_word_engine",
    sttEngine:          "selected_stt_engine",
    intentEngine:       "selected_intent_recognition_engine",
    slotEngine:         "selected_slot_extraction_engine",
    glinerModel:        "selected_gliner_model",
    voskModel:          "selected_vosk_model",
    noiseSuppression:   "noise_suppression",
    vad:                "vad",
    gainNormalizer:     "gain_normalizer",
    picovoiceApiKey:    "api_key__picovoice",
    ollamaUrl:          "ollama_url",
    ollamaModel:        "ollama_model",
} as const

export type DbKey = typeof DB_KEYS[keyof typeof DB_KEYS]
