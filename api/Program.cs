using System.ComponentModel.DataAnnotations;
using MySqlConnector;
using Dapper;

var builder = WebApplication.CreateBuilder(args);

// Läs connection string från configuration
builder.Configuration.AddJsonFile("appsettings.json", optional: true);
builder.Configuration.AddJsonFile("appsettings.local.json", optional: true);
builder.Configuration.AddEnvironmentVariables();

// CORS-konfiguration
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
            "http://localhost:3000",
            "http://localhost:5500",
            "https://ekonomiappen.se",
            "https://www.ekonomiappen.se"
        )
        .AllowAnyMethod()
        .AllowAnyHeader();
    });
});

var app = builder.Build();

app.UseCors();

// Health check endpoint
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

// Subscribe endpoint
app.MapPost("/api/subscribe", async (SubscribeRequest request, IConfiguration config) =>
{
    // Validera input
    if (string.IsNullOrWhiteSpace(request.Email))
    {
        return Results.BadRequest(new ApiResponse 
        { 
            Success = false, 
            Message = "E-postadress saknas" 
        });
    }

    if (!new EmailAddressAttribute().IsValid(request.Email))
    {
        return Results.BadRequest(new ApiResponse 
        { 
            Success = false, 
            Message = "Ogiltig e-postadress" 
        });
    }

    var connectionString = config.GetConnectionString("DefaultConnection");
    
    if (string.IsNullOrEmpty(connectionString))
    {
        return Results.Problem("Databasanslutning saknas");
    }

    try
    {
        await using var connection = new MySqlConnection(connectionString);
        await connection.OpenAsync();

        // Kolla om e-posten redan finns
        var existingEmail = await connection.QueryFirstOrDefaultAsync<string>(
            "SELECT email FROM email_subscriptions WHERE email = @Email",
            new { Email = request.Email }
        );

        if (existingEmail != null)
        {
            return Results.Ok(new ApiResponse 
            { 
                Success = true, 
                Message = "E-posten är redan registrerad" 
            });
        }

        // Spara ny e-post
        await connection.ExecuteAsync(
            @"INSERT INTO email_subscriptions (email, subscribed_at, ip_address, user_agent) 
              VALUES (@Email, @SubscribedAt, @IpAddress, @UserAgent)",
            new
            {
                Email = request.Email,
                SubscribedAt = DateTime.UtcNow,
                IpAddress = request.IpAddress,
                UserAgent = request.UserAgent
            }
        );

        return Results.Created($"/api/subscriptions/{request.Email}", new ApiResponse 
        { 
            Success = true, 
            Message = "Tack för din anmälan!" 
        });
    }
    catch (MySqlException ex)
    {
        app.Logger.LogError(ex, "Database error");
        return Results.Problem("Ett databasfel uppstod");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Unexpected error");
        return Results.Problem("Ett oväntat fel uppstod");
    }
});

// GET endpoint för att räkna prenumeranter (administrativ)
app.MapGet("/api/subscriptions/count", async (IConfiguration config, HttpContext httpContext) =>
{
    var connectionString = config.GetConnectionString("DefaultConnection");
    
    if (string.IsNullOrEmpty(connectionString))
    {
        return Results.Problem("Databasanslutning saknas");
    }

    try
    {
        await using var connection = new MySqlConnection(connectionString);
        var count = await connection.ExecuteScalarAsync<int>(
            "SELECT COUNT(*) FROM email_subscriptions WHERE unsubscribed_at IS NULL"
        );

        return Results.Ok(new { count, timestamp = DateTime.UtcNow });
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Error counting subscriptions");
        return Results.Problem("Ett fel uppstod");
    }
});

app.Run();

// Models
public record SubscribeRequest(
    [EmailAddress] string Email,
    string? IpAddress = null,
    string? UserAgent = null
);

public record ApiResponse
{
    public bool Success { get; init; }
    public string Message { get; init; } = string.Empty;
}
