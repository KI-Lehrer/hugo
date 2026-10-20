# Hugo Browser-Verbindung

Diese lokale Erweiterung verwendet nur die beiden benannten Unterrichtsseiten und den lokalen Hugo auf Port 4317. Sie liest sichtbare Lektionen bzw. sichtbare Materialansichten, niemals Login-Speicher, Cookies oder Kennwörter. Keine Datenänderungen auf den Quellseiten. Schüler-Arbeitsstände, Korrekturen und Aktivitäten werden nicht erfasst.

1. In Chrome `chrome://extensions` öffnen, Entwicklermodus einschalten und **Entpackte Erweiterung laden** wählen.
2. Diesen Ordner `browser-bridge` auswählen. Chrome zeigt die angeforderten Seitenzugriffe an; die Installation und Freigabe führt der Benutzer selbst durch.
3. In Hugo im Zahnrad des Unterricht-Widgets **Automatisch mit Chrome übernehmen** öffnen und den Verbindungscode anzeigen/kopieren.
4. Den Code im Erweiterungsfenster einfügen und speichern. Den Code nicht weitergeben.
5. KlassenFLOW/LearningView nach der Installation neu laden. In KlassenFLOW die laufende Woche, in LearningView die Lehrpersonen-Materialansicht öffnen. **Diese Ansicht an Hugo senden** wählen.

Optional: automatische Übernahme aktivieren. Ein Chrome-Alarm prüft ungefähr alle 90 Sekunden die geöffneten KlassenFLOW- und LearningView-Tabs, auch im Hintergrund. Pro Dienst wird die zuletzt verwendete geöffnete Ansicht übernommen. Die Erweiterung wechselt keine Tabs, lädt keine Seiten neu, navigiert nicht zu anderen Wochen und öffnet keine eingeklappten Kursbereiche. Erfasst wird der aktuell geladene Wochenplan bzw. Materialbereich. Externe Änderungen, die die Quellseite selbst noch nicht geladen hat, sind darin nicht enthalten. Pausierte/verworfene Tabs müssen einmal geöffnet werden; bei schlafendem Mac oder geschlossenem Chrome ist keine laufende Übernahme möglich. Hugo zeigt den tatsächlichen Übernahmezeitpunkt und den begrenzten Umfang. LearningView-Materialien ohne Wochenbezug bleiben als solche gekennzeichnet.

Nach dem Aktualisieren dieser lokalen Erweiterung in Chrome auf **Neu laden** klicken und die beiden Quellseiten einmal neu laden. Version 0.2.0 nutzt zusätzlich den Chrome-Zeitgeber (`alarms`) und Seitenzugriff ausschliesslich auf die beiden bereits freigegebenen Unterrichtsdienste. Der Verbindungscode und die Auto-Sync-Auswahl bleiben erhalten.

Hinweis für die installierte Chrome-Version: Der Entwicklermodus muss bei dieser entpackten lokalen Erweiterung eingeschaltet bleiben. Beim Ausschalten deaktiviert Chrome Hugo. Der Benutzer entscheidet selbst über diesen dauerhaften Modus; die lokale Erweiterung ist nicht im Chrome Web Store geprüft.
