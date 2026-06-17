import type { ChatSettings, DefaultSettingsResponse, SseEvent } from "./types";
import { logger } from "./logger";

/**
 * Parses a block of Server-Sent Events text into discrete events. Multi-line
 * data is rejoined with newlines and a single leading space after "data:" is
 * stripped per the SSE specification.
 */
export function parseSse(block: string): SseEvent[] {
    const events: SseEvent[] = [];

    for (const raw of block.split("\n\n")) {
        let event = "message";
        const data: string[] = [];

        for (const line of raw.split("\n")) {
            if (line.startsWith("event:")) {
                event = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
                let value = line.slice(5);
                if (value.startsWith(" ")) {
                    value = value.slice(1);
                }
                data.push(value);
            }
        }

        if (data.length > 0) {
            events.push({ event, data: data.join("\n") });
        }
    }

    return events;
}

/** Callbacks invoked while a chat response is streamed. */
export interface ChatStreamHandlers {
    onThread: (threadId: string) => void;
    onDelta: (text: string) => void;
    onReasoning: (text: string) => void;
}

/**
 * Posts a message to the backend and streams the Server-Sent Events response,
 * invoking the supplied handlers as "thread" and "delta" events arrive.
 */
export async function streamChat(
    apiBase: string,
    message: string,
    threadId: string | null,
    overrides: ChatSettings | null,
    handlers: ChatStreamHandlers,
    signal?: AbortSignal,
): Promise<void> {
    const response = await fetch(`${apiBase}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, threadId, overrides }),
        signal,
    });

    logger.debug("chat request sent", { apiBase, threadId, hasOverrides: overrides !== null });

    if (!response.ok || !response.body) {
        logger.error("chat request failed", { status: response.status, hasBody: response.body !== null });
        throw new Error(`Chat request failed with status ${response.status}.`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let threadEvents = 0;
    let deltaEvents = 0;
    let reasoningEvents = 0;

    for (;;) {
        const { value, done } = await reader.read();
        if (done) {
            break;
        }

        buffer += decoder.decode(value, { stream: true });
        const boundary = buffer.lastIndexOf("\n\n");
        if (boundary === -1) {
            continue;
        }

        const ready = buffer.slice(0, boundary + 2);
        buffer = buffer.slice(boundary + 2);

        for (const evt of parseSse(ready)) {
            const frame = interpretFrame(evt);
            if (frame.type === "thread") {
                threadEvents += 1;
                handlers.onThread(frame.data);
            } else if (frame.type === "delta") {
                deltaEvents += 1;
                handlers.onDelta(frame.data);
            } else if (frame.type === "reasoning") {
                reasoningEvents += 1;
                handlers.onReasoning(frame.data);
            } else {
                logger.debug("ignoring stream frame", { type: frame.type });
            }
        }
    }

    logger.debug("chat stream complete", { threadEvents, deltaEvents, reasoningEvents });
}

/** A normalized stream frame: a logical event type and its string payload. */
interface StreamFrame {
    type: string;
    data: string;
}

/**
 * Normalizes a parsed SSE event into a logical frame. A correctly formatted
 * backend sets the SSE event name directly (thread/delta/done). As a fallback,
 * older responses wrap each frame as a JSON payload on the default "message"
 * event, carrying the real type in an "eventType" field
 * (e.g. {"data":"Hi","eventType":"delta"}); that shape is unwrapped here.
 */
function interpretFrame(evt: SseEvent): StreamFrame {
    if (evt.event && evt.event !== "message") {
        return { type: evt.event, data: evt.data };
    }

    try {
        const payload = JSON.parse(evt.data) as { data?: unknown; eventType?: unknown };
        if (payload && typeof payload.eventType === "string") {
            return {
                type: payload.eventType,
                data: typeof payload.data === "string" ? payload.data : "",
            };
        }
    } catch {
        // Not JSON: fall back to the raw SSE event name and data below.
    }

    return { type: evt.event, data: evt.data };
}

/** Fetches the non-secret default settings exposed by the backend. */
export async function fetchDefaultSettings(apiBase: string): Promise<DefaultSettingsResponse | null> {
    try {
        const response = await fetch(`${apiBase}/settings`);
        if (!response.ok) {
            logger.warn("default settings request returned a non-OK status", { status: response.status });
            return null;
        }
        const payload = (await response.json()) as { data?: DefaultSettingsResponse };
        logger.debug("default settings loaded", payload.data ?? null);
        return payload.data ?? null;
    } catch (error) {
        logger.warn("failed to fetch default settings", error);
        return null;
    }
}
