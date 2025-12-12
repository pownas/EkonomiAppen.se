# Setup-instruktioner för e-postregistrering

## .NET 8+ Minimal API Backend (Nuvarande implementation)

Sajten använder en modern .NET minimal API backend med self-contained deployment som sparar e-postadresser direkt i MySQL-databasen.

### Steg-för-steg installation:

#### 1. Skapa MySQL-databasen

Kör SQL-skriptet för att skapa databasen och tabellen:

```bash
mysql -u root -p < database/setup.sql
```

Eller logga in i MySQL och kör:

```bash
mysql -u root -p
```

Sedan:
```sql
source /path/to/database/setup.sql
```

#### 2. Konfigurera databasanslutning

Kopiera exempelfilen och lägg till riktiga uppgifter:

```bash
cd api
cp appsettings.local.json.example appsettings.local.json
```

Öppna `api/appsettings.local.json` och uppdatera:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=ekonomiappen;User=your_username;Password=YOUR_REAL_PASSWORD;SSL Mode=None;"
  }
}
```

**VIKTIGT:** Filen `appsettings.local.json` är redan i `.gitignore` och kommer inte commitas.

#### 3. Bygg och kör API:et

**Development (lokalt):**

```bash
cd api
dotnet restore
dotnet run
```

API:et startar på `http://localhost:5000`

**Production (self-contained build):**

```bash
cd api
chmod +x build.sh
./build.sh
```

Detta skapar en self-contained executable i `api/publish/linux-x64/EkonomiAppenApi`

**Kör self-contained versionen:**

```bash
cd api/publish/linux-x64
./EkonomiAppenApi
```

#### 4. Säkerhetsinställningar (Viktigt!)

**a) Skapa en dedikerad MySQL-användare:**

```sql
CREATE USER 'ekonomiappen_user'@'localhost' IDENTIFIED BY 'STARKT_LÖSENORD';
#### 5. Testa installationen

**a) Testa API:et direkt:**

```bash
# Health check
curl http://localhost:5000/health

# Registrera e-post
curl -X POST http://localhost:5000/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Räkna prenumeranter
curl http://localhost:5000/api/subscriptions/count
```

**b) Testa via webbläsaren:**

1. Öppna sajten i en webbläsare
2. Fyll i en test-e-postadress
3. Kontrollera att den sparades i databasen:

```sql
SELECT * FROM email_subscriptions;
```
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=ekonomiappen;User=ekonomiappen_user;Password=PRODUCTION_PASSWORD;SSL Mode=Required;"
  },
  "Kestrel": {
    "Endpoints": {
      "Http": {
        "Url": "http://localhost:5000"
      }
    }
  }
}
```

**c) Systemd service (Linux):**

```bash
# Kopiera filen
sudo cp api/ekonomiappen-api.service /etc/systemd/system/

# Uppdatera sökvägar i servicefilen
sudo nano /etc/systemd/system/ekonomiappen-api.service

#### 6. Hantera registrerade e-postadresser
sudo systemctl daemon-reload
sudo systemctl enable ekonomiappen-api
sudo systemctl start ekonomiappen-api
sudo systemctl status ekonomiappen-api
```

#### 4. Testa installationen

1. Öppna sajten i en webbläsare
2. Fyll i en test-e-postadress
3. Kontrollera att den sparades i databasen:

```sql
SELECT * FROM email_subscriptions;
```

#### 5. Hantera registrerade e-postadresser

**Visa alla aktiva:**
```sql
SELECT * FROM active_subscriptions;
```

**Räkna totalt:**
```sql
SELECT COUNT(*) as total FROM email_subscriptions WHERE unsubscribed_at IS NULL;
```

**Exportera till CSV:**
```bash
mysql -u username -p -D ekonomiappen -e "SELECT email, subscribed_at FROM active_subscriptions" > emails.csv
```

**Exportera till JSON:**
```bash
mysql -u username -p -D ekonomiappen -e "SELECT email, subscribed_at FROM active_subscriptions" --batch --silent | \
awk 'BEGIN{print "["} NR>1{printf "%s{\"email\":\"%s\",\"subscribed_at\":\"%s\"}", (NR>2?",":""), $1, $2} END{print "]"}' > emails.json
```

**Ta bort en e-post (GDPR):**
```sql
UPDATE email_subscriptions SET unsubscribed_at = NOW() WHERE email = 'exempel@mail.se';
```

### Fallback-lagring

Om API:et inte är tillgängligt sparas e-postadresser lokalt i användarens webbläsare (localStorage). 
Du kan läsa dessa genom utvecklarkonsolens kommandon:

```javascript
// Läs lokalt sparade e-postadresser
JSON.parse(localStorage.getItem('notifyList'))
```

---

## Alternativa lösningar

### Alternativ 1: Formspree (Om du inte vill ha egen backend)

1. **Skapa ett gratis Formspree-konto:**
   - Gå till https://formspree.io
   - Skapa ett konto (gratis upp till 50 submissions/månad)

2. **Uppdatera kod:**
   I `src/script.js`, ändra fetch URL:en:
   ```javascript
   const response = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
   ```

### Alternativ 2: Netlify Forms

Om du hostar på Netlify kan du istället använda Netlify Forms:

1. Ändra `<form>` taggen till:
   ```html
   <form id="notifyForm" class="notify-form" name="notify" method="POST" data-netlify="true" netlify-honeypot="_gotcha">
   ```

2. Ta bort fetch-koden i `script.js` och låt formuläret skickas naturligt

### Alternativ 3: EmailJS

EmailJS är ett annat alternativ som skickar e-post direkt via JavaScript:

1. Skapa konto på https://www.emailjs.com/
2. Konfigurera en e-posttjänst
3. Använd deras SDK för att skicka meddelanden

---

## Felsökning

**Problem: "Connection refused" eller 500-fel**
- Kontrollera att MySQL-servern körs: `sudo service mysql status`
- Kontrollera att API:et körs: `curl http://localhost:5000/health`
- Verifiera connection string i `api/appsettings.local.json`
- Kolla loggar: `journalctl -u ekonomiappen-api -f` (om systemd service)
**Problem: CORS-fel i webbläsaren**
- Lägg till din domän i CORS-listan i `api/Program.cs`
- För produktion, uppdatera `.WithOrigins()` med rätt domän
- Om olika domäner, uppdatera `Access-Control-Allow-Origin`

**Problem: E-post sparas inte**
- Testa API:et direkt: 
  ```bash
  curl -X POST http://localhost:5000/api/subscribe \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com"}'
  ```
- Kontrollera MySQL-behörigheter för användaren
- Verifiera att connection string är korrekt

**Problem: Dubbletter sparas**
- Tabellen har UNIQUE constraint på email-kolumnen
- Om dubbletter ändå sparas, kör: `ALTER TABLE email_subscriptions ADD UNIQUE KEY unique_email (email);`
