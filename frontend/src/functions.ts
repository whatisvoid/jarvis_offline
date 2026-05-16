import { showInFolder } from "./lib/api"
import { addToast } from "./lib/toast"

// ### UTILITY FUNCTIONS

export function showInExplorer(path: string): void {
    showInFolder(path)
        .catch(err => {
            console.error("failed to open explorer:", err)
            addToast("Failed to open file location", "error")
        })
}
