/* ============================================
   Buchen: Popup mit Buchungsformular
   ============================================ */
(function () {
  var dialog = document.getElementById('booking-dialog');
  if (!dialog) return;

  var form     = document.getElementById('booking-form');
  var success  = document.getElementById('booking-success');
  var typesBox = document.getElementById('booking-types');
  var payment  = document.getElementById('booking-payment');
  var submit   = document.getElementById('booking-submit');
  var errorBox = document.getElementById('booking-error');
  var dateSel  = document.getElementById('booking-date');
  var current  = null;

  // Adresse der Google-Apps-Script-Web-App (siehe automation/google-apps-script/ANLEITUNG.md).
  // Solange leer, öffnet sich beim Absenden eine vorausgefüllte Mail an Marie.
  var BOOKING_ENDPOINT = '';

  var WEEKS_AHEAD = 8;
  var WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  // Termine fürs Dropdown: feste Termine aus data-dates,
  // sonst die nächsten Wochentermine ab heute aus data-weekday/-start/-end
  function getDates(row) {
    if (row.dataset.dates) {
      var isos = (row.dataset.iso || '').split('|');
      return row.dataset.dates.split('|').map(function (label, i) {
        return { label: label, iso: isos[i] || '' };
      });
    }

    var weekday = Number(row.dataset.weekday);
    var start = row.dataset.start, end = row.dataset.end;
    var hm = start.split(':');
    var d = new Date();
    d.setHours(Number(hm[0]), Number(hm[1]), 0, 0);
    d.setDate(d.getDate() + ((weekday - d.getDay() + 7) % 7));
    if (d < new Date()) d.setDate(d.getDate() + 7); // heutiger Kurs schon vorbei

    var dates = [];
    for (var i = 0; i < WEEKS_AHEAD; i++) {
      dates.push({
        label: WEEKDAYS[d.getDay()] + ', ' + pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '. um ' + start + '–' + end + ' Uhr',
        iso: d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + start
      });
      d.setDate(d.getDate() + 7);
    }
    return dates;
  }

  function fillDates(row) {
    var dates = getDates(row);
    dateSel.innerHTML = '';
    if (dates.length > 1) dateSel.add(new Option('Bitte wählen', ''));
    dates.forEach(function (d) { dateSel.add(new Option(d.label, d.iso || d.label)); });

    // Fester Termin: kein Dropdown, nur den Termin anzeigen
    var fixed = dates.length === 1;
    document.getElementById('booking-date-field').hidden = fixed;
    document.getElementById('booking-date-fixed').hidden = !fixed;
    document.getElementById('booking-date-text').textContent = fixed ? dates[0].label : '';
    // Oben unter dem Titel nur bei Wochenkursen den Rhythmus zeigen, sonst steht der Termin doppelt
    document.getElementById('booking-detail').textContent = fixed ? '' : current.detail + ' · ';
  }

  var TYPE_LABELS = {
    einzel:   'Einzelstunde',
    wellpass: 'Wellpass'
  };

  // Bezahlung und Button-Text hängen von der Buchungsart ab:
  // Wellpass braucht keine Zahlung.
  function updatePayment() {
    var checked = form.querySelector('input[name="type"]:checked');
    var paid = !checked || checked.value === 'einzel';
    payment.hidden = !paid;
    submit.textContent = paid ? 'Zahlungspflichtig buchen' : 'Verbindlich anmelden';
  }

  var SUCCESS_TEXT = {
    booking:  'Du bekommst gleich eine Bestätigung per E-Mail. Treffpunkt bzw. Link schicke ich dir spätestens am Vortag.',
    interest: 'Danke für dein Interesse! Ich melde mich bei dir, sobald Termin und Details feststehen.'
  };

  function open(row) {
    current = {
      offer:    row.dataset.offer,
      detail:   row.dataset.detail,
      price:    row.dataset.price,
      interest: row.dataset.mode === 'interest'
    };

    form.reset();
    form.hidden = false;
    success.hidden = true;
    errorBox.hidden = true;

    document.getElementById('booking-dialog-title').textContent = current.offer;
    document.getElementById('booking-price').textContent = current.price;
    document.getElementById('booking-success-text').textContent = SUCCESS_TEXT[current.interest ? 'interest' : 'booking'];
    document.getElementById('booking-success-title').textContent = current.interest ? 'Danke dir!' : 'Deine Buchung ist angekommen';

    // Interesse melden: nur Name, E-Mail und Nachricht, ohne Termin, Buchungsart, Zahlung und AGB
    form.classList.toggle('is-interest', current.interest);
    if (current.interest) {
      document.getElementById('booking-detail').textContent = current.detail + (current.price ? ' · ' : '');
      submit.textContent = 'Interesse senden';
      dialog.showModal();
      form.querySelector('input[name="name"]').focus();
      return;
    }

    var types = row.dataset.types.split(',');

    // Nur die Buchungsarten zeigen, die für dieses Angebot gelten
    typesBox.querySelectorAll('label').forEach(function (label) {
      var available = types.indexOf(label.dataset.type) !== -1;
      label.hidden = !available;
      label.querySelector('input').disabled = !available;
    });
    // Bei nur einer Möglichkeit ist keine Auswahl nötig
    typesBox.hidden = types.length < 2;
    if (types.length === 1) {
      typesBox.querySelector('input[value="' + types[0] + '"]').checked = true;
    }

    fillDates(row);
    updatePayment();
    dialog.showModal();
    form.querySelector('input[name="name"]').focus();
  }

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.hidden = false;
  }

  document.querySelectorAll('.booking-open').forEach(function (btn) {
    btn.addEventListener('click', function () { open(btn.closest('tr')); });
  });

  form.addEventListener('change', function (e) {
    if (e.target.name === 'type') updatePayment();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    errorBox.hidden = true;

    var name  = form.elements.name.value.trim();
    var email = form.elements.email.value.trim();
    var type  = form.querySelector('input[name="type"]:checked');

    if (!name)  return showError('Bitte gib deinen Namen an.');
    if (!email || !form.elements.email.checkValidity()) return showError('Bitte gib eine gültige E-Mail-Adresse an.');

    if (current.interest) {
      return send({
        kind:    'interest',
        offer:   current.offer,
        name:    name,
        email:   email,
        message: form.elements.message.value.trim(),
        website: form.elements.website.value
      });
    }

    if (!dateSel.value) return showError('Bitte wähle deinen Termin aus.');
    if (!type)  return showError('Bitte wähle aus, wie du buchen möchtest.');
    if (!form.elements.agb.checked) return showError('Bitte stimme den AGB zu, um die Buchung abzuschließen.');

    send({
      kind:      'booking',
      offer:     current.offer,
      date:      dateSel.value,
      dateLabel: dateSel.options[dateSel.selectedIndex].text,
      price:     current.price,
      type:      type.value,
      typeLabel: TYPE_LABELS[type.value],
      name:      name,
      email:     email,
      website:   form.elements.website.value
    });
  });

  // TODO: Online-Zahlung anbinden.
  function send(data) {
    if (!BOOKING_ENDPOINT) return sendViaMail(data);

    var label = submit.textContent;
    submit.disabled = true;
    submit.textContent = 'Wird gesendet …';

    // text/plain, damit der Browser keine CORS-Vorabanfrage an Google schickt
    fetch(BOOKING_ENDPOINT, { method: 'POST', body: JSON.stringify(data) })
      .then(function (res) { return res.json(); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.error);
        form.hidden = true;
        success.hidden = false;
      })
      .catch(function () {
        showError('Das hat leider nicht geklappt. Bitte versuch es noch einmal oder schreib mir an info@marieyogaaa.de.');
      })
      .then(function () {
        submit.disabled = false;
        submit.textContent = label;
      });
  }

  // Übergangslösung ohne Automatisierung: vorausgefüllte Mail an Marie
  function sendViaMail(b) {
    if (b.kind === 'interest') {
      window.location.href = 'mailto:info@marieyogaaa.de'
        + '?subject=' + encodeURIComponent('Interesse: ' + b.offer)
        + '&body=' + encodeURIComponent('Name: ' + b.name + '\nE-Mail: ' + b.email + (b.message ? '\n\n' + b.message : ''));
      form.hidden = true;
      success.hidden = false;
      return;
    }
    var body = [
      'Angebot: ' + b.offer,
      'Termin: ' + b.dateLabel,
      'Preis: ' + b.price,
      'Buchungsart: ' + b.typeLabel,
      'Name: ' + b.name,
      'E-Mail: ' + b.email,
      'AGB akzeptiert: ja'
    ].join('\n');
    window.location.href = 'mailto:info@marieyogaaa.de'
      + '?subject=' + encodeURIComponent('Buchung: ' + b.offer)
      + '&body=' + encodeURIComponent(body);

    document.getElementById('booking-success-text').textContent = 'Deine Buchung geht per E-Mail an mich. Ich melde mich in Kürze bei dir.';
    form.hidden = true;
    success.hidden = false;
  }

  dialog.querySelectorAll('.booking-close, .booking-close-btn').forEach(function (btn) {
    btn.addEventListener('click', function () { dialog.close(); });
  });

  // Link mit Anker (z. B. buchen.html#midsommar) öffnet direkt das passende Popup
  var linked = location.hash && document.getElementById(location.hash.slice(1));
  if (linked && linked.querySelector('.booking-open')) open(linked);

  // Klick auf den abgedunkelten Hintergrund schließt das Popup
  dialog.addEventListener('click', function (e) {
    if (e.target === dialog) dialog.close();
  });
})();
