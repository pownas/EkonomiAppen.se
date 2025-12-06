-- Skapa databas (om den inte finns)
CREATE DATABASE IF NOT EXISTS ekonomiappen
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

USE ekonomiappen;

-- Skapa tabell för e-postregistreringar
CREATE TABLE IF NOT EXISTS email_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    subscribed_at DATETIME NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    unsubscribed_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_subscribed_at (subscribed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Skapa en vy för aktiva prenumerationer
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT 
    id,
    email,
    subscribed_at,
    ip_address,
    created_at
FROM email_subscriptions
WHERE unsubscribed_at IS NULL
ORDER BY subscribed_at DESC;

-- Exempel-queries för att hantera data:

-- Visa alla aktiva prenumerationer
-- SELECT * FROM active_subscriptions;

-- Räkna antal prenumerationer
-- SELECT COUNT(*) as total FROM email_subscriptions WHERE unsubscribed_at IS NULL;

-- Exportera till CSV (kör från kommandoraden)
-- mysql -u username -p -D ekonomiappen -e "SELECT email, subscribed_at FROM active_subscriptions" > emails.csv

-- Ta bort en e-postadress (GDPR)
-- UPDATE email_subscriptions SET unsubscribed_at = NOW() WHERE email = 'example@example.com';
