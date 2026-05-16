<script lang="ts">
    import { onMount, onDestroy } from "svelte"
    import { Router } from "@roxi/routify"
    import routes from "../.routify/routes.default.js"
    import Events from "./Events.svelte"
    import Toasts from "@/components/ui/Toasts.svelte"

    import { disconnectIpc } from "@/stores"
    import { criticalInit, deferredInit } from "@/lib/bootstrap"

    onMount(async () => {
        await criticalInit()
        deferredInit()
    })

    onDestroy(() => {
        disconnectIpc()
    })
</script>

<Router {routes} />
<Events />
<Toasts />
