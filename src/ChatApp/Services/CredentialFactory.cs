using Azure.Core;
using Azure.Identity;
using ChatApp.Configuration;

namespace ChatApp.Services;

/// <summary>
/// Resolves the <see cref="TokenCredential"/> used to authenticate against
/// Microsoft Foundry when no API key is supplied.
/// </summary>
public sealed class CredentialFactory
{
    #region Fields

    private readonly ChatOptions chatOptions;

    #endregion

    #region Construction

    /// <summary>
    /// Initializes a new instance of the <see cref="CredentialFactory"/> class.
    /// </summary>
    /// <param name="chatOptions">The application chat options.</param>
    public CredentialFactory(ChatOptions chatOptions)
    {
        this.chatOptions = chatOptions;
    }

    #endregion

    #region Public Methods

    /// <summary>
    /// Creates a credential for Foundry authentication. When <c>AZURE_CLIENT_ID</c>
    /// is provided, a dedicated <see cref="ManagedIdentityCredential"/> is used to
    /// avoid the latency, credential probing, and fallback risks that
    /// <see cref="DefaultAzureCredential"/> introduces in production. When no client
    /// id is set (typically local development), the default credential chain is used.
    /// </summary>
    /// <returns>A configured <see cref="TokenCredential"/>.</returns>
    public TokenCredential CreateCredential()
    {
        if (!string.IsNullOrWhiteSpace(chatOptions.ManagedIdentityClientId))
        {
            return new ManagedIdentityCredential(
                ManagedIdentityId.FromUserAssignedClientId(chatOptions.ManagedIdentityClientId));
        }

        return new DefaultAzureCredential();
    }

    #endregion
}
