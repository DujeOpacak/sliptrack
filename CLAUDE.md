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

**Sadržaj rada (iz obrasca, 2026-08-07 — puni tekst prvi put dobiven, ranije samo parafraza)** — orijentir za opseg poglavlja koja treba napisati/demonstrirati, posebno relevantno za planiranje preostalog rada:

1. Uvod
2. Analiza problema i postojećih rješenja (2.1 opis problema, 2.2 analiza postojećih rješenja, 2.3 prijedlog rješenja)
3. Arhitektura programskog rješenja (3.1 opća arhitektura, 3.2 model baze podataka, 3.3 pozadinski dio, 3.4 mobilno sučelje, 3.5 autentifikacija/uloge)
4. Razvoj programskog rješenja (4.1 digitalizacija barkod+OCR, 4.2 evidencija/status, 4.3 dashboard/grafovi, 4.4 automatski podsjetnici, 4.5 admin sučelje, **4.6 kontejnerizacija i produkcijsko okruženje**)
5. **Testiranje i analiza programskog rješenja** (5.1 strategija testiranja, 5.2 testiranje točnosti digitalizacije uplatnica, 5.3 funkcionalno i integracijsko testiranje) — potvrđeno da testovi NISU opcionalni, dio su odobrenog sadržaja; trenutno stanje: backend ima samo prazan Spring Initializr placeholder test, mobile/admin nemaju nijedan test file, sve dosad ručno testirano
6. Zaključak, Literatura

Poglavlje 4.6 znači da produkcijsko/kontejnerizirano okruženje mora biti demonstrirano, ne samo lokalni `docker-compose up` — vidi "Deployment" niže. Poglavlje 5 znači da treba stvarne automatske testove, ne samo ručno testiranje — vidi "Sljedeći koraci" niže za predloženo mapiranje.

## Arhitektura

Tri zasebna projekta u jednom repozitoriju (privatni GitHub repo `sliptrack`):

```
sliptrack/
  ├── sliptrack-backend/     ← Java 21 / Spring Boot 4.1.0 REST API
  ├── sliptrack-mobile/      ← React Native (Expo) — funkcionalno kompletan (auth, skeniranje uklj. OCR, dashboard, podsjetnici)
  ├── sliptrack-admin/       ← React web admin sučelje (Vite + TypeScript) — u izradi (auth, Kategorije, Korisnici, Statistika, Pregled gotovi)
  └── docker/                ← docker-compose.yml (PostgreSQL 18 + MinIO)
```

## Tech stack

- **Backend**: Spring Boot 4.1.0, Java 21, Maven, Hibernate ORM (Spring Data JPA), Spring Security, JWT (access + refresh token, jjwt 0.12.6), Lombok
- **Baza**: PostgreSQL 18 (Docker), db `sliptrack`, user/pass `sliptrack` / `sliptrack123`, port 5432
- **Object storage**: MinIO (slike uplatnica), konzola na http://localhost:9001, user/pass `sliptrack` / `sliptrack123`, API port 9000
- **Mobilna app**: React Native + Expo, PDF417 barkod skeniranje (HUB-3 standard) kao primarna metoda, Google ML Kit OCR kao rezerva
- **Admin**: React (web), Vite + TypeScript, React Router, axios — bez UI biblioteke (ručno pisan dizajn sustav: tamna tema, oštri rubovi, `CSS Modules`)
- **Push notifikacije**: Expo Notifications

Napomena: `pom.xml` koristi `spring-boot-starter-webmvc` (novi naziv u Spring Boot 4.x za `spring-boot-starter-web`) i `spring-boot-starter-data-jpa-test` / `-security-test` / `-webmvc-test` kao test starteri.

## Trenutno stanje (2026-08-07)

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
- ✅ Svi REST endpointi iz plana implementirani (Category, SubCategory, Property, PaymentSlip, Dashboard, UserDevice, Notification, Admin)
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
- ✅ `UserDevice` registracija na mobileu implementirana i testirana na fizičkom iOS uređaju: `deviceApi.ts`, `registerPushToken.ts` (`expo-notifications`, traži permisije, dohvaća Expo push token preko `getExpoPushTokenAsync` uz `projectId` iz `app.json extra.eas`), `AuthContext.tsx` poziva `registerDeviceForPush()` (best-effort, `try/catch`, nikad ne blokira login/register/app-startup) nakon logina/registracije/obnove sesije i briše uređaj (`DELETE /api/devices/{id}`) na logoutu; `deviceId` iz odgovora servera čuva se u `tokenStorage` (SecureStore); potvrđeno u bazi: login upisuje `user_devices` redak (`ExponentPushToken[...]`, `platform=IOS`), logout ga briše, ponovni login (uklj. drugi korisnik na istom uređaju) ispravno reupotrijebi/reasignira isti `deviceToken` — **poznato ograničenje, ažurirano 2026-08-06**: na Androidu `registerDeviceForPush()` tiho ne uspije (uhvaćeno u `try/catch`, best-effort po dizajnu), uređaj se nikad ne registrira; izvorno pretpostavljeno da je uzrok Expo Go specifičan i da će prelazak na development build sam po sebi riješiti problem — **pokazalo se netočnim**: nakon uspješnog dev build seta (vidi "Development build — Android" niže) i privremenog logiranja greške u catchu, stvarni uzrok je `Default FirebaseApp is not initialized` — Android push (od nedavno, otkad je Google ugasio legacy FCM API) zahtijeva vlastiti Firebase (FCM V1) projekt neovisno o Expo Go/dev build razlici; rješenje ima dva dijela, oba još nenapravljena: (A) `google-services.json` iz Firebase Console (Android app, package `com.dujeopacak.sliptrackmobile`) u projektu + `app.json` `android.googleServicesFile` + `expo prebuild --clean`, (B) `eas credentials` upload FCM V1 service account key-a za serversku isporuku; vidi DEVLOG 06.08.2026 za detalje
- ✅ `Notification` inbox ekran implementiran: `notificationApi.ts`, `NotificationListScreen.tsx` (lista, neplaćene/nepročitane obavijesti vizualno istaknute, dodir označava kao pročitano preko `PATCH /{id}/read` i, ako obavijest ima `paymentSlipId`, otvara pripadajuću uplatnicu); dostupno preko gumba "Obavijesti" na `ProfileScreen`-u kao zaseban `AppStack` ekran (ne tab, isto kao `AddChoice`)
- ✅ Filteri na `PaymentSlipListScreen`: status (PAID/UNPAID), kategorija, potkategorija (dinamički ovisno o kategoriji), nekretnina (prikazana samo ako korisnik ima barem jednu), godina i mjesec dospijeća (`getDueDateRange` pretvara u `dueDateFrom`/`dueDateTo`, backend query params prošireni s `propertyId`) — otvaraju se preko ikone filtera u headeru taba (ne zauzima prostor na ekranu), prikazani u `Modal` bottom-sheetu
- ✅ `SelectField.tsx` — vlastita "textfield + dropdown" komponenta (`src/components/`) koja zamjenjuje `@react-native-picker/picker` posvuda (filteri i `PaymentSlipFormScreen` kategorija/potkategorija/nekretnina) — riješava dva Android problema s default Picker izgledom: zauzimao je preveliki prostor (pun-ekran spinner) i odabrani naziv se nije jasno vidio; sad kompaktno polje s dropdown listom ispod, cijeli izgled i ponašanje pod kontrolom aplikacije
- ✅ `PaymentSlip.dueDate` promijenjen u obavezno polje (`@Column(nullable = false)` + `@NotNull` na `PaymentSlipRequest`) na korisnikov zahtjev — svaka uplatnica (i tekući računi i jednokratne kazne/uplate) mora imati datum dospijeća da podsjetnici i filtriranje rade jednoobrazno za sve; HUB-3 barkod ne nosi taj podatak pa `PaymentSlipFormScreen` sad blokira spremanje bez njega na sva tri puta unosa (scan/ručno/edit)
- ✅ Riješen Android bug: polje "Datum dospijeća" u `PaymentSlipFormScreen` moglo se postaviti isključivo na 01.01.1970 (Unix epoch) — uzrok je `value={dueDate ?? new Date()}` u `DateTimePicker`-u gdje se `new Date()` iznova računala (nova referenca) pri svakom re-renderu dok je Android native picker otvoren, native modul se zbunio i resetirao prikaz na epoch (poznat issue u `@react-native-community/datetimepicker`); riješeno stabilnom `today` referencom (`useMemo`), isti obrazac koji polje "Plaćeno" (`paidAt`/`draftPaidAt`) već ispravno koristi
- ✅ Fullscreen preglednik fotografije uplatnice: dodir na sliku u `PaymentSlipFormScreen` otvara `Modal` s cijelom slikom (`resizeMode="contain"`, crna pozadina, zatvara se dodirom/X gumbom); mijenjanje fotografije (Kamera/Galerija) ostaje dostupno preko zasebne male ikone na thumbnailu, ne miješa se s pregledom
- ✅ `PropertyFormScreen` dobio vidljive labele iznad polja (Naziv/Adresa, ne samo placeholder); kartice na `PropertyListScreen` vizualno istaknutije (tamnija pozadina, obrub, suptilna sjena) na korisnikov zahtjev
- ✅ Graf "Troškovi kroz vrijeme" na Dashboardu redizajniran: `LineChart.tsx` sad ima pravu Y os (4 gridlinea s € vrijednostima, skalirano na najveći mjesečni zbroj **unutar odabranog razdoblja**) i X os s labelom ispod svake točke (kratki hrvatski format mjeseca, npr. "srp 26"); graf postaje vodoravno scrollabilan (`ScrollView horizontal`) kad ima puno točaka (12/24 mjeseca); dodir na točku prikazuje tooltip s mjesecom i iznosom (automatski se prebacuje ispod točke ako nema mjesta iznad); backend `GET /dashboard/timeline?months=N` sad vraća **kontinuirani niz mjeseci** (default 6, opcije 3/6/12/24 preko `SelectField` iznad grafa) s nulama za mjesece bez uplatnica, umjesto da ih izostavlja; zbrajanje PAID+UNPAID po mjesecu ostaje kao i prije (bez filtera po statusu)
- ✅ `@Scheduled` podsjetnik-job implementiran i testiran end-to-end (baza, in-app inbox, push na fizički iOS uređaj): `ReminderService` (dnevno u 8h preko `reminder.cron`) prvo poziva `RecurringPatternService.recomputeAll()` — analizira povijest po `(user, providerName)` s min. 3 zapisa (prosjek dana u mjesecu i iznosa, `nextPredictedDate` = zadnji `dueDate` + 1 mjesec, dan clampan na kraj mjeseca kad treba), zatim šalje 4 neovisna slučaja: "Uskoro dospijeva" (sutra..+`reminder.days-ahead` dana, `status=UNPAID`), "Danas dospijeva" (`dueDate == danas`), "Dospjelo, neplaćeno" (`dueDate < danas`), "Očekivana uplatnica" (predikcija bez postojeće uplatnice za taj mjesec/davatelja); svaki slučaj šalje se točno jednom po uplatnici/mjesecu — dedup preko `NotificationRepository.existsByPaymentSlipIdAndMessageStartingWith` (prefiks poruke po slučaju) za prva tri, preko `RecurringPattern.lastReminderSentAt` za predikciju; `ExpoPushService` (novo, `RestClient`) šalje push na sve `UserDevice` korisnika, greške se hvataju i logiraju bez rušenja joba
- ✅ Badge nepročitanih obavijesti na mobileu: `NotificationContext.tsx` (novo, `src/context/`) drži `unreadCount`, osvježava se pri pokretanju app-a i preko `Notifications.addNotificationReceivedListener` (trenutno osvježavanje čim push stigne dok je app otvorena); prikazan kao nativni `tabBarBadge` na Profil tabu (`@react-navigation/bottom-tabs`) i kao broj uz "Obavijesti" gumb na `ProfileScreen`-u; `NotificationListScreen` poziva `refreshUnreadCount()` nakon `markAsRead` da badge odmah padne
- ✅ Stale `payer_name` stupac u `recurring_patterns` tablici (ostatak od prije preimenovanja u `providerName`; `ddl-auto=update` ne briše/preimenuje stupce, samo dodaje nove) ručno uklonjen (`ALTER TABLE ... DROP COLUMN`) jer je blokirao insert s `NOT NULL` violation
- ✅ Riješen drugi, iOS-specifičan `DateTimePicker` bug (uzročno različit od ranijeg Android epoch buga) — datum dospijeća se kod uzastopnih skeniranja unutar iste app sesije mogao postaviti samo na 1.1.1970. ili starije (restart app-a privremeno popravljao); JS state (`dueDate`, `today` `useMemo`) ispravno se resetirao pri svakom mountu ekrana, pa je uzrok bio na native razini — React Native reciklirao `UIDatePicker` view umjesto potpunog uništavanja/stvaranja; riješeno dodavanjem `key={route.key}` na oba `DateTimePicker`-a u `PaymentSlipFormScreen` (dospijeće i plaćeno), forsira svjež native view po svakoj instanci ekrana
- ✅ Backend prošireno za `sliptrack-admin` (web klijent) bez ijedne izmjene mobile ugovora — dodatno je, ne zamjena: access token i dalje stiže u JSON body (`AuthResponse`/`TokenResponse`, mobile ga sprema u `SecureStore` kao i prije); refresh token se sad **dodatno** šalje kao `HttpOnly` cookie (`AuthController.setRefreshCookie/clearRefreshCookie`, `SameSite=Strict`, `path=/api/auth`, `secure` gatan preko `app.cookie.secure` property-ja) — mobile ga ignorira (RN axios ne perzistira cookieje), web ga koristi umjesto localStorage; `/auth/refresh`/`/logout` sad primaju token iz cookieja ILI iz bodyja (`RefreshRequest.refreshToken` prestao biti `@NotBlank`) — isti endpoint servisira oba klijenta; `SecurityConfig` dobio `CorsConfigurationSource` bean (`app.cors.allowed-origins`, `allowCredentials(true)`, `exposedHeaders: Set-Cookie`); novi `GET /api/auth/me` (`CurrentUserResponse`) jer JWT nosi samo email — web ga zove nakon tihog cookie-refresha da dohvati ime/prezime/rolu za UI (ruta premještena iz `permitAll` u `anyRequest().authenticated()` popis, za razliku od `register/login/refresh/logout`)
- ✅ Backend dobio dva nova admin-only endpointa (samo brojevi, bez financijskih podataka — dosljedno CLAUDE.md pravilu): `GET /api/admin/categories/stats` (pun popis kategorija s brojem uplatnica, bez top-5 ograničenja kao `/admin/stats`), `GET /api/admin/subcategories/stats` (isto na razini potkategorije, `categoryId` u svakom retku); nova repository upit metoda `countGroupedBySubCategory()` (JPQL GROUP BY, isti obrazac kao postojeći `countGroupedByCategory()`), `AdminSubCategoryCountResponse` DTO
- ✅ `sliptrack-admin` inicijaliziran (`npm create vite@latest -- --template react-ts`), `react-router-dom` dodan (pinnan na patched verziju, preostale `npm audit` prijave vežu se uz RSC/SSR mod koji se ne koristi u ovom čisto client-side SPA-u pa su irelevantne)
- ✅ Dizajn sustav dogovoren s korisnikom prije prve implementacije: tamna/crna tema, oštri rubovi posvuda (`border-radius: 0 !important` globalno u `index.css`), bez "klasičnih AI" boja/ikona — plavi accent (`#2a78d6`, isti kao mobile `colors.primary` radi brand kontinuiteta) kao jedina boja, `good`/`critical` status boje identične mobileu; monospace font (`ui-monospace`) za brand mark, navigacijske labele i brojčane vrijednosti (ledger/terminal estetika); svih ~10 ikona (Dashboard/Kategorije/Korisnici/Statistika/Odjava/Edit/Delete/Plus/Chevron/Sort) ručno crtani angularni SVG-ovi (`strokeLinejoin="miter"`) u `src/components/icons.tsx`, namjerno ne biblioteka ikona
- ✅ Auth sloj na adminu: `tokenStore.ts` (access token isključivo u memoriji, modulska varijabla, nikad localStorage/sessionStorage — XSS površina realna u browseru za razliku od mobilne app), `client.ts` (axios `withCredentials: true`, isti refresh/retry-na-401 obrazac kao mobile, dijeljen in-flight refresh), `AuthContext.tsx` (tihi bootstrap preko refresh cookieja pri učitavanju stranice → `GET /auth/me` za user info; `role !== 'ADMIN'` na loginu ili bootstrapu odmah briše cookie preko `/auth/logout`, ne pušta USER račun u admin sesiju iako bi cookie tehnički bio valjan)
- ✅ `AdminLayout` + `Sidebar` (fiksna lijeva navigacija, aktivna stavka = tanka plava lijeva linija) + `PageHeader` (naslov/podnaslov/akcije slot) — ugniježđene rute (`/`, `/categories`, `/users`, `/stats`) iza `ProtectedRoute`
- ✅ **Kategorije** (`/categories`): expand/collapse redak po kategoriji (potkategorije lazy-loadaju se na prvi expand), CRUD modali za oboje (kategorija: naziv; potkategorija: naziv, `allowsProperty` checkbox, `categoryId` dropdown — podržava premještanje potkategorije u drugu kategoriju), badge "Nekretnina"/"Bez nekretnine"; search preko naziva kategorije ILI potkategorije (dodatni fetch svih potkategorija odjednom samo za search index, odvojeno od lazy per-category liste za prikaz) — pri pretrazi automatski expand-a pogotke; brisanje/greške idu kroz `ConfirmContext`/`ToastContext` (vidi niže), FK `409 Conflict` s backenda prikazan u toastu
- ✅ **Korisnici** (`/users`): tablica s badge rola/status, aktivacija/deaktivacija po retku (gumb onemogućen na vlastitom računu, zrcali backend `400` pravilo umjesto čekanja greške), search (ime/prezime/email) + filteri (rola, status), **sortiranje klikom na header stupca** (Korisnik/Rola/Status/Registriran, `SortIcon` — dva trokutića, aktivan smjer u accent boji), **izvoz CSV** (poštuje trenutne filtere/sortiranje/pretragu)
- ✅ **Statistika** (`/stats`): 5 stat tile-ova (ukupno/aktivni/neaktivni korisnici, ukupno uplatnica, prosjek po korisniku — neaktivni i prosjek izvedeni client-side, bez backend izmjene), **"Registracije kroz vrijeme"** (`LineChart.tsx`, vlastita SVG implementacija — kvadratni markeri umjesto krugova radi oštre teme, hover tooltip, period selector 3/6/12/24 mjeseca, kontinuirani niz mjeseci s nulama isto kao mobile dashboard timeline), "Korisnici po roli" i **"Uplatnice po kategoriji"** (`BarChart.tsx` — jedna accent boja za sve barove jer su kategorije nominalne bez prirodnog poretka, "rainbow bar chart" anti-pattern izbjegnut isto kao na mobileu, validirano kroz `dataviz` skill; dropdown "Sve kategorije" vs. konkretna kategorija prebacuje graf na breakdown po njenim potkategorijama, koristi nova `/admin/categories|subcategories/stats` dva endpointa), "Najnovije registracije" (zadnjih 5), izvoz CSV (multi-sekcijski, jedan file sa svih pet blokova)
- ✅ **Pregled** (`/`, dashboard/home): skraćena verzija statistike (3 stat tile-a), top 3 kategorije kao rang-lista, kartice brzog pristupa na ostala tri ekrana
- ✅ `ToastContext`/`ConfirmContext` — zamjena za native `alert()`/`confirm()` (izlazili su iz teme): toast stog bottom-right s accent bojom po tipu (error/success/info), auto-dismiss 5s; `confirm()` promise-based hook kroz postojeći `Modal`, `danger` varijanta (crveni gumb) za destruktivne akcije — sve `alert`/`confirm` pozive u Kategorijama i Korisnicima zamijenjeni, uspješne akcije (brisanje, aktivacija/deaktivacija) dodatno potvrđene zelenim toastom
- ✅ `src/utils/csv.ts` — RFC4180 escapiranje (zarezi/navodnici/newline u poljima), UTF-8 BOM da hrvatska dijakritika ne puca u Excelu; `src/utils/formatDate.ts`, `src/utils/months.ts` (dijeljeni helperi, isti mjesečni skraćeni format "srp 26" kao mobile `DashboardScreen`)
- ✅ OCR (Put 2 na mobileu) implementiran i testiran na Android emulatoru (dvije različite uplatnice) — zadnja planirana mobile funkcionalnost, mobile je time funkcionalno kompletan: `expo-text-extractor` (`pchalupa/expo-text-extractor`, ML Kit na Androidu / Apple Vision na iOSu, `extractTextFromImage(uri): Promise<string[]>`) instaliran bez potrebe za config pluginom (čist autolink modul, potvrđeno u `expo-module.config.json` — bez `app.plugin.js`); zahtijevao rebuild dev clienta (`npx expo prebuild --clean --platform android` + `npx expo run:android`) jer je novi native modul izvan Expo Go skupa, isto obrazloženje kao ranije za ML Kit; `prebuild --clean` je (očekivano, poznat gotcha) obrisao `android/local.properties`, ponovno kreiran (`sdk.dir=...`) prije rebuilda
- ✅ Odlučeno (nakon rasprave o UX-u i testiranju bez fizičkog iOS/Android uređaja) da OCR NIJE live-scan nego foto/galerija: `expo-text-extractor` radi nad jednom statičnom slikom, ne video streamom, pa live-frame-capture ne bi donio korist; provjereno da to nije ograničenje iz projektnog obrasca (rad ne propisuje live-scan). Ekran `OcrScanScreen.tsx` nudi isti Kamera/Galerija izbor kao postojeći upload fotografije uplatnice (`ImagePicker.launchCameraAsync`/`launchImageLibraryAsync`, `mediaTypes: ["images"]`, `quality: 0.7`) — reuse postojećeg, već testiranog obrasca umjesto novog mehanizma
- ✅ `src/utils/parseOcrText.ts` — heuristički parser (za razliku od `parseHub3.ts` koji čita fiksne pozicije u barkod stringu, OCR vraća niz linija bez garantiranog redoslijeda pa se sve izvlači regexom nad spojenim tekstom): IBAN (`HR` + 19 znamenki, tolerantno na razmake koje OCR ubaci između znamenki), iznos (hrvatski format `1.234,56`), model plaćanja (`HR\d{2}` s negativnim lookaheadom `(?!\d)` da se razlikuje od početka IBAN-a koji nastavlja s još znamenki — IBAN se prvo pronađe i ukloni iz teksta prije traženja modela, da se izbjegne krivi match), poziv na broj (znamenke odmah iza modela plaćanja); `providerName`/`description` namjerno se NE izvlače heuristikom (nepouzdano bez labela polja na slici) — korisnik ih upisuje ručno, dosljedno s dokumentiranom nižom pouzdanosti OCR puta
- ✅ Testiranje na Android emulatoru bez fizičkog uređaja riješeno drag-and-drop slike uplatnice izravno na prozor emulatora (ide u Downloads/galeriju, dostupno kroz `expo-image-picker` "Galerija" opciju) — determinističko i ponovljivo za razliku od AVD webcam passthrough opcije (koja bi bila potrebna samo za "Kamera" put); korisnikovo testiranje s dvije stvarne uplatnice potvrdilo da flow radi end-to-end, uz očekivanu nižu točnost prepoznavanja pojedinih polja (zato postoji ekran za potvrdu/ispravak — po dizajnu, ne bug)
- ✅ Navigacija: `AddChoiceScreen` dobio treću opciju "OCR fotografija" (odabrana opcija A nad alternativom "OCR kao fallback unutar `ScanScreen`-a nakon neuspjelog barkoda" — manje isprepleteno, lakše izolirano testirati); `types.ts` — nova `OcrScanPaymentSlip: undefined` ruta, `PaymentSlipForm` union proširen s `{ ocrData: ParsedOcrData; sourceImage?: PickedImage }`; `PickedImage` sučelje premješteno iz lokalne definicije u `PaymentSlipFormScreen.tsx` u `types.ts` (dijeljeno između `PaymentSlipFormScreen` i `OcrScanScreen`)
- ✅ Bonus integracija: fotografija koju korisnik odabere/snimi za OCR automatski se koristi kao slika uplatnice (`sourceImage` param → `setPickedImage` u `PaymentSlipFormScreen` init efektu) — korisnik je ionako već fotografirao uplatnicu za prepoznavanje teksta, nema smisla da je bira ponovno za upload; `wasScanned` (za backend `scannedAt`) sad `true` i za OCR put (`scannedData !== undefined || ocrData !== undefined`), banner tekst prilagođen po izvoru — OCR poruka eksplicitno upozorava na nižu pouzdanost naspram barkoda ("manje pouzdano od barkoda, pažljivo provjeri")
- ✅ Odgovoreno korisnikovo pitanje o testiranju bez plaćenog Apple Developer računa: fizičko iOS testiranje custom native koda (uklj. OCR) nije moguće bez njega — lokalni build treba Xcode/Mac (korisnik je na Windowsu), a EAS cloud build i dalje mora ad-hoc potpisati build za instalaciju na uređaj, što Apple dopušta samo plaćenim Program članovima (besplatan Apple ID daje samo 7-dnevno lokalno "personal team" potpisivanje, opet uz Mac); dogovoreno da se iOS grana koda piše i kompajlira, ali fizička verifikacija ostaje odgođena do otvaranja Apple Developer Program računa
- ✅ Tijekom vođenog code reviewa (07.08.2026) otkriveni i popravljeni bugovi: `SubCategoryService.update()` nije sprječavao `allowsProperty` toggle-off dok postoje uplatnice s dodijeljenom nekretninom (vidi "FK constraint prije brisanja"); `ReminderService.sendPredictedReminders()` je "već postoji uplatnica za taj mjesec" provjeru radio samo protiv `UNPAID` statusa (`existsByUserIdAndProviderNameAndDueDateBetween`, bez status filtera, ispravlja); `PaymentSlipService.delete()` nije otkvačivao `Notification.paymentSlip` prije brisanja uplatnice → FK violation kod brisanja uplatnice s postojećim podsjetnicima, riješeno `NotificationRepository.detachPaymentSlip()` (postavlja `paymentSlip = null`, notifikacija ostaje jer je poruka smislena samostalno, isti `paymentSlipId == null` slučaj koji mobile već podržava za "Očekivana uplatnica")
- ✅ `PaymentSlipAudit` prikaz na mobileu: `PaymentSlipFormScreen` dobio sekciju "Povijest promjena statusa" (zadnjih 5 tranzicija, "Prikaži još X" bez ugniježđenog scrolla) — endpoint je postojao od Dana 4 ali ga dotad nijedan klijent nije pozivao
- ✅ `ProfileScreen` redizajniran (dashboard-stil, korisnikov odabir između 4 ponuđene opcije): header kartica s inicijalima, `StatTile` red (broj uplatnica/neplaćenih, broj nekretnina), meni lista (Obavijesti s brojčanim badge, Odjava)
- ✅ Dashboard prošireno "Po potkategoriji" sekcijom (`GET /api/dashboard/by-subcategory`, opcionalni `categoryId`/`propertyId`/`dueDateFrom`/`dueDateTo`) — rješava problem da je `providerName` slobodan tekst (npr. "HEP Elektra" vs "HEP - Opskrba" fragmentiraju graf "Po davatelju"), dok je `subCategory` kontrolirani rječnik; filteri Kategorija/Nekretnina/Godina/Mjesec na mobileu. Implementacija prvo pokušala JPQL `(:param IS NULL OR ...)` obrazac (netestiran nigdje drugdje u kodu) — vratio pogrešne (nefiltrirane) rezultate; zamijenjeno dokazanim `Specification` + agregacija-u-memoriji pristupom (isti kao `getSummary()`). Usput otkrivena i popravljena ugniježđena `LazyInitializationException` zamka — vidi "Ugniježđene lazy asocijacije" u sekciji ispod
- ✅ `PaymentSlipListScreen` kartice uplatnica vizualno usklađene s `PropertyListScreen` karticama (tamnija pozadina `#eef0f2`, obrub `#dde1e6`, suptilna sjena) na korisnikov zahtjev
- ✅ Dashboard prošireno "Usporedba nekretnina" sekcijom (`GET /api/dashboard/property-comparison`, opcionalni `dueDateFrom`/`dueDateTo`) — prikazuje se samo korisnicima s 2+ nekretnine; dva dropdowna (Nekretnina 1/Nekretnina 2, međusobno isključuju odabir onog drugog da se izbjegne usporedba nekretnine same sa sobom) + Godina/Mjesec filter; podaci se grupiraju klijentski po potkategoriji, po jedan `BarChart` po potkategoriji s barovima = odabrane nekretnine (reuse postojećeg single-series grafa umjesto novog clustered-bar komponenta, dosljedno dataviz-validiranom dizajnu)
- ✅ Dashboard sekcije (`Po kategoriji`/`Po potkategoriji`/`Usporedba nekretnina`/`Po davatelju`/`Troškovi kroz vrijeme`) dobile vizualno odvajanje — gornja linija (`borderTopWidth`) + veći razmak na dijeljenom `sectionTitle` stilu, jedna izmjena primijenjena svugdje
- ✅ `BarChart` (mobile) redizajniran — labela iznad bara umjesto pored (stack layout) umjesto skraćivanja (`numberOfLines={1}` uklonjen), rješava problem dugih naziva davatelja/kategorija koji su se skraćivali ("HEP ELEKT...")
- ✅ `sliptrack-admin` postao u potpunosti responzivan (07.08.2026, prvi put ikad — prije nijedan `@media` query nije postojao u projektu): `Sidebar` ispod 768px postaje off-canvas drawer (hamburger gumb u novoj mobilnoj traci, `MenuIcon`/`CloseIcon` dodane u `icons.tsx`, auto-close pri odabiru stavke/kliku na pozadinu); `Dashboard`/`Stats` grid-ovi promijenjeni s fiksnog `repeat(N, 1fr)` na `repeat(auto-fit, minmax(...))` (samostalan reflow bez ručnih breakpointa); `Modal`/`Toast`/`LoginPage` fiksne širine dobile `max-width: 100%` sigurnosnu mrežu; admin `BarChart` dobio istu stack-layout izmjenu kao mobile verzija; `LineChart` X-os labele preskaču se (max ~8 vidljivih) kod puno točaka da se ne preklapaju; Korisnici tablica omotana u `overflow-x: auto` (`min-width: 640px`) umjesto da lomi layout stranice; globalni `.toolbar` dobio `flex-wrap`. Jedan dosljedan breakpoint (768px layout, 480px sitna dorada), bez nove ovisnosti
- ✅ Admin `LineChart` tooltip interakcija promijenjena s hovera (`onMouseEnter`/`onMouseLeave`) na klik/tap toggle (`onClick`) — hover ne postoji na touch ekranima pa graf nije radio na mobitelu; hit-area povećana s 20×20 na 24×24 (bliže preporučenoj touch-target veličini)

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
- id, iban, amount, referenceNumber (poziv na broj), paymentModel (HR01, HR02...), providerName (naziv davatelja usluge — primatelja uplate, ne osobe koja plaća; nazvano `providerName` a ne `payerName` da se ne miješa s korisnikom koji plaća), description, dueDate (**obavezno**, `NOT NULL` — svaka uplatnica, uklj. jednokratne kazne/uplate bez "pravog" roka dospijeća, mora imati datum da podsjetnici/filtriranje rade jednoobrazno), status (PAID / UNPAID), paidAt (datum stvarnog plaćanja — nullable, postavlja se/briše se u `PATCH /status`, odvojeno od `PaymentSlipAudit.changedAt` koji bilježi kad je promjena upisana u app; korisnik može zadati datum unatrag ako je platio prije nego je uplatnicu unio/skenirao), imageKey, category, subCategory (nullable — obavezan ako Category ima definirane SubCategory zapise, inače ostaje null), property (nullable, samo ako subCategory.allowsProperty), user, createdAt, scannedAt

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

**Put 2 — OCR (rezervno, kad barkod nema/ne čita se) — ✅ implementirano.** Google ML Kit (Android) / Apple Vision (iOS) preko `expo-text-extractor` vraća sirovi tekst kao niz linija bez strukture — IBAN/iznos/model plaćanja/poziv na broj prepoznaju se regexom/heuristikom u `src/utils/parseOcrText.ts` (`HR\d{19}` za IBAN i sl.), manje pouzdano od barkoda, zato je ekran za potvrdu/ispravak ovdje kritičan (banner na formi eksplicitno upozorava). Implementirano kao foto/galerija (`OcrScanScreen.tsx`, isti `expo-image-picker` obrazac kao upload fotografije uplatnice), ne live-scan — biblioteka radi nad jednom statičnom slikom, ne video streamom; potvrđeno da to nije ograničenje iz projektnog obrasca. Odabrana fotografija automatski postaje i slika uplatnice (bonus, izbjegava duplo biranje). Testirano na Android emulatoru (drag-and-drop slike u galeriju emulatora) s dvije stvarne uplatnice — radi end-to-end, uz očekivano nižu točnost pojedinih polja.

**Riješeno — Expo Go vs development build:** `expo-camera` barcode scanning (uklj. `pdf417`) radi u Expo Go bez ikakvih promjena (SDK 57 dokumentacija eksplicitno navodi `expo-go` kao podržanu platformu) — Put 1 i sav ostali razvoj (auth, dashboard, navigation) ide normalno kroz Expo Go. ML Kit/Vision OCR biblioteke su native moduli izvan skupa koji Expo Go bundla — zahtijevaju **development build** (`npx expo prebuild` + `npx expo run:android` lokalno, ili `eas build --profile development` u cloudu za iOS bez Mac-a), čak i one pisane kao Expo Modules. Odabrana biblioteka: `expo-text-extractor` (pchalupa) — bez config plugina, čist autolink modul (`expo-module.config.json`, nema `app.plugin.js`), pokriva oba OS-a jednim paketom umjesto zasebnog ML Kit wrappera po platformi.

**Put 3 — ručni unos.** Isti `PaymentSlipRequest` oblik, bez auto-popunjenih polja.

**Riješeno — `scannedAt`:** `PaymentSlipRequest.wasScanned` (boolean) — `PaymentSlipService.create()` postavlja `scannedAt = now()` samo ako je `true`. Mobile šalje `wasScanned: true` za oba scan puta (barkod i OCR), nikad pri ručnom unosu ili editiranju — vidi "Trenutno stanje" gore.

## Funkcionalnosti — mobilna app (USER)

1. **Skeniranje uplatnice**: primarno PDF417 barkod (HUB-3), rezervno OCR (foto/galerija, ML Kit/Vision preko `expo-text-extractor`), ekran za potvrdu/ispravak, i mogućnost ručnog unosa.
2. **Evidencija**: status PAID/UNPAID, kategorizacija, vezivanje komunalnih uplatnica uz Property, pohrana slike u MinIO.
3. **Dashboard**: filteri po statusu/kategoriji/davatelju, ukupni iznosi plaćeno/neplaćeno po davatelju i kategoriji, grafički prikaz troškova kroz vrijeme.
4. **Automatski podsjetnici**: Spring `@Scheduled` job (dnevno) analizira obrasce plaćanja (prethodni dueDate-ovi), predviđa sljedeći rok, šalje push notifikaciju kroz Expo Notifications.

## Funkcionalnosti — admin sučelje (ADMIN)

- ✅ Upravljanje kategorijama i potkategorijama (CRUD, `allowsProperty` flag, search)
- ✅ Upravljanje korisničkim računima (pregled, aktivacija/deaktivacija, search/filter/sort, izvoz CSV)
- ✅ Statistike sustava (broj registriranih/aktivnih/neaktivnih korisnika, broj uplatnica, uplatnice po kategoriji/potkategoriji s filterom, registracije kroz vrijeme, izvoz CSV)
- Admin **nema** pristup financijskim podacima korisnika — potvrđeno kroz sve implementirane admin endpointe (samo brojevi, nikad iznosi)

## Sigurnost

- JWT autentifikacija implementirana: access token (15 min, `jwt.access-token-expiration-ms`) + refresh token (30 dana, `jwt.refresh-token-expiration-ms`, hashiran SHA-256 u tablici `refresh_tokens`, rotira se pri svakom refreshu)
- `jwt.secret` trenutno hardkodiran u `application.properties` (commita se u git) — prihvatljivo za sada, razmotriti premještanje u `application-local.properties` (već u `.gitignore`) prije javnog objavljivanja repozitorija
- Endpointi: `POST /api/auth/register`, `/login`, `/refresh`, `/logout` — javno dostupni (`permitAll`), sve ostalo zahtijeva autentikaciju (uklj. `GET /api/auth/me`, iako je pod `/api/auth/**` prefiksom — namjerno izvan permitAll liste, vidi niže)
- **Web (sliptrack-admin) vs mobile auth**: oba klijenta koriste iste `/api/auth/*` rute, ali različit dio odgovora — mobile access+refresh token čita iz JSON bodyja (`SecureStore`), web access token čita iz istog bodyja ali drži ga samo u memoriji (nikad storage), a refresh token web uopće ne čita iz bodyja nego iz `HttpOnly` cookieja koji backend šalje na `login`/`register`/`refresh` (`SameSite=Strict`, `path=/api/auth`, `secure` preko `app.cookie.secure` property-ja — `false` u dev-u, na `true` prije produkcije). `/refresh` i `/logout` prihvaćaju token iz cookieja ILI bodyja (cookie ima prednost) — isti endpoint, bez grananja po klijentu. CORS (`app.cors.allowed-origins`, zadano `http://localhost:5173`) i `allowCredentials(true)` potrebni da browser uopće prihvati cross-origin cookie razmjenu.
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

**Ugniježđene lazy asocijacije (otkriveno 07.08.2026, `DashboardService.getBySubCategory`)**: `@EntityGraph(attributePaths = {"category", "subCategory", "property"})` na `PaymentSlipRepository.findAll(Specification)` eager-učitava `PaymentSlip`-ove izravne asocijacije, ali **ne** i asocijacije **jednu razinu dublje** — `SubCategory.category` je zaseban LAZY `@ManyToOne` koji taj graph ne pokriva. Pristup `slip.getSubCategory().getCategory().getName()` bi mogao "slučajno" raditi (Hibernateov first-level cache unutar iste sesije/upita ponekad već ima tu `Category` instancu učitanu preko `PaymentSlip.category`), ali to nije strukturno zagarantirano — ovisi o redoslijedu hidracije unutar upita. Riješeno dodavanjem ugniježđenog puta u isti `@EntityGraph`: `attributePaths = {"category", "subCategory", "subCategory.category", "property"}` (dot-notacija za ugniježđene asocijacije je podržana). Isto pravilo vrijedi za bilo koju buduću asocijaciju-unutar-asocijacije.

### FK constraint prije brisanja

Kad entitet ima djecu preko `@ManyToOne` (npr. `Category` ← `SubCategory`), `delete()` u service sloju mora provjeriti `existsByParentId()` prije brisanja i vratiti `409 Conflict` s jasnom porukom — ne pustiti da DB FK constraint padne i završi kao neuhvaćeni `500` (`DataIntegrityViolationException`). Cascade-delete je namjerno izbjegnut (npr. brisanje Category ne smije tiho obrisati SubCategory i posljedično PaymentSlip zapise — financijski podaci se ne smiju tiho gubiti). Isti obrazac primijenjen na `SubCategory` i `Property` kad `PaymentSlip` počne referencirati na njih (`PaymentSlipRepository.existsByCategoryId/existsBySubCategoryId/existsByPropertyId`).

**Iznimka od pravila — `PaymentSlip` ↔ `PaymentSlipAudit`**: obrnut slučaj. `PaymentSlipAudit` je podređeni zapis koji ima smisla samo dok postoji `PaymentSlip` na koji se odnosi (povijest promjena statusa te konkretne uplatnice) — blokirati brisanje uplatnice zbog postojeće audit povijesti bi bilo pogrešno. Ovdje `PaymentSlipService.delete()` (`@Transactional`) prvo eksplicitno briše sve `PaymentSlipAudit` zapise (`paymentSlipAuditRepository.deleteByPaymentSlipId(id)`), pa tek onda `PaymentSlip` — cascade delete na razini servisa, ne blokada.

**Isti obrazac primijenjen i na "opasnu izmjenu polja", ne samo na brisanje** — otkriveno 07.08.2026 tijekom vođenog code reviewa (Faza 3): `SubCategoryService.update()` je dopuštao prebacivanje `allowsProperty` s `true` na `false` bez provjere postoje li već `PaymentSlip` zapisi te potkategorije s postavljenim `property` poljem, što bi ostavilo postojeće uplatnice u poslovno nekonzistentnom stanju. Popravljeno: `PaymentSlipRepository.existsBySubCategoryIdAndPropertyIsNotNull(subCategoryId)` + provjera u `update()` prije spremanja → `409 Conflict` ako guard uhvati sukob, isti princip kao FK-provjera prije brisanja.

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
| GET | `/api/payment-slips` | Lista uplatnica, query params: `status`, `categoryId`, `subCategoryId`, `propertyId`, `providerName`, `dueDateFrom/To` | USER (samo svoje) |
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
| GET | `/api/dashboard/by-subcategory` | Iznosi grupirani po potkategoriji, opcionalni query param `categoryId`/`propertyId`/`dueDateFrom`/`dueDateTo` | USER |
| GET | `/api/dashboard/property-comparison` | Iznosi grupirani po (nekretnina, potkategorija), opcionalni `dueDateFrom`/`dueDateTo` — samo uplatnice s postavljenom nekretninom (implicira `subCategory.allowsProperty=true`) | USER |
| GET | `/api/dashboard/by-provider` | Iznosi grupirani po davatelju | USER |
| GET | `/api/dashboard/timeline` | Troškovi kroz vrijeme (za graf), query param `months` (default 6) — vraća kontinuirani niz mjeseci s nulama za praznine | USER |

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
| GET | `/api/admin/categories/stats` | Broj uplatnica po kategoriji, pun popis (bez top-5 ograničenja) | ADMIN |
| GET | `/api/admin/subcategories/stats` | Broj uplatnica po potkategoriji (svaki redak nosi `categoryId`) | ADMIN |

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
   - ✅ `UserDevice` registracija na mobileu (testirano na iOS, poznato Android/Expo Go ograničenje), `Notification` inbox ekran, filteri na listi uplatnica (status/kategorija/potkategorija/nekretnina/godina/mjesec dospijeća), `SelectField` komponenta (zamjena za Picker), redizajn grafa "Troškovi kroz vrijeme" (Y/X os, filter razdoblja, tooltip)
   - ✅ Development build za Android potvrđen radi (`npx expo run:android` na Android Studio emulatoru, vidi "Development build — Android" niže) — preduvjet za OCR zadovoljen
   - 🔶 Android push (FCM V1 Firebase projekt) otkriven kao zaseban, još nerješen problem tijekom postavljanja dev builda — vidi `UserDevice` bullet gore i DEVLOG 06.08.2026; privremeni `console.warn` ostavljen u `AuthContext.tsx` `registerDeviceForPush()` catch bloku dok se ne riješi, treba ukloniti nakon
   - ✅ OCR (Put 2) — implementirano i testirano na Android emulatoru, vidi "Trenutno stanje" i DEVLOG 07.08.2026; iOS grana koda napisana ali fizički neverificirana (čeka Apple Developer Program račun)
7. ✅ Automatski podsjetnici — `@Scheduled` job (analiza `RecurringPattern`, upis `Notification`, slanje push kroz Expo Notifications API) — implementirano i testirano end-to-end; 4 slučaja (uskoro dospijeva/danas dospijeva/dospjelo neplaćeno/predikcija), badge nepročitanih obavijesti na mobileu (tab bar + Profil)
8. **React admin sučelje** — u izradi, backend prošireno (cookie-based web auth uz postojeći mobile JSON-body flow, `/auth/me`, admin category/subcategory stats endpointi)
   - ✅ Vite init (React + TypeScript), dizajn sustav (tamna tema, oštri rubovi, ručno crtane ikone)
   - ✅ Auth (cookie refresh + in-memory access token, role gate na ADMIN)
   - ✅ Layout (Sidebar/AdminLayout/PageHeader), routing
   - ✅ Kategorije (CRUD, expand/collapse, search)
   - ✅ Korisnici (aktivacija/deaktivacija, search/filter/sort, CSV export)
   - ✅ Statistika (stat tileovi, registracije kroz vrijeme, uplatnice po kategoriji/potkategoriji, CSV export)
   - ✅ Pregled/Dashboard (skraćena statistika + brzi linkovi)
   - ✅ Toast/Confirm sustav (zamjena native browser dijaloga)
9. **Testiranje (poglavlje 5 rada)** — plan dogovoren 07.08.2026, još nije implementirano; korisnik prvo želi proći kroz cijeli postojeći kod (vođeni pregled arhitekture, backend → mobile → admin) prije pisanja testova
   - Predloženo mapiranje: 5.1 (strategija) — dokumentira piramidu testova i obrazloženje pristupa; 5.2 (točnost digitalizacije) — Jest unit testovi za `parseHub3.ts`/`parseOcrText.ts` (poznati ulaz/izlaz parovi) + strukturirano dokumentiranje ručnog testa točnosti OCR-a; 5.3 (funkcionalno/integracijsko) — backend `@SpringBootTest`/`@WebMvcTest` + `MockMvc` na ključnim endpointima (auth, PaymentSlip CRUD, autorizacija USER/ADMIN, FK-conflict brisanje), konačno iskorištava postojeće test-startere iz `pom.xml` (`-data-jpa-test`/`-security-test`/`-webmvc-test`) koji su tu od početka a nikad korišteni
   - ❌ Nije započeto
10. **Deployment / produkcijsko okruženje (poglavlje 4.6 rada)** — odluka odgođena 07.08.2026
   - Otvoreno pitanje: treba li app biti live — odgovoreno DA (poglavlje 4.6 to zahtijeva, plus pouzdaniji demo za obranu neovisan o laptopu/mreži)
   - Preporučeno (nije odlučeno): jeftin VPS (Hetzner/DigitalOcean, ~5€/mj) koji vrti isti postojeći `docker-compose.yml` (Postgres + MinIO) plus backend kao treći kontejner — nula promjena koda, dosljedno obrascu ("infrastruktura se uspostavlja tehnologijom Docker")
   - Odbačeno (preporuka protiv, ne korisnikova konačna odluka): Render (backend) + Supabase (baza) razdvojeno — odstupa od Docker infrastrukture navedene u obrascu, free tier cold-start/pauziranje nepouzdano za demo na obrani
   - Razjašnjeno: Docker kontejnerizacija u produkciji je obavezujuća (dio odobrenog sadržaja rada), fleksibilnost postoji samo u izboru hostinga te infrastrukture
   - ❌ Nije odlučeno ni implementirano
11. **Vođeni code review cijelog koda** — dogovoreno 07.08.2026 prije testova/deploymenta: korisnik prvo mora razumjeti stvarno stanje koda; ja naglas prolazim file po file i objašnjavam, korisnik pita; nakon cijelog reviewa slijedi zaseban "lov na glupi kod" (bugovi/čišćenje), pa tek onda testovi i deployment
   - Backend review razložen na 5 finijih faza (rupa Faza 3/4 popunjena 07.08.2026, dosad bile nedefinirane): Faza 1 = ulazna točka/enumi/domenski model (`User`, `Category`+`SubCategory`, `Property`, `PaymentSlip`) + pripadajući repository/service + MinIO (`MinioConfig`, `PaymentSlipImageService`); Faza 2 = sigurnost + rukovanje greškama (`SecurityConfig`, `security/` paket, `GlobalExceptionHandler`, `AuthController`/`AuthService`); Faza 3 = `CategoryService`/`CategoryController`/DTO-ovi i `SubCategoryService`/`SubCategoryController`/DTO-ovi; Faza 4 = `PropertyController`/DTO-ovi i `PaymentSlipController`/DTO-ovi; Faza 5 = `Dashboard`/`Admin`/`UserDevice`/`Notification`/`RecurringPattern`/`ReminderService`/`ExpoPushService`. Nakon backenda: mobile struktura, pa admin struktura.
   - ✅ Faza 1 gotova (07.08.2026): `SliptrackBackendApplication`, `enums/`, `model/User`, `model/Category`+`SubCategory`, `model/Property`+repo+service, `model/PaymentSlip`+repo+service, `MinioConfig`, `PaymentSlipImageService` pregledani i objašnjeni (LAZY/`@EntityGraph`/`open-in-view` detaljno, vlasništvo-bez-`@PreAuthorize` obrazac, `Specification` dinamičko filtriranje, `paidAt`/audit logika, presigned URL mehanizam). Review nije otkrio bugove.
   - ✅ Faza 2 gotova (07.08.2026): `SecurityConfig`, `JwtService`, `JwtAuthenticationFilter`, `CustomUserDetailsService`, `RefreshTokenService`, `CurrentUserService`, `GlobalExceptionHandler`, `AuthController`/`AuthService` (cookie/refresh flow, mobile vs. web razlika detaljno) pregledani i objašnjeni; usput uspoređeno s korisnikovim ranijim projektom fishing-shop (`C:\Users\User\source\repos\fishing-shop`) — sliptrack ispao stroži na nekoliko mjesta (SHA-256 hash refresh tokena naspram fishing-shopovog plaintexta, catch-all `Exception` handler naspram curenja sirovih Spring grešaka). Review nije otkrio bugove.
   - ✅ Faza 3 gotova (07.08.2026): `CategoryService`/`CategoryController`/DTO-ovi, `SubCategoryService`/`SubCategoryController`/DTO-ovi pregledani. Review otkrio i odmah popravio jedan bug — vidi "FK constraint prije brisanja" sekciju (`allowsProperty` toggle-off guard).
   - ✅ Faza 4 gotova (07.08.2026): `PropertyController`+DTO-ovi, `PaymentSlipController`+DTO-ovi pregledani. Uočeno (`iban` nema format validaciju, nijedan DTO nema `@Size` ograničenja) i naknadno **implementirano isti dan** (korisnik odlučio ne čekati zajednički lov na glupi kod) — `@Size(max=255)` na tekstualnim poljima Category/SubCategory/Property/PaymentSlip DTO-ova, `@Pattern(regexp="HR\\d{19}")` na `PaymentSlipRequest.iban`; usput popravljena mobile regresija (`PaymentSlipFormScreen` IBAN normalizacija prije slanja, ne samo `.trim()`).
   - ✅ Faza 5 gotova (07.08.2026): `Dashboard`, `Admin`, `UserDevice`, `Notification`, `RecurringPattern`, `ReminderService`, `ExpoPushService` pregledani. Review otkrio i odmah popravio drugi bug: `ReminderService.sendPredictedReminders()` je "postoji li već uplatnica za taj mjesec/davatelja" provjeru (`alreadyTracked`) radio samo protiv `UNPAID` zapisa — plaćena (`PAID`) uplatnica se nije brojala, pa je sustav svejedno slao suvišnu "Uskoro se očekuje uplatnica" notifikaciju. Popravljeno: `PaymentSlipRepository.existsByUserIdAndProviderNameAndStatusAndDueDateBetween` → `existsByUserIdAndProviderNameAndDueDateBetween` (bez `status` filtera, provjerava obje vrijednosti).
   - **Backend review u cijelosti gotov (Faza 1-5).** Nakon toga otkriven i popravljen treći bug kroz stvarnu upotrebu (`Notification` FK kod brisanja uplatnice, vidi "FK constraint prije brisanja") i četvrti/peti tijekom Dashboard "Po potkategoriji" feature rada (pogrešan JPQL optional-filter obrazac, ugniježđena `LazyInitializationException` zamka).
   - 🔶 **Vođeni review mobile/admin strukture nije nastavljen** — sesija je 07.08.2026 skrenula na niz feature zahtjeva (Dashboard "Po potkategoriji"/"Usporedba nekretnina", `PaymentSlipAudit` prikaz, Profile redizajn, admin responzivnost, chart popravci) umjesto nastavka sustavnog file-po-file pregleda mobilne i admin strukture. I dalje na redu prije zajedničkog "lova na glupi kod": mobile struktura (navigacija, auth/client, ekrani po toku), pa admin struktura.

## Pokretanje lokalno

```bash
# Docker (Postgres + MinIO)
cd docker && docker-compose up -d

# Backend
cd sliptrack-backend && ./mvnw spring-boot:run
```

Backend na http://localhost:8080, MinIO konzola na http://localhost:9001.

**Gotcha kod testiranja na fizičkom uređaju**: `minio.endpoint` u `application.properties` mora biti LAN IP računala, ne `localhost` — MinIO SDK potpisuje presigned `imageUrl` protiv tog hosta, pa `localhost` u odgovoru s backenda razriješi na sam telefon (koji nema ništa na portu 9000) umjesto na dev računalo, i fotografija uplatnice se ne učita u appu iako je stvarno u MinIO-u. Isti razlog kao `sliptrack-mobile/src/api/config.ts` (`API_BASE_URL`) — ažurirati oba na trenutni LAN IP kod promjene mreže.

### Development build — Android (potrebno za OCR i za dijagnosticiranje push problema)

Expo Go ne uključuje native module izvan fiksnog Expo SDK skupa (npr. ML Kit OCR) — treba `npx expo run:android` (lokalni build preko Gradle-a, zahtijeva instaliran Android Studio + SDK) ili `eas build --profile development` (cloud build).

**Gotcha**: `npx expo run:android` može pasti s `SDK location not found` iako je Android SDK stvarno instaliran (standardna lokacija `%LOCALAPPDATA%\Android\Sdk`) — uzrok je da `ANDROID_HOME` env varijabla nije postavljena na sustavu. Riješeno kreiranjem `sliptrack-mobile/android/local.properties` sa `sdk.dir=<put do SDK-a>` (forward slashevi, ne backslash) — projekt-specifično, ne dira sistemske env varijable (korisnikov izričit izbor); taj fajl (cijeli `android/` folder) je već u `.gitignore`, sigurno ga je generirati lokalno bez rizika za repo.

Android emulator (Android Studio → AVD Manager) potvrđen kao radno rješenje za testiranje bez fizičkog Android uređaja.
