/**
 * RSVP backend: Google Apps Script web app bound to the RSVP Google Sheet.
 *
 * Called only by the Vercel proxy (api/rsvp.ts), which sends a shared secret.
 * Deployment steps are in apps-script/README.md.
 *
 * Script Properties (Project Settings → Script Properties):
 *   SHARED_SECRET  long random string, same as RSVP_SHARED_SECRET on Vercel
 *   MAX_GUESTS     optional, default 10
 */

var SHEET_NAME = 'RSVP';
var HEADERS = ['Submitted At', 'Name', 'Attendance', 'Guest Count', 'Message', 'Submission ID'];
var ATTENDANCE_LABELS = { attending: 'Attending', not_attending: 'Not Attending' };
var LIMITS = { nameMin: 2, nameMax: 80, messageMax: 500 };
var THROTTLE = {
  sameNameSeconds: 30,  // same name can't submit twice within 30s
  globalPerMinute: 30,  // total submissions accepted per minute
};

var TIMEZONE = 'Asia/Kolkata';

function doPost(e) {
  try {
    var props = PropertiesService.getScriptProperties();
    var secret = props.getProperty('SHARED_SECRET');
    var maxGuests = Number(props.getProperty('MAX_GUESTS') || 10);

    if (!secret) return respond_({ ok: false, error: 'not_configured' });
    if (!e || !e.postData || !e.postData.contents) return respond_({ ok: false, error: 'empty' });
    if (e.postData.contents.length > 8192) return respond_({ ok: false, error: 'too_large' });

    var body;
    try {
      body = JSON.parse(e.postData.contents);
    } catch (err) {
      return respond_({ ok: false, error: 'invalid_json' });
    }

    if (!safeEquals_(String(body.secret || ''), secret)) {
      return respond_({ ok: false, error: 'unauthorized' });
    }

    var check = validate_(body, maxGuests);
    if (!check.ok) return respond_({ ok: false, error: 'invalid', errors: check.errors });
    var data = check.data;

    var cache = CacheService.getScriptCache();

    // Global brake against floods.
    var minuteKey = 'rate:' + Math.floor(Date.now() / 60000);
    var count = Number(cache.get(minuteKey) || 0);
    if (count >= THROTTLE.globalPerMinute) return respond_({ ok: false, error: 'rate_limited' });

    var lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) return respond_({ ok: false, error: 'busy' });

    try {
      var sheet = getSheet_();

      // Duplicate guard 1: the same submission retried (double tap, network retry).
      if (submissionExists_(sheet, data.submissionId)) {
        return respond_({ ok: true, duplicate: true });
      }

      // Duplicate guard 2: the same name sent again within a few seconds.
      var nameKey = 'name:' + Utilities.base64EncodeWebSafe(data.name.toLowerCase()).slice(0, 200);
      if (cache.get(nameKey)) return respond_({ ok: false, error: 'rate_limited' });

      sheet.appendRow([
        Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd HH:mm:ss'),
        neutralize_(data.name),
        ATTENDANCE_LABELS[data.attendance],
        data.guests,
        neutralize_(data.message),
        data.submissionId,
      ]);
      SpreadsheetApp.flush();

      cache.put(nameKey, '1', THROTTLE.sameNameSeconds);
      cache.put(minuteKey, String(count + 1), 120);
    } finally {
      lock.releaseLock();
    }

    return respond_({ ok: true });
  } catch (err) {
    console.error(err);
    return respond_({ ok: false, error: 'server_error' });
  }
}

/** Health check only. Never returns any RSVP data. */
function doGet() {
  return respond_({ status: 'ok' });
}

// ---------------------------------------------------------------------------

function validate_(body, maxGuests) {
  var errors = {};

  var name = clean_(body.name, false);
  if (name.length < LIMITS.nameMin) errors.name = 'Please enter your name.';
  else if (name.length > LIMITS.nameMax) errors.name = 'Name is too long.';

  var attendance = body.attendance;
  if (!ATTENDANCE_LABELS.hasOwnProperty(attendance)) errors.attendance = 'Invalid attendance.';

  var guests = 0;
  if (attendance === 'attending') {
    var n = Number(body.guests);
    if (!isFinite(n) || Math.floor(n) !== n || n < 1 || n > maxGuests) {
      errors.guests = 'Number of guests must be between 1 and ' + maxGuests + '.';
    } else {
      guests = n;
    }
  }

  var message = clean_(body.message, true);
  if (message.length > LIMITS.messageMax) errors.message = 'Message is too long.';

  var submissionId = String(body.submissionId || '');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(submissionId)) {
    errors.submissionId = 'Invalid submission.';
  }

  if (Object.keys(errors).length) return { ok: false, errors: errors };
  return {
    ok: true,
    data: { name: name, attendance: attendance, guests: guests, message: message, submissionId: submissionId },
  };
}

function clean_(value, multiline) {
  if (typeof value !== 'string') return '';
  var s = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  s = multiline
    ? s.replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n')
    : s.replace(/\s+/g, ' ');
  return s.trim();
}

/** Stop formula injection: values starting with = + - @ are stored as text. */
function neutralize_(value) {
  return /^[=+\-@\t\r]/.test(value) ? "'" + value : value;
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sheet;
}

function submissionExists_(sheet, submissionId) {
  if (sheet.getLastRow() < 2) return false;
  var range = sheet.getRange(2, 6, sheet.getLastRow() - 1, 1);
  return range.createTextFinder(submissionId).matchEntireCell(true).findNext() !== null;
}

function safeEquals_(a, b) {
  if (a.length !== b.length) return false;
  var diff = 0;
  for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function respond_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Run once from the editor to create the sheet header and grant permissions. */
function setup() {
  getSheet_();
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('SHARED_SECRET')) {
    props.setProperty('SHARED_SECRET', Utilities.getUuid() + Utilities.getUuid());
  }
  console.log('Sheet ready. SHARED_SECRET is set in Script Properties. Copy it to Vercel as RSVP_SHARED_SECRET.');
}
