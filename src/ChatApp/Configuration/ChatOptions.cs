namespace ChatApp.Configuration;

using ChatApp.Models;
using Microsoft.Extensions.Configuration;

/// <summary>
/// Strongly-typed application options bound from the <c>ChatOptions</c>
/// configuration section, with environment variables taking precedence.
/// Controls how the chatbot connects to Microsoft Foundry.
/// </summary>
public sealed class ChatOptions
{
    #region Constants

    /// <summary>Configuration section name that backs these options.</summary>
    public const string SectionName = "ChatOptions";

    /// <summary>Backend mode that talks directly to a deployed model.</summary>
    public const string ModeModel = "model";

    /// <summary>Backend mode that talks to an existing Foundry agent.</summary>
    public const string ModeAgent = "agent";

    #endregion

    #region Properties

    /// <summary>
    /// Selects the backend: <c>model</c> for a direct model deployment or
    /// <c>agent</c> for an existing Microsoft Foundry agent. Read from <c>AI_MODE</c>.
    /// </summary>
    public string Mode { get; set; } = ModeModel;

    /// <summary>Azure OpenAI / Foundry models endpoint. Read from <c>AZURE_OPENAI_ENDPOINT</c>.</summary>
    public string? OpenAIEndpoint { get; set; }

    /// <summary>Model deployment name. Read from <c>AZURE_OPENAI_DEPLOYMENT_NAME</c>.</summary>
    public string? DeploymentName { get; set; }

    /// <summary>Optional API key. When empty, managed identity is used. Read from <c>AZURE_OPENAI_API_KEY</c>.</summary>
    public string? ApiKey { get; set; }

    /// <summary>Foundry project endpoint. Read from <c>AZURE_FOUNDRY_PROJECT_ENDPOINT</c>.</summary>
    public string? FoundryProjectEndpoint { get; set; }

    /// <summary>Existing Foundry agent identifier. Read from <c>AZURE_FOUNDRY_AGENT_ID</c>.</summary>
    public string? FoundryAgentId { get; set; }

    /// <summary>Optional Foundry agent version. When empty, the latest version is used. Read from <c>AZURE_FOUNDRY_AGENT_VERSION</c>.</summary>
    public string? FoundryAgentVersion { get; set; }

    /// <summary>Optional user-assigned managed identity client id. Read from <c>AZURE_CLIENT_ID</c>.</summary>
    public string? ManagedIdentityClientId { get; set; }

    /// <summary>System prompt / instructions for the agent. Read from <c>CHAT_SYSTEM_PROMPT</c>.</summary>
    public string SystemPrompt { get; set; } =
        "You are a friendly, concise assistant. Keep your answers brief and helpful.";

    /// <summary>Display name reported for the agent.</summary>
    public string AgentName { get; set; } = "ChatAgent";

    #endregion

    #region Factory

    /// <summary>
    /// Builds a <see cref="ChatOptions"/> instance from the <see cref="SectionName"/>
    /// configuration section, then applies environment variable overrides. Environment
    /// variables take precedence so container deployments can override appsettings values.
    /// </summary>
    /// <param name="configuration">The application configuration.</param>
    /// <returns>A populated <see cref="ChatOptions"/> instance.</returns>
    public static ChatOptions Load(IConfiguration configuration)
    {
        var options = new ChatOptions();
        configuration.GetSection(SectionName).Bind(options);

        void Override(string key, Action<string> apply)
        {
            var value = Environment.GetEnvironmentVariable(key);
            if (!string.IsNullOrWhiteSpace(value))
            {
                apply(value);
            }
        }

        Override("AI_MODE", value => options.Mode = value);
        Override("AZURE_OPENAI_ENDPOINT", value => options.OpenAIEndpoint = value);
        Override("AZURE_OPENAI_DEPLOYMENT_NAME", value => options.DeploymentName = value);
        Override("AZURE_OPENAI_API_KEY", value => options.ApiKey = value);
        Override("AZURE_FOUNDRY_PROJECT_ENDPOINT", value => options.FoundryProjectEndpoint = value);
        Override("AZURE_FOUNDRY_AGENT_ID", value => options.FoundryAgentId = value);
        Override("AZURE_FOUNDRY_AGENT_VERSION", value => options.FoundryAgentVersion = value);
        Override("AZURE_CLIENT_ID", value => options.ManagedIdentityClientId = value);
        Override("CHAT_SYSTEM_PROMPT", value => options.SystemPrompt = value);
        Override("CHAT_AGENT_NAME", value => options.AgentName = value);

        options.Mode = string.IsNullOrWhiteSpace(options.Mode)
            ? ModeModel
            : options.Mode.Trim().ToLowerInvariant();

        return options;
    }

    #endregion

    #region Validation

    /// <summary>
    /// Validates that the options required for the selected <see cref="Mode"/> are present.
    /// </summary>
    /// <exception cref="InvalidOperationException">Thrown when required configuration is missing.</exception>
    public void Validate()
    {
        if (Mode is not (ModeModel or ModeAgent))
        {
            throw new InvalidOperationException(
                $"AI_MODE must be '{ModeModel}' or '{ModeAgent}', but was '{Mode}'.");
        }

        if (!IsConfigured(out var missing))
        {
            throw new InvalidOperationException(
                $"Required environment variable(s) not set for AI_MODE '{Mode}': {string.Join(", ", missing)}.");
        }
    }

    /// <summary>
    /// Checks, without throwing, whether the options required for the selected
    /// <see cref="Mode"/> are present. Used at startup so the application can run and
    /// prompt the user to supply configuration instead of crashing.
    /// </summary>
    /// <param name="missingVariables">
    /// Receives the names of the environment variables that still need to be set for the
    /// current mode. Empty when the configuration is complete.
    /// </param>
    /// <returns><see langword="true"/> when fully configured; otherwise <see langword="false"/>.</returns>
    public bool IsConfigured(out IReadOnlyList<string> missingVariables)
    {
        var missing = new List<string>();

        if (Mode is not (ModeModel or ModeAgent))
        {
            missing.Add("AI_MODE");
        }
        else if (Mode == ModeModel)
        {
            AddIfMissing(missing, OpenAIEndpoint, "AZURE_OPENAI_ENDPOINT");
            AddIfMissing(missing, DeploymentName, "AZURE_OPENAI_DEPLOYMENT_NAME");
        }
        else
        {
            AddIfMissing(missing, FoundryProjectEndpoint, "AZURE_FOUNDRY_PROJECT_ENDPOINT");
            AddIfMissing(missing, FoundryAgentId, "AZURE_FOUNDRY_AGENT_ID");
        }

        missingVariables = missing;
        return missing.Count == 0;
    }

    private static void AddIfMissing(List<string> missing, string? value, string variableName)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            missing.Add(variableName);
        }
    }

    /// <summary>Indicates whether an API key was supplied.</summary>
    public bool HasApiKey => !string.IsNullOrWhiteSpace(ApiKey);

    #endregion

    #region Overrides

    /// <summary>
    /// Produces a copy of these options with the supplied non-empty
    /// <paramref name="overrides"/> applied. Secrets (API key and managed identity
    /// client id) are never overridable and are carried over unchanged.
    /// </summary>
    /// <param name="overrides">The per-request overrides, or <see langword="null"/>.</param>
    /// <returns>A new <see cref="ChatOptions"/> instance.</returns>
    public ChatOptions WithOverrides(ChatOverrides? overrides)
    {
        var clone = new ChatOptions
        {
            Mode = Mode,
            OpenAIEndpoint = OpenAIEndpoint,
            DeploymentName = DeploymentName,
            ApiKey = ApiKey,
            FoundryProjectEndpoint = FoundryProjectEndpoint,
            FoundryAgentId = FoundryAgentId,
            FoundryAgentVersion = FoundryAgentVersion,
            ManagedIdentityClientId = ManagedIdentityClientId,
            SystemPrompt = SystemPrompt,
            AgentName = AgentName,
        };

        if (overrides is null)
        {
            return clone;
        }

        void Apply(string? value, Action<string> set)
        {
            if (!string.IsNullOrWhiteSpace(value))
            {
                set(value);
            }
        }

        Apply(overrides.Mode, value => clone.Mode = value.Trim().ToLowerInvariant());
        Apply(overrides.OpenAIEndpoint, value => clone.OpenAIEndpoint = value);
        Apply(overrides.DeploymentName, value => clone.DeploymentName = value);
        Apply(overrides.FoundryProjectEndpoint, value => clone.FoundryProjectEndpoint = value);
        Apply(overrides.FoundryAgentId, value => clone.FoundryAgentId = value);
        Apply(overrides.FoundryAgentVersion, value => clone.FoundryAgentVersion = value);
        Apply(overrides.SystemPrompt, value => clone.SystemPrompt = value);
        Apply(overrides.AgentName, value => clone.AgentName = value);

        return clone;
    }

    /// <summary>
    /// Builds a stable cache key that identifies an agent configuration. Excludes
    /// secrets, which are not part of how the agent instance is distinguished.
    /// </summary>
    /// <returns>A deterministic key for caching agents.</returns>
    public string ComputeAgentKey() => string.Join(
        '|',
        Mode,
        OpenAIEndpoint,
        DeploymentName,
        FoundryProjectEndpoint,
        FoundryAgentId,
        FoundryAgentVersion,
        SystemPrompt,
        AgentName);

    #endregion
}
