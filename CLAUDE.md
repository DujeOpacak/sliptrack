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
  ├── sliptrack-mobile/      ← React Native (Expo) — u izradi (auth, Property, PaymentSlip ručni unos gotovi)
  ├── sliptrack-admin/       ← React web admin sučelje — još ne postoji
  └── docker/                ← docker-compose.yml (PostgreSQL 18 + MinIO)
```

## Tech stack

- **Backend**: Spring Boot 4.1.0, Java 21, Maven, Hibernate ORM (Spring Data JPA), Spring Security, JWT (access + refresh token, jjwt 0.12.6), Lombok
- **Baza**: PostgreSQL 18 (Docker), db `sliptrack`, user/pass `sliptrack` / `sliptrack123`, port 5432
- **Object storage**: MinIO (slike uplatnica), konzola na http://localhost:9001, user/pass `sliptrack` / `sliptrack123`, API port 9000
- **Mobilna app**: React Native + Expo, PDF417 barkod skeniranje (HUB-3 standard) kao primarna metoda, Google ML Kit OCR kao rezerva
- **Admin**: React (web)
- **Push notifikacije**: Expo Notifications

Napomena: `pom.xml` koristi `spring-boot-starter-webmvc` (novi naziv u Spring Boot 4.x za `spring-boot-starter-web`) i `spring-boot-starter-data-jpa-test` / `-security-test` / `-webmvc-test` kao test starteri.

## Trenutno stanje (2026-07-29)

- ✅ `docker-compose.yml` gotov, oba kontejnera rade
- ✅ Spring Boot projekt kreiran, `application.properties` konfiguriran, spaja se na Postgres bez grešaka
- ✅ `spring.jpa.hibernate.ddl-auto=update` — Hibernate sam kreira tablice, nema ručnih migracija (Flyway/Liquibase se ne koristi)
- ✅ Paketna struktura backenda kreirana (`controller`, `service`, `repository`, `model`, `dto`, `security`, `config`)
- ✅ JPA entiteti kreirani: `User`, `Category`, `SubCategory`, `Property`, `PaymentSlip`, `RecurringPattern`, `UserDevice`, `Notification`, `PaymentSlipAudit`, `RefreshToken` (paket `model`), enumi `Role`, `PaymentStatus`, `DevicePlatform` (paket `enums`)
- ✅ JWT autentifikacija i Spring Security konfiguracija gotovi i testirani (Postman): `POST /api/auth/register`, `/login`, `/refresh`, `/logout`
- ✅ Access token (15 min) + refresh token (30 dana, hashiran u bazi, rotira se pri svakom refreshu)
- ✅ Grubi plan REST ruta za sve domenske entitete definiran (vidi "Plan REST ruta" niže)
- ✅ Category CRUD implementiran i testiran (Postman): `GET/POST/PUT/DELETE /api/categories` — GET javan svim autenticiranim korisnicima, POST/PUT/DELETE ograničeni na ADMIN (`@PreAuthorize`, `@EnableMethodSecurity` dodan u `SecurityConfig`)
- ✅ SubCategory CRUD implementiran i testiran (Postman): `GET/POST/PUT/DELETE /api/subcategories`, isto pravilo autorizacije kao Category; `allowsProperty` flag živi na SubCategory razini (npr. "Struja" unutar "Komunalije"), ne na Category
- ✅ Property CRUD implementiran i testiran (Postman): `GET/POST/PUT/DELETE /api/properties` — bez `@PreAuthorize`, vlasništvo se štiti isključivo u service sloju preko `CurrentUserService` (novi helper u `security` paketu, resolvao trenutnog korisnika iz `SecurityContext` po emailu); pristup tuđoj nekretnini vraća `404`, ne `403` (ne otkriva postojanje tuđih resursa)
- ✅ Globalno rukovanje greškama: `GlobalExceptionHandler` (`@RestControllerAdvice`, paket `exception`) hvata `MethodArgumentNotValidException` (400, `polje → poruka` mapa), `ResponseStatusException` (status iz iznimke + `message`), `AuthorizationDeniedException` (403, zamjena za staru `AccessDeniedException` u Spring Security 6.3+), i catch-all `Exception` (500, generička poruka klijentu + pun stack trace u server log preko `@Slf4j`) — svi odgovori u dosljednom `{"message": "..."}` formatu, bez curenja internih detalja
- ✅ `SecurityConfig` dobio eksplicitni `AuthenticationEntryPoint` bean — neautenticirani zahtjevi sad vraćaju `401` (piše JSON direktno u response, ne ide kroz `/error`), umjesto defaultnog Spring Security `403` (`Http403ForbiddenEntryPoint`) koji se koristi kad nema konfiguriranog `httpBasic()`/`formLogin()`
- ✅ PaymentSlip core CRUD implementiran i testiran (Postman): `GET/POST/PUT/PATCH/DELETE /api/payment-slips` + `GET /{id}/audit` — dinamičko filtriranje preko `JpaSpecificationExecutor` (`status`, `categoryId`, `subCategoryId`, `providerName`, `dueDateFrom/To`), validacija subCategory/property pravila u service sloju, `PATCH /status` upisuje `PaymentSlipAudit` samo kad se status stvarno promijeni; MinIO image upload (`POST /{id}/image`) namjerno odgođen kao zaseban korak
- ✅ Dashboard implementiran i testiran (Postman): `GET /api/dashboard/summary` (filtriran po `categoryId`/`providerName`), `/by-category`, `/by-provider`, `/timeline` (grupirano po mjesecu `dueDate`-a, native SQL `TO_CHAR`) — sve scoped na trenutnog korisnika
- ✅ MinIO image upload implementiran i testiran (Postman): `POST /api/payment-slips/{id}/image` — `PaymentSlip.imageKey` u bazi sprema MinIO object key (`payment-slips/{userId}/{paymentSlipId}/{uuid}.{ext}`), `PaymentSlipResponse.imageUrl` se generira on-demand kao presigned URL (istek 15 min) pri svakom GET-u; bucket (`payment-slip-images`) se auto-kreira pri startu app-a (`MinioConfig`, `bucketExists`/`makeBucket`); zamjena slike briše stari objekt, brisanje uplatnice briše pripadajući objekt iz MinIO; validacija tipa (JPEG/PNG) i max veličine (10MB) u `PaymentSlipImageService`, `spring.servlet.multipart.max-file-size/max-request-size=10MB` usklađeno s tim limitom
- ✅ UserDevice implementiran i testiran (Postman): `POST /api/devices` (upsert po `deviceToken` — reasignira uređaj na trenutnog korisnika ako token već postoji, npr. reinstall pod drugim računom), `DELETE /api/devices/{id}`
- ✅ Notification implementiran i testiran (Postman): `GET /api/notifications`, `PATCH /api/notifications/{id}/read` — nema create endpoint (namjerno, upisivat će ga budući `@Scheduled` podsjetnik-job)
- ✅ Admin implementiran i testiran (Postman): `GET /api/admin/users` (bez financijskih podataka), `PATCH /api/admin/users/{id}/activate|deactivate` (blokirano samo-deaktiviranje admina), `GET /api/admin/stats` (totalUsers/activeUsers/totalPaymentSlips/topCategories — top 5 po broju, bez iznosa)
- ❌ Svi REST endpointi iz plana sad implementirani. Preostaje: `@Scheduled` job za automatske podsjetnike (analiza `RecurringPattern`, slanje push notifikacija kroz Expo Notifications API — funkcionalnost iz "Funkcionalnosti — mobilna app" #4, nije REST endpoint pa nije bila na popisu ruta) i cijeli mobilni/admin frontend
- ✅ `sliptrack-mobile` inicijaliziran: `create-expo-app` s `blank-typescript` templateom; naknadno spušten s Expo SDK 57 na **SDK 54** (`npx expo install expo@^54.0.0` + `expo install --fix`) jer korisnikov Expo Go na iOS-u (verzija OS-a ne prima noviji Expo Go update) podržava samo do SDK 54 — trenutne verzije: Expo SDK 54, React 19.1.0, React Native 0.81.5, TypeScript 5.9.2
- ✅ Istražena Expo Go kompatibilnost skeniranja: `expo-camera` PDF417 radi u Expo Go, ML Kit OCR biblioteke zahtijevaju development build (vidi "Plan implementacije skeniranja")
- ✅ Auth flow testiran na fizičkom uređaju kroz Expo Go (register/login/logout, access+refresh token ciklus) — radi ispravno
- ✅ Property CRUD implementiran na mobileu: `propertyApi.ts`, `PropertyListScreen` (lista + FAB za dodavanje), `PropertyFormScreen` (create/edit/delete u jednom ekranu, isti obrazac kao Login/Register — inline error, `err?.response?.data?.message`); brisanje nekretnine s postojećim uplatnicama sad ispravno hvata `409 Conflict` s backenda i prikazuje `Alert` s porukom umjesto tihog neuspjeha
- ✅ Category/SubCategory read-only API sloj na mobileu (`categoryApi.ts`) — koristi ga PaymentSlip forma za dropdown kategorija/potkategorija
- ✅ PaymentSlip ručni unos (Put 3 iz plana skeniranja) implementiran: `paymentSlipApi.ts`, `PaymentSlipListScreen` (kartice sa statusom/iznosom/kategorijom, brzi toggle statusa dodirom na badge), `PaymentSlipFormScreen` (create/edit/delete; kategorija/potkategorija dropdown preko `@react-native-picker/picker` s dinamičkim učitavanjem potkategorija; nekretnina dropdown prikazan samo kad odabrana potkategorija ima `allowsProperty`, isto pravilo kao backend `PaymentSlipService.resolveProperty`; datum dospijeća preko `@react-native-community/datetimepicker`, formatiran ručno iz lokalnih Date dijelova — ne `toISOString()`, da se izbjegne UTC timezone off-by-one bug kod ponoćnih lokalnih datuma)
- ✅ Status promjena (PAID/UNPAID) ožičena na `PATCH /payment-slips/{id}/status` — dostupna kao brzi dodir na badge u listi i kao poseban gumb u formi, oba mjesta ažuriraju lokalni state iz odgovora servera bez punog refetcha
- ✅ Oba nova native paketa (`@react-native-picker/picker`, `@react-native-community/datetimepicker`) potvrđena kao Expo Go kompatibilna na SDK 54 prije instalacije (provjereno na docs.expo.dev, po pravilu iz `sliptrack-mobile/AGENTS.md` da se prije pisanja koda čita točna verzionirana Expo dokumentacija)
- ✅ Navigacija na mobileu preoblikovana u bottom tab bar (`@react-navigation/bottom-tabs`): Dashboard / Uplatnice / (+) / Nekretnine / Profil — `AppTabNavigator.tsx` (novi paket `@expo/vector-icons` za ikone taba); root `RootNavigator` sad omata tabove kao `AppTabs` ekran plus `PropertyForm`/`PaymentSlipForm` kao `presentation: "modal"` ekrani izvan tab bara; centralni `+` (`CenterAddButton`, komponenta podignuta iznad tab bara) nije pravi tab nego presreće `tabPress` i direktno otvara `PaymentSlipForm` preko `navigation.getParent()`; stari `HomeScreen` obrisan, zamijenjen `ProfileScreen`-om (greeting + odjava) kao Profil tab; FAB na `PaymentSlipListScreen` uklonjen (zamijenjen globalnim tab bar `+`)
- ✅ `DashboardScreen` implementiran: `dashboardApi.ts` (summary/by-category/by-provider/timeline), `StatTile`/`BarChart`/`LineChart` komponente u `src/components/`, `src/theme/colors.ts` uveden kao dijeljena paleta (validirana kroz `dataviz` skill — jedna plava boja za sve barove jer su kategorije nominalne bez prirodnog poretka, tzv. "rainbow bar chart" anti-pattern namjerno izbjegnut; validirane `good`/`critical` status boje umjesto proizvoljnog zelene/crvene); `BarChart` građen s običnim RN View-ovima (bez SVG-a), `LineChart` s `react-native-svg` (Expo Go kompatibilan, potvrđeno prije instalacije)
- ✅ PDF417 skeniranje (Put 1 iz plana skeniranja) implementirano na mobileu: `expo-camera` instaliran i potvrđen Expo Go kompatibilan prije instalacije; `parseHub3.ts` parsira HUB-3 barkod string po fiksnom redoslijedu polja; `ScanScreen.tsx` (permisije, `isLocked` flag protiv višestrukog triggera, `Alert` s opcijama "Ručni unos"/"Pokušaj ponovno" kod neuspjelog parsiranja); `AddChoiceScreen.tsx` — centralni tab bar `+` sad otvara izbor Skeniraj/Ručni unos umjesto direktno prazne forme; `PaymentSlipForm` prošireni route param prima `scannedData` i pre-popunjava polja uz plavi banner upozorenja da se podaci provjere prije spremanja; navigacija kroz `AddChoice`→`Scan`/`Form` koristi `navigation.replace` da povratak iz forme ide ravno na tabove
- ✅ `PaymentSlip.scannedAt` otvoreno pitanje iz "Plan implementacije skeniranja" riješeno: `PaymentSlipRequest.wasScanned` (boolean, backend) — `PaymentSlipService.create()` postavlja `scannedAt = now()` samo ako je `true`; `update()` ga ne dira; mobile šalje `wasScanned: true` samo pri kreiranju iz scan-flowa, nikad pri ručnom unosu ili editiranju
- ✅ Upload fotografije uplatnice na mobileu implementiran (`expo-image-picker`, potvrđen Expo Go kompatibilan prije instalacije, `mediaTypes: ['images']` — non-deprecated API): kartica za fotografiju na `PaymentSlipForm` (Kamera/Galerija izbor), `paymentSlipApi.uploadImage(id, image)` (multipart FormData); budući da endpoint zahtijeva postojeći `id`, redoslijed u `handleSave` je uvijek prvo `create()`/`update()`, tek onda upload — ako sam upload slike padne, uplatnica ostaje spremljena i korisnik dobije `Alert` (ne gubi unesene podatke); radi identično za sva tri puta unosa (scan/ručno/edit), nema posebne logike u `ScanScreen`
- ✅ Novo polje `PaymentSlip.paidAt` (datum stvarnog plaćanja, odvojeno od `PaymentSlipAudit.changedAt` koji ostaje "kad je promjena upisana u app") — `PaymentSlipStatusUpdateRequest.paidAt` opcionalan; `updateStatus()`: prijelaz u PAID → poslani datum ili "danas" ako nije poslan i ranije nije bio PAID, ponovno slanje PAID uz novi `paidAt` dok je već PAID korigira datum bez diranja statusa, prijelaz u UNPAID briše `paidAt`; mobile: dodir na status gumb u formi (UNPAID→PAID) sad otvara date picker (`maximumDate` = danas) prije slanja, dok brzi toggle na listi ostaje trenutan (backend defaultira na danas); Android/iOS razlika u `DateTimePicker` ponašanju obrađena (Android modal = jednokratan `onChange`, poziva API odmah; iOS inline picker šalje `onChange` kontinuirano pa se samo lokalno ažurira draft dok korisnik eksplicitno ne potvrdi gumbom)
- 🔶 `UserDevice` registracija na mobileu implementirana, ali s poznatim ograničenjem: `deviceApi.ts`, `registerPushToken.ts` (`expo-notifications`, traži permisije, dohvaća Expo push token preko `getExpoPushTokenAsync` uz `projectId` iz `app.json extra.eas`), `AuthContext.tsx` poziva `registerDeviceForPush()` (best-effort, `try/catch`, nikad ne blokira login/register/app-startup) nakon logina/registracije/obnove sesije i briše uređaj (`DELETE /api/devices/{id}`) na logoutu; `deviceId` iz odgovora servera čuva se u `tokenStorage` (SecureStore) — **poznato ograničenje**: `expo-notifications` remote push token dohvat (`getExpoPushTokenAsync`) ne radi u Expo Go na Androidu od SDK 53 nadalje (radi normalno na iOS-u) — na Androidu `registerDeviceForPush()` tiho ne uspije (uhvaćeno u `try/catch`), uređaj se jednostavno nikad ne registrira; isti obrazac kao Put 2 (OCR) — rješava se prelaskom na development build, odgođeno dok se stvarno ne krene testirati na Android uređaju
- ❌ `sliptrack-admin` nije inicijaliziran

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

**Category** (kreira samo ADMIN; korisnici samo biraju) — najviša razina, npr. "Komunalije", "Zdravstvo"
- id, name, createdAt

**SubCategory** (kreira samo ADMIN) — konkretna usluga unutar kategorije, npr. "Struja", "Voda" unutar "Komunalije"; `ManyToOne` na Category
- id, name, allowsProperty (dopušta li ova potkategorija vezivanje uz Property), category, createdAt
- `allowsProperty` je namjerno na SubCategory razini, ne na Category — cijela kategorija "Komunalije" je preopćenita (npr. "Komunalna naknada" ne veže se uz specifičan Property na isti način kao "Struja")

**Property** — stambeni prostor (npr. "Stan Zagreb", "Vikendica"); nema izravnu vezu na Category/SubCategory — veže se kroz PaymentSlip, i to samo kad `paymentSlip.subCategory.allowsProperty == true`
- id, name, address, user (vlasnik)

**PaymentSlip** — uplatnica
- id, iban, amount, referenceNumber (poziv na broj), paymentModel (HR01, HR02...), providerName (naziv davatelja usluge — primatelja uplate, ne osobe koja plaća; nazvano `providerName` a ne `payerName` da se ne miješa s korisnikom koji plaća), description, dueDate, status (PAID / UNPAID), paidAt (datum stvarnog plaćanja — nullable, postavlja se/briše se u `PATCH /status`, odvojeno od `PaymentSlipAudit.changedAt` koji bilježi kad je promjena upisana u app; korisnik može zadati datum unatrag ako je platio prije nego je uplatnicu unio/skenirao), imageKey, category, subCategory (nullable — obavezan ako Category ima definirane SubCategory zapise, inače ostaje null), property (nullable, samo ako subCategory.allowsProperty), user, createdAt, scannedAt

Slike uplatnica se **ne** spremaju u PostgreSQL — idu u MinIO, u bazi se čuva samo `imageKey` (MinIO object key, npr. `payment-slips/{userId}/{paymentSlipId}/{uuid}.jpg`), ne URL. Bucket je privatan; `PaymentSlipResponse.imageUrl` se generira on-demand kao presigned URL (istek 15 min) pri svakom GET-u preko `PaymentSlipImageService`, umjesto da se sprema trajni public URL — uplatnica sadrži financijske podatke (IBAN, iznos, poziv na broj) pa slika ne smije biti dostupna bez autentikacije bilo kome tko procuri/pogodi URL, dosljedno s ostatkom sustava gdje se vlasništvo štiti u service sloju.

**RecurringPattern** — analiza obrasca plaćanja po davatelju, podloga za automatske podsjetnike
- id, user, providerName, averageDayOfMonth, averageAmount, lastPaymentDate, nextPredictedDate, updatedAt

**UserDevice** — Expo push token po uređaju korisnika
- id, user, deviceToken, platform (ANDROID / IOS), createdAt, updatedAt

**Notification** — zapis poslane push notifikacije (in-app inbox)
- id, user, paymentSlip (nullable), message, read, sentAt

**PaymentSlipAudit** — povijest promjena statusa uplatnice (korisnički uvid u zadnju promjenu vlastite uplatnice)
- id, paymentSlip, changedBy, oldStatus, newStatus, changedAt

**RefreshToken** — infrastrukturni entitet za JWT refresh flow (nije dio domenskog modela iz projektnog obrasca)
- id, user, tokenHash (SHA-256 hash, ne plaintext), expiresAt, revoked, createdAt

Enumi (`Role`, `PaymentStatus`, `DevicePlatform`) su u zasebnom paketu `com.sliptrack.sliptrackbackend.enums`, entiteti u `model`.

### Podaci koji se izvlače skeniranjem uplatnice

IBAN primatelja, iznos, poziv na broj primatelja, model plaćanja (HR01, HR02...), naziv davatelja usluge, opis plaćanja, datum dospijeća.

### Plan implementacije skeniranja (dogovoreno, još nije implementirano — `sliptrack-mobile`)

Skeniranje se odvija **isključivo na mobilnoj strani** — backend se ne mijenja, oba puta (barkod i OCR) na kraju šalju isti `POST /api/payment-slips` s već parsiranim i korisnički potvrđenim podacima kroz postojeći `PaymentSlipRequest`.

**Put 1 — PDF417 barkod (primarni).** HUB-3 barkod već sadrži strukturirane podatke kao čisti tekst, polja odvojena `\n`, fiksni redoslijed:
```
HRVHUB30
EUR
000000000012550          ← iznos, zadnje 2 znamenke centi, bez decimalne točke
Ime Prezime platitelja
Adresa platitelja
Grad platitelja
HEP ELEKTRA               ← naziv primatelja = providerName
Ulica primatelja
Grad primatelja
HR1210010051863000160     ← IBAN primatelja
HR01                      ← paymentModel
1234567890                ← referenceNumber (poziv na broj)
XXXX                      ← šifra namjene
Struja - srpanj 2026       ← description
```
`expo-camera` (`CameraView`, `barcodeScannerSettings: { barcodeTypes: ['pdf417'] }`) čita barkod on-device, string se parsira split-om po `\n` u čistoj JS funkciji (mapiranje pozicije → polje), rezultat popuni ekran za potvrdu/ispravak (korisnik i dalje ručno bira `categoryId`/`subCategoryId` — to barkod ne nosi).

**Put 2 — OCR (rezervno, kad barkod nema/ne čita se).** Google ML Kit Text Recognition vrati sirovi tekst bez strukture — IBAN/iznos/poziv na broj prepoznaju se regexom/heuristikom (`HR\d{19}` za IBAN i sl.), manje pouzdano od barkoda, zato je ekran za potvrdu/ispravak ovdje kritičan.

**Riješeno — Expo Go vs development build:** `expo-camera` barcode scanning (uklj. `pdf417`) radi u Expo Go bez ikakvih promjena (SDK 57 dokumentacija eksplicitno navodi `expo-go` kao podržanu platformu) — Put 1 i sav ostali razvoj (auth, dashboard, navigation) ide normalno kroz Expo Go. ML Kit OCR biblioteke (`@react-native-ml-kit/text-recognition`, `expo-mlkit-ocr`, `expo-text-extractor`) su sve native moduli izvan skupa koji Expo Go bundla — zahtijevaju **development build** (`expo-dev-client` + `eas build --profile development` ili lokalni prebuild), čak i one pisane kao Expo Modules s config pluginom. Odabrana biblioteka: `expo-text-extractor` ili `expo-mlkit-ocr` (imaju gotov Expo config plugin) umjesto golog `@react-native-ml-kit/text-recognition` (ručno pisanje config plugina). Prijelaz na dev build odgađa se dok se ne krene na Put 2 implementaciju — nema potrebe prebacivati cijeli projekt unaprijed.

**Put 3 — ručni unos.** Isti `PaymentSlipRequest` oblik, bez auto-popunjenih polja.

**Otvoreno:** `PaymentSlip.scannedAt` trenutno nigdje nije postavljen na write strani (`PaymentSlipService.create/update`) — treba odlučiti šalje li mobitel `scannedAt` kao dio requesta ili backend dobiva `wasScanned` flag pa sam postavlja timestamp; kod ručnog unosa mora ostati `null`. Odgoditi odluku dok se ne krene na scan ekrane.

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

- JWT autentifikacija implementirana: access token (15 min, `jwt.access-token-expiration-ms`) + refresh token (30 dana, `jwt.refresh-token-expiration-ms`, hashiran SHA-256 u tablici `refresh_tokens`, rotira se pri svakom refreshu)
- `jwt.secret` trenutno hardkodiran u `application.properties` (commita se u git) — prihvatljivo za sada, razmotriti premještanje u `application-local.properties` (već u `.gitignore`) prije javnog objavljivanja repozitorija
- Endpointi: `POST /api/auth/register`, `/login`, `/refresh`, `/logout` — javno dostupni (`permitAll`), sve ostalo zahtijeva autentikaciju
- Napomena: `/error` mora biti u `permitAll` listi — servlet kontejner interno preusmjerava neuhvaćene HTTP greške (npr. `ResponseStatusException`) na `/error`, koji inače prolazi kroz Security filter i vraća pogrešan `403` umjesto stvarnog statusa
- Dvije uloge: USER, ADMIN
- Svaki korisnik vidi samo svoje uplatnice
- Admin nema pristup tuđim financijskim podacima

## Rukovanje greškama

`GlobalExceptionHandler` (`com.sliptrack.sliptrackbackend.exception`) centralizira sve HTTP odgovore na greške kroz cijeli API — svi vraćaju `{"message": "..."}` (ili `{"polje": "poruka"}` za validaciju), nikad sirovi Spring/Boot format s `trace`/`timestamp`/`path`.

| Iznimka | Status | Izvor |
|---|---|---|
| `MethodArgumentNotValidException` | 400 | `@Valid` na `@RequestBody` DTO-ovima |
| `AuthenticationEntryPoint` (SecurityConfig, ne ide kroz handler) | 401 | zahtjev bez valjanog JWT-a |
| `AuthorizationDeniedException` | 403 | `@PreAuthorize` odbija (npr. USER na ADMIN-only rutu) |
| `ResponseStatusException` | status iz iznimke (404/409/...) | ručno bačeno u service sloju (npr. `findByIdOrThrow`) |
| `Exception` (catch-all) | 500 | neočekivano — puni stack trace ide u server log (`@Slf4j`), klijent dobiva samo generičku poruku |

Napomena o `application.properties`: nema `server.error.*` konfiguracije — `spring-boot-devtools` u dev profilu sam postavlja `include-stacktrace`/`include-message` na `ALWAYS`, zato se stari (pred-`GlobalExceptionHandler`) odgovori vidljivi u Postmanu s punim trace-om — to je devtools ponašanje, ne bug. U produkciji (bez devtools) taj isti fallback bi vratio generički odgovor bez trace-a, ali `GlobalExceptionHandler` sad daje kontroliran, dosljedan format neovisno o devtools okruženju.

### LazyInitializationException — obrazac za buduće entitete (PaymentSlip!)

`spring.jpa.open-in-view=false` znači da se Hibernate sesija zatvara čim repository poziv završi — svaki `@ManyToOne(fetch = LAZY)` pristupljen izvan te sesije baca `LazyInitializationException`. Naučeno na `SubCategory.category`:

- **Read strana** (`getAll`/`getById`): repository metode moraju eksplicitno eager-učitati asocijaciju — `@EntityGraph(attributePaths = "...")` na `findAll()`/`findById()`/custom finder metodama. Ne osloniti se na `@Transactional` na servisnoj metodi ako se mapiranje u DTO (`toResponse`) može pozvati i iz konteksta gdje transakcija nije garantirana — `@EntityGraph` je strukturno zagarantiran na razini upita, `@Transactional` ovisi o disciplini da svaka buduća metoda koja dira lazy polje bude anotirana.
- **Update strana**: `repository.save()` na entitetu s postojećim ID-om zove Hibernateov `merge()`, koji bez `cascade = MERGE` na asocijaciji vraća **nov, neinicijaliziran proxy** za tu asocijaciju na vraćenom (merged) entitetu — čak i ako je asocijacija bila potpuno učitana prije `save()`. Rješenje: graditi response DTO koristeći objekt koji je servis već eksplicitno i potpuno učitao (npr. `findCategoryOrThrow(...)` rezultat), ne `savedEntity.getAsociacija()`.
- `AuthService.refresh()` koristi `@Transactional` i to je ispravno — cijeli lazy pristup (`refreshToken.getUser()`) događa se unutar te iste anotirane metode, nema curenja proxy-ja van transakcijske granice. `@Transactional` nije "loš" pristup, samo je prikladniji za usku, jednokratnu operaciju nego za read endpoint koji vraća listu i prolazi kroz odvojeni mapper.

`PaymentSlip` će imati više `@ManyToOne` veza (`category`, `subCategory`, `property`, `user`) — primijeniti isti `@EntityGraph` obrazac odmah, ne čekati da se greška pojavi.

### FK constraint prije brisanja

Kad entitet ima djecu preko `@ManyToOne` (npr. `Category` ← `SubCategory`), `delete()` u service sloju mora provjeriti `existsByParentId()` prije brisanja i vratiti `409 Conflict` s jasnom porukom — ne pustiti da DB FK constraint padne i završi kao neuhvaćeni `500` (`DataIntegrityViolationException`). Cascade-delete je namjerno izbjegnut (npr. brisanje Category ne smije tiho obrisati SubCategory i posljedično PaymentSlip zapise — financijski podaci se ne smiju tiho gubiti). Isti obrazac primijenjen na `SubCategory` i `Property` kad `PaymentSlip` počne referencirati na njih (`PaymentSlipRepository.existsByCategoryId/existsBySubCategoryId/existsByPropertyId`).

**Iznimka od pravila — `PaymentSlip` ↔ `PaymentSlipAudit`**: obrnut slučaj. `PaymentSlipAudit` je podređeni zapis koji ima smisla samo dok postoji `PaymentSlip` na koji se odnosi (povijest promjena statusa te konkretne uplatnice) — blokirati brisanje uplatnice zbog postojeće audit povijesti bi bilo pogrešno. Ovdje `PaymentSlipService.delete()` (`@Transactional`) prvo eksplicitno briše sve `PaymentSlipAudit` zapise (`paymentSlipAuditRepository.deleteByPaymentSlipId(id)`), pa tek onda `PaymentSlip` — cascade delete na razini servisa, ne blokada.

## Plan REST ruta (domenski entiteti)

Grubi plan, regulirati po potrebi tijekom implementacije. "Vlasnik"/"samo svoje" znači da se filtriranje po `user` radi u service sloju (iz `SecurityContext`), ne kroz `SecurityConfig`.

### Category `/api/categories`
| Metoda | Ruta | Opis | Autorizacija |
|---|---|---|---|
| GET | `/api/categories` | Lista svih kategorija | svi autenticirani |
| GET | `/api/categories/{id}` | Detalji kategorije | svi autenticirani |
| POST | `/api/categories` | Nova kategorija | ADMIN |
| PUT | `/api/categories/{id}` | Izmjena kategorije | ADMIN |
| DELETE | `/api/categories/{id}` | Brisanje kategorije | ADMIN |

### SubCategory `/api/subcategories`
| Metoda | Ruta | Opis | Autorizacija |
|---|---|---|---|
| GET | `/api/subcategories?categoryId=` | Lista potkategorija, opcionalni filter po kategoriji | svi autenticirani |
| GET | `/api/subcategories/{id}` | Detalji potkategorije | svi autenticirani |
| POST | `/api/subcategories` | Nova potkategorija (body uključuje `categoryId`) | ADMIN |
| PUT | `/api/subcategories/{id}` | Izmjena potkategorije (uklj. premještanje u drugu kategoriju) | ADMIN |
| DELETE | `/api/subcategories/{id}` | Brisanje potkategorije | ADMIN |

### Property `/api/properties`
| Metoda | Ruta | Opis | Autorizacija |
|---|---|---|---|
| GET | `/api/properties` | Lista nekretnina prijavljenog korisnika | USER (samo svoje) |
| GET | `/api/properties/{id}` | Detalji nekretnine | USER (vlasnik) |
| POST | `/api/properties` | Nova nekretnina | USER |
| PUT | `/api/properties/{id}` | Izmjena nekretnine | USER (vlasnik) |
| DELETE | `/api/properties/{id}` | Brisanje nekretnine | USER (vlasnik) |

### PaymentSlip `/api/payment-slips`
| Metoda | Ruta | Opis | Autorizacija |
|---|---|---|---|
| GET | `/api/payment-slips` | Lista uplatnica, query params: `status`, `categoryId`, `subCategoryId`, `providerName`, `dueDateFrom/To` | USER (samo svoje) |
| GET | `/api/payment-slips/{id}` | Detalji uplatnice | USER (vlasnik) |
| POST | `/api/payment-slips` | Nova uplatnica (ručni unos ili nakon skeniranja) | USER |
| POST | `/api/payment-slips/{id}/image` | Upload slike u MinIO, upiše `imageKey` | USER (vlasnik) |
| PUT | `/api/payment-slips/{id}` | Izmjena podataka uplatnice | USER (vlasnik) |
| PATCH | `/api/payment-slips/{id}/status` | Promjena statusa PAID/UNPAID → upisuje `PaymentSlipAudit` | USER (vlasnik) |
| DELETE | `/api/payment-slips/{id}` | Brisanje uplatnice | USER (vlasnik) |
| GET | `/api/payment-slips/{id}/audit` | Povijest promjena statusa te uplatnice | USER (vlasnik) |

### Dashboard `/api/dashboard`
| Metoda | Ruta | Opis | Autorizacija |
|---|---|---|---|
| GET | `/api/dashboard/summary` | Ukupno plaćeno/neplaćeno (filtrirano po kategoriji/davatelju) | USER |
| GET | `/api/dashboard/by-category` | Iznosi grupirani po kategoriji | USER |
| GET | `/api/dashboard/by-provider` | Iznosi grupirani po davatelju | USER |
| GET | `/api/dashboard/timeline` | Troškovi kroz vrijeme (za graf) | USER |

### UserDevice `/api/devices` (push notifikacije)
| Metoda | Ruta | Opis | Autorizacija |
|---|---|---|---|
| POST | `/api/devices` | Registracija/update Expo push tokena za uređaj | USER |
| DELETE | `/api/devices/{id}` | Uklanjanje uređaja (npr. logout) | USER (vlasnik) |

### Notification `/api/notifications`
| Metoda | Ruta | Opis | Autorizacija |
|---|---|---|---|
| GET | `/api/notifications` | In-app inbox obavijesti | USER (samo svoje) |
| PATCH | `/api/notifications/{id}/read` | Označi kao pročitano | USER (vlasnik) |

### Admin `/api/admin`
| Metoda | Ruta | Opis | Autorizacija |
|---|---|---|---|
| GET | `/api/admin/users` | Popis korisnika | ADMIN |
| PATCH | `/api/admin/users/{id}/deactivate` | Deaktivacija korisnika | ADMIN |
| PATCH | `/api/admin/users/{id}/activate` | Reaktivacija korisnika | ADMIN |
| GET | `/api/admin/stats` | Statistike sustava (broj korisnika, broj skeniranih uplatnica, top kategorije) | ADMIN |

Napomene:
- `RecurringPattern` nema vlastiti REST endpoint — puni ga interni `@Scheduled` job, nije nešto što klijent CRUD-a direktno.
- `PaymentSlipAudit` nema create endpoint — upisuje se automatski unutar `PATCH /payment-slips/{id}/status`.

## Sljedeći koraci (redoslijed)

1. ✅ Kreirati paketnu strukturu backenda
2. ✅ Kreirati JPA entitete i enume
3. ✅ Kreirati Repository sučelja (Spring Data JPA) — zasad `UserRepository`, `RefreshTokenRepository`
4. ✅ JWT autentifikacija + Spring Security konfiguracija (access + refresh token)
5. REST endpointi za domenske entitete (controller + service sloj: PaymentSlip, Category, SubCategory, Property, Dashboard...)
   - ✅ Category (gotovo i testirano)
   - ✅ SubCategory (gotovo i testirano)
   - ✅ Property (gotovo i testirano)
   - ✅ PaymentSlip core CRUD (gotovo i testirano) — MinIO image upload odgođen kao zaseban korak
   - ✅ Dashboard (gotovo i testirano)
   - ✅ MinIO image upload (gotovo i testirano)
   - ✅ UserDevice (gotovo i testirano)
   - ✅ Notification (gotovo i testirano)
   - ✅ Admin (gotovo i testirano)
6. **React Native mobilna aplikacija (Expo init, auth, skeniranje, dashboard)** — dogovoreno da ide prije Admin web sučelja i prije podsjetnik-joba: mobile je glavni predmet rada i tehnički najrizičniji dio (kamera, barkod/OCR, native permisije), bolje rano otkriti probleme; podsjetnik-job šalje push na `UserDevice` tokene koji ne postoje dok mobitel ne registrira barem jedan (`POST /api/devices`), pa bi se testirao "na slijepo" bez mobitela. Vidi "Plan implementacije skeniranja" iznad za detalje.
   - ✅ Expo init (TypeScript template)
   - ✅ Expo Go vs development build istraženo i riješeno
   - ✅ Struktura foldera, auth flow protiv `/api/auth`, navigation — testirano na fizičkom uređaju
   - ✅ Property CRUD ekrani (lista, forma create/edit/delete)
   - ✅ PaymentSlip ručni unos (Put 3) — lista, forma create/edit/delete, kategorija/potkategorija/nekretnina dropdown, date picker, status toggle
   - ✅ Bottom tab navigacija (Dashboard/Uplatnice/+/Nekretnine/Profil) + Dashboard ekran (stat tiles, bar/line grafovi)
   - ✅ PDF417 skeniranje (Put 1) — AddChoice izbor, ScanScreen, HUB-3 parser, pre-popunjavanje forme
   - ✅ Upload fotografije uplatnice (Kamera/Galerija, `expo-image-picker`), `scannedAt`/`wasScanned`, `paidAt` (datum stvarnog plaćanja s backdating podrškom)
   - ❌ `UserDevice` registracija na mobileu, `Notification` inbox ekran, OCR (Put 2, zahtijeva dev build)
7. Automatski podsjetnici — `@Scheduled` job (analiza `RecurringPattern`, upis `Notification`, slanje push kroz Expo Notifications API) — nakon mobitela, kad postoji barem jedan registriran `UserDevice` za stvarno testiranje push notifikacija
8. React admin sučelje
9. Testiranje

## Pokretanje lokalno

```bash
# Docker (Postgres + MinIO)
cd docker && docker-compose up -d

# Backend
cd sliptrack-backend && ./mvnw spring-boot:run
```

Backend na http://localhost:8080, MinIO konzola na http://localhost:9001.
