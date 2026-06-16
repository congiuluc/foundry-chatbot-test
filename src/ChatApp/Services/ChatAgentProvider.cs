using System.Collections.Concurrent;
using Azure;
using Azure.AI.Extensions.OpenAI;
using Azure.AI.OpenAI;
using Azure.AI.Projects;
using ChatApp.Configuration;
using ChatApp.Models;
using Microsoft.Agents.AI;
using OpenAI.Chat;

namespace ChatApp.Services;

/// <summary>
/// Builds and caches an <see cref="AIAgent"/> per distinct effective configuration
/// (server defaults plus optional per-request overrides) and keeps per-conversation
/// <see cref="AgentSession"/> instances in memory.
/// </summary>
public sealed class ChatAgentProvider : IChatAgentProvider
{
    #region Fields

    private readonly ChatOptions chatOptions;
    private readonly CredentialFactory credentialFactory;
    private readonly ILogger<ChatAgentProvider> logger;
    private readonly ConcurrentDictionary<string, Task<AgentSession>> sessions = new();
    private readonly ConcurrentDictionary<string, AIAgent> agents = new();

    #endregion

    #region Construction

    /// <summary>
    /// Initializes a new instance of the <see cref="ChatAgentProvider"/> class.
    /// </summary>
    /// <param name="chatOptions">The application chat options.</param>
    /// <param name="credentialFactory">The factory used to resolve Azure credentials.</param>
    /// <param name="logger">The logger instance.</param>
    public ChatAgentProvider(
        ChatOptions chatOptions,
        CredentialFactory credentialFactory,
        ILogger<ChatAgentProvider> logger)
    {
        this.chatOptions = chatOptions;
        this.credentialFactory = credentialFactory;
        this.logger = logger;
    }

    #endregion

    #region IChatAgentProvider

    /// <inheritdoc />
    public AIAgent GetAgent(ChatOverrides? overrides)
    {
        var effective = chatOptions.WithOverrides(overrides);
        effective.Validate();
        return agents.GetOrAdd(effective.ComputeAgentKey(), _ => CreateAgent(effective));
    }

    /// <inheritdoc />
    public Task<AgentSession> GetOrCreateSessionAsync(
        string threadId,
        AIAgent agent,
        CancellationToken cancellationToken)
    {
        return sessions.GetOrAdd(threadId, _ => agent.CreateSessionAsync(cancellationToken).AsTask());
    }

    #endregion

    #region Agent Creation

    /// <summary>
    /// Creates the agent for the effective backend mode.
    /// </summary>
    /// <param name="options">The effective options for this agent.</param>
    /// <returns>The constructed <see cref="AIAgent"/>.</returns>
    private AIAgent CreateAgent(ChatOptions options)
    {
        return options.Mode == ChatOptions.ModeAgent
            ? CreateFoundryAgent(options)
            : CreateModelAgent(options);
    }

    /// <summary>
    /// Creates an agent backed by a directly-deployed model using chat completions.
    /// </summary>
    /// <param name="options">The effective options for this agent.</param>
    private AIAgent CreateModelAgent(ChatOptions options)
    {
        var endpoint = new Uri(options.OpenAIEndpoint!);

        AzureOpenAIClient openAIClient = options.HasApiKey
            ? new AzureOpenAIClient(endpoint, new AzureKeyCredential(options.ApiKey!))
            : new AzureOpenAIClient(endpoint, credentialFactory.CreateCredential());

        logger.LogInformation(
            "Creating model-backed agent. Deployment={Deployment}, Auth={Auth}",
            options.DeploymentName,
            options.HasApiKey ? "ApiKey" : "ManagedIdentity");

        return openAIClient
            .GetChatClient(options.DeploymentName)
            .AsAIAgent(instructions: options.SystemPrompt, name: options.AgentName);
    }

    /// <summary>
    /// Resolves an existing agent hosted on Microsoft Foundry.
    /// </summary>
    /// <param name="options">The effective options for this agent.</param>
    private AIAgent CreateFoundryAgent(ChatOptions options)
    {
        var endpoint = new Uri(options.FoundryProjectEndpoint!);
        var projectClient = new AIProjectClient(endpoint, credentialFactory.CreateCredential());

        logger.LogInformation(
            "Resolving Foundry agent. AgentName={AgentName}, Auth=ManagedIdentity",
            options.FoundryAgentId);

        // Reference the named server-side agent (latest version when none is specified).
        var agentReference = new AgentReference(
            name: options.FoundryAgentId!,
            version: string.IsNullOrWhiteSpace(options.FoundryAgentVersion)
                ? null!
                : options.FoundryAgentVersion);

        return projectClient.AsAIAgent(agentReference);
    }

    #endregion
}
