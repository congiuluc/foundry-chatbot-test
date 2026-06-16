/**
 * Lightweight console logger for the embeddable widget. Every message is
 * prefixed so host-page developers can filter widget output. <c>debug</c>
 * messages are suppressed unless verbose logging is enabled (via the embedding
 * script's <c>data-debug="true"</c> attribute); warnings and errors always log.
 */

const PREFIX = "[chatbot-widget]";

let debugEnabled = false;

/** Enables or disables verbose <c>debug</c> logging at runtime. */
export function setDebugLogging(enabled: boolean): void {
    debugEnabled = enabled;
    if (enabled) {
        console.info(PREFIX, "verbose logging enabled");
    }
}

/** Indicates whether verbose <c>debug</c> logging is currently enabled. */
export function isDebugLogging(): boolean {
    return debugEnabled;
}

export const logger = {
    /** Logs a verbose diagnostic message (only when debug logging is enabled). */
    debug(...args: unknown[]): void {
        if (debugEnabled) {
            console.debug(PREFIX, ...args);
        }
    },
    /** Logs an informational message. */
    info(...args: unknown[]): void {
        console.info(PREFIX, ...args);
    },
    /** Logs a warning message. */
    warn(...args: unknown[]): void {
        console.warn(PREFIX, ...args);
    },
    /** Logs an error message. */
    error(...args: unknown[]): void {
        console.error(PREFIX, ...args);
    },
};
