// ### STYLES
import "./css/tokens.css"
import "./css/main.scss"
import "./css/styles.scss"

// ### APP
import App from "./app.svelte"

const app = new App({
    target: document.getElementById("app")!
})

export default app
