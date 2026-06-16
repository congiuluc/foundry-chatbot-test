using System.Net.ServerSentEvents;
using System.Runtime.CompilerServices;
using ChatApp.Configuration;
using ChatApp.Models;
using ChatApp.Services;
using Microsoft.Agents.AI;

namespace ChatApp.Endpoints;

/// <summary>
/// Maps the application's HTTP endpoints (health, streaming chat, and settings)
/// and contains the supporting Server-Sent Events streaming helper.
/// </summary>
public static class ChatEndpoints
{
    /// <summary>
    /// Registers the health, chat, and settings endpoints on the supplied route builder.
    /// </summary>
    /// <param name="app">The endpoint route builder to map the endpoints onto.</param>
    /// <returns>The same <paramref name="app"/> instance, to allow chaining.</returns>
    public static IEndpointRouteBuilder MapChatEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapHealthChecks("/healthz");
        MapChat(app);
        MapSettings(app);
        return app;
    }

    #region Endpoints

    /// <summary>
    /// Maps the streaming chat endpoint, which returns an agent response as Server-Sent Events.
    /// </summary>
    private static void MapChat(IEndpointRouteBuilder app)
    {
        app.MapPost("/chat", (
            ChatRequest request,
            IChatAgentProvider agentProvider,
            CancellationToken cancellationToken) =>
        {
            if (string.IsNullOrWhiteSpace(request.Message))
            {
                return Results.BadRequest(ApiResponse<object>.Fail("Message must not be empty."));
            }

            // Resolve the agent for the effective configuration (defaults + overrides).
            AIAgent agent;
            try
            {
                agent = agentProvider.GetAgent(request.Overrides);
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(ApiResponse<object>.Fail(ex.Message));
            }

            var threadId = string.IsNullOrWhiteSpace(request.ThreadId)
                ? Guid.NewGuid().ToString("N")
                : request.ThreadId;

            return Results.ServerSentEvents(
                StreamResponseAsync(agentProvider, agent, request.Message, threadId, cancellationToken));
        })
        .WithName("Chat")
        .WithSummary("Streams an agent response for the supplied message.");
    }

    /// <summary>
    /// Maps the settings endpoint, which exposes the non-secret default chat settings so the
    /// UI can prefill its form. Secrets (API key and managed identity client id) are never returned.
    /// </summary>
    private static void MapSettings(IEndpointRouteBuilder app)
    {
        app.MapGet("/settings", (ChatOptions options) =>
            Results.Ok(ApiResponse<object>.Ok(new
            {
                mode = options.Mode,
                openAIEndpoint = options.OpenAIEndpoint,
                deploymentName = options.DeploymentName,
                foundryProjectEndpoint = options.FoundryProjectEndpoint,
                foundryAgentId = options.FoundryAgentId,
                foundryAgentVersion = options.FoundryAgentVersion,
                systemPrompt = options.SystemPrompt,
                agentName = options.AgentName,
            })))
        .WithName("GetSettings")
        .WithSummary("Returns the non-secret default chat settings.");
    }

    #endregion

    #region Streaming

    /// <summary>
    /// Streams the agent response as Server-Sent Events: a "thread" event with the conversation
    /// id, one "reasoning" event per reasoning chunk (model thinking), one "delta" event per
    /// response chunk, then a final "done" event.
    /// </summary>
    /// <param name="agentProvider">The provider used to resolve or create the conversation session.</param>
    /// <param name="agent">The resolved agent that produces the streamed response.</param>
    /// <param name="message">The user message to send to the agent.</param>
    /// <param name="threadId">The conversation thread identifier.</param>
    /// <param name="cancellationToken">A token used to cancel the streaming operation.</param>
    /// <returns>An asynchronous stream of Server-Sent Event items.</returns>
    private static async IAsyncEnumerable<SseItem<string>> StreamResponseAsync(
        IChatAgentProvider agentProvider,
        AIAgent agent,
        string message,
        string threadId,
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        var session = await agentProvider.GetOrCreateSessionAsync(threadId, agent, cancellationToken);

        yield return new SseItem<string>(threadId, eventType: "thread");

        await foreach (var update in agent
            .RunStreamingAsync(message, session, cancellationToken: cancellationToken))
        {
            foreach (var content in update.Contents)
            {
                if (content is Microsoft.Extensions.AI.TextReasoningContent reasoning
                    && !string.IsNullOrEmpty(reasoning.Text))
                {
                    yield return new SseItem<string>(reasoning.Text, eventType: "reasoning");
                }
            }

            var text = update.Text;
            if (!string.IsNullOrEmpty(text))
            {
                yield return new SseItem<string>(text, eventType: "delta");
            }
        }

        yield return new SseItem<string>(threadId, eventType: "done");
    }

    #endregion
}
