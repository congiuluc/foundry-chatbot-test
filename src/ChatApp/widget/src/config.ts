import type { WidgetConfig } from "./types";

const DEFAULT_TITLE = "Chatbot";
const DEFAULT_ACCENT = "#2563eb";
const DEFAULT_PANEL = "#1e293b";
const DEFAULT_BOT_BUBBLE = "#334155";
const DEFAULT_TEXT = "#e2e8f0";
const DEFAULT_GREETING = "Ask me anything to get started.";

/**
 * Reads widget configuration from the embedding <script> element's data-*
 * attributes. The API base defaults to the origin the widget script was served
 * from, so a bare embed (just the script tag) works without extra config.
 */
export function readConfig(script: HTMLScriptElement): WidgetConfig {
    const data = script.dataset;
    const scriptOrigin = safeOrigin(script.src);
    const apiBase = stripTrailingSlash(data.apiBase ?? scriptOrigin);
    const position = data.position === "bottom-left" ? "bottom-left" : "bottom-right";

    const accent = sanitizeColor(data.accent) ?? DEFAULT_ACCENT;

    return {
        apiBase,
        title: data.title ?? DEFAULT_TITLE,
        accent,
        launcherIcon: sanitizeIconUrl(data.icon),
        panelColor: sanitizeColor(data.panel) ?? DEFAULT_PANEL,
        userBubbleColor: sanitizeColor(data.userBubble) ?? accent,
        botBubbleColor: sanitizeColor(data.botBubble) ?? DEFAULT_BOT_BUBBLE,
        textColor: sanitizeColor(data.text) ?? DEFAULT_TEXT,
        position,
        allowSettings: data.allowSettings !== "false",
        greeting: data.greeting ?? DEFAULT_GREETING,
        storageKey: data.storageKey ?? `chatbot:${apiBase || "self"}`,
        debug: data.debug === "true",
    };
}

function safeOrigin(src: string): string {
    try {
        return new URL(src, location.href).origin;
    } catch {
        return "";
    }
}

function stripTrailingSlash(value: string): string {
    return value.endsWith("/") ? value.slice(0, -1) : value;
}

/**
 * Accepts only safe image URL schemes for the custom launcher icon, guarding
 * against script-bearing URLs such as javascript:. Returns an empty string when
 * the value is missing or uses a disallowed scheme.
 */
function sanitizeIconUrl(value: string | undefined): string {
    if (!value) {
        return "";
    }

    const trimmed = value.trim();
    if (/^(https?:|data:image\/|\/)/i.test(trimmed)) {
        return trimmed;
    }

    return "";
}

/**
 * Accepts only safe CSS colour tokens (hex, rgb/rgba, hsl/hsla, or a plain named
 * colour) so caller-supplied values cannot inject arbitrary CSS into the widget
 * stylesheet. Returns undefined when the value is missing or invalid.
 */
function sanitizeColor(value: string | undefined): string | undefined {
    if (!value) {
        return undefined;
    }

    const trimmed = value.trim();
    const hex = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
    const functional = /^(?:rgb|rgba|hsl|hsla)\(\s*[0-9.,%\s/]+\)$/i;
    const named = /^[a-z]+$/i;

    if (hex.test(trimmed) || functional.test(trimmed) || named.test(trimmed)) {
        return trimmed;
    }

    return undefined;
}
