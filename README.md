# Hugo – persönlicher Unterrichtsassistent

Hugo läuft in Chrome und liest Dokumente aus ausgewählten Finder-Ordnern. Das gilt auch für lokal verfügbare Dateien in synchronisierten Google-Drive- und OneDrive-Ordnern. Antworten erscheinen als Text und können vorgelesen werden.

## Starten

Doppelklick auf **Hugo starten.command**. Das Terminalfenster bleibt während der Nutzung geöffnet. Alternativ im Projektordner `npm start` ausführen und `http://127.0.0.1:4317` in Chrome öffnen. Beenden mit Ctrl+C im Terminal.

Voraussetzungen: macOS, Chrome, Node.js 20+, Python 3 mit `pypdf` und Claude Code. Auf diesem Mac wurden Node.js, Python, pypdf und Claude Code gefunden. Beim ersten Start wird `ical.js` für Kalenderdateien mit `npm ci` installiert (der Starter erledigt das bei Bedarf).

## Einmal einrichten

1. **Claude anmelden** wählen. Die lokale Claude-Code-Anmeldung öffnet sich im Terminal und im Browser. Dein Login in der Desktop-App allein meldet den Helfer nicht an. Mit dem bestehenden Claude-Abo anmelden, anschliessend **Verbindung prüfen** wählen.
2. **Ordner auswählen** wählen. Nur konkrete Unterrichtsordner freigeben. Alternativ unter **Ordnerpfad eingeben** einen absoluten Finder-Pfad einfügen. Entfernen über das Kreuz beim Ordner.
3. Im Modus **Chat – ohne Dateien** kannst du direkt chatten, auch ohne Ordner. Für Datei-Zusammenfassungen **Unterlagen einbeziehen** wählen. Die Wochenplan-Beispielfrage schaltet stattdessen den Modus **Wochenplanung** für die übernommenen KlassenFLOW-/LearningView-Auszüge ein. Enter sendet, Umschalt+Enter erzeugt einen Zeilenumbruch.
4. Optional das Mikrofon einschalten und Chrome den Zugriff erlauben. «Hey Hugo, fasse meine Unterrichtsplanung für diese Woche zusammen» sagen. Nach dem Aktivierungswort ist auch eine kurze Pause möglich. Danach auf die Antwort warten.

Unter **Stimme auswählen** eine Browser-/Systemstimme wählen und mit **Stimme anhören** testen. Die Auswahl wird lokal im Browser gespeichert. **Antwort vorlesen** aktiviert die gesprochene Ausgabe von Antworten. Claudes eigene Voice-Stimmen werden nicht importiert; eine öffentliche Schnittstelle dafür ist nicht dokumentiert.

**Natürliche lokale Stimme:** Wenn auf dem Mac eine hochwertige deutsche Stimme verfügbar ist, bietet Hugo sie als **Hugo – Natürlich (Mac)** an. Automatische Auswahl bevorzugt diesen Weg. Der Helfer nutzt Apples öffentliche AVFoundation-Schnittstelle und erzeugt kurzlebige WAV-Dateien, die nach der Ausgabe an den Browser gelöscht werden. Der Text bleibt für diese Sprachausgabe auf dem Mac; kein zusätzlicher Sprachdienst und keine API-Kosten. Der Helfer verwendet die installierte Apple-Swift-Laufzeit (Xcode Command Line Tools nötig). Ohne geeignete Stimme oder Swift-Laufzeit bleiben die Browserstimmen verfügbar. Vorlesen erfolgt in vollständigen Sätzen und ohne Wortabbrüche. Die Klangähnlichkeit zu Claude ist nicht zugesichert.

## Umfang und Grenzen

- Unterstützt werden TXT, Markdown, CSV, PDF mit Text, DOCX, DOC und RTF. Scans ohne Textebene brauchen später OCR. Native Google-Dokumente müssen zunächst als DOCX/PDF exportiert werden. XLSX, Bilder und Präsentationen werden noch nicht gelesen.
- Suche: bis zu 3000 unterstützte Dokumente / 15000 Ordnereinträge, maximal 15 MB pro Datei. Versteckte Dateien, bekannte Secret-Dateinamen und symbolische Links werden ausgelassen. Die 80 nach Dateinamen, Kalenderwoche und Änderungsdatum passendsten Dokumente werden zum Lesen ausgewählt, bis zu 180000 Zeichen insgesamt / 16000 pro Dokument. PDF-Extraktion umfasst höchstens 100 Seiten. Dies ist **keine vollständige Volltextsuche**; Suchgrenzen werden neben der Antwort angezeigt.
- Die aktuelle Woche ist Montag bis Sonntag in **Europe/Zurich**. Ein Änderungsdatum gilt ausdrücklich nicht als Beleg für den Unterrichtszeitraum.
- Die Quellenliste zeigt die für diesen Auftrag gelesenen Dokumente. Ziffern in der Antwort verweisen darauf; Links laden die Originaldateien herunter. Nach einem Neustart sind alte Quellenlinks ungültig.
- Cloud-Dateien müssen lokal abrufbar sein. Nicht lesbare Dateien werden gemeldet. Die erste Version lädt nicht eigenständig ganze Cloud-Ordner herunter.
- Claude erhält ausschliesslich die vom Helfer gelesenen Auszüge sowie bis zu sechs Nachrichten des aktuellen Gesprächs. Es erhält keine Datei-, Shell-, Browser- oder Schreibwerkzeuge. Kein API-Key-Fallback; die App prüft Claude-Abo-Anmeldung vor jedem Auftrag.
- Die aktuelle offizielle Abo-Regelung unterstützt `claude -p` innerhalb der Abo-Limits. Abo-Limits und Bedingungen können sich ändern: https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan
- Die Spracherkennung nutzt Chromes Web-Speech-Funktion. Dabei kann Audio an Googles Dienst gesendet werden, auch um das Aktivierungswort zu erkennen. Das ist keine lokale Offline-Aktivierungsworterkennung. Aktivierung nur nach bewusstem Klick; abschaltbar. Kein Mikrofonzugriff beim Öffnen der Seite.
- Andere Tabs sind grundsätzlich möglich, solange Chrome die Seite und Spracherkennung weiter ausführt. Schlafmodus, Sperrbildschirm, Browser-Unterbrechungen und Tab-Verwerfen verhindern zuverlässigen Dauerbetrieb. Fehler werden angezeigt. Hintergrundbetrieb und Mikrofon müssen auf dem echten Gerät geprüft werden.
- Gesprochene Antworten verwenden die verfügbaren System-/Browserstimmen. Während Hugo spricht oder arbeitet, pausiert die Erkennung gegen Rückkopplungen.
- KlassenFLOW und LearningView werden als datierte Browser-Auszüge gelesen, keine vollständige Live-API-Anbindung. Die Steuerung bestehender Cowork-Sitzungen ist nicht enthalten.

## Speicherung und Zugriff

Standardmässig nur auf `127.0.0.1` erreichbar; die unten beschriebene Codespaces-Konfiguration lässt zusätzlich die exakte eigene GitHub-Adresse zu. Schutz durch Host-/Origin-Prüfung, zufälliges Sitzungstoken und SameSite-Cookie. Keine externen Fonts oder UI-Abhängigkeiten. Ordnerfreigaben liegen lokal in `.jarvis/folders.json`; Dokumentauszüge aus Finder-Ordnern werden nicht gespeichert. Übernommene Browser-Planungsauszüge, Widget-Einstellungen und optional importierte Kalenderdateien liegen in `.jarvis/`. Ein lokaler Verbindungsschlüssel schützt die Browser-Übernahme. Der Chat liegt nur im Browser-Arbeitsspeicher und verschwindet beim Neuladen. Claude-Verarbeitung erfolgt entsprechend deinem Claude-Konto. Claude Code kann eigene Betriebs-/Anmeldedaten verwalten.

Die erste Version ist für eine Person auf diesem Mac gedacht. Kein öffentliches Hosting und keine Mehrbenutzerfreigabe.

## Prüfen

`npm test` prüft Ordnergrenzen, Symlinks, Suchauswahl, Kalenderwochen, Dokumentextraktion und die Verbindung mit einem isolierten Claude-Testdouble. Das Testdouble ist ausschliesslich für Tests; die normale App zeigt keine simulierten KI-Antworten. Eine echte Claude-Antwort erfordert die persönliche Abo-Anmeldung.


## Unterricht, Kalender und Wetter

Die Oberfläche nutzt das gesamte Browserfenster. **Vollbild** blendet auf Wunsch die Browserleisten aus; **Widgets** blendet das Dashboard ein oder aus.

**KlassenFLOW / LearningView:** Unter «Quellen verbinden & aktualisieren» können sichtbare Planungstexte übernommen werden. KlassenFLOW benötigt den Montag der angezeigten Woche; andere Wochen werden bei einer aktuellen Wochenzusammenfassung ausgelassen. Auszüge über 24 Stunden erhalten einen Warnhinweis. LearningView bleibt eine ausdrücklich unvollständige Materialansicht ohne bestätigten Wochenbezug. «Diese Woche zusammenfassen» schickt die gespeicherten Auszüge an Claude über das bestehende Abo. Die Quelle, der Umfang und der Übernahmezeitpunkt sind sichtbar. Auszüge können entfernt werden.

Für spätere Übernahmen liegt die lokale Chrome-Erweiterung im Ordner **browser-bridge** bereit. Installation und Zugriff müssen ausdrücklich freigegeben werden; sie ist nicht automatisch installiert. Anleitung: [browser-bridge/README.md](browser-bridge/README.md). Sie liest die sichtbare Wochen-/Materialansicht der beiden Dienste und übergibt sie mit einem zufälligen lokalen Verbindungscode an Hugo. Keine Passwörter, Cookies, individuellen Schüler-Arbeitsstände oder Hintergrund-Navigation. Ein tieferliegendes, nicht geöffnetes Thema wird nicht automatisch gelesen. Optionaler Auto-Sync prüft etwa alle 90 Sekunden die geöffneten Unterrichtsseiten, auch im Hintergrund. Pro Dienst wird die zuletzt verwendete Ansicht übernommen; pausierte Tabs müssen einmal geöffnet werden. Zur vollständigen Trennung auch Auto-Sync deaktivieren bzw. die Erweiterung entfernen.

**Google Kalender:** Einmalig über die Kalender-ID verbinden. Die Google-Agenda erscheint direkt im Widget, ohne wiederholten ICS-Import. Bei privaten Kalendern ist die Anmeldung bei Google im verwendeten Browser erforderlich. Alternativ kann die eigene Sieben-Tage-Liste aus einem lokalen ICS-Import genutzt werden; diese importierte Datei synchronisiert sich nicht automatisch.

**Wetter am aktuellen Standort:** Erst «Standort verwenden» fordert die Browserfreigabe an. Koordinaten werden vor der Abfrage auf zwei Nachkommastellen gerundet (ungefähr 1 km) und an Open-Meteo gesendet. Standortkoordinaten werden nicht gespeichert; nach einem Neuladen muss der Standort erneut angefordert werden. Alternativ kann ein Ort gespeichert werden. Der Wetterstand ist eine Modellprognose, kein eigener Wettersensor. Keine zusätzlichen API-Kosten; Open-Meteo ist für nichtkommerzielle Verwendung kostenlos.


Die linke Einrichtungsspalte kann über **Seitenleiste** im Kopfbereich ein- und ausgeblendet werden. Hugo merkt sich die Einstellung im Browser. Das Dashboard lässt sich separat über **Widgets** ausblenden. Die digitale Uhr zeigt die aktuelle Schweizer Zeit mit Datum und aktualisiert sich nach Rückkehr aus einem Hintergrundtab. Weitere animierte Drahtkörper, Satelliten und Lichtpunkte ergänzen die zentrale Hugo-Kugel. **Animationen pausieren** stoppt die dekorativen Bewegungen; die Uhrzeit bleibt korrekt.


## Widgets frei platzieren

Bei ausreichend grossen Fenstern ab 1250 px am kleinen Verschiebegriff neben dem Widget-Titel ziehen. Die Positionen bleiben nach dem Neuladen erhalten. Alternativ den Griff fokussieren und Pfeiltasten drücken (Umschalt für kleine Schritte) oder im Zahnrad eine Ecke wählen. Positionen werden innerhalb der nutzbaren Fläche gehalten. «Widget-Positionen zurücksetzen» im oberen Zahnrad stellt die Grundanordnung wieder her. Bei kleinen Fenstern stehen die Widgets übersichtlich untereinander.

Die Widget-Flächen zeigen nur das Wesentliche. Einrichtung, Quellen-Details, Kalenderimport und Wetterort liegen hinter dem jeweiligen Zahnrad. Das Zahnrad oben öffnet Sprache, Animationen, Vollbild, Widget-Sichtbarkeit sowie Ordner-/Claude-Verbindung. Die zentrale Kugel pulsiert ausschliesslich während tatsächlicher Sprachausgabe. «Hugo anhören» gibt eine Hörprobe, ohne das Mikrofon einzuschalten.


## Ansichten und Wartung

Oben unter **Ansicht** zwischen Futuristisch und Wandtafel wechseln. Die Auswahl und vorhandene Widget-/Stimmpräferenzen bleiben im Browser gespeichert. Die Wandtafel verwendet Post-it-Widgets und einen Tafelschwamm mit Sprechbewegung bei tatsächlicher Audioausgabe. **Standort festlegen** im Wetterwidget öffnet die Einrichtung; erst **Standort verwenden** fordert den Standortzugriff an. Das Plus oben ist der einzige Knopf für ein neues Gespräch.

Die Oberfläche verwendet native ES-Module ohne Framework oder Build-Schritt:

- `public/app.js`: Start, Gespräch und übergreifende Aktionen.
- `public/api.js`: Sitzung und authentifizierte JSON-/Audio-Anfragen.
- `public/ui.js`: sichere Textdarstellung, Quellen, Verbindungsstatus und Ordner.
- `public/voice.js`: Aktivierungswort, Spracherkennung und Wiedergabe.
- `public/widgets.js`: Uhr, Quellen, Kalender, Wetter, Drawer, Ansichten und Platzierung.
- `public/state.js`: gemeinsam verwendeter Laufzeitzustand.
- `public/widget-layout.js`: reine Kollisionsberechnung.

**Update des lokalen Helfers:** Alle Moduldateien müssen mitkopiert und vom Server als JavaScript ausgeliefert werden. Die aktualisierte `server.mjs` enthält die passenden expliziten Routen. Danach Helfer neu starten und alle offenen Hugo-Seiten neu laden. Client und Server verwenden gemeinsam **`X-Hugo-Token`**; der bisherige Header `X-Jarvis-Token` wird nicht mehr akzeptiert. Bestehende lokale Dateien, Sitzungscookie-Namen und Browser-Einstellungen bleiben erhalten.

Schrift ist in der eigenen Oberfläche mindestens 12 px gross. Klickflächen sind mindestens 24 × 24 px, per CSS auf Touch-Geräten 44 × 44 px. Die Sekunden der Wandtafel-Uhr haben 8,01:1 Kontrast; ihre Bewegung verändert dort die Deckkraft nicht. Native VoiceOver-Ausgabe und echte Touch-Geräte sind noch nicht vollständig geprüft; dies ist keine allgemeine WCAG-Konformitätsbescheinigung.

## Kalender und Wetter (aktuell)

Ein einmal verbundener Google Kalender erscheint direkt im Widget und lädt seine Termine bei Google. Ein ICS-Import ist optional. Im Zahnrad kann stattdessen die lokale Dateiliste gewählt werden. Bei privaten Kalendern ist die Google-Anmeldung im verwendeten Browser erforderlich; Browser mit gesperrten Drittanbieter-Cookies können die Einbettung blockieren.

Ein per Standortfreigabe gewählter Wetterort wird gerundet auf zwei Nachkommastellen im lokalen Helfer gespeichert und beim nächsten Öffnen geladen. Eine manuell gewählte Stadt ersetzt die Koordinaten. Es wird beim Start keine neue Standortfreigabe angefordert.

## GitHub und Erreichbarkeit

Dieses Repository enthält den Quellcode. `.jarvis`, lokale Anmeldedaten, Unterrichtsunterlagen und Ausgabe-Dateien gehören nicht ins Repository. GitHub Pages kann den benötigten Node-Helfer und den lokalen Claude-Zugang nicht ausführen. Die lokale Adresse lautet `http://127.0.0.1:4317/`. Fernzugriff erfordert einen zusätzlich eingerichteten geschützten Zugang; das Repository allein stellt keinen öffentlich erreichbaren Dienst bereit.

## Auf anderen Geräten über GitHub Codespaces

[Hugo in GitHub Codespaces starten](https://codespaces.new/KI-Lehrer/hugo?quickstart=1)

Die Konfiguration für einen eigenen GitHub Codespace liegt in `.devcontainer`. Sie installiert Node, Python/PDF-Unterstützung und Claude Code und startet Hugo auf Port 4317. Der Port muss **Privat** bleiben: GitHub verlangt vor dem Zugriff die Anmeldung mit dem Konto, dem der Codespace gehört. Den Port niemals öffentlich schalten; Hugo besitzt keine zusätzliche Benutzerverwaltung. Die exakte Codespaces-Adresse wird aus den GitHub-Umgebungsvariablen zugelassen, keine beliebigen Hosts oder Origins.

1. Codespace erstellen und Einrichtung abwarten. GitHub zeigt Kontingent und gegebenenfalls Kosten; Codespaces ist kein kostenlos garantierter Dauer-Hostingdienst. Bei Inaktivität stoppt die Umgebung.
2. Im Codespace-Terminal einmal `claude auth login` ausführen und mit dem Claude-Abo anmelden. Keine Zugangsdaten ins Repository kopieren.
3. Unter **Ports → 4317 → Im Browser öffnen** die persönliche Hugo-Adresse öffnen. Diese HTTPS-Adresse kann auch auf anderen Geräten nach GitHub-Anmeldung verwendet werden.

Die endgültige App-Adresse gibt es erst nach Erstellung des Codespace. Sie ist nicht die Repository-Adresse und keine GitHub-Pages-Adresse. Die Cloud-Einrichtung ist vorbereitet, aber noch nicht live geprüft. Das aktuelle GitHub-CLI-Login erlaubt Repository-Uploads, jedoch noch keinen Codespaces-Zugriff.

Die Cloud-Umgebung hat **keinen Zugriff auf Finder-Ordner, die lokale Browser-Erweiterung oder Mac-Stimmen**. Unterrichtsdateien müssten gezielt in den privaten Codespace übertragen werden; lokale Planungsauszüge werden nicht automatisch übertragen. DOC/RTF-Konvertierung über macOS-textutil steht dort nicht zur Verfügung, PDF/DOCX/Text sind vorgesehen. Die Sprachausgabe nutzt verfügbare Browserstimmen. Für die automatische lokale KlassenFLOW-Übernahme weiterhin die lokale App verwenden.
