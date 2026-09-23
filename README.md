# NetBox Tracker · Sowacom

Interne Web-App zum **Team-Tracking der NetBox-Erfassung**: Wer arbeitet gerade
an welchem Kunden, wie ist der Status, und was ist zuletzt passiert.

Der Fokus liegt bewusst auf den **Kunden** (nicht auf einzelnen Geräten): pro
Kunde sieht man, wem er zugewiesen ist bzw. wer ihn bearbeitet oder
fertiggestellt hat.

## Features

- **Kein klassisches Login** – beim ersten Öffnen wählt man seinen Namen aus
  einer Liste oder legt sich ein Profil an. Die Auswahl wird im Browser
  (LocalStorage) gemerkt. Wer den Link hat, kommt rein.
- **Passwort pro Profil** – jeder vergibt bei der Erstellung ein Passwort.
  Zum Anmelden/Wechseln als dieses Profil ist das Passwort nötig
  (bcrypt-Hash, kein Klartext).
- **Dashboard** – alle Kunden als Karten mit Status-Badge, ausformuliertem
  Status-Satz, Fortschrittsbalken, Live-Avataren der aktuell Arbeitenden und
  letzter Aktualisierung. Filter nach Status, Suche und Sortierung.
- **Status-Formulierung pro User**:
  - `Aufgenommen`     → **„Zugewiesen an \<Name\>“**
  - `In Bearbeitung`  → **„Wird von \<Name\> bearbeitet“**
  - `Erledigt`        → **„Fertiggestellt von \<Name\>“**
- **Kunden-Detailseite** – Status ändern, Zuweisung setzen, Notizen inline
  bearbeiten, Kunden löschen und **„Ich arbeite jetzt daran“** (Live-Marker mit
  Auto-Timeout nach 30 Min Inaktivität).
- **Team-View** – Live-Dashboard, wer gerade an was arbeitet.
- **Aktivitäts-Log** – die letzten Statusänderungen und Bearbeitungen.
- **Live-Updates** – Polling alle 10 Sekunden (React Query).
- **Design** – Dark Mode als Default (optional Light), Glass-/Gradient-Akzente,
  Cyan-Akzentfarbe, Framer-Motion-Animationen, lucide-react-Icons.

## Tech-Stack

Next.js 15 (App Router) · TypeScript · Prisma (SQLite lokal / Postgres Prod) ·
Tailwind CSS · shadcn/ui · React Query · Framer Motion · sonner · bcryptjs

## Setup

Voraussetzung: **Node.js 18+**.

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Datenbank anlegen (SQLite) + Prisma-Client generieren
npm run db:push

# 3. Muster-Profil einspielen (optional)
npm run db:seed

# 4. Dev-Server starten
npm run dev
```

Dann im Browser: **http://localhost:3000**

### Muster-Login (nach `db:seed`)

| Name        | Passwort |
| ----------- | -------- |
| Max Muster  | `muster` |

Es sind **keine Kunden** vorangelegt – diese werden über **„Neuer Kunde“**
manuell erfasst. Profile lassen sich jederzeit direkt in der App neu anlegen.

## Konfiguration

`.env` (Vorlage siehe `.env.example`) – Postgres (Neon/Supabase):

```env
DATABASE_URL="postgresql://…-pooler…/neondb?sslmode=require"
DIRECT_URL="postgresql://…(ohne -pooler)…/neondb?sslmode=require"
```

> Rein lokal ohne Postgres möglich: in `prisma/schema.prisma` `provider`
> zurück auf `"sqlite"`, `directUrl`-Zeile entfernen, `DATABASE_URL="file:./dev.db"`.

### Nützliche Skripte

| Befehl            | Beschreibung                                        |
| ----------------- | --------------------------------------------------- |
| `npm run dev`     | Entwicklungsserver (http://localhost:3000)          |
| `npm run build`   | Produktions-Build (inkl. `prisma generate`)         |
| `npm run start`   | Produktions-Server                                  |
| `npm run db:push` | Schema in die DB übertragen                         |
| `npm run db:seed` | Muster-Profil einspielen                            |
| `npm run db:reset`| DB zurücksetzen und neu seeden                      |

## Online-Deployment (Netlify + Neon)

Die App ist auf **Postgres** eingestellt und deploy-fertig für Netlify. Serverlos
braucht es eine gehostete DB – SQLite funktioniert dort nicht.

### 1. Datenbank anlegen (Neon)

1. Bei [neon.tech](https://neon.tech) registrieren, **Create project**
   (Region: *Europe/Frankfurt*).
2. Oben links **Connect** öffnen und zwei Connection-Strings kopieren:
   - **Pooled** (Host mit `-pooler`) → `DATABASE_URL`
   - **Direct** (Schalter „Connection pooling" aus, ohne `-pooler`) → `DIRECT_URL`

> Alternativ Supabase (Transaction-Pooler-String = `DATABASE_URL`, Direct = `DIRECT_URL`).

### 2. Code zu GitHub

Netlify deployt aus einem Git-Repo:

```bash
git init && git add -A && git commit -m "NetBox Tracker"
# leeres GitHub-Repo anlegen und pushen:
git remote add origin https://github.com/<user>/netbox-tracker.git
git push -u origin main
```

### 3. Netlify verbinden

1. Auf [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project** → GitHub-Repo wählen.
2. Build wird automatisch erkannt (`netlify.toml` liegt bei). **Environment variables** setzen:
   - `DATABASE_URL` = gepoolter Neon-String
   - `DIRECT_URL`   = direkter Neon-String
3. **Deploy**. Der Build legt die Tabellen automatisch an
   (`prisma db push` läuft im Build-Command) und startet die App.

Ergebnis: eine dauerhafte URL `dein-name.netlify.app`. Profile werden direkt in
der App angelegt (kein Seed nötig).

### Docker Compose (Alternative)

Ein Beispiel-`docker-compose.yml` mit Postgres kann bei Bedarf ergänzt werden;
der App-Container braucht nur `DATABASE_URL`/`DIRECT_URL` und
`npm run build && npm run start`.

## Hinweis zur Sicherheit

Dies ist ein **internes Team-Tool**. Die Passwörter schützen davor, versehentlich
als jemand anderes zu handeln – es ist aber **kein vollwertiges Auth-System**
(kein Session-Token, keine Rollen). Für den Betrieb über das interne Netz hinaus
sollte die App hinter HTTPS und ggf. einem zusätzlichen Zugangsschutz laufen.
