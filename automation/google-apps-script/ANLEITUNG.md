# Buchungen & automatische Mails einrichten

Kostenlos über eine Google-Tabelle. Einmalig ca. 15 Minuten, danach läuft alles automatisch.

## Was die Automatisierung macht

| Wann | Was passiert |
|---|---|
| Jemand klickt „Interesse melden“ | Eintrag im Tab „Interessen“, die Person bekommt eine kurze Bestätigung, Marie eine Info |
| Jemand bucht auf der Website | Buchung landet in der Tabelle, die Person bekommt sofort eine Bestätigung, Marie eine kurze Info |
| Am Vortag ab 17 Uhr | Alle Angemeldeten bekommen eine Erinnerung mit Treffpunkt bzw. Zoom-Link, Marie bekommt die Teilnehmerliste |
| Marie hakt bei einem Termin „Abgesagt“ an | Innerhalb einer Stunde bekommen alle Angemeldeten eine Absage-Mail |
| Treffpunkt fehlt am Vortag | Marie bekommt eine Erinnerung, ihn einzutragen. Danach gehen die Mails automatisch raus |

## Einrichtung (einmalig)

1. Mit Maries Google-Konto eine neue **Google-Tabelle** anlegen, z. B. „marieyoga Buchungen“.
2. In der Tabelle: **Erweiterungen → Apps Script**.
3. Den Inhalt von `Code.gs` komplett in das Editor-Fenster kopieren (vorhandenen Code ersetzen) und speichern.
4. Links auf das Zahnrad **Projekteinstellungen** → Zeitzone **Europe/Berlin** einstellen.
5. Oben in der Funktionsauswahl **setup** wählen → **Ausführen**. Google fragt nach Berechtigungen (Tabelle, Gmail) → zulassen.
   Danach gibt es in der Tabelle die Tabs „Anmeldungen“, „Treffpunkte“ und „Interessen“.
6. **Bereitstellen → Neue Bereitstellung** → Typ **Web-App**
   - Ausführen als: **Ich**
   - Zugriff: **Jeder**
   → Bereitstellen und die **Web-App-URL** kopieren (endet auf `/exec`).
7. Die URL in `js/booking.js` bei `BOOKING_ENDPOINT = ''` zwischen die Anführungszeichen setzen und die Website veröffentlichen.
8. Einmal selbst eine Testbuchung machen und prüfen, ob die Bestätigung ankommt.

## So arbeitet Marie damit

Alles im Tab **„Treffpunkte“**:

- **Gleicher Treffpunkt jedes Mal** (z. B. Zoom-Link fürs Online Yoga): in der Zeile des Angebots ohne Datum eintragen. Gilt dann für alle Termine.
- **Treffpunkt wechselt** (Outdoor Yoga): neue Zeile mit Angebot + Datum (`2026-10-18`) + Treffpunkt. Spätestens am Vortag bis 17 Uhr.
- **Termin fällt aus**: Zeile mit Angebot + Datum, Häkchen bei „Abgesagt“, optional ein Satz bei „Hinweis“ (z. B. „Wegen Regen. Nächste Woche wie gewohnt.“).

Der Angebotsname muss genau so geschrieben sein wie auf der Website (die Zeilen sind nach `setup` schon vorbereitet).

Tab **„Anmeldungen“** zeigt alle Buchungen. Dort nichts löschen, sonst fehlen Erinnerungen.

## Absenderadresse

Die Mails kommen zunächst von Maries Gmail-Adresse, Antworten gehen an info@marieyogaaa.de.
Damit sie direkt von info@marieyogaaa.de kommen: das STRATO-Postfach in Gmail unter
**Einstellungen → Konten → Senden als** hinzufügen (SMTP `smtp.strato.de`, Port 465, SSL) und dann in
`Code.gs` bei `ABSENDER_ALIAS` die Adresse eintragen und neu bereitstellen.

## Wichtig

- **Code geändert?** Bereitstellen → Bereitstellungen verwalten → Bearbeiten → neue Version. Die URL bleibt gleich.
- **Limit:** Ein normales Google-Konto darf ca. 100 Mails pro Tag verschicken. Für Maries Kursgrößen reicht das.
- **Datenschutz:** Namen und E-Mail-Adressen liegen bei Google. Das muss in die Datenschutzerklärung.
  Ein Auftragsverarbeitungsvertrag mit Google gibt es nur mit Google Workspace (kostenpflichtig), nicht mit einem privaten Gmail-Konto.
