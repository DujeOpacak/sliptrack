# SlipTrack

Mobilno programsko rješenje za digitalizaciju i praćenje papirnatih uplatnica. Završni rad, Stručni prijediplomski studij Primijenjeno računarstvo (Programsko inženjerstvo), Sveučilište Algebra Bernays. **Rok: 1. kolovoza 2026.**

## Obrazloženje teme (iz projektnog obrasca)

Plaćanje obveza putem papirnatih uplatnica svakodnevna je praksa u Hrvatskoj (komunalne usluge, sportske aktivnosti, kazne, zdravstvene naknade). Evidencija plaćanja uglavnom se vodi ručno ili se ne vodi, što rezultira nesigurnošću o statusu obveza, propuštenim rokovima dospijeća i nedostatkom pregleda ukupnih troškova. Problem je posebno izražen kod mladih osoba koje se prvi put suočavaju s upravljanjem osobnim financijama.

**Analiza tržišta / diferencijacija** — ovo je ključni argument rada, važno za obranu:
- Mobilne bankarske aplikacije podržavaju skeniranje barkoda isključivo radi izvršavanja plaćanja, bez arhiviranja ili praćenja statusa.
- Aplikacije pojedinih davatelja usluga nude uvid u zaduženja i uplate, ali isključivo za vlastite usluge (nema jedinstvenog pregleda).
- Inozemna rješenja za praćenje troškova ne podržavaju format hrvatskog platnog područja (model plaćanja, poziv na broj primatelja).
- Zaključak: ne postoji namjensko rješenje za osobnu evidenciju papirnatih uplatnica koje objedinjuje sve davatelje i poštuje hrvatski platni standard — to je praktični doprinos rada.

**Sažetak pristupa**: korisnik skenira uplatnicu kamerom (PDF417/HUB-3 primarno, OCR rezervno), potvrđuje izvučene podatke, označava status i kategoriju; podaci se pohranjuju putem backend API-ja. Admin sučelje upravlja kategorijama, korisničkim računima i statistikama sustava. Sustav nudi dashboard s evidencijom, iznosima po davatelju/kategoriji, grafičkim prikazom troškova, te automatske podsjetnike temeljene na analizi obrazaca plaćanja korisnika.

## Arhitektura

Tri zasebna projekta u jednom repozitoriju (privatni GitHub repo `sliptrack`):

```
sliptrack/
  ├── sliptrack-backend/     ← Java 21 / Spring Boot 4.1.0 REST API
  ├── sliptrack-mobile/      ← React Native (Expo) — prazan, još nije započet
  ├── sliptrack-admin/       ← React web admin sučelje — još ne postoji
  └── docker/                ← docker-compose.yml (PostgreSQL 18 + MinIO)
```

## Tech stack

- **Backend**: Spring Boot 4.1.0, Java 21, Maven, Hibernate ORM (Spring Data JPA), Spring Security, JWT (još nije implementiran), Lombok
- **Baza**: PostgreSQL 18 (Docker), db `sliptrack`, user/pass `sliptrack` / `sliptrack123`, port 5432
- **Object storage**: MinIO (slike uplatnica), konzola na http://localhost:9001, user/pass `sliptrack` / `sliptrack123`, API port 9000
- **Mobilna app**: React Native + Expo, PDF417 barkod skeniranje (HUB-3 standard) kao primarna metoda, Google ML Kit OCR kao rezerva
- **Admin**: React (web)
- **Push notifikacije**: Expo Notifications

Napomena: `pom.xml` koristi `spring-boot-starter-webmvc` (novi naziv u Spring Boot 4.x za `spring-boot-starter-web`) i `spring-boot-starter-data-jpa-test` / `-security-test` / `-webmvc-test` kao test starteri.

## Trenutno stanje (2026-07-17)

- ✅ `docker-compose.yml` gotov, oba kontejnera rade
- ✅ Spring Boot projekt kreiran, `application.properties` konfiguriran, spaja se na Postgres bez grešaka
- ✅ `spring.jpa.hibernate.ddl-auto=update` — Hibernate sam kreira tablice, nema ručnih migracija (Flyway/Liquibase se ne koristi)
- ❌ Nema još paketne strukture, entiteta, repozitorija, servisa, kontrolera ni sigurnosne konfiguracije — samo prazan `SliptrackBackendApplication.java`
- ❌ `sliptrack-mobile` i `sliptrack-admin` nisu inicijalizirani

Package name backend aplikacije: `com.sliptrack.sliptrackbackend` (auto-generiran od Spring Initializr, zadržan kao konačan naziv).

### Planirana paketna struktura backenda (sljedeći korak)

```
com.sliptrack.sliptrackbackend/
  ├── controller/
  ├── service/
  ├── repository/
  ├── model/
  ├── dto/
  ├── security/
  └── config/
```

## Domenski model

### Entiteti

**User**
- id, email, password, firstName, lastName, active, role (USER / ADMIN), createdAt

**Category** (kreira samo ADMIN; korisnici samo biraju)
- id, name, createdAt

**Property** — stambeni prostor (npr. "Stan Zagreb", "Vikendica"); veže se **samo** uz kategoriju "komunalije"
- id, name, address, user (vlasnik)

**PaymentSlip** — uplatnica
- id, iban, amount, referenceNumber (poziv na broj), paymentModel (HR01, HR02...), payerName (naziv davatelja), description, dueDate, status (PAID / UNPAID), imageUrl, category, property (nullable), user, createdAt, scannedAt

Slike uplatnica se **ne** spremaju u PostgreSQL — idu u MinIO, u bazi se čuva samo `imageUrl`.

### Podaci koji se izvlače skeniranjem uplatnice

IBAN primatelja, iznos, poziv na broj primatelja, model plaćanja (HR01, HR02...), naziv davatelja usluge, opis plaćanja, datum dospijeća.

## Funkcionalnosti — mobilna app (USER)

1. **Skeniranje uplatnice**: primarno PDF417 barkod (HUB-3), rezervno OCR (Google ML Kit), ekran za potvrdu/ispravak, i mogućnost ručnog unosa.
2. **Evidencija**: status PAID/UNPAID, kategorizacija, vezivanje komunalnih uplatnica uz Property, pohrana slike u MinIO.
3. **Dashboard**: filteri po statusu/kategoriji/davatelju, ukupni iznosi plaćeno/neplaćeno po davatelju i kategoriji, grafički prikaz troškova kroz vrijeme.
4. **Automatski podsjetnici**: Spring `@Scheduled` job (dnevno) analizira obrasce plaćanja (prethodni dueDate-ovi), predviđa sljedeći rok, šalje push notifikaciju kroz Expo Notifications.

## Funkcionalnosti — admin sučelje (ADMIN)

- Upravljanje kategorijama (komunalije, zdravstvo, sport i rekreacija, obrazovanje, kazne i pristojbe, ostalo)
- Upravljanje korisničkim računima (pregled, deaktivacija)
- Statistike sustava (broj registriranih/aktivnih korisnika, broj skeniranih uplatnica, najpopularnije kategorije)
- Admin **nema** pristup financijskim podacima korisnika

## Sigurnost

- JWT autentifikacija (još nije implementirana)
- Dvije uloge: USER, ADMIN
- Svaki korisnik vidi samo svoje uplatnice
- Admin nema pristup tuđim financijskim podacima

## Sljedeći koraci (redoslijed)

1. Kreirati paketnu strukturu backenda
2. Kreirati JPA entitete: User, Role, Category, Property, PaymentSlip
3. Kreirati Repository sučelja (Spring Data JPA)
4. JWT autentifikacija + Spring Security konfiguracija
5. REST endpointi (controller + service sloj)
6. React Native mobilna aplikacija (Expo init, skeniranje, dashboard)
7. React admin sučelje
8. Testiranje

## Pokretanje lokalno

```bash
# Docker (Postgres + MinIO)
cd docker && docker-compose up -d

# Backend
cd sliptrack-backend && ./mvnw spring-boot:run
```

Backend na http://localhost:8080, MinIO konzola na http://localhost:9001.
