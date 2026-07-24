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

23.07.2026. — Dan 3
Što je napravljeno

Analiza cjelokupnog auth/JWT sloja implementiranog do sada: UserRepository, RefreshTokenRepository, AuthService (register, login, refresh, logout, toAuthResponse), AuthController, JwtService (generiranje i validacija access tokena), JwtAuthenticationFilter, SecurityConfig, CustomUserDetailsService, te svi DTO-ovi (RegisterRequest, LoginRequest, RefreshRequest, AuthResponse, TokenResponse)
Razjašnjena rotacija refresh tokena: pri svakom /refresh pozivu stari token se označava kao revoked (ne briše se iz baze) čime se čuva audit trag i omogućuje buduća detekcija ponovne upotrebe ukradenog tokena (reuse detection)
Izrađen grubi plan REST ruta za sve domenske entitete (Category, Property, PaymentSlip, Dashboard, UserDevice, Notification, Admin) — zapisan u CLAUDE.md, regulirat će se po potrebi tijekom implementacije
Implementiran kompletan CRUD za Category: CategoryRepository, CategoryRequest/CategoryResponse DTO-ovi, CategoryService, CategoryController
GET rute dostupne svim autenticiranim korisnicima, POST/PUT/DELETE ograničeni na ADMIN ulogu putem @PreAuthorize("hasRole('ADMIN')")
Dodan @EnableMethodSecurity u SecurityConfig kako bi @PreAuthorize anotacije uopće imale efekt
Sve Category rute ručno testirane kroz Postman i rade ispravno (uključujući provjeru da USER dobiva 403 na admin-only rute)

Problemi i rješenja

Bez @EnableMethodSecurity na SecurityConfig, @PreAuthorize anotacije na CategoryControlleru se tiho ignoriraju — riješeno dodavanjem anotacije

Sutra

Implementirati Property CRUD (vlasništvo vezano uz User, veza samo uz kategoriju "komunalije")
Krenuti na PaymentSlip (najsloženiji entitet — Category, Property, User, MinIO upload slike, PaymentSlipAudit pri promjeni statusa)

24.07.2026. — Dan 4
Što je napravljeno

Razjašnjena veza Property ↔ Category: Property nema izravnu vezu na Category, nego se veže isključivo kroz PaymentSlip (property je oznaka lokacije na uplatnici, ne vlasništvo kategorije)
Uočeno da je izvorni plan ("Property se veže samo uz kategoriju komunalije") preopćenit — pravilo mora vrijediti na razini konkretne usluge (npr. Struja), ne cijele kategorije Komunalije
Uveden dvorazinski model kategorija: Category (npr. Komunalije, Zdravstvo) → SubCategory (npr. Struja, Voda, Plin unutar Komunalije)
Kreiran SubCategory entitet: id, name, allowsProperty, category (ManyToOne), createdAt — unique constraint na (name, category_id)
allowsProperty flag premješten s Category na SubCategory (prvotno je bio kratkotrajno dodan na Category, potom uklonjen istog dana kad je odlučeno uvesti SubCategory razinu)
Kreiran SubCategoryRepository, SubCategoryRequest/SubCategoryResponse DTO-ovi, SubCategoryService, SubCategoryController
Rute /api/subcategories prate isti obrazac autorizacije kao Category: GET javan svim autenticiranim korisnicima, POST/PUT/DELETE ograničeni na ADMIN
GET /api/subcategories podržava opcionalni query param categoryId za filtriranje
Dogovoreno da PaymentSlip.subCategory ostaje nullable na razini baze, ali će service sloj (pri implementaciji PaymentSlip) validirati da je subCategory obavezan ako kategorija ima definirane potkategorije
Ažuriran CLAUDE.md: domenski model (Category, SubCategory, Property, PaymentSlip), plan REST ruta (dodan /api/subcategories, PaymentSlip GET query params prošireni sa subCategoryId), trenutno stanje, sljedeći koraci
Implementiran Property CRUD: PropertyRepository (findByUserId, findByIdAndUserId), PropertyRequest/PropertyResponse DTO-ovi, PropertyService, PropertyController na /api/properties
Kreiran CurrentUserService (paket security) — reusable helper koji resolva trenutnog autenticiranog korisnika iz SecurityContext (po emailu), prvi put korišten za vlasništvo nad Property; planiran za ponovnu upotrebu kod PaymentSlip
Property rute nemaju @PreAuthorize — svaki autenticirani korisnik smije upravljati vlastitim nekretninama, vlasništvo se provjerava isključivo u service sloju (findByIdAndUserId); pristup tuđoj nekretnini vraća 404 umjesto 403 da se ne otkriva postojanje tuđeg resursa
Dodan GlobalExceptionHandler (@RestControllerAdvice, paket exception) koji centralizira sve HTTP error odgovore u dosljedan {"message": "..."} format (ili {"polje": "poruka"} za validaciju), umjesto Bootovog default formata s trace/timestamp/path
Handler pokriva redom: MethodArgumentNotValidException (400), ResponseStatusException (status iz iznimke), AuthorizationDeniedException (403 — Spring Security 6.3+ zamjena za AccessDeniedException kod @PreAuthorize odbijanja), catch-all Exception (500, s @Slf4j logiranjem punog stack tracea server-side prije nego se klijentu vrati generička poruka)
Dodan eksplicitni AuthenticationEntryPoint bean u SecurityConfig — neautenticirani zahtjevi sad vraćaju 401 (piše JSON izravno u response) umjesto defaultnog Spring Security 403 ponašanja (Http403ForbiddenEntryPoint, aktivan kad nema httpBasic()/formLogin() konfiguriranog)
Otkriven i riješen LazyInitializationException na SubCategoryService.getAll()/getById() — SubCategory.category je LAZY, a open-in-view=false zatvara sesiju čim repository poziv završi; toResponse() je čitao category.getName() izvan sesije. Riješeno s @EntityGraph(attributePaths = "category") na SubCategoryRepository.findAll()/findById()/findByCategoryId() — eager učitavanje na razini upita umjesto oslanjanja na otvorenu transakciju
Otkriven drugi, uzročno različit LazyInitializationException na SubCategoryService.update() — repository.save() na entitetu s postojećim ID-om zove Hibernate merge(), koji bez cascade=MERGE na asocijaciji vraća nov neinicijaliziran proxy za category na vraćenom entitetu, čak i kad je asocijacija bila eager učitana prije save(). Riješeno građenjem response DTO-a iz already-loaded category varijable umjesto iz savedEntity.getCategory()
Razjašnjeno (na korisnikovo pitanje) zašto je @Transactional na AuthService.refresh() ispravan pristup za RefreshToken.getUser(), a nije bio dovoljan/prikladan generalni fix za SubCategory: kod refresh() sav lazy pristup ostaje unutar iste anotirane metode, dok bi SubCategory zahtijevao da svaka buduća metoda koja dira lazy polje pamti @Transactional — @EntityGraph je strukturno zagarantiran na razini upita, manje krhak
Otkrivena i riješena greška kod brisanja Category koja ima SubCategory zapise — bez provjere, DB FK constraint je bacao DataIntegrityViolationException koji je završavao kao neuhvaćeni 500. Dodana provjera subCategoryRepository.existsByCategoryId(id) u CategoryService.delete() prije brisanja → sad vraća 409 s jasnom porukom; cascade-delete namjerno izbjegnut jer bi u budućnosti tiho brisao PaymentSlip zapise
Korisnik ručno testirao apsolutno sve dosad implementirane kontrolere (Auth, Category, SubCategory, Property) kroz Postman

Problemi i rješenja

Korisnik je odlučio prije nastavka izbrisati sve testne podatke iz baze kako bi mogao unijeti čist inicijalni test-set nakon promjene modela kategorija — implementacija SubCategory-ja pričekana do potvrde da je baza prazna
LazyInitializationException na SubCategory.category (dva različita uzroka — read strana i update/merge strana), riješeno @EntityGraph + eksplicitno građenje response DTO-a (vidi gore)
DataIntegrityViolationException kod brisanja Category s postojećim SubCategory zapisima, riješeno provjerom existsByCategoryId() prije delete()
Spring Security defaultno vraća 403 umjesto 401 za neautenticirane zahtjeve kad nema httpBasic()/formLogin() konfiguriranog — riješeno eksplicitnim AuthenticationEntryPoint

Sutra

Krenuti na PaymentSlip (najsloženiji entitet — Category, SubCategory, Property, User, MinIO upload slike, PaymentSlipAudit pri promjeni statusa; uključuje validaciju subCategory/property pravila i primjenu @EntityGraph obrasca od početka)
Primijeniti isti FK-provjeri-prije-brisanja obrazac na SubCategory kad PaymentSlip počne referencirati na nju

Nastavak Dana 4 — PaymentSlip core CRUD, Dashboard, preimenovanje payerName → providerName
Što je napravljeno

Dogovoreno da se MinIO image upload odgodi kao zaseban korak nakon core PaymentSlip CRUD-a — smanjuje rizik da se dvije nove stvari (validacijska logika + nova MinIO infrastruktura) miješaju u istom koraku
Dodano PaymentSlip.subCategory polje na entitet (nedostajalo je unatoč ranijem dogovoru iz prošlog nastavka Dana 4)
Odabran Specification pristup (JpaSpecificationExecutor) za dinamičko filtriranje liste uplatnica umjesto ručnog pisanja @Query metode za svaku kombinaciju filtera (status, categoryId, subCategoryId, payerName/providerName, dueDateFrom/To)
Implementiran PaymentSlipRepository (Specification + @EntityGraph na category/subCategory/property, existsByCategoryId/existsBySubCategoryId/existsByPropertyId za FK guardove), PaymentSlipAuditRepository
Implementirani DTO-ovi: PaymentSlipRequest, PaymentSlipResponse (uključuje categoryName/subCategoryName/propertyName), PaymentSlipStatusUpdateRequest, PaymentSlipAuditResponse
Implementiran PaymentSlipService: validacija da subCategory mora pripadati odabranoj category, subCategory obavezan ako category ima potkategorije, property dopušten samo ako subCategory.allowsProperty i mora pripadati trenutnom korisniku; svi write putevi grade response iz eksplicitno učitanih varijabli (isti LazyInitializationException/merge-proxy obrazac naučen na SubCategory ranije danas)
Implementiran PaymentSlipController na /api/payment-slips — GET s filterima, GET/{id}, POST, PUT, PATCH /status (upisuje PaymentSlipAudit samo ako se status stvarno promijenio), DELETE, GET /{id}/audit; bez @PreAuthorize, vlasništvo štiti service sloj (isti obrazac kao Property)
Proaktivno dodane FK provjere prije brisanja u CategoryService, SubCategoryService, PropertyService (existsByCategoryId/existsBySubCategoryId/existsByPropertyId na PaymentSlipRepository) — sad kad PaymentSlip može referencirati sve troje, brisanje bi bez provjere palo na neuhvaćeni DataIntegrityViolationException
Razjašnjena razlika PATCH vs PUT (na korisnikovo pitanje) — PATCH je ispravan izbor za /status jer mijenja samo jedno polje, ne cijelu reprezentaciju resursa
Implementiran Dashboard: DashboardSummaryResponse, CategoryAmountResponse, PayerAmountResponse (kasnije preimenovan), TimelinePointResponse DTO-ovi; PaymentSlipRepository dobio tri agregacijska upita (sumAmountGroupedByCategory/ByPayer kroz JPQL SELECT NEW constructor expression, sumAmountGroupedByMonth kroz native SQL s TO_CHAR(due_date, 'YYYY-MM') jer JPQL nema prenosivu date-trunc funkciju)
DashboardService.getSummary ponovno koristi Specification obrazac iz PaymentSlipService (opcionalni categoryId/payerName filter), zbraja plaćeno/neplaćeno u memoriji; getByCategory/getByPayer/getTimeline su čisti DB-level GROUP BY upiti bez filtera
DashboardController na /api/dashboard — GET /summary, /by-category, /by-payer (kasnije /by-provider), /timeline
Otkrivena i riješena greška kod brisanja PaymentSlip koji ima PaymentSlipAudit povijest — FK violation na payment_slip_audits. Za razliku od Category/SubCategory/Property (gdje se brisanje blokira jer su djeca neovisne vrijednosti), ovdje je ispravno rješenje suprotno: PaymentSlipAudit je podređeni zapis bez smisla bez svog PaymentSlipa, pa PaymentSlipService.delete() sad eksplicitno briše audit zapise prije brisanja uplatnice, unutar @Transactional metode radi atomarnosti
Na korisnikovo zapažanje, preimenovan payerName → providerName kroz cijeli backend (PaymentSlip, RecurringPattern entiteti; DTO-ovi; PayerAmountResponse → ProviderAmountResponse; repository/service/controller filteri; Dashboard ruta /by-payer → /by-provider) — izvorni naziv payerName bio je pogrešan jer "payer" znači osoba koja plaća (korisnik), a polje zapravo opisuje davatelja usluge koji prima uplatu (dosljedno s iban poljem koje je već bilo "IBAN primatelja")
Korisnik ručno testirao cijeli Dashboard controller sa stvarnim uplatnicama i iznosima — radi ispravno
Ažuriran CLAUDE.md: trenutno stanje, domenski model (providerName umjesto payerName, napomena o cascade-delete iznimci za PaymentSlipAudit), plan REST ruta (/by-provider), sljedeći koraci

Problemi i rješenja

DataIntegrityViolationException kod brisanja PaymentSlip s postojećom PaymentSlipAudit poviješću — riješeno eksplicitnim cascade brisanjem audit zapisa u service sloju prije brisanja uplatnice (suprotno od Category/SubCategory/Property obrasca — ovdje se brise, ne blokira)
payerName je bio semantički pogrešan naziv (payer = onaj koji plaća, polje opisuje primatelja/davatelja usluge) — preimenovan u providerName kroz cijeli stack

Sutra

MinIO image upload (POST /payment-slips/{id}/image) — nova infrastruktura, MinIO klijent, bucket konfiguracija
UserDevice, Notification, Admin REST endpointi
Razmotriti početak sliptrack-mobile (Expo init) s obzirom na rok