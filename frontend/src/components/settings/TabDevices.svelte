<script lang="ts">
    import Select from "@/components/ui/Select.svelte"
    import type { SelectOption } from "@/types"

    export let t: (key: string) => string
    export let availableMicrophones: SelectOption[]
    export let selectedMicrophone: string
</script>

<div class="settings-section">
    <span class="section-label">{t('settings-microphone')}</span>
    <p class="section-desc">{t('settings-microphone-desc')}</p>
    <Select
        data={availableMicrophones}
        bind:value={selectedMicrophone}
    />
</div>
