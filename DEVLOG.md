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
Kreiran UserRepository (Spring Data JPA)
Implementirana JWT autentifikacija i Spring Security konfiguracija: JwtService, CustomUserDetailsService, JwtAuthenticationFilter, SecurityConfig
Kreiran AuthController s endpointima POST /api/auth/register i /login
Dodana podrška za access + refresh token: RefreshToken entitet i RefreshTokenRepository, RefreshTokenService (generira, hashira SHA-256, validira i rotira refresh token), endpointi POST /api/auth/refresh i /logout
Access token traje 15 min, refresh token 30 dana; refresh token se čuva u bazi kao hash, ne plaintext, i rotira se pri svakom korištenju
Sve ručno testirano kroz Postman: register, login, kriva lozinka, duplikat emaila, zaštićena ruta bez/s tokena, refresh, logout, ponovna upotreba revociranog refresh tokena
Provjera baze putem IntelliJ Database alata (Ultimate) uz DBeaver/pgAdmin kao alternativu

Problemi i rješenja

Kod grešaka u kontroleru (409/401) servlet kontejner interno preusmjerava na /error rutu, koja je prolazila kroz Security filter i vraćala generički 403 umjesto stvarnog statusa — riješeno dodavanjem /error u permitAll
DaoAuthenticationProvider u ovoj verziji Spring Securityja nema no-arg konstruktor ni setUserDetailsService — riješeno korištenjem konstruktora s UserDetailsService argumentom
LazyInitializationException pri pristupu RefreshToken.getUser() nakon zatvaranja Hibernate sesije — riješeno dodavanjem @Transactional na AuthService.refresh()

Sutra

Dogovoriti i implementirati promjene u auth/token flowu (najavljeno, detalji još nisu definirani)
REST endpointi za domenske entitete (PaymentSlip, Category, Property, Dashboard)