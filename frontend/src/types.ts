// Shared domain types — used across components and stores

export interface VoiceMeta {
    id: string
    name: string
    author: string
    languages: string[]
}

export interface VoiceConfig {
    voice: VoiceMeta
}

export interface SlotDefinition {
    entity: string
    context: string[]
}

export interface JCommand {
    id: string
    type: string
    description: string
    phrases: Record<string, string[]>
    slots: Record<string, SlotDefinition>
}

export interface JarvisStats {
    running: boolean
    ram_mb: number
    cpu_usage: number
}

export interface AppInfo {
    tgOfficialLink: string
    feedbackLink: string
    repositoryLink: string
    boostySupportLink: string
    patreonSupportLink: string
    logFilePath: string
}

export interface RuntimeEvent {
    id: number
    title: string
    detail: string
    time: string
}

export interface SelectOption {
    label: string
    value: string
}

export interface VoskModel {
    name: string
    language: string
    size: string
}

export interface GlinerModel {
    display_name: string
    value: string
}
