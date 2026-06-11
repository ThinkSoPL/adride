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
| **521 Web server is down** (Cloudflare) | Nginx nie wstał. `sudo nginx -t` pokaże przyczynę. **Najczęstsza (2026-06-11):** stary plik w `sites-available` (np. `ja-adride-log`) odwołuje się do nieistniejącego certu `ja.adride.pl` → cała konfiguracja nginx pada. Usuń osierocony plik: `rm /etc/nginx/sites-available/ja-adride-log` → `systemctl restart nginx`. Sprawdź czym jest cert: `ls /etc/letsencrypt/live/` (powinien być tylko `app.adride.pl`). |
| **502 Bad Gateway** | `pm2 logs adride` — zobacz błędy Node'a. Restart: `pm2 restart adride` |
| **ENOENT prerender-manifest.json** | Build niekompletny lub `.next/` skasowany. `cd /root/adride/app && npm run build && pm2 restart adride` |
| **Port 3000 zajęty** | `lsof -i :3000` → `kill -9 PID` |
| **Supabase connection fail** | Sprawdź `.env.local` na VPS — czy klucze są aktualne |
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

## Aktualizacja aplikacji (gdy zmieniłeś kod) — REALNY WORKFLOW (git-based)

Na VPS repo jest sklonowane w `/root/adride`, gałąź **`master`** (UWAGA: nie `main` — `main` to stary stub).
Po `git push origin master` z lokalnej maszyny:

```bash
ssh root@app.adride.pl
cd /root/adride && git pull origin master && cd app && npm run build && pm2 restart adride
```

**Smoke test po deployu (wszystko w jednej linii):**
```bash
sleep 3 && curl -s -X OPTIONS -H "Origin: https://adride.pl" -o /dev/null -w "CORS: %{http_code}\n" http://localhost:3000/api/leads
# oczekiwane: CORS: 204
curl -s -o /dev/null -w "HTTPS app.adride.pl: %{http_code}\n" https://app.adride.pl/login
# oczekiwane: HTTPS app.adride.pl: 200
```

⚠️ **Jeśli po deployu pojawia się 521** — to nie aplikacja, tylko nginx. Patrz tabela Troubleshooting (osierocony `sites-available/ja-adride-log`).

### Landing (adride.pl — statyczny FTP)
Po zmianie `index.html` / `js/form.js` / `kierowca.html` / `reklamodawca.html` wgraj je przez FTP (Filezilla/WinSCP) na hosting aftermarket adride.pl. To OSOBNY serwer niż VPS app.adride.pl.

---

## Sprawdzenie czy działa

```bash
# Lokalnie lub z Any przeglądarki
curl https://natalia132.mikrus.xyz
# Powinno zwrócić HTML strony logowania (307 → /kalkulator dla anonima)
```

---

**Gotowe!** Aplikacja powinna być dostępna pod twoją domeną. Zaloguj się i testuj demo.
