import { readConfig } from "./config";
import { logger, setDebugLogging } from "./logger";
import { ChatWidget } from "./widget";

/**
 * Bootstraps a single chatbot widget instance. The widget mounts a host element
 * (using a Shadow DOM) at the end of <body> and reads its configuration from the
 * embedding <script> tag's data-* attributes.
 */
function bootstrap(): void {
    const script = (document.currentScript as HTMLScriptElement | null) ?? findScript();
    if (!script) {
        logger.error("could not locate the embedding <script> element; widget not mounted");
        return;
    }

    const config = readConfig(script);
    setDebugLogging(config.debug);
    logger.debug("resolved configuration", config);

    const mount = (): void => {
        const host = document.createElement("div");
        host.setAttribute("data-chatbot-widget", "");
        document.body.appendChild(host);
        // eslint-disable-next-line no-new
        new ChatWidget(host, config);
        logger.info("widget mounted", { apiBase: config.apiBase });
    };

    if (document.readyState === "loading") {
        logger.debug("document still loading; deferring mount until DOMContentLoaded");
        document.addEventListener("DOMContentLoaded", mount, { once: true });
    } else {
        mount();
    }
}

/** Fallback lookup for the widget script when document.currentScript is unavailable. */
function findScript(): HTMLScriptElement | null {
    const scripts = document.querySelectorAll<HTMLScriptElement>("script[src*='chatbot-widget']");
    return scripts.length > 0 ? scripts[scripts.length - 1] : null;
}

bootstrap();
