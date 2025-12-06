# .NET Minimal API Backend för Ekonomiappen.se

Modern, self-contained .NET 8 minimal API för hantering av e-postregistreringar.

## Funktioner

- ✅ Self-contained deployment (ingen .NET runtime krävs på servern)
- ✅ Single-file executable
- ✅ MySQL-databas integration med Dapper
- ✅ CORS-konfigurerad
- ✅ Validering och error handling
- ✅ Health check endpoint
- ✅ Systemd service support

## API Endpoints

### POST /api/subscribe
Registrera en ny e-postadress.

**Request:**
```json
{
  "email": "user@example.com",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tack för din anmälan!"
}
```

### GET /api/subscriptions/count
Hämta antal aktiva prenumerationer.

**Response:**
```json
{
  "count": 42,
  "timestamp": "2025-12-06T10:30:00Z"
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-06T10:30:00Z"
}
```

## Utveckling

```bash
# Restore packages
dotnet restore

# Run locally
dotnet run

# Watch mode
dotnet watch run
```

## Build för produktion

```bash
# Linux x64 self-contained
./build.sh

# Eller manuellt
dotnet publish -c Release -r linux-x64 --self-contained true -o ./publish/linux-x64
```

## Konfiguration

Konfigurera via `appsettings.local.json` eller environment variables:

```bash
export ConnectionStrings__DefaultConnection="Server=localhost;Database=ekonomiappen;User=myuser;Password=mypass"
dotnet run
```

## Deployment

Se `SETUP.md` för detaljerade deployment-instruktioner inklusive systemd service setup.
