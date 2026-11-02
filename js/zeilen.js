// Termin-Zeilen (Buchen-Tabelle, Retreat-Termine): die ganze Zeile ist klickbar
// und löst die Aktion rechts aus (Buchen, Anfragen, Interesse melden).
document.addEventListener('DOMContentLoaded', function () {
  var rows = document.querySelectorAll('.booking-table tbody tr, .date-card');
  Array.prototype.forEach.call(rows, function (row) {
    var actions = row.querySelectorAll('a, button');
    var action = actions[actions.length - 1];
    if (!action) return;
    row.classList.add('is-zeile');
    row.addEventListener('click', function (e) {
      if (e.target.closest('a, button')) return;
      if (window.getSelection && String(window.getSelection())) return;   // Text markieren bleibt möglich
      action.click();
    });
  });
});
