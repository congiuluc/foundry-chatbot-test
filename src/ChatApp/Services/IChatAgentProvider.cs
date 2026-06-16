using ChatApp.Models;
using Microsoft.Agents.AI;

namespace ChatApp.Services;

/// <summary>
/// Resolves the <see cref="AIAgent"/> for a request (optionally applying per-request
/// overrides) and manages per-conversation <see cref="AgentSession"/> state.
/// </summary>
public interface IChatAgentProvider
{
    /// <summary>
    /// Resolves the agent for the effective configuration produced by applying the
    /// supplied <paramref name="overrides"/> on top of the server defaults. Agents are
    /// cached per distinct effective configuration.
    /// </summary>
    /// <param name="overrides">Optional per-request overrides.</param>
    /// <returns>The resolved <see cref="AIAgent"/>.</returns>
    /// <exception cref="InvalidOperationException">Thrown when the effective configuration is invalid.</exception>
    AIAgent GetAgent(ChatOverrides? overrides);

    /// <summary>
    /// Gets an existing conversation session by id, or creates a new one from the
    /// supplied <paramref name="agent"/> when missing.
    /// </summary>
    /// <param name="threadId">The conversation identifier supplied by the client.</param>
    /// <param name="agent">The agent that owns the session.</param>
    /// <param name="cancellationToken">A token to cancel session creation.</param>
    /// <returns>The associated <see cref="AgentSession"/>.</returns>
    Task<AgentSession> GetOrCreateSessionAsync(string threadId, AIAgent agent, CancellationToken cancellationToken);
}
