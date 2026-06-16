namespace ChatApp.Models;

/// <summary>
/// Optional, per-request overrides supplied by the client to change how the
/// chatbot connects for the current conversation only. Empty or whitespace
/// values are ignored and the server defaults are used instead. Secrets such as
/// the API key and managed identity client id can never be overridden by the client.
/// </summary>
public sealed record ChatOverrides
{
    /// <summary>Overrides the backend mode (<c>model</c> or <c>agent</c>).</summary>
    public string? Mode { get; init; }

    /// <summary>Overrides the Azure OpenAI / Foundry models endpoint.</summary>
    public string? OpenAIEndpoint { get; init; }

    /// <summary>Overrides the model deployment name.</summary>
    public string? DeploymentName { get; init; }

    /// <summary>Overrides the Foundry project endpoint.</summary>
    public string? FoundryProjectEndpoint { get; init; }

    /// <summary>Overrides the existing Foundry agent identifier.</summary>
    public string? FoundryAgentId { get; init; }

    /// <summary>Overrides the Foundry agent version.</summary>
    public string? FoundryAgentVersion { get; init; }

    /// <summary>Overrides the system prompt / instructions.</summary>
    public string? SystemPrompt { get; init; }

    /// <summary>Overrides the display name reported for the agent.</summary>
    public string? AgentName { get; init; }
}
