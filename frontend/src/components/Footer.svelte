<script lang="ts">
    import { onDestroy } from "svelte"
    import { appInfo, currentLanguage, tStore } from "@/stores"

    $: t = $tStore

    let authorName = ""
    let tgLink = ""
    let repoLink = ""
    let boostyLink = ""
    let patreonLink = ""

    const currentYear = new Date().getFullYear()

    const unsubAppInfo = appInfo.subscribe(info => {
        authorName = info.authorName
        tgLink     = info.tgOfficialLink
        repoLink   = info.repositoryLink
        boostyLink = info.boostySupportLink
        patreonLink = info.patreonSupportLink
    })

    onDestroy(() => {
        unsubAppInfo()
    })
</script>

<footer id="footer">
    <p>© {currentYear}. {t('footer-author')}: <b>{authorName}</b></p>
    <p class="links">
        {#if ($currentLanguage === "ru" || $currentLanguage === "ua") && tgLink}
        <a href={tgLink} target="_blank" rel="noopener noreferrer" class="telegram-link">
            <img src="/media/icons/telegram.webp" alt="Telegram" width="18px" />
            &nbsp;<span>{t('footer-telegram')}</span>
        </a>
        &nbsp;
        {/if}
        {#if repoLink}
        <a href={repoLink} target="_blank" rel="noopener noreferrer">
            <img src="/media/icons/github-logo.png" alt="GitHub" width="18px" />
            &nbsp;<span>{t('footer-github')}</span>
        </a>
        {/if}
    </p>
    <p class="links last">
        {#if $currentLanguage === "ru" && boostyLink}
        {t('footer-support')} <a href={boostyLink} target="_blank" rel="noopener noreferrer" class="telegram-link">
            <img src="/media/icons/boosty.webp" alt="Boosty" width="18px" />
            <span>Boosty</span>
        </a>.
        {/if}
        {#if ($currentLanguage === "ua" || $currentLanguage === "en") && patreonLink}
        {t('footer-support')} <a href={patreonLink} target="_blank" rel="noopener noreferrer" class="telegram-link">
            <img src="/media/icons/patreon.png" alt="Patreon" width="18px" />
            <span>Patreon</span>
        </a>.
        {/if}
    </p>
</footer>

<style lang="scss">
    #footer {
        text-align: center;
        color: var(--text-muted);
        font-size: 13px;
        font-weight: normal;
        line-height: 1.7em;
        margin-top: 15px;

        p {
            margin: 0;
            padding: 0;

            &.links {
                margin-top: 5px;
                margin-bottom: 15px;

                &.last {
                    margin-top: -5px;
                }
            }
        }

        a {
            color: rgba(255,255,255,0.32);
            text-decoration: none;
            transition: var(--ease);

            & > span {
                color: rgba(var(--accent-rgb),0.52);
                border-bottom: 1px solid var(--border-hover);
                transition: var(--ease);
            }

            img {
                opacity: 0.42;
                transition: var(--ease);
                margin-top: -3px;
            }

            &:hover {
                color: rgba(255,255,255,0.55);

                & > span {
                    color: var(--accent);
                    border-bottom-color: rgba(var(--accent-rgb),0.45);
                }

                img {
                    opacity: 0.85;
                }
            }

            &.telegram-link {
                color: rgba(var(--accent-rgb),0.52);
                display: inline-block;

                &:hover {
                    color: var(--accent);
                }
            }
        }
    }
</style>
