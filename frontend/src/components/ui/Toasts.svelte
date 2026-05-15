<script lang="ts">
    import { toasts, removeToast } from "@/lib/toast"
</script>

<div class="toasts-container" aria-live="assertive" aria-atomic="false">
    {#each $toasts as toast (toast.id)}
        <div class="toast toast--{toast.type}" role="alert">
            <span class="toast-message">{toast.message}</span>
            <button
                class="toast-close"
                aria-label="Dismiss"
                on:click={() => removeToast(toast.id)}
            >✕</button>
        </div>
    {/each}
</div>

<style lang="scss">
.toasts-container {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: 9999;
    pointer-events: none;
    min-width: 280px;
    max-width: 420px;
}

.toast {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 14px;
    border-radius: var(--r-md);
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.02em;
    pointer-events: auto;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    animation: toast-in 180ms ease;

    &--error {
        background: rgba(30, 8, 8, 0.95);
        border: 1px solid rgba(255, 80, 80, 0.35);
        color: rgba(255, 160, 160, 0.92);
    }

    &--success {
        background: rgba(6, 22, 14, 0.95);
        border: 1px solid rgba(0, 200, 100, 0.35);
        color: rgba(100, 220, 160, 0.92);
    }

    &--info {
        background: rgba(6, 14, 22, 0.95);
        border: 1px solid rgba(0, 229, 255, 0.30);
        color: rgba(0, 229, 255, 0.88);
    }
}

.toast-message {
    flex: 1;
    line-height: 1.4;
}

.toast-close {
    flex-shrink: 0;
    background: transparent;
    border: none;
    color: inherit;
    opacity: 0.55;
    cursor: pointer;
    padding: 0;
    font-size: 11px;
    line-height: 1;
    transition: opacity 120ms ease;

    &:hover { opacity: 1; }
}

@keyframes toast-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
}
</style>
