/**
 * Shared types for the embeddable chatbot widget.
 */

/** Visual theme preference. "system" follows the OS colour-scheme setting. */
export type Theme = "system" | "light" | "dark";

/** Resolved configuration for a single widget instance. */
export interface WidgetConfig {
    /** Base URL of the ChatApp backend (no trailing slash). */
    apiBase: string;
    /** Title shown in the panel header. */
    title: string;
    /** Accent colour used for the launcher and primary actions. */
    accent: string;
    /** Optional URL of a custom launcher icon image; empty for the default. */
    launcherIcon: string;
    /** Background colour of the chat panel. */
    panelColor: string;
    /** Background colour of the user (outgoing) message bubbles. */
    userBubbleColor: string;
    /** Background colour of the bot (incoming) message bubbles. */
    botBubbleColor: string;
    /** Primary text colour used inside the panel. */
    textColor: string;
    /** Corner the widget is anchored to. */
    position: "bottom-right" | "bottom-left";
    /** Whether the settings panel (per-session overrides) is available. */
    allowSettings: boolean;
    /** Placeholder text shown when the conversation is empty. */
    greeting: string;
    /** Namespace used to scope session-storage keys. */
    storageKey: string;
    /** Whether verbose debug logging is emitted to the console. */
    debug: boolean;
}

/** Per-session configuration overrides sent with each chat request. */
export interface ChatSettings {
    mode: string;
    openAIEndpoint: string;
    deploymentName: string;
    foundryProjectEndpoint: string;
    foundryAgentId: string;
    foundryAgentVersion: string;
    systemPrompt: string;
    agentName: string;
}

/** A single rendered chat message. */
export interface ChatMessage {
    role: "user" | "bot";
    text: string;
    /** Accumulated model reasoning ("thinking") for a bot message, if any. */
    reasoning?: string;
}

/**
 * The payload returned by the backend `/settings` endpoint: the non-secret
 * default chat settings plus the backend configuration status used to remind
 * the user to supply missing environment variables or session settings.
 */
export interface DefaultSettingsResponse extends Partial<ChatSettings> {
    /** Whether the backend has all required configuration for its mode. */
    configured?: boolean;
    /** Environment variables still missing when not configured. */
    missingVariables?: string[];
    /** Human-readable reminder shown in the UI when not configured. */
    configurationMessage?: string | null;
}

/** A parsed Server-Sent Event. */
export interface SseEvent {
    event: string;
    data: string;
}

/** Persisted conversation state. */
export interface Conversation {
    threadId: string | null;
    messages: ChatMessage[];
}
