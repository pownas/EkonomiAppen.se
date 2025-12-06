# Setup-instruktioner för e-postregistrering

## MySQL + PHP Backend (Nuvarande implementation)

Sajten använder en egen PHP-backend som sparar e-postadresser direkt i MySQL-databasen.

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

Öppna `api/subscribe.php` och uppdatera dessa rader:

```php
define('DB_HOST', 'localhost');        // Din MySQL-server
define('DB_NAME', 'ekonomiappen');     // Databas-namn
define('DB_USER', 'your_username');    // Ditt MySQL-användarnamn
define('DB_PASS', 'your_password');    // Ditt MySQL-lösenord
```

**VIKTIGT:** Lägg till `api/subscribe.php` i `.gitignore` efter att du lagt in riktiga lösenord, eller använd en separat config-fil.

#### 3. Säkerhetsinställningar (Viktigt!)

För produktionsmiljö:

a) **Skapa en separat databaskonfigurationsfil:**

```bash
# Skapa config utanför webroot
cp api/subscribe.php api/subscribe.php.example
```

Skapa `config/database.php` (utanför `src/`):
```php
<?php
return [
    'host' => 'localhost',
    'name' => 'ekonomiappen',
    'user' => 'ekonomiappen_user',
    'pass' => 'STARKT_LÖSENORD_HÄR'
];
```

b) **Uppdatera `.gitignore`:**
```
config/database.php
api/subscribe.php
```

c) **Skapa en dedikerad MySQL-användare:**
```sql
CREATE USER 'ekonomiappen_user'@'localhost' IDENTIFIED BY 'STARKT_LÖSENORD';
GRANT SELECT, INSERT, UPDATE ON ekonomiappen.* TO 'ekonomiappen_user'@'localhost';
FLUSH PRIVILEGES;
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

Om Formspree inte är tillgängligt sparas e-postadresser lokalt i användarens webbläsare (localStorage). 
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
- Verifiera databasuppgifter i `api/subscribe.php`
- Kolla PHP error log: `tail -f /var/log/apache2/error.log`

**Problem: CORS-fel i webbläsaren**
- Se till att `api/subscribe.php` har rätt CORS-headers
- Om olika domäner, uppdatera `Access-Control-Allow-Origin`

**Problem: E-post sparas inte**
- Testa API:et direkt: 
  ```bash
  curl -X POST http://localhost/api/subscribe.php \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com"}'
  ```
- Kontrollera MySQL-behörigheter för användaren

**Problem: Dubbletter sparas**
- Tabellen har UNIQUE constraint på email-kolumnen
- Om dubbletter ändå sparas, kör: `ALTER TABLE email_subscriptions ADD UNIQUE KEY unique_email (email);`
