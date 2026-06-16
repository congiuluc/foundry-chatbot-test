import type { WidgetConfig } from "./types";

/**
 * Builds the scoped stylesheet for the widget. All rules target the shadow root
 * (via :host and prefixed class names) so the host page's CSS cannot leak in and
 * the widget's CSS cannot leak out.
 */
export function createStyles(config: WidgetConfig): string {
    const anchor = config.position === "bottom-left" ? "left: 24px;" : "right: 24px;";
    const align = config.position === "bottom-left" ? "flex-start" : "flex-end";

    return `
:host {
    --cb-bg: #0f172a;
    --cb-panel: ${config.panelColor};
    --cb-panel-2: #182233;
    --cb-surface: #0f172a;
    --cb-user: ${config.userBubbleColor};
    --cb-bot: ${config.botBubbleColor};
    --cb-text: ${config.textColor};
    --cb-muted: #94a3b8;
    --cb-border: #334155;
    --cb-accent: ${config.accent};
    position: fixed;
    bottom: 24px;
    ${anchor}
    z-index: 2147483000;
    font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
}

/* Light theme palette: applied for the explicit "light" choice and for
   "system" when the OS prefers a light colour scheme. */
:host([data-cb-theme="light"]),
:host([data-cb-theme="system"]) {
    color-scheme: light dark;
}

:host([data-cb-theme="light"]) {
    --cb-bg: #f8fafc;
    --cb-panel: #ffffff;
    --cb-panel-2: #f1f5f9;
    --cb-surface: #ffffff;
    --cb-bot: #e2e8f0;
    --cb-text: #0f172a;
    --cb-muted: #64748b;
    --cb-border: #cbd5e1;
}

@media (prefers-color-scheme: light) {
    :host([data-cb-theme="system"]) {
        --cb-bg: #f8fafc;
        --cb-panel: #ffffff;
        --cb-panel-2: #f1f5f9;
        --cb-surface: #ffffff;
        --cb-bot: #e2e8f0;
        --cb-text: #0f172a;
        --cb-muted: #64748b;
        --cb-border: #cbd5e1;
    }
}

* {
    box-sizing: border-box;
}

.cb-root {
    display: flex;
    flex-direction: column;
    align-items: ${align};
    gap: 12px;
}

.cb-launcher {
    width: 60px;
    height: 60px;
    border: none;
    border-radius: 50%;
    background: var(--cb-accent);
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
    transition: transform 0.15s ease, filter 0.15s ease;
}

.cb-launcher:hover {
    filter: brightness(1.08);
    transform: translateY(-2px);
}

.cb-launcher svg {
    width: 26px;
    height: 26px;
}

.cb-launcher-icon {
    width: 30px;
    height: 30px;
    object-fit: contain;
    border-radius: 50%;
}

.cb-panel {
    width: 380px;
    height: 560px;
    max-height: calc(100vh - 120px);
    background: var(--cb-panel);
    border: 1px solid var(--cb-border);
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
    color: var(--cb-text);
}

.cb-panel[hidden] {
    display: none;
}

.cb-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: var(--cb-panel-2);
    border-bottom: 1px solid var(--cb-border);
}

.cb-title {
    font-weight: 600;
    font-size: 15px;
}

.cb-actions {
    display: flex;
    gap: 6px;
}

.cb-icon-btn {
    width: 30px;
    height: 30px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: var(--cb-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    transition: background 0.15s ease, color 0.15s ease;
}

.cb-icon-btn:hover {
    background: rgba(148, 163, 184, 0.15);
    color: var(--cb-text);
}

.cb-icon-btn svg {
    width: 18px;
    height: 18px;
}

.cb-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.cb-empty {
    margin: auto;
    color: var(--cb-muted);
    font-size: 14px;
    text-align: center;
}

.cb-message {
    max-width: 80%;
    padding: 10px 12px;
    border-radius: 12px;
    font-size: 14px;
    line-height: 1.45;
    white-space: pre-wrap;
    word-wrap: break-word;
}

.cb-message.user {
    align-self: flex-end;
    background: var(--cb-user);
    color: #fff;
    border-bottom-right-radius: 4px;
}

.cb-message.bot {
    align-self: flex-start;
    background: var(--cb-bot);
    color: var(--cb-text);
    border-bottom-left-radius: 4px;
}

.cb-thinking {
    margin: 0 0 8px;
    border: 1px solid var(--cb-border);
    border-radius: 8px;
    background: var(--cb-panel-2);
}

.cb-thinking-summary {
    cursor: pointer;
    list-style: none;
    padding: 6px 10px;
    font-size: 12px;
    font-weight: 600;
    color: var(--cb-muted);
    user-select: none;
}

.cb-thinking-summary::-webkit-details-marker {
    display: none;
}

.cb-thinking-summary::before {
    content: "\\25B8";
    display: inline-block;
    margin-right: 6px;
    transition: transform 0.15s ease;
}

.cb-thinking[open] .cb-thinking-summary::before {
    transform: rotate(90deg);
}

.cb-thinking-body {
    padding: 0 10px 8px;
    font-size: 12px;
    line-height: 1.4;
    color: var(--cb-muted);
    white-space: pre-wrap;
    word-wrap: break-word;
}

.cb-typing {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 0;
}

.cb-typing-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--cb-muted);
    animation: cb-typing-bounce 1.2s infinite ease-in-out both;
}

.cb-typing-dot:nth-child(2) {
    animation-delay: 0.15s;
}

.cb-typing-dot:nth-child(3) {
    animation-delay: 0.3s;
}

@keyframes cb-typing-bounce {
    0%, 60%, 100% {
        transform: translateY(0);
        opacity: 0.4;
    }
    30% {
        transform: translateY(-4px);
        opacity: 1;
    }
}

.cb-composer {
    display: flex;
    gap: 8px;
    padding: 12px;
    border-top: 1px solid var(--cb-border);
    background: var(--cb-panel-2);
}

.cb-composer textarea {
    flex: 1;
    resize: none;
    border: 1px solid var(--cb-border);
    border-radius: 10px;
    background: var(--cb-bg);
    color: var(--cb-text);
    padding: 10px 12px;
    font: inherit;
    font-size: 14px;
    max-height: 120px;
}

.cb-composer textarea:focus {
    outline: none;
    border-color: var(--cb-accent);
}

.cb-send {
    border: none;
    border-radius: 10px;
    background: var(--cb-accent);
    color: #fff;
    padding: 0 16px;
    font-weight: 600;
    cursor: pointer;
    transition: filter 0.15s ease;
}

.cb-send:hover:not(:disabled) {
    filter: brightness(1.08);
}

.cb-send:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.cb-dialog {
    position: fixed;
    inset: 0;
    margin: auto;
    width: min(420px, calc(100vw - 32px));
    max-height: min(560px, calc(100vh - 32px));
    padding: 0;
    border: 1px solid var(--cb-border);
    border-radius: 14px;
    background: var(--cb-surface);
    color: var(--cb-text);
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.45);
    overflow: hidden;
    flex-direction: column;
}

.cb-dialog[open] {
    display: flex;
}

.cb-dialog::backdrop {
    background: rgba(0, 0, 0, 0.5);
}

.cb-dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid var(--cb-border);
    flex-shrink: 0;
}

.cb-dialog-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.cb-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: var(--cb-muted);
}

.cb-field[hidden] {
    display: none;
}

.cb-field input,
.cb-field select,
.cb-field textarea {
    border: 1px solid var(--cb-border);
    border-radius: 8px;
    background: var(--cb-bg);
    color: var(--cb-text);
    padding: 8px 10px;
    font: inherit;
    font-size: 13px;
    font-weight: 400;
}

.cb-field input:focus,
.cb-field select:focus,
.cb-field textarea:focus {
    outline: none;
    border-color: var(--cb-accent);
}

.cb-field textarea {
    resize: vertical;
}

.cb-hint {
    margin: 0;
    font-size: 11px;
    color: var(--cb-muted);
    line-height: 1.4;
}

.cb-settings-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 14px 16px;
    border-top: 1px solid var(--cb-border);
    flex-shrink: 0;
}

.cb-settings-actions button {
    border: none;
    border-radius: 8px;
    padding: 8px 14px;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
}

.cb-ghost {
    background: transparent;
    color: var(--cb-muted);
    border: 1px solid var(--cb-border) !important;
}

.cb-ghost:hover {
    color: var(--cb-text);
}

.cb-primary {
    background: var(--cb-accent);
    color: #fff;
}

.cb-primary:hover {
    filter: brightness(1.08);
}

@media (max-width: 480px) {
    :host {
        bottom: 16px;
        ${config.position === "bottom-left" ? "left: 16px;" : "right: 16px;"}
    }

    .cb-panel {
        width: calc(100vw - 32px);
        height: calc(100vh - 110px);
    }
}
`;
}
