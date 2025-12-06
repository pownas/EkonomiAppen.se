# Setup-instruktioner för e-postregistrering

## Formspree-integration (Rekommenderat)

Sajten är konfigurerad att använda Formspree för e-postregistreringar.

### Steg-för-steg:

1. **Skapa ett gratis Formspree-konto:**
   - Gå till https://formspree.io
   - Skapa ett konto (gratis upp till 50 submissions/månad)

2. **Skapa ett nytt formulär:**
   - Klicka på "New Form"
   - Namnge det t.ex. "Ekonomiappen.se Lanseringsanmälan"
   - Du får ett form-ID som ser ut så här: `abc123def`

3. **Uppdatera din kod:**
   - Öppna `src/script.js`
   - Hitta raden: `const response = await fetch('https://formspree.io/f/YOUR_FORM_ID', {`
   - Ersätt `YOUR_FORM_ID` med ditt faktiska form-ID
   - Exempel: `https://formspree.io/f/abc123def`

4. **Testa formuläret:**
   - Öppna sajten i en webbläsare
   - Skicka in en test-e-postadress
   - Kontrollera i Formspree dashboard att den kom fram

5. **Exportera data:**
   - I Formspree dashboard kan du:
     - Se alla submissions i en tabell
     - Exportera som CSV
     - Exportera som JSON
     - Få e-postnotiser för varje submission

### Fallback-lagring

Om Formspree inte är tillgängligt sparas e-postadresser lokalt i användarens webbläsare (localStorage). 
Du kan läsa dessa genom utvecklarkonsolens kommandon:

```javascript
// Läs lokalt sparade e-postadresser
JSON.parse(localStorage.getItem('notifyList'))
```

## Alternativ: Netlify Forms

Om du hostar på Netlify kan du istället använda Netlify Forms:

1. Ändra `<form>` taggen till:
   ```html
   <form id="notifyForm" class="notify-form" name="notify" method="POST" data-netlify="true" netlify-honeypot="_gotcha">
   ```

2. Ta bort fetch-koden i `script.js` och låt formuläret skickas naturligt

## Alternativ: EmailJS

EmailJS är ett annat alternativ som skickar e-post direkt via JavaScript:

1. Skapa konto på https://www.emailjs.com/
2. Konfigurera en e-posttjänst
3. Använd deras SDK för att skicka meddelanden

## Alternativ: Egen backend senare

När du är redo att bygga en egen backend kan du:
- Skapa ett REST API (t.ex. med Node.js/Express)
- Spara till en databas (MongoDB, PostgreSQL, etc.)
- Ersätt Formspree URL:en med din egen API-endpoint
