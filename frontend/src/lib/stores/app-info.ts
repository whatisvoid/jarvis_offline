import { writable } from "svelte/store"
import type { AppInfo } from "@/types"
import { addToast } from "@/lib/toast"
import {
    getTgOfficialLink, getFeedbackLink, getRepositoryLink,
    getBoostyLink, getPatreonLink, getLogFilePath
} from "@/lib/api"

export const appInfo = writable<AppInfo>({
    tgOfficialLink:    "",
    feedbackLink:      "",
    repositoryLink:    "",
    boostySupportLink: "",
    patreonSupportLink: "",
    logFilePath:       ""
})

export async function loadAppInfo() {
    try {
        const [tg, feedback, repo, boosty, patreon, logPath] = await Promise.all([
            getTgOfficialLink(),
            getFeedbackLink(),
            getRepositoryLink(),
            getBoostyLink(),
            getPatreonLink(),
            getLogFilePath()
        ])
        appInfo.set({
            tgOfficialLink:    tg,
            feedbackLink:      feedback,
            repositoryLink:    repo,
            boostySupportLink: boosty,
            patreonSupportLink: patreon,
            logFilePath:       logPath
        })
    } catch (err: unknown) {
        console.error("failed to load app info:", err)
        addToast("Failed to load app info", "error")
    }
}
