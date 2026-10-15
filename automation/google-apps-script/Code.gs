/**
 * marieyoga – Buchungen & automatische Mails
 *
 * Läuft als Google Apps Script in einer Google-Tabelle.
 * - Nimmt Buchungen von buchen.html entgegen und speichert sie im Tab „Anmeldungen“.
 * - Schickt sofort eine Bestätigung an die Teilnehmerin und eine Info an Marie.
 * - Schickt am Vortag (ab ERINNERUNG_AB_UHR) eine Erinnerung mit Treffpunkt bzw. Zoom-Link
 *   an alle Angemeldeten und Marie eine Teilnehmerliste.
 * - Nimmt „Interesse melden“ entgegen und speichert es im Tab „Interessen“.
 * - Hakt Marie im Tab „Treffpunkte“ bei einem Termin „Abgesagt“ an, bekommen alle
 *   Angemeldeten automatisch eine Absage.
 *
 * Einrichtung: siehe ANLEITUNG.md im selben Ordner.
 */

var CONFIG = {
  MARIE_EMAIL: 'info@marieyogaaa.de',
  ABSENDER_NAME: 'Marie · marieyoga',
  // Absenderadresse der Mails. Leer lassen = die Gmail-Adresse des Google-Kontos.
  // info@marieyogaaa.de geht erst, wenn sie in Gmail unter „Senden als“ eingerichtet ist.
  ABSENDER_ALIAS: '',
  ERINNERUNG_AB_UHR: 17,
  ZEITZONE: 'Europe/Berlin'
};

var TAB_ANMELDUNGEN = 'Anmeldungen';
var TAB_TREFFPUNKTE = 'Treffpunkte';
var TAB_INTERESSEN  = 'Interessen';

// Spalten (1-basiert)
var A = { ZEIT: 1, ANGEBOT: 2, TERMIN: 3, DATUM: 4, NAME: 5, EMAIL: 6, ART: 7,
          BESTAETIGUNG: 8, ERINNERUNG: 9, ABSAGE: 10 };
var T = { ANGEBOT: 1, DATUM: 2, ORT: 3, HINWEIS: 4, ABGESAGT: 5, ABSAGE_GESENDET: 6 };

var ANGEBOTE = [
  'Outdoor Yoga · Isar',
  'Outdoor Yoga · Englischer Garten',
  'Yoga fürs Nervensystem (online)',
  'VON INNEN WARM',
  'Adventskalender',
  'Somatics Weekend Retreat',
  'Retreat in Mittenwald',
  'Midsommar'
];

/* ---------- Einrichtung (einmal von Hand ausführen) ---------- */

function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var anm = ss.getSheetByName(TAB_ANMELDUNGEN) || ss.insertSheet(TAB_ANMELDUNGEN);
  if (anm.getLastRow() === 0) {
    anm.appendRow(['Zeitstempel', 'Angebot', 'Termin', 'Datum', 'Name', 'E-Mail', 'Buchungsart',
                   'Bestätigung', 'Erinnerung', 'Absage']);
    anm.setFrozenRows(1);
    anm.getRange('D:D').setNumberFormat('@');
  }

  var tp = ss.getSheetByName(TAB_TREFFPUNKTE) || ss.insertSheet(TAB_TREFFPUNKTE);
  if (tp.getLastRow() === 0) {
    tp.appendRow(['Angebot', 'Datum (JJJJ-MM-TT, leer = gilt für alle Termine)', 'Treffpunkt / Link',
                  'Hinweis (optional)', 'Abgesagt', 'Absage gesendet']);
    tp.setFrozenRows(1);
    tp.getRange('B:B').setNumberFormat('@');
    ANGEBOTE.forEach(function (name) { tp.appendRow([name, '', '', '', false, '']); });
    tp.getRange(2, T.ABGESAGT, 200, 1).insertCheckboxes();
  }

  interessenTab();

  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'stuendlich') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('stuendlich').timeBased().everyHours(1).create();
}

/* ---------- Buchung von der Website ---------- */

function doPost(e) {
  var data;
  try { data = JSON.parse(e.postData.contents); } catch (err) { return antwort(false, 'Ungültige Anfrage'); }

  // Spamschutz: verstecktes Feld muss leer sein
  if (data.website) return antwort(true);

  if (data.kind === 'interest') return interesseSpeichern(data);

  var pflicht = ['offer', 'dateLabel', 'date', 'name', 'email', 'type'];
  for (var i = 0; i < pflicht.length; i++) {
    if (!data[pflicht[i]]) return antwort(false, 'Feld fehlt: ' + pflicht[i]);
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) return antwort(false, 'E-Mail ungültig');

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = tab(TAB_ANMELDUNGEN);
    sheet.appendRow([new Date(), data.offer, data.dateLabel, data.date, data.name, data.email, data.typeLabel || data.type, '', '', '']);
    var row = sheet.getLastRow();

    var info = treffpunkt(data.offer, data.date);
    var ortZeile = info.ort
      ? 'Treffpunkt / Link: ' + info.ort + (info.hinweis ? '\n' + info.hinweis : '')
      : 'Den genauen Treffpunkt bzw. den Link bekommst du am Vortag per E-Mail.';

    mail(data.email, 'Deine Anmeldung: ' + data.offer,
      'Hallo ' + data.name + ',\n\n' +
      'danke für deine Anmeldung! Hier noch einmal alles auf einen Blick:\n\n' +
      'Angebot: ' + data.offer + '\n' +
      'Termin: ' + data.dateLabel + '\n' +
      'Buchungsart: ' + (data.typeLabel || data.type) + '\n\n' +
      ortZeile + '\n\n' +
      'Falls du doch nicht kommen kannst, gib mir bitte rechtzeitig Bescheid, ' +
      'einfach als Antwort auf diese Mail. Es gelten die Stornofristen aus meinen AGB.\n\n' +
      'Ich freu mich auf dich!\nMarie');
    sheet.getRange(row, A.BESTAETIGUNG).setValue(stempel());

    mail(CONFIG.MARIE_EMAIL, 'Neue Anmeldung: ' + data.offer + ' · ' + data.dateLabel,
      data.name + ' (' + data.email + ') hat sich angemeldet.\n\n' +
      'Angebot: ' + data.offer + '\nTermin: ' + data.dateLabel + '\n' +
      'Buchungsart: ' + (data.typeLabel || data.type) + '\n\n' +
      'Alle Anmeldungen: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl());
  } finally {
    lock.releaseLock();
  }
  return antwort(true);
}

/* ---------- Interesse melden ---------- */

function interesseSpeichern(data) {
  if (!data.offer || !data.name || !data.email) return antwort(false, 'Feld fehlt');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) return antwort(false, 'E-Mail ungültig');

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = interessenTab();
    sheet.appendRow([new Date(), data.offer, data.name, data.email, data.message || '', '']);
    var row = sheet.getLastRow();

    mail(data.email, 'Danke für dein Interesse: ' + data.offer,
      'Hallo ' + data.name + ',\n\n' +
      'schön, dass du dich für ' + data.offer + ' interessierst! ' +
      'Ich habe dich vorgemerkt und melde mich bei dir, sobald Termin und Details feststehen.\n\n' +
      'Alles Liebe\nMarie');
    sheet.getRange(row, 6).setValue(stempel());

    mail(CONFIG.MARIE_EMAIL, 'Neues Interesse: ' + data.offer,
      data.name + ' (' + data.email + ') interessiert sich für ' + data.offer + '.' +
      (data.message ? '\n\nNachricht:\n' + data.message : '') +
      '\n\nAlle Interessierten: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl());
  } finally {
    lock.releaseLock();
  }
  return antwort(true);
}

function interessenTab() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(TAB_INTERESSEN);
  if (!sheet) {
    sheet = ss.insertSheet(TAB_INTERESSEN);
    sheet.appendRow(['Zeitstempel', 'Angebot', 'Name', 'E-Mail', 'Nachricht', 'Bestätigung']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/* ---------- Läuft jede Stunde automatisch ---------- */

function stuendlich() {
  absagenVersenden();
  var stunde = Number(Utilities.formatDate(new Date(), CONFIG.ZEITZONE, 'H'));
  if (stunde >= CONFIG.ERINNERUNG_AB_UHR) erinnerungenVersenden();
}

// Erinnerung am Vortag an alle Angemeldeten, plus Teilnehmerliste an Marie
function erinnerungenVersenden() {
  var morgen = Utilities.formatDate(new Date(Date.now() + 24 * 3600 * 1000), CONFIG.ZEITZONE, 'yyyy-MM-dd');
  var sheet = tab(TAB_ANMELDUNGEN);
  var rows = daten(sheet);
  var props = PropertiesService.getScriptProperties();

  // Anmeldungen für morgen nach Angebot gruppieren
  var gruppen = {};
  rows.forEach(function (r, i) {
    if (tagVon(r[A.DATUM - 1]) !== morgen) return;
    var key = r[A.ANGEBOT - 1];
    (gruppen[key] = gruppen[key] || []).push({ row: i + 2, r: r });
  });

  Object.keys(gruppen).forEach(function (angebot) {
    var liste = gruppen[angebot];
    var info = treffpunkt(angebot, morgen);
    if (info.abgesagt) return;

    if (!info.ort) {
      // Ohne Treffpunkt keine Erinnerung – Marie einmal warnen, nächste Stunde wird erneut geprüft
      var warnKey = 'warnung_' + angebot + '_' + morgen;
      if (!props.getProperty(warnKey)) {
        mail(CONFIG.MARIE_EMAIL, 'Bitte Treffpunkt eintragen: ' + angebot + ' morgen',
          'Für „' + angebot + '“ morgen (' + morgen + ') sind ' + liste.length + ' Personen angemeldet, ' +
          'aber im Tab „Treffpunkte“ steht noch kein Treffpunkt bzw. Link.\n\n' +
          'Sobald du ihn einträgst, gehen die Erinnerungen automatisch raus (bis Mitternacht).\n\n' +
          SpreadsheetApp.getActiveSpreadsheet().getUrl());
        props.setProperty(warnKey, '1');
      }
      return;
    }

    var namen = [];
    liste.forEach(function (x) {
      namen.push('- ' + x.r[A.NAME - 1] + ' (' + x.r[A.ART - 1] + ')');
      if (x.r[A.ERINNERUNG - 1] || x.r[A.ABSAGE - 1]) return;
      mail(x.r[A.EMAIL - 1], 'Morgen: ' + angebot,
        'Hallo ' + x.r[A.NAME - 1] + ',\n\n' +
        'kurze Erinnerung: Morgen ist es so weit.\n\n' +
        'Angebot: ' + angebot + '\n' +
        'Termin: ' + x.r[A.TERMIN - 1] + '\n' +
        'Treffpunkt / Link: ' + info.ort + '\n' +
        (info.hinweis ? info.hinweis + '\n' : '') +
        '\nFalls du doch nicht kommen kannst, antworte einfach kurz auf diese Mail.\n\n' +
        'Bis morgen!\nMarie');
      sheet.getRange(x.row, A.ERINNERUNG).setValue(stempel());
    });

    var listKey = 'liste_' + angebot + '_' + morgen;
    if (!props.getProperty(listKey)) {
      mail(CONFIG.MARIE_EMAIL, 'Teilnehmerliste morgen: ' + angebot + ' (' + liste.length + ')',
        angebot + ' am ' + morgen + '\n' + liste.length + ' Anmeldungen:\n\n' + namen.join('\n'));
      props.setProperty(listKey, '1');
    }
  });
}

// Hat Marie bei einem Termin „Abgesagt“ angehakt, alle Angemeldeten informieren
function absagenVersenden() {
  var tp = tab(TAB_TREFFPUNKTE);
  var tpRows = daten(tp);
  var anm = tab(TAB_ANMELDUNGEN);
  var anmRows = daten(anm);

  tpRows.forEach(function (t, i) {
    var datum = tagVon(t[T.DATUM - 1]);
    if (t[T.ABGESAGT - 1] !== true || t[T.ABSAGE_GESENDET - 1] || !datum) return;
    var angebot = t[T.ANGEBOT - 1];

    anmRows.forEach(function (r, j) {
      if (r[A.ANGEBOT - 1] !== angebot || tagVon(r[A.DATUM - 1]) !== datum || r[A.ABSAGE - 1]) return;
      mail(r[A.EMAIL - 1], 'Abgesagt: ' + angebot + ' · ' + r[A.TERMIN - 1],
        'Hallo ' + r[A.NAME - 1] + ',\n\n' +
        'leider muss ich ' + angebot + ' am ' + r[A.TERMIN - 1] + ' absagen.\n' +
        (t[T.HINWEIS - 1] ? '\n' + t[T.HINWEIS - 1] + '\n' : '') +
        '\nBei Fragen antworte einfach auf diese Mail.\n\nAlles Liebe\nMarie');
      anm.getRange(j + 2, A.ABSAGE).setValue(stempel());
    });
    tp.getRange(i + 2, T.ABSAGE_GESENDET).setValue(stempel());
  });
}

/* ---------- Hilfsfunktionen ---------- */

// Treffpunkt für Angebot + Tag: erst ein Eintrag mit genau diesem Datum, sonst der allgemeine Eintrag
function treffpunkt(angebot, datum) {
  var tag = tagVon(datum);
  var allgemein = null, genau = null;
  daten(tab(TAB_TREFFPUNKTE)).forEach(function (t) {
    if (t[T.ANGEBOT - 1] !== angebot) return;
    var d = tagVon(t[T.DATUM - 1]);
    if (d === tag) genau = t;
    else if (!d) allgemein = t;
  });
  var t = genau || allgemein;
  if (!t) return { ort: '', hinweis: '', abgesagt: false };
  return {
    ort: String(t[T.ORT - 1] || (allgemein ? allgemein[T.ORT - 1] : '') || '').trim(),
    hinweis: String(t[T.HINWEIS - 1] || '').trim(),
    abgesagt: genau ? genau[T.ABGESAGT - 1] === true : false
  };
}

// Datum als JJJJ-MM-TT, egal ob Text („2026-10-18T09:00“) oder Datumszelle
function tagVon(v) {
  if (!v) return '';
  if (v instanceof Date) return Utilities.formatDate(v, CONFIG.ZEITZONE, 'yyyy-MM-dd');
  return String(v).slice(0, 10);
}

function mail(an, betreff, text) {
  var opt = { name: CONFIG.ABSENDER_NAME, replyTo: CONFIG.MARIE_EMAIL };
  if (CONFIG.ABSENDER_ALIAS) opt.from = CONFIG.ABSENDER_ALIAS;
  GmailApp.sendEmail(an, betreff, text, opt);
}

function tab(name) { return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name); }

function daten(sheet) {
  var n = sheet.getLastRow() - 1;
  return n > 0 ? sheet.getRange(2, 1, n, sheet.getLastColumn()).getValues() : [];
}

function stempel() { return 'gesendet ' + Utilities.formatDate(new Date(), CONFIG.ZEITZONE, 'dd.MM. HH:mm'); }

function antwort(ok, fehler) {
  return ContentService.createTextOutput(JSON.stringify({ ok: ok, error: fehler || null }))
    .setMimeType(ContentService.MimeType.JSON);
}
