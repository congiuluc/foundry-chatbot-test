import type { ChatSettings, Conversation, Theme } from "./types";
import { logger } from "./logger";

/**
 * Session-scoped persistence for the widget. Keys are namespaced so multiple
 * widgets (or multiple sites) do not collide in the same browser session.
 */
export class SessionStore {
    private readonly historyKey: string;
    private readonly settingsKey: string;
    private readonly themeKey: string;

    public constructor(namespace: string) {
        this.historyKey = `${namespace}:history`;
        this.settingsKey = `${namespace}:settings`;
        this.themeKey = `${namespace}:theme`;
    }

    /** Loads the persisted conversation, or an empty conversation when none exists. */
    public loadConversation(): Conversation {
        return this.read<Conversation>(this.historyKey) ?? { threadId: null, messages: [] };
    }

    /** Persists the supplied conversation. */
    public saveConversation(conversation: Conversation): void {
        this.write(this.historyKey, conversation);
    }

    /** Loads the persisted per-session settings, or <c>null</c> when none exist. */
    public loadSettings(): ChatSettings | null {
        return this.read<ChatSettings>(this.settingsKey);
    }

    /** Persists the supplied per-session settings. */
    public saveSettings(settings: ChatSettings): void {
        this.write(this.settingsKey, settings);
    }

    /** Loads the persisted theme preference, or <c>null</c> when none exists. */
    public loadTheme(): Theme | null {
        return this.read<Theme>(this.themeKey);
    }

    /** Persists the supplied theme preference. */
    public saveTheme(theme: Theme): void {
        this.write(this.themeKey, theme);
    }

    private read<T>(key: string): T | null {
        try {
            const raw = sessionStorage.getItem(key);
            return raw ? (JSON.parse(raw) as T) : null;
        } catch (error) {
            logger.warn("failed to read from session storage", { key, error });
            return null;
        }
    }

    private write(key: string, value: unknown): void {
        try {
            sessionStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            // Ignore storage quota / privacy-mode failures.
            logger.warn("failed to write to session storage", { key, error });
        }
    }
}
