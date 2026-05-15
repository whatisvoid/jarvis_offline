import { showInFolder } from "./lib/api"

// ### UTILITY FUNCTIONS

export function showInExplorer(path: string): void {
    showInFolder(path)
        .catch(err => console.error("failed to open explorer:", err))
}
