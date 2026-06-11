# AdRide — Instrukcja Deploymentu

## Opcja A: Vercel (rekomendowana — 3 minuty)

```bash
# 1. Zainstaluj Vercel CLI
npm i -g vercel

# 2. Build lokalnie
cd app
npm run build

# 3. Deploy
vercel --prod
```

**Pytania Vercel CLI:**
- Project name: `adride`
- Override: `N`
- Connected to repo: nie (deploy z lokalnego folderu)
- Create & Deploy: `Y`

**Rezultat:** URL typu `adride.vercel.app`

**Własna domena:**
1. Vercel dashboard → Project → Settings → Domains
2. Dodaj domenę (np. `app.adride.pl`)
3. Zmień DNS u dostawcy na nameservery Vercel

---

## Opcja B: SSH na Linux (mikr.us lub inny serwer)

### Krok 1 — Przygotuj plik do wgrania

```bash
cd C:\Users\andrz\Downloads\AdRide\app
npm run build

# Utwórz paczkę do deploymentu
mkdir -p deploy
cp -r .next public package.json package-lock.json deploy/
cp .env.local deploy/.env.production
cd deploy
```

### Krok 2 — Wgraj na serwer

**PowerShell:**
```powershell
scp -r "C:\Users\andrz\Downloads\AdRide\app\deploy\*" user@natalia132.mikrus.xyz:/home/user/adride/app/
```

**Lub WinSCP (GUI):** przeciągnij `deploy/` folder

### Krok 3 — Setup na serwerze (SSH)

```bash
ssh user@natalia132.mikrus.xyz
cd /home/user/adride/app

# 3.1. Sprawdź .env.production
nano .env.production
# Upewnij się że NEXT_PUBLIC_SUPABASE_URL + klucze są OK
# Ctrl+O, Enter, Ctrl+X

# 3.2. Instaluj zależności
npm install --production

# 3.3. Zainstaluj PM2 (process manager)
sudo npm install -g pm2

# 3.4. Uruchom aplikację
pm2 start 'npm start' --name adride

# 3.5. Skonfiguruj autostart na reboot
pm2 save
pm2 startup
```

### Krok 4 — Nginx reverse proxy

```bash
# 4.1. Utwórz konfigurację
sudo nano /etc/nginx/sites-available/adride
```

Wklej (zmień `natalia132.mikrus.xyz` na swoją domenę):

```nginx
server {
  listen 80;
  server_name natalia132.mikrus.xyz;

  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

Zapisz: `Ctrl+O`, `Enter`, `Ctrl+X`

```bash
# 4.2. Enable site
sudo ln -s /etc/nginx/sites-available/adride /etc/nginx/sites-enabled/

# 4.3. Test config
sudo nginx -t

# 4.4. Restart Nginx
sudo systemctl restart nginx
```

Teraz dostępne: `http://natalia132.mikrus.xyz`

### Krok 5 — SSL (Let's Encrypt, opcjonalne ale zalecane)

```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

sudo certbot --nginx -d natalia132.mikrus.xyz
# Podążaj za pytaniami
```

Automatycznie:
- Generuje certyfikat
- Konfiguruje HTTPS w Nginx
- Redirect HTTP → HTTPS

Teraz dostępne: `https://natalia132.mikrus.xyz`

---

## Monitoring & Troubleshooting

### Statusy aplikacji

```bash
# Sprawdź proces
pm2 status

# Logi aplikacji
pm2 logs adride

# Logi Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Problemy

| Problem | Rozwiązanie |
|---|---|
| **502 Bad Gateway** | `pm2 logs adride` — zobacz błędy Node'a. Restart: `pm2 restart adride` |
| **Port 3000 zajęty** | `lsof -i :3000` → `kill -9 PID` |
| **Supabase connection fail** | Sprawdź `.env.production` — czy klucze są aktualne |
| **Certbot error** | `sudo certbot renew --dry-run` — test auto-renew |
| **PM2 nie startuje na reboot** | Powtórz: `pm2 startup` + `pm2 save` |

---

## Logowanie Demo (hasło: AdRide2026!)

Po deploymencie przejdź do aplikacji i zaloguj się:

| Email | Rola | Co widać |
|---|---|---|
| `admin@adride.pl` | admin | Panel admina |
| `tomek@demo.adride.pl` | kierowca | 3 pojazdy, kampania aktywna, wypłaty |
| `firma@demo.adride.pl` | reklamodawca | Kampania "Mokotów", KPI, pojazdy w terenie |

---

## Aktualizacja aplikacji (gdy zmieniłeś kod)

```bash
# Lokalnie
cd app
npm run build

# Wgraj nowy .next
scp -r .next/* user@natalia132.mikrus.xyz:/home/user/adride/app/.next/

# Na serwerze
ssh user@natalia132.mikrus.xyz
cd /home/user/adride/app
pm2 restart adride
```

---

## Sprawdzenie czy działa

```bash
# Lokalnie lub z Any przeglądarki
curl https://natalia132.mikrus.xyz
# Powinno zwrócić HTML strony logowania (307 → /kalkulator dla anonima)
```

---

**Gotowe!** Aplikacja powinna być dostępna pod twoją domeną. Zaloguj się i testuj demo.
