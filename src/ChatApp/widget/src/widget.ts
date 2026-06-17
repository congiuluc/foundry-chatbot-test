import type { ChatMessage, ChatSettings, Conversation, Theme, WidgetConfig } from "./types";
import { SessionStore } from "./storage";
import { fetchDefaultSettings, streamChat } from "./sse";
import { createStyles } from "./styles";
import { logger } from "./logger";

const EMPTY_SETTINGS: ChatSettings = {
    mode: "model",
    openAIEndpoint: "",
    deploymentName: "",
    foundryProjectEndpoint: "",
    foundryAgentId: "",
    foundryAgentVersion: "",
    systemPrompt: "",
    agentName: "",
};

const CHAT_ICON =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '<path d="M12 3C6.48 3 2 6.94 2 11.5c0 2.3 1.13 4.37 2.96 5.86-.13 1.06-.6 2.45-1.62 ' +
    "3.4-.2.2-.06.55.22.53 1.9-.16 3.62-.86 4.9-1.86.78.2 1.6.31 2.45.31 5.52 0 10-3.94 " +
    '10-8.5S17.52 3 12 3z"/></svg>';

const GEAR_ICON =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '<path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 ' +
    ".12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.03 7.03 0 0 0-1.62-.94l-.36-2.54a.5.5 " +
    "0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96a.5.5 " +
    "0 0 0-.6.22L2.74 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 " +
    "1.58a.5.5 0 0 0-.12.64l1.92 3.32c.14.24.42.34.66.22l2.39-.96c.49.38 1.03.7 1.62.94l.36 " +
    "2.54c.04.24.25.42.5.42h3.84c.25 0 .46-.18.5-.42l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.24.12.52.02.66-.22l1.92-3.32a.5.5 " +
    '0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z"/></svg>';

const TRASH_ICON =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '<path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM8 9h8v10H8V9zm7.5-5l-1-1h-5l-1 ' +
    '1H5v2h14V4h-3.5z"/></svg>';

const SUN_ICON =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '<path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 1a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0V2a1 1 0 0 1 1-1zm0 18a1 1 0 0 1 1 ' +
    '1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1zM1 12a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2H2a1 1 0 0 1-1-1zm18 0a1 1 0 0 1 1-1h2a1 ' +
    '1 0 1 1 0 2h-2a1 1 0 0 1-1-1zM4.22 4.22a1 1 0 0 1 1.42 0l1.41 1.41a1 1 0 0 1-1.42 1.42L4.22 5.64a1 1 0 0 1 ' +
    '0-1.42zm12.73 12.73a1 1 0 0 1 1.41 0l1.42 1.41a1 1 0 0 1-1.42 1.42l-1.41-1.42a1 1 0 0 1 0-1.41zM19.78 4.22a1 ' +
    '1 0 0 1 0 1.42l-1.41 1.41a1 1 0 0 1-1.42-1.42l1.42-1.41a1 1 0 0 1 1.41 0zM7.05 16.95a1 1 0 0 1 0 1.41l-1.41 ' +
    '1.42a1 1 0 0 1-1.42-1.42l1.42-1.41a1 1 0 0 1 1.41 0z"/></svg>';

const MOON_ICON =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '<path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.5 5.5 0 0 1-7.54-7.54A9.05 9.05 0 0 0 12 3z"/></svg>';

/**
 * The embeddable chatbot widget. Renders a floating launcher and a chat panel
 * inside an isolated Shadow DOM, streams responses from the backend, and
 * persists conversation history and per-session setting overrides.
 */
export class ChatWidget {
    private readonly config: WidgetConfig;
    private readonly store: SessionStore;
    private readonly host: HTMLElement;
    private readonly root: ShadowRoot;

    private conversation: Conversation;
    private settings: ChatSettings = { ...EMPTY_SETTINGS };
    private theme: Theme = "system";
    private isOpen = false;
    private isBusy = false;
    private settingsLoaded = false;

    // Reminder shown when the backend reports it is missing required configuration.
    private configNotice: string | null = null;

    // Element references.
    private panel!: HTMLDivElement;
    private launcher!: HTMLButtonElement;
    private messagesEl!: HTMLDivElement;
    private settingsDialog!: HTMLDialogElement;
    private composerEl!: HTMLFormElement;
    private textarea!: HTMLTextAreaElement;
    private sendButton!: HTMLButtonElement;
    private settingsToggle: HTMLButtonElement | null = null;
    private themeToggleBtn: HTMLButtonElement | null = null;
    private settingsInputs: Partial<Record<keyof ChatSettings, HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>> = {};
    private themeSelect: HTMLSelectElement | null = null;
    private modelFields: HTMLElement[] = [];
    private agentFields: HTMLElement[] = [];

    // Streaming render state. Incoming deltas arrive in bursts; to keep the
    // output smooth we buffer the full text/reasoning on the message object and
    // reveal it character-by-character on a steady animation-frame loop using
    // persistent DOM nodes (no per-frame rebuild of the bubble).
    private streamingEl: HTMLDivElement | null = null;
    private streamingMessage: ChatMessage | null = null;
    private streamFrame = 0;
    private streamDone = false;
    private shownTextLen = 0;
    private shownReasoningLen = 0;
    private streamTextEl: HTMLDivElement | null = null;
    private streamReasoningWrap: HTMLDetailsElement | null = null;
    private streamReasoningBody: HTMLDivElement | null = null;
    private streamTypingEl: HTMLDivElement | null = null;

    public constructor(host: HTMLElement, config: WidgetConfig) {
        this.config = config;
        this.store = new SessionStore(config.storageKey);
        this.conversation = this.store.loadConversation();
        this.host = host;
        this.root = host.attachShadow({ mode: "open" });
        this.theme = this.store.loadTheme() ?? "system";

        this.build();
        this.applyTheme(this.theme, false);
        this.loadSettings();
        this.renderMessages();
    }

    // #region Construction

    private build(): void {
        const style = document.createElement("style");
        style.textContent = createStyles(this.config);
        this.root.appendChild(style);

        const container = document.createElement("div");
        container.className = "cb-root";

        this.panel = this.buildPanel();
        this.launcher = this.buildLauncher();

        container.appendChild(this.panel);
        container.appendChild(this.launcher);
        this.root.appendChild(container);
    }

    private buildLauncher(): HTMLButtonElement {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "cb-launcher";
        button.title = "Open chat";
        button.addEventListener("click", () => this.toggleOpen());
        this.launcher = button;
        this.renderLauncherIcon();
        return button;
    }

    /**
     * Renders the launcher contents: a close glyph while open, otherwise the
     * configured custom icon image, falling back to the built-in chat glyph.
     */
    private renderLauncherIcon(): void {
        if (this.isOpen) {
            this.launcher.textContent = "\u2715";
            return;
        }

        const iconUrl = this.config.launcherIcon;
        if (iconUrl) {
            const image = document.createElement("img");
            image.className = "cb-launcher-icon";
            image.src = iconUrl;
            image.alt = "";
            this.launcher.replaceChildren(image);
            return;
        }

        this.launcher.innerHTML = CHAT_ICON;
    }

    private buildPanel(): HTMLDivElement {
        const panel = document.createElement("div");
        panel.className = "cb-panel";
        panel.setAttribute("role", "dialog");
        panel.setAttribute("aria-label", this.config.title);
        panel.hidden = true;

        panel.appendChild(this.buildHeader());

        this.messagesEl = document.createElement("div");
        this.messagesEl.className = "cb-messages";
        panel.appendChild(this.messagesEl);

        this.composerEl = this.buildComposer();
        panel.appendChild(this.composerEl);

        this.settingsDialog = this.buildSettingsDialog();
        panel.appendChild(this.settingsDialog);

        return panel;
    }

    private buildHeader(): HTMLElement {
        const header = document.createElement("div");
        header.className = "cb-header";

        const title = document.createElement("span");
        title.className = "cb-title";
        title.textContent = this.config.title;

        const actions = document.createElement("div");
        actions.className = "cb-actions";

        const clear = this.buildIconButton(TRASH_ICON, "Clear chat", () => this.clearChat());
        actions.appendChild(clear);

        this.themeToggleBtn = this.buildIconButton(SUN_ICON, "Toggle theme", () => this.toggleTheme());
        this.renderThemeToggleIcon();
        actions.appendChild(this.themeToggleBtn);

        if (this.config.allowSettings) {
            this.settingsToggle = this.buildIconButton(GEAR_ICON, "Settings", () => this.openSettings());
            actions.appendChild(this.settingsToggle);
        }

        const close = this.buildIconButton("\u2715", "Close", () => this.toggleOpen());
        actions.appendChild(close);

        header.appendChild(title);
        header.appendChild(actions);
        return header;
    }

    private buildIconButton(content: string, title: string, onClick: () => void): HTMLButtonElement {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "cb-icon-btn";
        button.title = title;
        if (content.startsWith("<")) {
            button.innerHTML = content;
        } else {
            button.textContent = content;
        }
        button.addEventListener("click", onClick);
        return button;
    }

    private buildComposer(): HTMLFormElement {
        const form = document.createElement("form");
        form.className = "cb-composer";

        this.textarea = document.createElement("textarea");
        this.textarea.rows = 1;
        this.textarea.placeholder = "Type a message\u2026";
        this.textarea.addEventListener("keydown", (event) => {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                this.submit();
            }
        });
        this.textarea.addEventListener("input", () => this.refreshSendState());

        this.sendButton = document.createElement("button");
        this.sendButton.type = "submit";
        this.sendButton.className = "cb-send";
        this.sendButton.textContent = "Send";
        this.sendButton.disabled = true;

        form.addEventListener("submit", (event) => {
            event.preventDefault();
            this.submit();
        });

        form.appendChild(this.textarea);
        form.appendChild(this.sendButton);
        return form;
    }

    // #endregion

    // #region Settings

    private buildSettingsDialog(): HTMLDialogElement {
        const dialog = document.createElement("dialog");
        dialog.className = "cb-dialog";
        dialog.setAttribute("aria-label", "Settings");

        // Close when clicking the backdrop (outside the dialog body).
        dialog.addEventListener("click", (event) => {
            if (event.target === dialog) {
                this.closeSettings();
            }
        });

        const header = document.createElement("div");
        header.className = "cb-dialog-header";

        const title = document.createElement("span");
        title.className = "cb-title";
        title.textContent = "Settings";

        const close = this.buildIconButton("\u2715", "Close", () => this.closeSettings());

        header.appendChild(title);
        header.appendChild(close);
        dialog.appendChild(header);

        const body = document.createElement("div");
        body.className = "cb-dialog-body";

        body.appendChild(this.buildThemeField());

        const mode = this.buildSelectField("mode", "Mode", [
            { value: "model", label: "Model" },
            { value: "agent", label: "Foundry Agent" },
        ]);
        mode.input.addEventListener("change", () => this.applyModeVisibility());
        body.appendChild(mode.field);

        const openAIEndpoint = this.buildTextField("openAIEndpoint", "OpenAI Endpoint", "https://...openai.azure.com/openai/v1");
        const deploymentName = this.buildTextField("deploymentName", "Deployment Name", "gpt-4o-mini");
        this.modelFields = [openAIEndpoint, deploymentName];

        const foundryProjectEndpoint = this.buildTextField(
            "foundryProjectEndpoint",
            "Foundry Project Endpoint",
            "https://...services.ai.azure.com/api/projects/...",
        );
        const foundryAgentId = this.buildTextField("foundryAgentId", "Agent Id", "my-agent");
        const foundryAgentVersion = this.buildTextField("foundryAgentVersion", "Agent Version", "(latest)");
        this.agentFields = [foundryProjectEndpoint, foundryAgentId, foundryAgentVersion];

        body.appendChild(openAIEndpoint);
        body.appendChild(deploymentName);
        body.appendChild(foundryProjectEndpoint);
        body.appendChild(foundryAgentId);
        body.appendChild(foundryAgentVersion);

        body.appendChild(this.buildTextField("agentName", "Agent Name", "ChatAgent"));
        body.appendChild(this.buildTextAreaField("systemPrompt", "System Prompt", "You are a friendly, concise assistant."));

        const hint = document.createElement("p");
        hint.className = "cb-hint";
        hint.textContent =
            "Saving applies these settings to this browser session and starts a new conversation. " +
            "Secrets are never overridable from the UI.";
        body.appendChild(hint);

        dialog.appendChild(body);

        const actions = document.createElement("div");
        actions.className = "cb-settings-actions";

        const cancel = document.createElement("button");
        cancel.type = "button";
        cancel.className = "cb-ghost";
        cancel.textContent = "Cancel";
        cancel.addEventListener("click", () => this.closeSettings());

        const save = document.createElement("button");
        save.type = "button";
        save.className = "cb-primary";
        save.textContent = "Save & restart";
        save.addEventListener("click", () => this.saveSettings());

        actions.appendChild(cancel);
        actions.appendChild(save);
        dialog.appendChild(actions);

        return dialog;
    }

    private buildTextField(key: keyof ChatSettings, label: string, placeholder: string): HTMLElement {
        const field = document.createElement("label");
        field.className = "cb-field";
        field.appendChild(document.createTextNode(label));

        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = placeholder;
        field.appendChild(input);

        this.settingsInputs[key] = input;
        return field;
    }

    private buildTextAreaField(key: keyof ChatSettings, label: string, placeholder: string): HTMLElement {
        const field = document.createElement("label");
        field.className = "cb-field";
        field.appendChild(document.createTextNode(label));

        const input = document.createElement("textarea");
        input.rows = 3;
        input.placeholder = placeholder;
        field.appendChild(input);

        this.settingsInputs[key] = input;
        return field;
    }

    /**
     * Builds the theme selector. Theme is a UI preference applied immediately
     * (and persisted) on change, independent of the per-session chat settings.
     */
    private buildThemeField(): HTMLElement {
        const field = document.createElement("label");
        field.className = "cb-field";
        field.appendChild(document.createTextNode("Theme"));

        const select = document.createElement("select");
        const options: Array<{ value: Theme; label: string }> = [
            { value: "system", label: "System" },
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
        ];
        for (const option of options) {
            const element = document.createElement("option");
            element.value = option.value;
            element.textContent = option.label;
            select.appendChild(element);
        }
        select.addEventListener("change", () => this.applyTheme(select.value as Theme));

        field.appendChild(select);
        this.themeSelect = select;
        return field;
    }

    /** Applies (and optionally persists) the theme. */
    private applyTheme(theme: Theme, persist = true): void {
        this.theme = theme;
        this.host.setAttribute("data-cb-theme", theme);
        if (this.themeSelect) {
            this.themeSelect.value = theme;
        }
        this.renderThemeToggleIcon();
        if (persist) {
            this.store.saveTheme(theme);
        }
    }

    /** Resolves the currently displayed theme, honouring the OS setting for "system". */
    private effectiveTheme(): "light" | "dark" {
        if (this.theme === "light" || this.theme === "dark") {
            return this.theme;
        }
        const prefersLight =
            typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: light)").matches;
        return prefersLight ? "light" : "dark";
    }

    /** Header quick-toggle: flips between an explicit light and dark theme. */
    private toggleTheme(): void {
        const next: Theme = this.effectiveTheme() === "light" ? "dark" : "light";
        this.applyTheme(next);
    }

    /** Updates the header toggle glyph to reflect the action it performs. */
    private renderThemeToggleIcon(): void {
        if (!this.themeToggleBtn) {
            return;
        }
        const isLight = this.effectiveTheme() === "light";
        this.themeToggleBtn.innerHTML = isLight ? MOON_ICON : SUN_ICON;
        this.themeToggleBtn.title = isLight ? "Switch to dark theme" : "Switch to light theme";
    }

    private buildSelectField(
        key: keyof ChatSettings,
        label: string,
        options: Array<{ value: string; label: string }>,
    ): { field: HTMLElement; input: HTMLSelectElement } {
        const field = document.createElement("label");
        field.className = "cb-field";
        field.appendChild(document.createTextNode(label));

        const select = document.createElement("select");
        for (const option of options) {
            const element = document.createElement("option");
            element.value = option.value;
            element.textContent = option.label;
            select.appendChild(element);
        }
        field.appendChild(select);

        this.settingsInputs[key] = select;
        return { field, input: select };
    }

    private loadSettings(): void {
        const saved = this.store.loadSettings();
        if (saved) {
            this.settings = { ...EMPTY_SETTINGS, ...saved };
            this.settingsLoaded = true;
            return;
        }

        void fetchDefaultSettings(this.config.apiBase).then((defaults) => {
            if (defaults) {
                this.settings = { ...EMPTY_SETTINGS, ...defaults };
                if (defaults.configured === false) {
                    this.configNotice =
                        defaults.configurationMessage ??
                        "The chatbot backend isn't fully configured yet. Open Settings to provide the required values.";
                    this.renderMessages();
                }
            }
            this.settingsLoaded = true;
        });
    }

    private populateSettingsForm(): void {
        if (this.themeSelect) {
            this.themeSelect.value = this.theme;
        }
        for (const key of Object.keys(this.settingsInputs) as Array<keyof ChatSettings>) {
            const input = this.settingsInputs[key];
            if (input) {
                input.value = this.settings[key] ?? "";
            }
        }
        this.applyModeVisibility();
    }

    private applyModeVisibility(): void {
        const modeInput = this.settingsInputs.mode as HTMLSelectElement | undefined;
        const isModel = (modeInput?.value ?? "model") === "model";
        for (const field of this.modelFields) {
            field.hidden = !isModel;
        }
        for (const field of this.agentFields) {
            field.hidden = isModel;
        }
    }

    private saveSettings(): void {
        const next: ChatSettings = { ...EMPTY_SETTINGS };
        for (const key of Object.keys(this.settingsInputs) as Array<keyof ChatSettings>) {
            next[key] = this.settingsInputs[key]?.value ?? "";
        }

        this.settings = next;
        this.store.saveSettings(next);

        // A new agent gets a clean conversation.
        this.conversation = { threadId: null, messages: [] };
        this.persist();
        this.renderMessages();

        this.closeSettings();
    }

    private openSettings(): void {
        this.populateSettingsForm();
        this.settingsDialog.showModal();
    }

    private closeSettings(): void {
        this.settingsDialog.close();
    }

    // #endregion

    // #region Messaging

    private toggleOpen(): void {
        this.isOpen = !this.isOpen;
        this.panel.hidden = !this.isOpen;
        this.renderLauncherIcon();
        this.launcher.title = this.isOpen ? "Close chat" : "Open chat";
        if (this.isOpen) {
            this.scrollToBottom();
            this.textarea.focus();
        }
    }

    private refreshSendState(): void {
        this.sendButton.disabled = this.isBusy || this.textarea.value.trim().length === 0;
    }

    private submit(): void {
        const text = this.textarea.value.trim();
        if (!text || this.isBusy) {
            return;
        }
        this.textarea.value = "";
        this.refreshSendState();
        void this.send(text);
    }

    private async send(text: string): Promise<void> {
        this.conversation.messages.push({ role: "user", text });
        const botMessage: ChatMessage = { role: "bot", text: "" };
        this.conversation.messages.push(botMessage);
        this.renderMessages();
        this.setBusy(true);
        this.beginStreaming(botMessage);

        const overrides = this.settingsLoaded ? this.settings : null;
        logger.debug("sending message", { length: text.length, threadId: this.conversation.threadId });

        try {
            await streamChat(
                this.config.apiBase,
                text,
                this.conversation.threadId,
                overrides,
                {
                    onThread: (threadId) => {
                        this.conversation.threadId = threadId;
                    },
                    onDelta: (delta) => {
                        botMessage.text += delta;
                        this.startStreamLoop();
                    },
                    onReasoning: (delta) => {
                        botMessage.reasoning = (botMessage.reasoning ?? "") + delta;
                        this.startStreamLoop();
                    },
                },
            );
            logger.debug("message exchange finished", { replyLength: botMessage.text.length });
        } catch (error) {
            logger.error("chat request failed", error);
            botMessage.text = "Sorry, something went wrong. Please try again.";
        } finally {
            this.finishStreaming();
            this.setBusy(false);
            this.persist();
        }
    }

    private setBusy(busy: boolean): void {
        this.isBusy = busy;
        this.textarea.disabled = busy;
        this.refreshSendState();
    }

    private renderMessages(): void {
        this.messagesEl.replaceChildren();

        if (this.configNotice) {
            this.messagesEl.appendChild(this.buildConfigNotice(this.configNotice));
        }

        if (this.conversation.messages.length === 0) {
            const empty = document.createElement("div");
            empty.className = "cb-empty";
            empty.textContent = this.config.greeting;
            this.messagesEl.appendChild(empty);
            return;
        }

        for (const message of this.conversation.messages) {
            const element = document.createElement("div");
            element.className = `cb-message ${message.role}`;
            if (message.role === "bot") {
                this.renderBotMessage(element, message);
            } else {
                // textContent (never innerHTML) keeps user content from being
                // interpreted as markup in the host page.
                element.textContent = message.text;
            }
            this.messagesEl.appendChild(element);
        }

        this.scrollToBottom();
    }

    /**
     * Renders a bot bubble: an optional collapsible "thinking" section holding
     * the model reasoning, followed by the answer text. The reasoning panel is
     * expanded while streaming and collapses once the reply is complete.
     */
    private renderBotMessage(container: HTMLDivElement, message: ChatMessage): void {
        container.replaceChildren();

        if (message.reasoning) {
            const thinking = document.createElement("details");
            thinking.className = "cb-thinking";
            thinking.open = this.isBusy;

            const summary = document.createElement("summary");
            summary.className = "cb-thinking-summary";
            summary.textContent = this.isBusy ? "Thinking\u2026" : "Thoughts";

            const body = document.createElement("div");
            body.className = "cb-thinking-body";
            // textContent (never innerHTML) keeps reasoning from being
            // interpreted as markup in the host page.
            body.textContent = message.reasoning;

            thinking.append(summary, body);
            container.appendChild(thinking);
        }

        // While the reply is still empty and a request is in flight, show an
        // animated "processing" indicator instead of the answer text.
        if (!message.text && this.isBusy) {
            container.appendChild(this.buildTypingIndicator());
            return;
        }

        const text = document.createElement("div");
        text.className = "cb-text";
        text.textContent = message.text;
        container.appendChild(text);
    }

    /** Builds the animated three-dot "processing" indicator. */
    private buildTypingIndicator(): HTMLDivElement {
        const indicator = document.createElement("div");
        indicator.className = "cb-typing";
        indicator.setAttribute("aria-label", "Processing");
        for (let i = 0; i < 3; i += 1) {
            const dot = document.createElement("span");
            dot.className = "cb-typing-dot";
            indicator.appendChild(dot);
        }
        return indicator;
    }

    /**
     * Builds the configuration reminder banner shown when the backend reports it is
     * missing required environment variables. When the settings panel is available the
     * banner offers a button that opens it so the values can be supplied for this session.
     */
    private buildConfigNotice(text: string): HTMLDivElement {
        const notice = document.createElement("div");
        notice.className = "cb-notice";
        notice.setAttribute("role", "status");

        const body = document.createElement("div");
        body.className = "cb-notice-text";
        // textContent (never innerHTML) keeps the message from being interpreted as markup.
        body.textContent = text;
        notice.appendChild(body);

        if (this.config.allowSettings) {
            const open = document.createElement("button");
            open.type = "button";
            open.className = "cb-notice-btn";
            open.textContent = "Open Settings";
            open.addEventListener("click", () => this.openSettings());
            notice.appendChild(open);
        }

        return notice;
    }

    private scrollToBottom(): void {
        this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    }

    /**
     * Prepares the freshly rendered bot bubble for streaming: clears it, shows
     * the processing indicator, and resets the typewriter reveal counters.
     */
    private beginStreaming(message: ChatMessage): void {
        const last = this.messagesEl.lastElementChild;
        this.streamingEl = last instanceof HTMLDivElement ? last : null;
        this.streamingMessage = message;
        this.streamDone = false;
        this.shownTextLen = 0;
        this.shownReasoningLen = 0;
        this.streamTextEl = null;
        this.streamReasoningWrap = null;
        this.streamReasoningBody = null;
        this.streamTypingEl = null;

        if (this.streamingEl !== null) {
            this.streamingEl.replaceChildren();
            this.streamTypingEl = this.buildTypingIndicator();
            this.streamingEl.appendChild(this.streamTypingEl);
        }

        this.startStreamLoop();
    }

    /** Starts (or wakes) the typewriter reveal loop if it is not running. */
    private startStreamLoop(): void {
        if (this.streamFrame === 0 && this.streamingEl !== null) {
            this.streamFrame = requestAnimationFrame(this.streamTick);
        }
    }

    /**
     * One frame of the typewriter loop. Advances how much of the buffered text
     * and reasoning is shown, updating only the affected text nodes so the
     * output flows at a steady pace regardless of network burstiness.
     */
    private readonly streamTick = (): void => {
        this.streamFrame = 0;

        const message = this.streamingMessage;
        const container = this.streamingEl;
        if (message === null || container === null) {
            return;
        }

        const reasoning = message.reasoning ?? "";
        const text = message.text;

        this.shownReasoningLen = this.advanceReveal(this.shownReasoningLen, reasoning.length);
        this.shownTextLen = this.advanceReveal(this.shownTextLen, text.length);

        const atBottom = this.isScrolledToBottom();

        if (this.shownReasoningLen > 0) {
            this.ensureReasoningNodes(container);
            this.streamReasoningBody!.textContent = reasoning.slice(0, this.shownReasoningLen);
        }

        if (this.shownTextLen > 0) {
            if (this.streamTypingEl !== null) {
                this.streamTypingEl.remove();
                this.streamTypingEl = null;
            }
            this.ensureTextNode(container);
            this.streamTextEl!.textContent = text.slice(0, this.shownTextLen);
        }

        if (atBottom) {
            this.scrollToBottom();
        }

        const caughtUp = this.shownTextLen >= text.length && this.shownReasoningLen >= reasoning.length;
        if (caughtUp) {
            if (this.streamDone) {
                this.finalizeStreaming();
            }
            // Otherwise stay idle until the next delta restarts the loop.
            return;
        }

        this.streamFrame = requestAnimationFrame(this.streamTick);
    };

    /**
     * Returns the next reveal count: it moves toward the target by a fraction
     * of the remaining backlog (clamped) so large bursts catch up quickly while
     * a steady trickle is revealed gradually.
     */
    private advanceReveal(shown: number, target: number): number {
        if (shown >= target) {
            return target;
        }

        const backlog = target - shown;
        const step = Math.min(Math.max(2, Math.ceil(backlog / 8)), 24);
        return Math.min(target, shown + step);
    }

    /** Lazily creates the collapsible reasoning panel at the top of the bubble. */
    private ensureReasoningNodes(container: HTMLDivElement): void {
        if (this.streamReasoningWrap !== null) {
            return;
        }

        const thinking = document.createElement("details");
        thinking.className = "cb-thinking";
        thinking.open = true;

        const summary = document.createElement("summary");
        summary.className = "cb-thinking-summary";
        summary.textContent = "Thinking\u2026";

        const body = document.createElement("div");
        body.className = "cb-thinking-body";

        thinking.append(summary, body);
        container.insertBefore(thinking, container.firstChild);
        this.streamReasoningWrap = thinking;
        this.streamReasoningBody = body;
    }

    /** Lazily creates the answer text node at the end of the bubble. */
    private ensureTextNode(container: HTMLDivElement): void {
        if (this.streamTextEl !== null) {
            return;
        }

        const text = document.createElement("div");
        text.className = "cb-text";
        container.appendChild(text);
        this.streamTextEl = text;
    }

    /**
     * Signals that the backend stream has ended. The reveal loop keeps running
     * until all buffered text is shown, then finalizes the bubble.
     */
    private finishStreaming(): void {
        this.streamDone = true;

        if (this.streamingEl === null || this.streamingMessage === null) {
            this.clearStreamState();
            this.renderMessages();
            return;
        }

        this.startStreamLoop();
    }

    /** Collapses the reasoning panel and clears streaming state once complete. */
    private finalizeStreaming(): void {
        if (this.streamTypingEl !== null) {
            this.streamTypingEl.remove();
            this.streamTypingEl = null;
        }

        if (this.streamReasoningWrap !== null) {
            this.streamReasoningWrap.open = false;
            const summary = this.streamReasoningWrap.querySelector(".cb-thinking-summary");
            if (summary !== null) {
                summary.textContent = "Thoughts";
            }
        }

        this.clearStreamState();
    }

    /** Cancels any pending frame and resets all streaming state. */
    private clearStreamState(): void {
        if (this.streamFrame !== 0) {
            cancelAnimationFrame(this.streamFrame);
            this.streamFrame = 0;
        }

        this.streamingEl = null;
        this.streamingMessage = null;
        this.streamTextEl = null;
        this.streamReasoningWrap = null;
        this.streamReasoningBody = null;
        this.streamTypingEl = null;
        this.streamDone = false;
        this.shownTextLen = 0;
        this.shownReasoningLen = 0;
    }

    /** Reports whether the message list is scrolled to (or near) the bottom. */
    private isScrolledToBottom(): boolean {
        const { scrollTop, scrollHeight, clientHeight } = this.messagesEl;
        return scrollHeight - (scrollTop + clientHeight) <= 24;
    }

    private persist(): void {
        this.store.saveConversation(this.conversation);
    }

    /** Clears the current conversation and starts a fresh thread. */
    private clearChat(): void {
        if (this.isBusy) {
            return;
        }

        this.conversation = { threadId: null, messages: [] };
        this.persist();
        this.renderMessages();
        logger.debug("conversation cleared");
    }

    // #endregion
}
