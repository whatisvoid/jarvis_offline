import { loadTranslations } from "./i18n"
import { enableIpc } from "./ipc"
import { loadVoiceSetting } from "./stores/voice"
import { loadAppInfo } from "./stores/app-info"
import { loadSettingsSnapshot } from "./stores/settings-cache"

/**
 * Critical init — must complete before the UI is meaningfully usable.
 * Translations are required for all user-visible text.
 * IPC is enabled here so it starts connecting as early as possible.
 */
export async function criticalInit(): Promise<void> {
    await loadTranslations()
    enableIpc()
}

/**
 * Deferred init — enhances the UI but does not block rendering.
 * Failures are handled internally (toasts) and do not propagate.
 */
export function deferredInit(): void {
    loadVoiceSetting()
    loadAppInfo()
    loadSettingsSnapshot()
}
