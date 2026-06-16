namespace ChatApp.Models;

/// <summary>
/// Inbound chat request sent by the client.
/// </summary>
/// <param name="Message">The user message to send to the agent.</param>
/// <param name="ThreadId">
/// Optional conversation identifier. When omitted, a new conversation is started.
/// </param>
/// <param name="Overrides">
/// Optional per-request configuration overrides for the current conversation.
/// </param>
public sealed record ChatRequest(string Message, string? ThreadId, ChatOverrides? Overrides);
