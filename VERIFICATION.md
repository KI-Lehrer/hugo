# First-version verification — 19 October 2026

- `npm test`: 8 passed, 0 failed. Zurich week/ISO year boundaries, folder-prefix boundary, hidden file and symlink exclusion, changed paths, ranking, truncation, DOCX extraction and blank-PDF/OCR distinction.
- Isolated integration test with temporary folders and a Claude testdouble verifies authentication, exclusion of unselected files, removal of API keys from the child environment, disabled Claude tools, non-persistent sessions, source download, revocation, Origin/token guards and unchanged source content.
- Browser at 1200×800 and 390×844: no horizontal overflow, complete desktop setup visible, composer within viewport, mobile checkbox labelled, no final-page console errors.
- Browser interactions: suggestion fills composer; missing folder shows recovery; synthetic recognition detects the wake phrase and submits the following command; response cites sources; HTML remains inert text; new conversation clears messages; recognition network failure switches the microphone off. Speech recognition and Claude output in this interaction check were mocked; all result content was labelled TESTDATEN.
- Actual Claude CLI is installed but logged out. A real Claude answer, account-specific subscription operation, audio output, microphone permission and continuous/background recognition remain unverified pending personal sign-in and microphone activation. No actual school folder was selected or read.
- Chrome speech service is not an offline wake-word engine. Cloud-only files, scans, native Google documents, XLSX and documents beyond reading limits do not have full-text coverage.

Evidence: `output/playwright/jarvis-desktop.png`, `jarvis-mobile.png`; `jarvis-answer-test.png` is a test fixture, not a genuine Claude answer.

Local URL: http://127.0.0.1:4317. Automatic opening of the application named Google Chrome was unavailable on the execution host; open manually in Chrome. No public deployment.

## Hugo rename and motion

Renamed visible branding, assistant instructions, wake phrase and launcher to Hugo. Kept `.jarvis` local configuration and internal request headers for compatibility with existing folder selections.

Eight existing tests pass after the rename. Browser checks with simulated speech events verify queued → speaking → paused → speaking → stopped/end, stale utterance events cannot end a newer response, and reduced-motion disables the wave animation. At 390px the layout has no horizontal overflow. These checks verify event-driven animation; actual acoustic output still requires a real-device check.

## Free chat and voice selection fix

Root cause: every request required readable source files, even greetings and general questions. Fixed by an explicit Chat/Unterlagen selector. Chat never scans selected folders; missing document results become context warnings rather than blocking all responses. Extended integration assertions cover chat with no folders, chat with existing folders (no document excerpts passed), and missing document context.

Live browser test against the real, now-authenticated Claude subscription returned **«Hallo, ich bin Hugo.»** in Chat mode, with no error and no source panel. This supersedes the initial logged-out status above. No school documents were read for that test.

Voice selector lists browser voices, refreshes on voiceschanged, remembers voiceURI and includes a spoken preview. Browser-event tests cover selected voice use and speaking animation; acoustic quality remains a device-level check.

## Natural local voice, no additional service

Public AVFoundation listing exposed the installed German natural Siri voice `com.apple.siri.natural.Martin` (quality 2); browser speech exposes only the compact/classic German voices. Standalone unsigned Swift executable did not expose this voice; the signed Apple Swift runtime did. The helper therefore uses `/usr/bin/swift` with the project-owned `speech.swift` and a local module cache.

End-to-end real browser preview used the local speech endpoint, produced 4.839875 seconds of playable WAV audio, entered `speaking` with no error and returned to `idle` after playback. No cloud speech service was called. Further playback-stop check released the Audio object and blob URL; native voice choice persisted after reload. Text segmentation preserves words and sentence punctuation. Temporary generated WAV files are removed after response delivery. Endpoint rejects unauthenticated and oversized requests.

The voice is Apple's existing natural voice, not an imported or cloned Claude voice. Perceptual similarity is subjective and was not asserted by tests.

## Futuristic visual redesign

User requested a futuristic appearance full of animation. Replaced the warm stylesheet with a dark cyan/violet/mint palette, geometric assistant core, three orbit tracks, moving ambient light and particles, composer light and interaction motion. Native controls, source rendering and authentication logic remain in place. Setup instructions are collapsed into native details.

Browser verification: actual local native-audio preview sets body/stage `speaking`; core uses `speaking-core`, wave uses `voice-syllable`; stopping returns to idle. Composer remains within the desktop viewport. The sample question still fills the composer and switches to documents mode. Mobile has no horizontal overflow. Motion-pause control sets CSS animation-play-state to paused; reduced-motion preference makes orbit animation `none`. JavaScript syntax check passes. Screenshots: `output/playwright/hugo-future-speaking.png` and `hugo-future-mobile.png`.

Design detector flags luminous accents and the previous design system palette: luminous accents are explicitly requested in this redesign; DESIGN.md and its sidecar have been replaced with the new palette and motion contract. Functional metadata remains at least 11px; body/answer content remains 14px. No new backend changes in this redesign.

## 19.10.2026 – Unterrichtsquellen und Dashboard

- 14 automatisierte Tests bestanden: bisherige Dateisicherheit und Chat, Quell-URLs/ungültige Wochen, veraltete/falsche Wochen, Browser-Schlüssel und fremde Origins, isolierter Planungsmodus, Kalender-Serien/Ausnahmen/Zeitzonen/Ganztag, Ausschluss persönlicher Terminzellen und Schüler-Popups in der Browser-Übernahme.
- Live: aktuelle KlassenFLOW-Woche 19.–23.10.2026 aus der angemeldeten Chrome-Ansicht übernommen. LearningView-Kurs «6. Klasse Suhr 26/27»: sichtbare Kapitel-6.3-Materialien und Deutsch-Lehrmittel gelesen und getrennt von datierter Wochenplanung importiert. Keine individuellen Arbeitsstände gelesen oder geändert.
- Live: Wochenübersicht mit tatsächlichen Auszügen über das bestehende Claude-Abo erzeugt, beide Quellen belegt und LearningView als undatierte Materialansicht markiert. Stundenplan-Slots und Nummern innerhalb einer Unterrichtsreihe sind ausdrücklich getrennt.
- Live: private offizielle Google-Kalender-Einbettung mit angemeldetem Chrome zeigt tatsächliche Termine. Keine Kalender-Freigaben geändert.
- Live: Wetterdienst mit öffentlichem Testort Suhr geprüft; drei Prognosetage empfangen. Persönliche Standortfreigabe noch nicht ausgelöst. Standortbutton und Fehlerbehandlung sind vorbereitet; tatsächliche Betriebssystem-/Browserfreigabe muss der Nutzer erteilen.
- Oberfläche auf den gesamten CSS-Viewport erweitert, Dashboard mit Quellen/Kalender/Wetter und optionalem Vollbild. Mikrofon bleibt beim Seitenstart aus; Kamerazugriff wird durch Permissions-Policy gesperrt.
- Chrome-Erweiterung als überprüfbarer Quellordner vorbereitet, noch nicht installiert. Ende-zu-Ende-Erweiterungssynchronisation ist deshalb noch nicht auf dem Gerät geprüft. Sie liest nur sichtbare Quellenansichten, keine vollständigen Kurse und keine versteckten Themen. Installation benötigt ausdrückliche Freigabe für neuen Seiten-Lesezugriff.

### Ergänzung: Uhr, Seitenleiste und weitere Animationen

- Live in Chrome: Seitenleiste ausgeblendet; Button wechselt zu «Seitenleiste anzeigen». Der Einrichtungsbereich verschwindet aus dem Accessibility-Baum und die Hauptansicht wächst auf die frei gewordene Fläche.
- Gemessen: App-Shell entspricht dem vollständigen CSS-Viewport (2490 × 933,75 px bei 80 % Browserzoom), kein horizontaler Überlauf. Die native Fensteraufnahme bestätigt, dass die Oberfläche das Chrome-Inhaltsfenster ausfüllt.
- Digitale Uhr zeigt Schweizer Zeit mit Wochentag/Datum; Sekundenwechsel live sichtbar. Sechs weitere Partikel, zwei Drahtkörper und zwei Umlaufbahnen ergänzen die vorhandenen Orbits.
- Bewegung der Uhrziffern und Dekoration berücksichtigt Pause/reduzierte Bewegung; in verborgenen Tabs wird der Uhrtimer gestoppt und beim Zurückkehren aus der tatsächlichen Zeit neu gesetzt.
- Abschliessend live geprüft: Animationspause setzt die Drahtkörper auf `animation-play-state: paused`; Fortsetzen funktioniert, Uhr läuft korrekt weiter. Ein-/Ausblenden beider Seitenleisten geprüft. Ohne beide Leisten entspricht die Hauptfläche exakt der gesamten Fensterbreite (2490 CSS-px). Google-Kalender mit sichtbaren Terminen über «Kalender neu laden» bestätigt; die Schaltfläche bleibt für blockierte/noch leere Einbettungen verfügbar.
- Aktuelle native Fensteraufnahme: `output/hugo-dashboard.png`. Browser-Tab als Ergebnis geöffnet gelassen, linke Leiste verborgen, Widgets sichtbar, Mikrofon aus.

## 19.10.2026 – Freie Widgets, Zahnrad und zentrale Sprechkugel

- Desktop-Chrome live: Uhr am Griff mit Pfeiltasten und anschliessend mit der Maus frei verschoben (20/20 → 240/80 CSS-px). Neuladen erhält die gespeicherte Position; Positionen werden relativ zur nutzbaren Fläche gespeichert und bei geänderter Fenster-/Composergrösse innerhalb der Grenzen angeordnet.
- Die normale Ansicht zeigt vier kompakte Widgets. Einrichtung, Stimme und Details sind über native Popover-Zahnräder erreichbar. Wetter- und globale Einstellungen live geöffnet und wieder geschlossen. Keine doppelten HTML-IDs.
- Kleine Fenster geprüft (390 physische Pixel bei 80 % Browserzoom): Widgets stehen im Raster untereinander; kein horizontaler Überlauf; Einstellungen bleiben vollständig innerhalb des Viewports. Temporäre Grössenprüfung zurückgesetzt.
- Echte Mac-Hörprobe live: `speaking` erst bei laufender Ausgabe, zentrale Kugel mit `sphere-voice`-Animation. Mittelpunkt gemessen bei 1245/431,4 in einem 2490/863 CSS-px-Viewport. Nach dem Ende wieder `idle`/`core-breathe`; Mikrofon blieb aus.
- Screenshot der tatsächlichen Wiedergabe: `output/hugo-widgets-sprechkugel.png` (nur leere Aufnahmeränder der Browser-Zoom-Aufnahme abgeschnitten).
- Google-Kalender zeigt im kompakten Ausschnitt die nächsten Termine; Quellenwidget zeigt Anzahl/Datenstand; Wetter zeigt nach Konfiguration nur Ort, Temperatur, Zustand und Tagesbereich. Weitere Daten liegen im Zahnrad.
- Nebenbefund korrigiert: sichere Top-Level-Navigation auf die öffentliche lokale App-Seite wird zugelassen, auch wenn sie von ausserhalb geöffnet wurde. API/Sitzung/Dateizugriffe behalten den bisherigen Schutz. Mit echten Navigationsheadern geprüft; alle 14 automatisierten Tests bestanden.
- Erweiterungsinstallation ist weiterhin separat durch die leere Chrome-Erweiterungsverwaltung blockiert. Dieser UI-Umbau installiert keine Erweiterung und startet Chrome nicht neu.

## 20.10.2026 – Kalenderfarben

- Google-Ansicht im tatsächlichen Chrome-Kalender mit dunklem Hintergrund und türkisfarbenen Akzenten sichtbar geprüft; Termine bleiben lesbar.
- Im Kalender-Zahnrad zwischen Hugo-Farben und Google-Originalfarben gewechselt: der berechnete Filter wechselt korrekt zwischen Farbanpassung und `none`. Auswahl wird lokal gespeichert; Hugo ist der Standard.
- JavaScript-Syntaxprüfung bestanden. Keine Änderungen an Kalenderdaten oder Freigaben.
- Aufnahme: `output/hugo-kalender-farben.jpg`.

## 20.10.2026 – Chrome-Erweiterung verbunden

- Installierte Erweiterung 0.1.0 über ihr eigenes Fenster mit dem lokalen Hugo-Code gekoppelt, automatische Übernahme aktiviert; UI bestätigt «Verbindung gespeichert» und gesetztes Auto-Sync-Kästchen. Code weder protokolliert noch als Screenshot aufgenommen.
- Lokalen Helfer gestartet. Ohne manuellen Senden-Knopf kamen neue Auszüge an: KlassenFLOW 13:44:27 UTC (15:44 Zürich), weekStart 2026-10-19, 6599 Zeichen; LearningView 13:46:32 UTC (15:46 Zürich), kein Wochenbezug, 185 Zeichen aus der sichtbaren Deutsch-Materialansicht des Kurses 6. Klasse Suhr 26/27.
- Beide tatsächlichen Zeitstempel im Unterricht-Zahnrad von Hugo sichtbar bestätigt. Screenshot `output/hugo-bridge-verbunden.jpg`.
- Installiertes Chrome deaktiviert die entpackte Erweiterung bei ausgeschaltetem Entwicklermodus. Nutzer hat ihn nach Erklärung selbst wieder aktiviert. README berichtigt; keine Sicherheitswarnung umgangen.
- Auto-Sync erfasst ausschliesslich den sichtbaren Tab und sichtbare Materialien. Andere Wochen, verdeckte Tabs, eingeklappte Inhalte und individuelle Arbeitsstände sind nicht Teil dieser Prüfung.

## 20.10.2026 – Hintergrund-Tabs, Version 0.2.0

- Automatischen Timer aus der Quellseite in den Chrome-Service-Worker verschoben (`alarms`, 1,5 Minuten). Abfrage nur für KlassenFLOW und LearningView, ohne Aktivierung, Navigation oder Neuladen von Tabs. Je Dienst wird der zuletzt verwendete geöffnete Tab ausgewählt.
- Quellauszüge werden vor Versand gegen Dienst und erlaubte URL geprüft. Deaktivierter Auto-Sync führt zu keiner Erfassung. Pausierte Tabs werden übersprungen, Fehler einer Quelle verhindern die andere Quelle nicht. Chrome-Speicher enthält pro Quelle Erfolg bzw. Fehlermeldung.
- Alle 17 Tests bestanden, darunter Erfassung beider inaktiven Tabs, ausgeschalteter Auto-Sync, pausierter Tab und Zurückweisung falscher Quelldaten. JavaScript-Syntax geprüft.
- Live-Prüfung der neuen Hintergrundfunktion noch ausstehend: lokale Erweiterung muss vom Nutzer über «Neu laden» auf Version 0.2.0 geladen werden. Bisherige erfolgreiche Live-Übernahmen betreffen Version 0.1.0 im sichtbaren Tab.
- Technische Referenz: https://developer.chrome.com/docs/extensions/reference/api/alarms (Chrome kann Alarme verzögern; beim schlafenden Gerät keine laufende Übernahme).

## 20.10.2026 – Version 0.2.0 im Hintergrund live bestätigt

- Nutzer hat Version 0.2.0 in Chrome neu geladen. Frische KlassenFLOW- und LearningView-Ansichten geöffnet, um die aktualisierten Content-Skripte zu laden. Bestehende LearningView-Umfrage nicht verändert oder neu geladen.
- Native Chrome-Ansicht bestätigte einen anderen ausgewählten Tab und die eingeklappte Test-Tabgruppe mit KlassenFLOW, LearningView und Hugo. Kein manueller Übernahme-Knopf, kein programmatisch ausgelöster Erweiterungsalarm.
- Nach Start des zuvor beendeten lokalen Helfers erhielt Hugo im selben regulären Alarmdurchlauf beide Auszüge: KlassenFLOW 2026-10-20T15:37:58.141Z (Woche 2026-10-19, 6599 Zeichen), LearningView 2026-10-20T15:37:58.182Z (185 Zeichen, kein bestätigter Wochenbezug). Beide Tabs waren laut nativer Tab-Leiste Hintergrund-Tabs. Die Browser-Automation meldet für betreute Dokumente abweichend `document.hidden=false`; die Prüfung des Hintergrundzustands stützt sich daher auf die native ausgewählte Tab-Ansicht.
- Beide aktuellen Zeitstempel im Unterricht-Zahnrad von Hugo bestätigt. Screenshot: `output/hugo-hintergrund-geprueft.jpg`. Quellseiten und Ergebnis offen gelassen.
- Lokalen Helfer als getrennten Prozess gestartet, damit er nicht mit dem Testfenster beendet wird. Keine Änderung an Unterrichts- oder Schülerdaten.
- Geprüft ist die erneute Übernahme der geladenen Unterrichtsansichten im Hintergrund. Kein Nachweis für externe Änderungen, die die Quellseiten selbst noch nicht geladen haben, oder für von Chrome pausierte Tabs.

## 20.10.2026 – Wählbare Wandtafel

- Zweite Ansicht über native Auswahl «Hugo-Ansicht» oben im Fenster. Live zwischen Futuristisch und Wandtafel gewechselt; im futuristischen Modus ist der Schwamm verborgen und die Kugel sichtbar. Nach Neuladen bleibt Wandtafel ausgewählt.
- Grüne Tafel mit Holzrahmen, vier pastellfarbene Post-it-Widgets, Klebestreifen und Papierkante. Bestehende Einstellungen und frei verschiebbare Widgets verwenden dieselben Elemente/Funktionen.
- Echte Mac-Hörprobe: data-hugo-mode=speaking mit Mundanimation sponge-mouth bestätigt; Mikrofon bleibt aus. Nach Abschluss idle. Ruhe-, Denk-, Hör- und Sprechdarstellung sind getrennt; vorhandene Animationspause, verborgene Seite und prefers-reduced-motion gelten auch für den Schwamm.
- Desktop und kleines Fenster (390 physische/487 CSS-Pixel bei Chrome-Zoom) ohne horizontalen Überlauf geprüft. Mobile Widgets stehen im vorhandenen Raster unter dem Gespräch. Temporäre Fenstergrösse zurückgesetzt.
- JavaScript-Syntaxprüfung bestanden; Design-Detektor meldet keine Befunde. Keine neuen automatisierten Tests für diesen reversiblen visuellen Modus; Backend unverändert.
- Aufnahmen: output/hugo-wandtafel-sprechen.jpg, output/hugo-wandtafel-mobil.jpg.

## 20.10.2026 – Priorität 1 aus dem Verbesserungsauftrag

- API-Aufrufe warten auf ein gemeinsames Token-Promise. Sitzungsstart wird erst nach Einrichtung aller Handler/Layoutzustände ausgelöst. Erfolgreiches refreshStatus entfernt alte Fehlermeldungen, fehlende Claude-Installation bleibt als echter Fehler sichtbar.
- Seitenleiste unter 1250 px zunächst geschlossen, unabhängig vom zuletzt auf einem grossen Fenster geöffneten Zustand. Menü-/Schliessenknopf, abgedunkelte Fläche ausserhalb des Drawers, dialog/aria-modal/inert, Fokusfang, Escape und Fokusrückgabe implementiert. hugo.sidebarHidden bleibt erhalten.
- Unter 1250 px Widgets im normalen Raster unter dem Chat. Darüber geometrische Kollisionsprüfung mit reserviertem Mittelbereich; bei zu wenig Platz ebenfalls Raster. Hinweisbereich liegt über den Widgets und wird bei der Platzberechnung berücksichtigt. Kalender und Unterricht werden nicht mehr durch feste Widget-Höhen abgeschnitten.
- Live in beiden Ansichten geprüft bei 375, 767, 1023, 1280 und 1440 CSS-px (80%-Chrome-Zoom rundet die angefragten 768/1024 um 1 px ab): kein horizontaler Überlauf, keine Widget-Überschneidung und keine Überdeckung der Beispielfrage durch die Eingabe. 1280/1440 mit ausreichender Höhe verwenden freie Platzierung, kleinere Breiten Raster.
- Drawer live mit Fokus auf Schliessen, Shift-Tab innerhalb der Leiste, Escape und Hintergrundklick geprüft; Fokusrückgabe jeweils zum Menü. Hauptbereich währenddessen inert.
- Echte Validierungsfehlermeldung über einen relativen Test-Ordnerpfad ausgelöst (kein Ordner hinzugefügt): Hinweis-Unterkante ca.140 px, erste Widget-Oberkante ca.158 px. Nach erfolgreichem «Verbindung prüfen» leer/verborgen. Testeingabe gelöscht.
- Alle 20 Tests bestanden, inklusive drei neuer gezielter Frontend-Tests. JS-Syntax und Design-Detektor geprüft, keine Detektorbefunde. Tastaturverschiebung der Uhr mit Pfeiltaste live bestätigt. Temporäre Fenstergrösse zurückgesetzt.
- Vollständiger erster Teil betrifft Aufgaben 1–3. Aufgaben 4–14 bewusst noch nicht umgesetzt; keine WCAG-Gesamtkonformität behauptet. Screenshot output/hugo-prioritaet1.jpg und Varianten output/hugo-fix-{future,board}-{375,1440}.jpg.
- Lokaler Server um die explizite statische Route /widget-layout.js ergänzt und neu gestartet. Authentifizierungsheader bleibt für diesen Teil X-Jarvis-Token; Umbenennung ist Aufgabe14.

## 20.10.2026 – Priorität 2, Aufgaben 4–8

- Standard-Kalenderwidget zeigt eine eigene Terminliste aus /api/calendar statt der Google-Einbettung. Eigenständige Zustände: Laden, noch kein Dateiimport, konfigurierte leere Liste («Keine Termine in den nächsten 7 Tagen»), Fehler und «Erneut versuchen». Kalendertexte ausschliesslich mit textContent/append.
- API wertet heute plus sechs folgende Kalendertage in Europe/Zurich aus. Vorhandene Kalenderdatei und Google-URL bleiben erhalten. Optionale Google-Einbettung nur im Kalender-Zahnrad; Sichtbarkeit separat lokal gespeichert. Eine Google-Anmeldung in der Einbettung liefert der eigenen Liste keine Daten. Kein automatischer privater Google-Datenabruf implementiert oder behauptet.
- Gespräch role=log/aria-live=polite, Hinweis role=alert/aria-atomic, Aktivitätsstatus polite/atomic. Arbeits-/Hörzustände benennen Hugo explizit.
- Schriftgrössen unter 12px entfernt, inklusive relativer Sekunden-Schriftgrösse. Eigene Buttons/Links mindestens 24x24; pointer:coarse-Regeln 44x44 samt umgebrochener Touch-Kopfzeile. Sidebar-Beschriftungen bleiben zusammen bzw. stehen zeilenweise.
- Beide Ansichten bei 375, 767, 1023, 1280, 1440 CSS-px gemessen: kein horizontaler Überlauf, keine Widget-Überlappung, keine sichtbaren Blatttexte unter12px, keine sichtbaren Buttons/Links unter24px. Geöffnete Sidebar gesondert: Verbindung-prüfen-Fläche ca.104x27px, kein Überlauf und keine kleine Schrift. Die 1px-Abweichungen von768/1024 entstehen durch80%-Browserzoom.
- Optionale Einbettung live im Zahnrad eingeschaltet und bestätigt, danach wieder ausgeschaltet. Im Widget-Inhalt kein iframe mehr. Temporäre Fenstergrösse zurückgesetzt.
- Alle23Tests bestanden, inklusive 7-Tage-/Jahreswechsel-/Schweizer-Zeitzonenprüfung, Lade-/Fehler-/Retry-/Leer-/Unkonfiguriert-Zustände und unveränderter Textbehandlung bösartiger Kalendertitel. Design-Detektor ohne Befunde. Read-only-Review: ship für Aufgaben4–8.
- Native VoiceOver-Ausgabe und physisches Touch-Gerät nicht getestet; keine umfassende WCAG-AA-Konformität behauptet. Aufgaben9–14 bleiben offen.
- Screenshots: output/hugo-p2-{future,board}-{375,1440}.jpg und output/hugo-prioritaet2.jpg.

## 20.10.2026 – Priorität 3, Aufgaben 9–14

- Petrol/türkisfarbenes Inline-SVG-Favicon mit H, eindeutige Widget-Panelüberschriften («… – Einstellungen»), nur ein Neues-Gespräch-Knopf (Plus im Header), Wetterbutton «Standort festlegen» direkt im Widget.
- Wandtafel-Sekunden live gemessen: rgb(73,61,29) auf rgb(244,223,137), Deckkraft1, rechnerisch8,01:1. Ziffern bewegen sich im Board-Modus nur durch Transformation, ohne kurzzeitigen Opazitätsabfall; Sekunden/Doppelpunkte ohne kontrastsenkende Opazitätsanimation.
- ES-Module: api.js, ui.js, voice.js, widgets.js; zusätzliche kleine Module state.js und widget-layout.js. app.js ist Einstieg/Orchestrierung. Abhängigkeiten explizit und ohne zyklische App-Imports; Sprach- und Widget-Controller erhalten ihren Sende-Callback. HTML lädt einen type=module-Einstieg. JS/HTML/CSS lesbar mit einmalig verwendetem Prettier3.6.2 formatiert, keine Laufzeit-Abhängigkeit ergänzt. Nicht mehr verwendete New-Chat-CSS-Regeln entfernt.
- Authentifizierung gleichzeitig im Client und Server auf X-Hugo-Token umgestellt. Audio verwendet denselben tokenbereiten Transport wie JSON. Server liefert alle Module explizit als JavaScript aus. Integrationstest prüft alte Header403, Moduldateien200 und bestehenden Schutz; bestehende Cookie-/Datei-/localStorage-Namen beibehalten.
- Alle23Tests nach endgültiger Formatierung bestanden. Design-Detektor ohne Befunde. Quellcodeprüfung in public ohne innerHTML/insertAdjacentHTML.
- Live: echte kurze Claude-Antwort im Chat, Rücksetzen durch den einzigen Header-Knopf (0Nachrichten/Begrüssung sichtbar), Wetter-Einrichtung geöffnet ohne Standortfreigabe, alle vier umbenannten Panelüberschriften sowie SVG-Favicon-Link bestätigt. Echte Mac-Hörprobe: speaking, keine Fehlermeldung, Mikrofon false; nach Ende idle. Neue Audio-Authentifizierung damit live bestätigt.
- Beide Ansichten erneut bei375,767,1023,1280,1440CSS-px: kein horizontaler Überlauf, keine Widget-Kollisionen, keine sichtbaren Texte unter12px und keine sichtbaren Ziele unter24px. Mobile Drawer nach Modulaufteilung mit Fokus auf Schliessen und Escape-Rückgabe zum Menü geprüft. Temporäre Fenstergrösse zurückgesetzt.
- Aufnahmen: output/hugo-prioritaet3.jpg, -desktop.jpg, -mobil.jpg und -sprechen.jpg. Keine pauschale WCAG-AA-Zusage; VoiceOver/echter Touch und umfassende Aktivierungswort-Dauerprüfung nicht Teil dieser Prüfung. Kalenderliste bleibt importbasierter Ausschnitt, keine neue Google-OAuth-Anbindung.

## Kalender- und Standortkorrektur, 20.10.2026

Google-Einbettung zurück im Widget; verbundene Google-Ansicht benötigt keinen ICS-Import. Optionale Dateiliste bleibt erhalten. Automatisch ermittelte Wetterkoordinaten werden validiert, auf zwei Nachkommastellen gerundet und im lokalen Integrationsspeicher gesichert. Neustart des Speichers und Ersatz durch Stadtnamen getestet. Insgesamt 25 Tests bestanden. GitHub-Veröffentlichung enthält keine lokalen Laufzeitdaten. Fernzugriff ist ein separater Einrichtungsschritt.
