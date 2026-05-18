# TimerApp

React Native-app som heter **Zonat** i UI:t. Bundle ID: `com.annamarkstrom.zonat`.

- React Native 0.84.1, New Architecture, Hermes
- Android API 36, Gradle 8.13
- GitHub-repo: `AnnaJellyHive/TimerApp`

## Köra appen

```bat
start-metro.bat   # starta Metro bundler
run-android.bat   # bygg och kör på Android-emulator
```

## App-ikon

Genereras från `assets/ic_launcher.png` via `node generate-icons.js` (sharp).

- Adaptiv Android-ikon: bakgrund `#1d6d2b`, förgrund i safe zone (72/108)
- iOS: skalas till 85% med vit padding så Apples squircle-mask inte klipper ytterringen
- Android splash: 200dp

Kör alltid `node generate-icons.js` innan bygget i CI (se TestFlight-workflow).

## Projektstruktur

- `src/utils/categoryConfig.ts` — `getCategoryConfig()` returnerar `bgLight/accent/accentLight/emoji` per kategori
- `src/storage/templateStore.ts` — `seedDefaultTemplates()` lägger till standardmallar vid första uppstart (nyckel: `template_store_seeded_v1`)
- `src/storage/checklistStore.ts` — CRUD för checklistor (nyckel: `checklist_store`). `save(name, templateItems?)` returnerar den skapade listan.
- `android/app/src/main/res/raw/` — ljudfiler för Android (`sound_start_new.mp3`, `sound_end_new.mp3`)
- `ios/TimerApp/` — ljudfiler för iOS (tillagda i `project.pbxproj`)

## Checklistor

Fristående checklistor (oberoende av timern) med tre tabbar i bottom nav: Uppgifter | Listor | Historik.

- `src/screens/ChecklistsScreen.tsx` — översikt, skapa/ta bort listor
- `src/screens/ChecklistDetailScreen.tsx` — punkter med kryssrutor, ▲▼-sortering, inline-redigerbar titel
- När alla punkter kryssas i: sparas till `streakStore` med `checklistItems`-fältet, listan tas bort från `checklistStore`, navigerar till Historiken
- Historikposter med `checklistItems` är tryckbara → skapar ny lista från mall via `CommonActions.reset` (stack: Checklists → ChecklistDetail)
- `react-native-reanimated` är **inte** installerat — kompatibelt med RN 0.84.1 New Architecture. Använd inte draggable-flatlist (kräver reanimated).

## Ljud

`Sound.setCategory('Ambient', true)` — mixar med Spotify (tyst bakgrundsmusik avbryts inte).

## CI/CD

### Android (`appium-tests.yml` i AppiumTests-repot)

Checkar ut TimerApp, bundlar JS med `npx react-native bundle` (inget Metro i CI), bygger APK, kör på Android API 33-emulator med swiftshader. APK:n cachas baserat på TimerApp-källkod + gradle-filer.

### iOS (`appium-tests-ios.yml` i AppiumTests-repot)

`runs-on: macos-15`, Xcode 26.3. Autocorrect stängs av via `xcrun simctl spawn`. Cache-nyckel: `macos15-pods-v10-xcode26-`.

### TestFlight (`.github/workflows/testflight.yml`)

Triggas på push till `master`. Kör `node generate-icons.js` innan bygget. Xcode 26.3.

Secrets:
- `DISTRIBUTION_CERTIFICATE_P12` + `DISTRIBUTION_CERTIFICATE_PASSWORD` (abc123)
- `PROVISIONING_PROFILE` ("Zonat AppStore")
- `APP_STORE_CONNECT_API_KEY_ID`, `APP_STORE_CONNECT_API_KEY_ISSUER_ID`, `APP_STORE_CONNECT_API_KEY`
- `APPLE_TEAM_ID`

Certifikatfiler lokalt: `C:/dev/distribution.key`, `distribution.cer`, `distribution_new.p12`

För att lägga till externa TestFlight-testare: TestFlight → External Testing → "+" → Add New Testers (inte via App Store Connect-användarinbjudan).
