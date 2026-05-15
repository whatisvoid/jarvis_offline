import { dbRead, dbWrite } from "./api"
import { DB_KEYS } from "./db-keys"

export interface SettingsValues {
    microphone:            string
    wakeWordEngine:        string
    sttEngine:             string
    intentEngine:          string
    slotEngine:            string
    glinerModel:           string
    voskModel:             string
    noiseSuppression:      string
    vad:                   string
    gainNormalizerEnabled: boolean
    apiKeyPicovoice:       string
    ollamaUrl:             string
    ollamaModel:           string
}

export async function loadSettingsValues(): Promise<SettingsValues> {
    const settled = await Promise.allSettled([
        dbRead(DB_KEYS.microphone),
        dbRead(DB_KEYS.wakeWordEngine),
        dbRead(DB_KEYS.sttEngine),
        dbRead(DB_KEYS.intentEngine),
        dbRead(DB_KEYS.slotEngine),
        dbRead(DB_KEYS.glinerModel),
        dbRead(DB_KEYS.voskModel),
        dbRead(DB_KEYS.noiseSuppression),
        dbRead(DB_KEYS.vad),
        dbRead(DB_KEYS.gainNormalizer),
        dbRead(DB_KEYS.picovoiceApiKey),
        dbRead(DB_KEYS.ollamaUrl),
        dbRead(DB_KEYS.ollamaModel),
    ])

    const val = (i: number): string =>
        settled[i].status === 'fulfilled' ? (settled[i] as PromiseFulfilledResult<string>).value : ""

    return {
        microphone:            val(0),
        wakeWordEngine:        val(1),
        sttEngine:             val(2),
        intentEngine:          val(3),
        slotEngine:            val(4),
        glinerModel:           val(5),
        voskModel:             val(6),
        noiseSuppression:      val(7),
        vad:                   val(8),
        gainNormalizerEnabled: val(9) === "true",
        apiKeyPicovoice:       val(10),
        ollamaUrl:             val(11) || "http://localhost:11434",
        ollamaModel:           val(12),
    }
}

export async function saveSettingsValues(s: SettingsValues & { voiceVal: string }): Promise<void> {
    await Promise.all([
        dbWrite(DB_KEYS.voice,           s.voiceVal),
        dbWrite(DB_KEYS.microphone,      s.microphone),
        dbWrite(DB_KEYS.wakeWordEngine,  s.wakeWordEngine),
        dbWrite(DB_KEYS.sttEngine,       s.sttEngine),
        dbWrite(DB_KEYS.intentEngine,    s.intentEngine),
        dbWrite(DB_KEYS.slotEngine,      s.slotEngine),
        dbWrite(DB_KEYS.glinerModel,     s.glinerModel),
        dbWrite(DB_KEYS.voskModel,       s.voskModel),
        dbWrite(DB_KEYS.noiseSuppression, s.noiseSuppression),
        dbWrite(DB_KEYS.vad,             s.vad),
        dbWrite(DB_KEYS.gainNormalizer,  s.gainNormalizerEnabled.toString()),
        dbWrite(DB_KEYS.picovoiceApiKey, s.apiKeyPicovoice),
        dbWrite(DB_KEYS.ollamaUrl,       s.ollamaUrl),
        dbWrite(DB_KEYS.ollamaModel,     s.ollamaModel),
    ])
}
