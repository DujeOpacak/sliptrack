17.07.2026. — Dan 1
Što je napravljeno

Kreiran GitHub repozitorij sliptrack (private)
Definirana struktura repozitorija: sliptrack-backend, sliptrack-mobile, sliptrack-admin, docker
Odabrano ime aplikacije: SlipTrack
Kreiran docker-compose.yml s PostgreSQL 18 i MinIO
Pokrenuti Docker kontejneri — oba rade lokalno
Potvrđeno MinIO web sučelje na http://localhost:9001
Kreiran Spring Boot projekt u IntelliJu (Java 21, Maven)
Dodane dependencije: Spring Web, Spring Security, Spring Data JPA, PostgreSQL Driver, Lombok, Spring Boot DevTools
Konfiguriran application.properties — spoj na PostgreSQL uspješan
Aplikacija se pokreće bez grešaka na portu 8080
Instaliran i konfiguriran Claude Code s kontekstom projekta

Problemi i rješenja

PostgreSQL 18 zahtijeva drugačiju putanju volumena (/var/lib/postgresql umjesto /var/lib/postgresql/data) — riješeno izmjenom docker-compose.yml
Docker Desktop nije bio pokrenut pri prvom pokušaju — riješeno pokretanjem aplikacije

Sutra

Kreiranje strukture paketa u Spring Bootu
Kreiranje Java entiteta (User, Category, Property, PaymentSlip)
Kreiranje Repository sučelja

20.07.2026. — Dan 2
Što je napravljeno

Kreirana paketna struktura backenda: controller, service, repository, model, dto, security, config
Kreirani JPA entiteti: User, Category, Property, PaymentSlip, RecurringPattern, UserDevice, Notification, PaymentSlipAudit
Kreirani enumi: Role (USER/ADMIN), PaymentStatus (PAID/UNPAID), DevicePlatform (ANDROID/IOS)
RecurringPattern dodan za podršku automatskim podsjetnicima (analiza obrazaca plaćanja)
UserDevice dodan za spremanje Expo push tokena po uređaju
PaymentSlipAudit dodan za praćenje povijesti promjena statusa uplatnice (korisnički uvid, ne administratorski)
Timestamp polja (createdAt/updatedAt) postavljaju se automatski putem Hibernate @CreationTimestamp/@UpdateTimestamp
Ažuriran CLAUDE.md — package name backenda ostaje com.sliptrack.sliptrackbackend

Sutra

Kreiranje Repository sučelja (Spring Data JPA) za sve entitete