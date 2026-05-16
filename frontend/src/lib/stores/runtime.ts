import { writable } from "svelte/store"
import { getJarvisStats } from "@/lib/api"

export const isJarvisRunning = writable(false)
export const jarvisRamUsage  = writable(0)
export const jarvisCpuUsage  = writable(0)

export async function updateJarvisStats() {
    try {
        const stats = await getJarvisStats()
        isJarvisRunning.set(stats.running)
        jarvisRamUsage.set(stats.ram_mb)
        jarvisCpuUsage.set(stats.cpu_usage)
    } catch (err: unknown) {
        console.error("failed to get jarvis stats:", err)
    }
}

let statsInterval: ReturnType<typeof setInterval> | null = null

export function startStatsPolling(intervalMs = 5000) {
    if (statsInterval) return
    updateJarvisStats()
    statsInterval = setInterval(updateJarvisStats, intervalMs)
}

export function stopStatsPolling() {
    if (statsInterval) {
        clearInterval(statsInterval)
        statsInterval = null
    }
}
