namespace ChatApp.Models;

/// <summary>
/// Standard envelope used for non-streaming JSON API responses.
/// </summary>
/// <typeparam name="T">The type of the payload carried in <see cref="Data"/>.</typeparam>
public sealed class ApiResponse<T>
{
    /// <summary>Gets or sets a value indicating whether the request succeeded.</summary>
    public bool Success { get; set; }

    /// <summary>Gets or sets the error message when <see cref="Success"/> is <c>false</c>.</summary>
    public string? Error { get; set; }

    /// <summary>Gets or sets the response payload when the request succeeded.</summary>
    public T? Data { get; set; }

    /// <summary>Creates a successful response wrapping <paramref name="data"/>.</summary>
    /// <param name="data">The payload to return.</param>
    /// <returns>A success <see cref="ApiResponse{T}"/>.</returns>
    public static ApiResponse<T> Ok(T data) => new() { Success = true, Data = data };

    /// <summary>Creates a failed response carrying <paramref name="error"/>.</summary>
    /// <param name="error">The error message.</param>
    /// <returns>A failure <see cref="ApiResponse{T}"/>.</returns>
    public static ApiResponse<T> Fail(string error) => new() { Success = false, Error = error };
}
