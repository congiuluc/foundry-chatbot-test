using System.Text.Json;
using ChatApp.Models;

namespace ChatApp.Middleware;

/// <summary>
/// Middleware that converts unhandled exceptions into a consistent JSON error response.
/// </summary>
public sealed class ErrorHandlingMiddleware
{
    #region Fields

    private readonly RequestDelegate next;
    private readonly ILogger<ErrorHandlingMiddleware> logger;

    private static readonly JsonSerializerOptions SerializerOptions =
        new(JsonSerializerDefaults.Web);

    #endregion

    #region Construction

    /// <summary>
    /// Initializes a new instance of the <see cref="ErrorHandlingMiddleware"/> class.
    /// </summary>
    /// <param name="next">The next middleware in the pipeline.</param>
    /// <param name="logger">The logger instance.</param>
    public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
    {
        this.next = next;
        this.logger = logger;
    }

    #endregion

    #region Public Methods

    /// <summary>
    /// Invokes the middleware, handling any unhandled exception thrown downstream.
    /// </summary>
    /// <param name="context">The current HTTP context.</param>
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception processing {Path}", context.Request.Path);

            if (context.Response.HasStarted)
            {
                throw;
            }

            context.Response.Clear();
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";

            var payload = ApiResponse<object>.Fail("An unexpected error occurred.");
            await context.Response.WriteAsync(JsonSerializer.Serialize(payload, SerializerOptions));
        }
    }

    #endregion
}
