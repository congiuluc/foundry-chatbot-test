using ChatApp.Configuration;
using ChatApp.Endpoints;
using ChatApp.Middleware;
using ChatApp.Services;
using Serilog;

// Bootstrap Serilog so early startup failures are captured.
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    // Structured logging with console + rolling file sinks.
    builder.Host.UseSerilog((context, services, configuration) => configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .WriteTo.Console()
        .WriteTo.File(
            path: "logs/chatapp-.log",
            rollingInterval: RollingInterval.Day,
            retainedFileCountLimit: 7));

    // Bind configuration from the ChatOptions section (env vars override) and validate.
    var chatOptions = ChatOptions.Load(builder.Configuration);
    chatOptions.Validate();
    builder.Services.AddSingleton(chatOptions);

    // Application services.
    builder.Services.AddSingleton<CredentialFactory>();
    builder.Services.AddSingleton<IChatAgentProvider, ChatAgentProvider>();

    // Swagger / OpenAPI.
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new() { Title = "ChatApp Foundry API", Version = "v1" });
    });

    // Response compression and health checks.
    builder.Services.AddResponseCompression();
    builder.Services.AddHealthChecks();

    // CORS so the widget can be embedded on other origins. When no origins are
    // configured (or "*" is listed) any origin is allowed; the API uses no cookies.
    var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
    builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
    {
        if (corsOrigins.Length == 0 || corsOrigins.Contains("*"))
        {
            policy.AllowAnyOrigin();
        }
        else
        {
            policy.WithOrigins(corsOrigins);
        }

        policy.AllowAnyHeader().AllowAnyMethod();
    }));

    var app = builder.Build();

    app.UseSerilogRequestLogging();
    app.UseMiddleware<ErrorHandlingMiddleware>();
    app.UseResponseCompression();
    app.UseCors();

    app.UseSwagger();
    app.UseSwaggerUI();

    app.UseDefaultFiles();
    app.UseStaticFiles();

    // Health, chat, and settings endpoints.
    app.MapChatEndpoints();

    Log.Information("Starting ChatApp in '{Mode}' mode.", chatOptions.Mode);
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "ChatApp terminated unexpectedly.");
    throw;
}
finally
{
    Log.CloseAndFlush();
}

// Exposes the implicit Program class for integration testing.
public partial class Program;
