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

27.07.2026. — Dan 5
Što je napravljeno

Implementiran MinIO image upload: POST /api/payment-slips/{id}/image
Dogovoreno da se slika sprema za svaki scan/priloženu fotografiju uplatnice (jedan endpoint za oba slučaja) jer je arhiviranje vizualnog dokaza originala dio glavne vrijednosti rada (digitalizacija papirnate uplatnice), ne samo izvučenih podataka
Dogovoreno da imageUrl bude presigned URL s istekom (15 min), ne trajni public URL — uplatnica sadrži financijske podatke (IBAN, iznos, poziv na broj), pa bi trajni javni URL bio nekonzistentan s ostatkom sustava koji već štiti vlasništvo nad Property/PaymentSlip u service sloju
Dodan io.minio:minio SDK u pom.xml
Kreiran MinioConfig (paket config) — MinioClient bean, bucket (payment-slip-images) se provjerava i auto-kreira (bucketExists/makeBucket) direktno unutar bean metode pri startu app-a, bez ručnog koraka u MinIO konzoli
Preimenovano PaymentSlip.imageUrl → imageKey — u bazi se sad sprema MinIO object key (payment-slips/{userId}/{paymentSlipId}/{uuid}.{ext}), ne URL; imageUrl naziv ostaje samo u PaymentSlipResponse gdje stvarno predstavlja URL
Kreiran PaymentSlipImageService: upload (validacija tipa JPEG/PNG i max veličine 10MB), delete, getPresignedUrl (istek 15 min)
PaymentSlipService.toResponse sad generira presigned URL iz imageKey pri svakom pozivu (on-demand, ne cachira se); uploadImage() briše stariju sliku iz MinIO prije uploada nove (zamjena, ne akumulacija); delete() briše pripadajući MinIO objekt nakon brisanja DB retka
Dodano spring.servlet.multipart.max-file-size/max-request-size=10MB u application.properties — bez ovoga bi Spring odbijao uploade već iznad defaultnog 1MB limita prije nego stignu do PaymentSlipImageService validacije
Ručno testirano kroz Postman: uspješan upload, presigned URL radi u browseru i mijenja se pri svakom GET-u, zamjena slike briše stari objekt iz bucketa (potvrđeno u MinIO konzoli), brisanje uplatnice briše sliku, upload na tuđu uplatnicu vraća 404, pogrešan tip datoteke i prevelika datoteka vraćaju 400
Ažuriran CLAUDE.md: trenutno stanje, domenski model (imageKey umjesto imageUrl na PaymentSlip, obrazloženje presigned pristupa), plan REST ruta, sljedeći koraci

Problemi i rješenja

MaxUploadSizeExceededException (Spring baca prije nego zahtjev stigne do controllera, kad multipart request premaši server-side limit) upadala je u GlobalExceptionHandler-ov catch-all Exception i vraćala 500 umjesto 400 — riješeno dodavanjem specifičnog @ExceptionHandler(MaxUploadSizeExceededException.class) koji vraća 400 s jasnom porukom
MultipartException ("Current request is not a multipart request", kad POST /image stigne bez multipart body-ja uopće) imala isti problem — riješeno dodavanjem @ExceptionHandler(MultipartException.class); MaxUploadSizeExceededException je podklasa, ali Spring bira specifičniji handler pa oba rade neovisno

Sutra

UserDevice, Notification, Admin REST endpointi
Razmotriti početak sliptrack-mobile (Expo init) s obzirom na rok

Nastavak Dana 5 — UserDevice, Notification, Admin
Što je napravljeno

Implementiran UserDevice: UserDeviceRepository (findByDeviceToken, findByIdAndUserId), UserDeviceRequest/Response, UserDeviceService, UserDeviceController na /api/devices — POST radi upsert po deviceToken (ako token već postoji, reasignira uređaj na trenutnog korisnika i ažurira platformu, umjesto da baci grešku ili stvori duplikat — pokriva slučaj reinstalacije aplikacije pod drugim računom na istom fizičkom uređaju), DELETE briše po vlasništvu
Implementiran Notification: NotificationRepository (findByUserIdOrderBySentAtDesc, findByIdAndUserId), NotificationResponse (bez Request DTO-a — nema create endpoint, upisivat će ga budući @Scheduled podsjetnik-job), NotificationService (getAll, markAsRead), NotificationController na /api/notifications
Razjašnjeno (na korisnikovo pitanje) da response mapiranje Notification.paymentSlip → paymentSlipId ne zahtijeva @EntityGraph iako je asocijacija LAZY — pristup samo getId()-u na neinicijaliziranom proxyju ne triggera LazyInitializationException jer je Hibernateu FK vrijednost već poznata iz same asocijacije, za razliku od ranijeg SubCategory.category.getName() slučaja koji je zahtijevao pun objekt
Implementiran Admin: UserRepository dobio countByActiveTrue(), PaymentSlipRepository dobio countGroupedByCategory() (sistemski upit, bez filtriranja po korisniku, za razliku od Dashboard upita); AdminUserResponse (bez financijskih podataka), AdminCategoryCountResponse (namjerno bez totalAmount polja — samo count, jer Admin ne smije vidjeti novčane iznose po CLAUDE.md pravilu; nije se ponovno iskoristio postojeći CategoryAmountResponse iz Dashboarda upravo zbog toga), AdminStatsResponse (totalUsers/activeUsers/totalPaymentSlips/topCategories top 5); AdminService, AdminController na /api/admin s @PreAuthorize("hasRole('ADMIN')") na razini cijelog controllera (sve rute su admin-only)
Proaktivno dodana zaštita u AdminService.deactivate() — admin ne može deaktivirati vlastiti račun (400), jer bi jedini admin inače mogao sam sebe zaključati iz sustava bez ikog tko bi ga mogao reaktivirati
Potvrđeno da active=false već ispravno blokira login bez dodatne logike — CustomUserDetailsService.disabled(!user.getActive()) je postojao od ranije (Dan 2)
Sve endpointe (UserDevice, Notification, Admin) korisnik ručno testirao kroz Postman
Ažuriran CLAUDE.md: trenutno stanje, plan sljedećih koraka (svi domenski REST endpointi iz plana sad gotovi)

Sutra

Razmotriti @Scheduled job za automatske podsjetnike (analiza RecurringPattern, upis Notification, slanje push kroz Expo Notifications API) — backend funkcionalnost koja nije bila na popisu REST ruta jer je nema klijent direktno pozivati
Ili krenuti na sliptrack-mobile (Expo init) s obzirom na rok

Nastavak Dana 5 — odluka o redoslijedu (mobile prije admin weba), plan skeniranja
Što je napravljeno

Dogovoreno da se sliptrack-mobile radi prije Admin web sučelja i prije @Scheduled podsjetnik-joba — mobile je glavni predmet rada (diferencijacija iz obrazloženja teme živi tamo) i tehnički najrizičniji dio (kamera, PDF417/OCR, native permisije), bolje rano otkriti probleme; podsjetnik-job šalje push na UserDevice tokene koji ne postoje dok mobitel ne registrira barem jedan, pa bi se testirao bez ikakve vizualne potvrde
Razjašnjen cijeli plan skeniranja uplatnice (zapisan u CLAUDE.md, sekcija "Plan implementacije skeniranja"): skeniranje je isključivo mobile-side posao, backend se ne mijenja — oba puta (barkod i OCR) završavaju istim POST /api/payment-slips pozivom s već potvrđenim podacima
Put 1 (primarni) — PDF417/HUB-3 barkod već sadrži strukturirane podatke kao čisti tekst odvojen \n u fiksnom redoslijedu (iznos, ime/adresa platitelja, providerName, adresa primatelja, IBAN, paymentModel, referenceNumber, šifra namjene, description) — expo-camera čita barkod on-device, parsira se split-om, korisnik svejedno ručno bira category/subCategory jer to barkod ne nosi
Put 2 (rezervno) — Google ML Kit OCR vraća sirovi tekst bez strukture, IBAN/iznos prepoznaju se regexom, manje pouzdano pa je ekran za potvrdu/ispravak ovdje kritičan; napomena da neki ML Kit React Native wrapperi zahtijevaju "development build" umjesto Expo Go — treba provjeriti prije init-a projekta jer utječe na testni workflow
Otkriveno da PaymentSlip.scannedAt trenutno nigdje nije postavljen na write strani (PaymentSlipService.create/update) — odluka o tome šalje li ga mobitel eksplicitno ili backend dobiva wasScanned flag odgođena dok se ne krene na scan ekrane
Objašnjena razlika trajni public URL vs presigned URL za MinIO sliku uplatnice (iz prethodnog dana, ali korisnik tražio dodatno pojašnjenje) — nije nova promjena koda, samo dokumentacijski kontekst
Pripremljena git commit poruka (summary + description) za korisnika da sam commita kroz GitHub Desktop — pokriva MinIO/UserDevice/Notification/Admin promjene
Ažuriran CLAUDE.md: nova sekcija "Plan implementacije skeniranja" ispod "Podaci koji se izvlače skeniranjem", redoslijed sljedećih koraka (mobile prije podsjetnik-joba prije admin weba)

Sutra

Kreirati sliptrack-mobile: npx create-expo-app, provjeriti Expo Go kompatibilnost odabranih barkod/OCR biblioteka (development build ako treba), postaviti auth flow protiv postojećeg /api/auth backenda

Nastavak Dana 5 — Expo init, istraženo Expo Go/ML Kit pitanje
Što je napravljeno

Dogovoreno da se sliptrack-mobile radi u TypeScriptu (ne čisti JavaScript) — pomaže da mobile DTO-ovi ostanu usklađeni s backend PaymentSlipRequest/Response ugovorom
Pokrenut npx create-expo-app@latest . --template blank-typescript u sliptrack-mobile — Expo SDK 57.0.8, React 19.2.3, React Native 0.86.0, TypeScript 6.0.3
Template je dodao lokalni CLAUDE.md/AGENTS.md (Expo-ov standardni scaffold koji upućuje na versioned SDK dokumentaciju) i .claude/settings.json — provjereno da su bezopasni, odvojeni od root CLAUDE.md preko ugniježđenog učitavanja
Istražena otvorena stavka iz "Plan implementacije skeniranja": treba li development build umjesto Expo Go za odabrane barkod/OCR biblioteke
Potvrđeno: expo-camera barcode scanning (uklj. pdf417) radi u Expo Go bez ikakvih promjena — SDK 57 dokumentacija eksplicitno navodi expo-go kao podržanu platformu
Potvrđeno: sve ML Kit OCR biblioteke (@react-native-ml-kit/text-recognition, expo-mlkit-ocr, expo-text-extractor) zahtijevaju development build (expo-dev-client + eas build --profile development ili lokalni prebuild) jer su native moduli izvan skupa koji Expo Go bundla, čak i one pisane kao Expo Modules s config pluginom
Odabrana biblioteka za Put 2 (OCR): expo-text-extractor ili expo-mlkit-ocr (gotov Expo config plugin) umjesto golog @react-native-ml-kit/text-recognition (zahtijevao bi ručno pisanje config plugina)
Odluka: ne prelazi se na development build odmah — Expo Go pokriva Put 1 (barkod) i sav ostali razvoj (auth, dashboard, navigation); prijelaz na dev build odgođen dok se ne krene na Put 2 implementaciju
Ažuriran CLAUDE.md: trenutno stanje (mobile inicijaliziran), riješena stavka u "Plan implementacije skeniranja", checklist unutar koraka 6 u "Sljedeći koraci"

Sutra

Postaviti strukturu foldera (screens/, components/, api/, navigation/, types/), auth flow protiv postojećeg /api/auth backenda, backend URL konfiguracija za emulator/fizički uređaj

Nastavak Dana 5 — struktura projekta, auth flow, SDK downgrade
Što je napravljeno

Odlučeno testiranje preko fizičkog uređaja (Expo Go) na LAN mreži umjesto Android emulatora — bliže stvarnom korištenju (kamera za skeniranje), LAN IP računala (192.168.1.8) korišten kao API_BASE_URL
Kreirana struktura foldera: src/api, src/components, src/context, src/navigation, src/screens/auth, src/screens/app, src/types
Instalirano: @react-navigation/native, @react-navigation/native-stack, react-native-screens, react-native-safe-area-context, expo-secure-store, axios
Provjeren točan backend auth ugovor iz izvornog koda (AuthController, RegisterRequest/LoginRequest/RefreshRequest/AuthResponse/TokenResponse) prije pisanja mobile tipova — /api/auth/register|login|refresh|logout na portu 8080
Implementiran axios klijent (src/api/client.ts) s request interceptorom (dodaje Bearer access token) i response interceptorom (na 401 automatski poziva /auth/refresh preko odvojene plain axios instance da ne triggera novi refresh krug, dijeli jedan in-flight refresh poziv kroz sve paralelne 401 zahtjeve, čisti tokene i javlja AuthContextu ako refresh sam padne)
Tokeni i korisnički podaci (email/ime/prezime/rola) spremaju se u expo-secure-store (tokenStorage.ts) — korisnik ostaje prijavljen nakon restarta app-a
Implementiran AuthContext (login/register/logout, bootstrap provjera pri pokretanju app-a), LoginScreen, RegisterScreen, placeholder HomeScreen, RootNavigator (auth stack vs app stack ovisno o user stanju)
Pokrenut backend i Expo dev server radi testiranja na fizičkom uređaju — otkriveno da korisnikov Expo Go (iOS) ne podržava Expo SDK 57 ("Project is incompatible with this version of Expo Go"), a App Store ne nudi update Expo Go aplikacije za korisnikov iOS
Spušten Expo SDK 57 → 54 (npx expo install expo@^54.0.0, zatim expo install --fix za usklađivanje react/react-native/svih ostalih paketa; čisti reinstall node_modules da se otkloni stale peer dependency warning) — sad odgovara Expo Go SDK 54 podršci na korisnikovom uređaju
Ažuriran CLAUDE.md: trenutno stanje (SDK 54 umjesto 57, konkretne verzije), checklist unutar koraka 6

Problemi i rješenja

"Project is incompatible with this version of Expo Go" — korisnikov Expo Go ne podržava SDK 57 i ne može se ažurirati (ograničenje iOS verzije na uređaju); riješeno spuštanjem projekta na SDK 54

Sutra

Testirati auth flow (register/login/logout) na fizičkom uređaju preko Expo Go, SDK 54
Krenuti na skeniranje (expo-camera PDF417) ili dashboard/payment-slip ekrane, ovisno o dogovoru