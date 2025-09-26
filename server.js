require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const SUPPORTED_LOCALES = ['nl', 'en'];
const DEFAULT_LOCALE = 'nl';

const translations = {
  nl: {
    brand: {
      name: 'Visit Booker',
      tagline: 'Een verfijnde planningservaring voor appartementbezoeken, op maat van jouw teams en bezoekers.'
    },
    nav: {
      admin: 'Admin',
      logout: 'Logout',
      login: 'Admin login'
    },
    footer: {
      made: 'Gemaakt met zorg door het team'
    },
    lang: {
      label: 'Taal',
      nl: 'Nederlands',
      en: 'English'
    },
    pageTitles: {
      bookVisit: 'Bezoek boeken',
      adminLogin: 'Admin login',
      admin: 'Admin'
    },
    index: {
      heading: 'Plan je bezoek',
      description: 'Selecteer een beschikbaar tijdsslot en vul je gegevens in. Elk slot duurt 20 minuten zodat iedereen voldoende tijd krijgt.',
      nameLabel: 'Naam',
      emailLabel: 'E-mail',
      phoneLabel: 'Telefoon',
      slotLabel: 'Tijdsslot',
      disabledHint: 'Je ziet enkel vrije slots. Kom later terug als het gewenste moment er niet bij staat.',
      noSlotsOption: 'Geen vrije slots beschikbaar',
      noSlotsAlert: 'Alle tijden zijn voorlopig geboekt. Probeer het later opnieuw of neem contact op met de beheerder.',
      availabilityHeading: 'Beschikbaarheid',
      availabilityDescription: 'Actuele slots gesorteerd op starttijd. Status wordt live bijgewerkt na elke boeking.',
      submit: 'Boeking bevestigen'
    },
    status: {
      free: 'Vrij',
      booked: 'Geboekt',
      selectFree: 'vrij',
      selectBooked: 'VOL'
    },
    table: {
      start: 'Start',
      end: 'Einde',
      status: 'Status',
      name: 'Naam',
      email: 'E-mail',
      phone: 'Tel',
      note: 'Notitie',
      actions: 'Acties'
    },
    adminLogin: {
      heading: 'Beheerder login',
      description: 'Toegang tot het admin-dashboard om slots aan te maken en boekingen te beheren.',
      username: 'Gebruikersnaam',
      password: 'Wachtwoord',
      submit: 'Inloggen'
    },
    adminDashboard: {
      heading: 'Beheer console',
      description: 'Maak nieuwe tijdssloten aan, beheer notities en boek indien nodig namens bezoekers. Alle acties worden meteen opgeslagen.',
      bulkHeading: 'Bulk tijdssloten aanmaken',
      bulkDescription: 'Kies een datum en interval. We maken automatisch alle slots tussen start- en eindtijd.',
      date: 'Datum',
      start: 'Startuur',
      end: 'Einduur',
      duration: 'Duur (minuten)',
      generate: 'Genereer slots',
      singleHeading: 'Enkel slot aanmaken',
      singleDescription: 'Handige optie als je een uitzonderlijk tijdstip wil toevoegen.',
      singleStart: 'Start (YYYY-MM-DDTHH:MM)',
      singleEnd: 'Einde (YYYY-MM-DDTHH:MM)',
      singleSubmit: 'Slot aanmaken',
      listHeading: 'Alle slots',
      listDescription: 'Bekijk status, notities en boek indien nodig namens bezoekers.',
      totalLabel: 'Totale slots',
      actionMenuTitle: 'Slot-acties',
      bookForVisitor: 'Boek namens bezoeker',
      bookExplanation: 'Boek namens bezoeker.',
      bookedBy: 'Geboekt door %{name}.',
      clearHint: 'Maak slot opnieuw vrij.',
      deleteHint: 'Verwijder slot definitief.',
      introHeading: 'Introductietekst bezoekerspagina',
      introDescription: 'Pas de boodschap aan die bezoekers bovenaan de boekingspagina zien.',
      introLabel: 'Tekst (%{language})',
      saveIntro: 'Intro opslaan'
    },
    placeholders: {
      name: 'Naam',
      email: 'E-mail',
      phone: 'Telefoon',
      note: 'Notitie',
      startIso: '2025-10-01T14:00',
      endIso: '2025-10-01T14:20'
    },
    buttons: {
      confirmBooking: 'Boeking bevestigen',
      bookSlot: 'Boek slot',
      saveNote: 'Opslaan',
      login: 'Inloggen',
      generate: 'Genereer slots',
      createSlot: 'Slot aanmaken',
      clearSlot: 'Vrijgeven',
      deleteSlot: 'Verwijderen'
    },
    flash: {
      fillAllFields: 'Gelieve alle velden in te vullen.',
      slotNotFound: 'Tijdsslot niet gevonden.',
      slotAlreadyBooked: 'Dit tijdsslot is al geboekt.',
      slotBookFailed: 'Kon slot niet boeken.',
      bookingConfirmed: 'Boeking bevestigd. Tot dan!',
      invalidLogin: 'Ongeldige inlog.',
      startEndRequired: 'Start en einde verplicht.',
      slotCreateFailed: 'Kon slot niet aanmaken.',
      slotExists: 'Slot bestond al.',
      slotCreated: 'Slot aangemaakt.',
      bulkRequired: 'Datum, start en einduur verplicht.',
      bulkFailed: 'Kon bulk slots niet aanmaken.',
      bulkSuccess: 'Aangemaakte slots: %{count}',
      noteSaveFailed: 'Kon notitie niet opslaan.',
      noteSaved: 'Notitie opgeslagen.',
      slotBooked: 'Slot geboekt.',
      clearFailed: 'Kon slot niet vrijgeven.',
      clearSuccess: 'Slot opnieuw vrijgegeven.',
      deleteRequiresClear: 'Slot is nog geboekt. Vrijgeven alvorens te verwijderen.',
      deleteFailed: 'Kon slot niet verwijderen.',
      deleteSuccess: 'Slot verwijderd.',
      introUpdated: 'Introductietekst bijgewerkt.',
      introUpdateFailed: 'Introductietekst kon niet bijgewerkt worden.'
    }
  },
  en: {
    brand: {
      name: 'Visit Booker',
      tagline: 'A refined scheduling experience for apartment visits tailored to your teams and guests.'
    },
    nav: {
      admin: 'Admin',
      logout: 'Logout',
      login: 'Admin login'
    },
    footer: {
      made: 'Crafted with care by the team'
    },
    lang: {
      label: 'Language',
      nl: 'Dutch',
      en: 'English'
    },
    pageTitles: {
      bookVisit: 'Book a visit',
      adminLogin: 'Admin login',
      admin: 'Admin'
    },
    index: {
      heading: 'Plan your visit',
      description: 'Select an available timeslot and fill in your details. Each slot lasts 20 minutes to give everyone enough time.',
      nameLabel: 'Name',
      emailLabel: 'Email',
      phoneLabel: 'Phone',
      slotLabel: 'Timeslot',
      disabledHint: 'Only free slots are shown. Check back later if your preferred time is missing.',
      noSlotsOption: 'No free slots available',
      noSlotsAlert: 'All times are currently booked. Try again later or contact the host.',
      availabilityHeading: 'Availability',
      availabilityDescription: 'Current slots sorted by start time. Status updates immediately after each booking.',
      submit: 'Confirm booking'
    },
    status: {
      free: 'Available',
      booked: 'Booked',
      selectFree: 'available',
      selectBooked: 'FULL'
    },
    table: {
      start: 'Start',
      end: 'End',
      status: 'Status',
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      note: 'Note',
      actions: 'Actions'
    },
    adminLogin: {
      heading: 'Admin login',
      description: 'Access the admin dashboard to create slots and manage bookings.',
      username: 'Username',
      password: 'Password',
      submit: 'Log in'
    },
    adminDashboard: {
      heading: 'Admin console',
      description: 'Create new timeslots, manage notes, and book on behalf of visitors if needed. Every action saves instantly.',
      bulkHeading: 'Create slots in bulk',
      bulkDescription: 'Pick a date and interval. We automatically create all slots between the start and end time.',
      date: 'Date',
      start: 'Start time',
      end: 'End time',
      duration: 'Duration (minutes)',
      generate: 'Generate slots',
      singleHeading: 'Create single slot',
      singleDescription: 'Handy when you need to add an exception.',
      singleStart: 'Start (YYYY-MM-DDTHH:MM)',
      singleEnd: 'End (YYYY-MM-DDTHH:MM)',
      singleSubmit: 'Create slot',
      listHeading: 'All slots',
      listDescription: 'Review status, notes, and book on behalf of visitors when needed.',
      totalLabel: 'Total slots',
      actionMenuTitle: 'Slot actions',
      bookForVisitor: 'Book on behalf of visitor',
      bookExplanation: 'Book on behalf of a visitor.',
      bookedBy: 'Booked by %{name}.',
      clearHint: 'Release the slot again.',
      deleteHint: 'Remove this slot permanently.',
      introHeading: 'Booking page intro',
      introDescription: 'Update the message visitors see at the top of the booking page.',
      introLabel: 'Text (%{language})',
      saveIntro: 'Save intro text'
    },
    placeholders: {
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      note: 'Note',
      startIso: '2025-10-01T14:00',
      endIso: '2025-10-01T14:20'
    },
    buttons: {
      confirmBooking: 'Confirm booking',
      bookSlot: 'Book slot',
      saveNote: 'Save',
      login: 'Log in',
      generate: 'Generate slots',
      createSlot: 'Create slot',
      clearSlot: 'Release',
      deleteSlot: 'Delete'
    },
    flash: {
      fillAllFields: 'Please fill in all fields.',
      slotNotFound: 'Timeslot not found.',
      slotAlreadyBooked: 'This timeslot has already been booked.',
      slotBookFailed: 'Could not book the slot.',
      bookingConfirmed: 'Booking confirmed. See you soon!',
      invalidLogin: 'Invalid login.',
      startEndRequired: 'Start and end are required.',
      slotCreateFailed: 'Could not create slot.',
      slotExists: 'Slot already existed.',
      slotCreated: 'Slot created.',
      bulkRequired: 'Date, start, and end time are required.',
      bulkFailed: 'Could not create bulk slots.',
      bulkSuccess: 'Created slots: %{count}',
      noteSaveFailed: 'Could not save note.',
      noteSaved: 'Note saved.',
      slotBooked: 'Slot booked.',
      clearFailed: 'Could not release slot.',
      clearSuccess: 'Slot released.',
      deleteRequiresClear: 'Slot is still booked. Release it before deleting.',
      deleteFailed: 'Could not delete slot.',
      deleteSuccess: 'Slot deleted.',
      introUpdated: 'Intro text updated.',
      introUpdateFailed: 'Could not update intro text.'
    }
  }
};

function translate(locale, key, vars = {}) {
  const localesToTry = [locale, 'en', DEFAULT_LOCALE].filter((loc, index, arr) => loc && arr.indexOf(loc) === index);
  let result;

  for (const loc of localesToTry) {
    const source = translations[loc];
    if (!source) continue;
    result = key.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), source);
    if (result !== undefined) break;
  }

  if (typeof result === 'string') {
    return result.replace(/%\{(.*?)\}/g, (_, token) => (vars[token] !== undefined ? vars[token] : ''));
  }

  if (result !== undefined) {
    return result;
  }

  return key;
}

const app = express();
const PORT = process.env.PORT || 3000;

// Security & parsing
const baseCspDirectives = {
  ...helmet.contentSecurityPolicy.getDefaultDirectives(),
  "script-src": ["'self'", 'https://cdn.tailwindcss.com'],
  "script-src-elem": ["'self'", 'https://cdn.tailwindcss.com']
};

app.use((req, res, next) => {
  res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...baseCspDirectives,
        "script-src": [...baseCspDirectives["script-src"], `\'nonce-${res.locals.cspNonce}\'`],
        "script-src-elem": [...baseCspDirectives["script-src-elem"], `\'nonce-${res.locals.cspNonce}\'`]
      }
    }
  })(req, res, next);
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Sessions
const sessionSecret = process.env.SESSION_SECRET || 'dev_secret_change_me';
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 } // 8h
}));

// Locale middleware
app.use((req, res, next) => {
  const cookieLang = req.cookies.lang;
  const locale = SUPPORTED_LOCALES.includes(cookieLang) ? cookieLang : DEFAULT_LOCALE;

  req.locale = locale;
  req.t = (key, vars) => translate(locale, key, vars);

  res.locals.locale = locale;
  res.locals.t = req.t;
  res.locals.availableLocales = SUPPORTED_LOCALES;

  next();
});

// Ensure data dir exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// DB setup
const db = new sqlite3.Database(path.join(dataDir, 'data.sqlite'));
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    note TEXT,
    booked_by_name TEXT,
    booked_by_email TEXT,
    booked_by_phone TEXT,
    created_by TEXT DEFAULT 'admin',
    created_at TEXT DEFAULT (datetime('now'))
  )`);
  db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_slots_start ON slots(start_time)`);
  db.run(`CREATE TABLE IF NOT EXISTS settings (
    key TEXT NOT NULL,
    locale TEXT NOT NULL,
    value TEXT NOT NULL,
    PRIMARY KEY (key, locale)
  )`);
});

// Flash helper via session
function setFlash(req, type, msg) {
  req.session.flash = { type, msg };
}
function getFlash(req) {
  const f = req.session.flash;
  delete req.session.flash;
  return f;
}

// Auth helpers
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'changeme';
async function verifyAdmin(username, password) {
  if (username !== ADMIN_USER) return false;
  // Hash each time for simplicity (env-based). In production, store a real hash.
  const hash = await bcrypt.hash(ADMIN_PASS, 10);
  return await bcrypt.compare(password, hash);
}
function requireAuth(req, res, next) {
  if (req.session && req.session.user === ADMIN_USER) return next();
  return res.redirect('/admin/login');
}

// Minimal EJS layout helper
app.use((req, res, next) => {

  res.locals.layout = function(view, params) {
    res.locals._layoutConfig = { view, params: params || {} };
  };

  res.render = function(view, options, callback) {
    const cb = typeof options === 'function' ? options : callback;
    const renderOptions = typeof options === 'function' ? {} : (options || {});

    res.locals._layoutConfig = null;

    const localsForView = { ...res.locals, ...renderOptions };
    localsForView.layout = localsForView.layout || res.locals.layout;

    const done = cb || ((err, html) => {
      if (err) return next(err);
      res.send(html);
    });

    req.app.render(view, localsForView, (err, viewHtml) => {
      if (err) {
        res.locals._layoutConfig = null;
        return done(err);
      }

      const layoutConfig = res.locals._layoutConfig;
      res.locals._layoutConfig = null;

      if (!layoutConfig) {
        return done(null, viewHtml);
      }

      const layoutView = layoutConfig.view || 'layout';
      const layoutLocals = {
        ...localsForView,
        ...layoutConfig.params,
        body: viewHtml
      };
      delete layoutLocals.layout;
      delete layoutLocals._layoutConfig;

      req.app.render(layoutView, layoutLocals, (layoutErr, layoutHtml) => {
        if (layoutErr) return done(layoutErr);
        done(null, layoutHtml);
      });
    });
  };

  next();
});

// Expose user & flash to views
app.use((req,res,next)=>{
  res.locals.user = req.session.user;
  res.locals.flash = getFlash(req);
  next();
});

// Language switcher
app.get('/lang/:locale', (req, res) => {
  const { locale } = req.params;
  if (!SUPPORTED_LOCALES.includes(locale)) {
    return res.redirect(req.get('Referer') || '/');
  }

  res.cookie('lang', locale, {
    maxAge: 1000 * 60 * 60 * 24 * 365,
    sameSite: 'lax'
  });

  const referer = req.get('Referer');
  const origin = `${req.protocol}://${req.get('host')}`;
  const redirectTo = referer && referer.startsWith(origin) ? referer : '/';
  res.redirect(redirectTo);
});

// Utilities
function addMinutesLocal(localIso, minutes) {
  // localIso: "YYYY-MM-DDTHH:MM" (interpreted as local time)
  const d = new Date(localIso);
  d.setMinutes(d.getMinutes() + minutes);
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  const hh = String(d.getHours()).padStart(2,'0');
  const mm = String(d.getMinutes()).padStart(2,'0');
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

// Routes: Public
app.get('/', (req, res) => {
  db.all(`SELECT * FROM slots ORDER BY start_time ASC`, [], (err, rows) => {
    if (err) return res.status(500).send('DB error');
    db.get(`SELECT value FROM settings WHERE key = ? AND locale = ?`, ['index.intro', req.locale], (settingErr, settingRow) => {
      const introText = (!settingErr && settingRow && settingRow.value) ? settingRow.value : req.t('index.description');
      res.render('index', { title: req.t('pageTitles.bookVisit'), slots: rows, introText });
    });
  });
});

app.post('/book', (req, res) => {
  const { name, email, phone, slot_id } = req.body;
  if (!name || !email || !phone || !slot_id) {
    setFlash(req, 'error', req.t('flash.fillAllFields'));
    return res.redirect('/');
  }
  db.get(`SELECT * FROM slots WHERE id = ?`, [slot_id], (err, slot) => {
    if (err || !slot) {
      setFlash(req, 'error', req.t('flash.slotNotFound'));
      return res.redirect('/');
    }
    if (slot.booked_by_name) {
      setFlash(req, 'error', req.t('flash.slotAlreadyBooked'));
      return res.redirect('/');
    }
    db.run(`UPDATE slots SET booked_by_name=?, booked_by_email=?, booked_by_phone=? WHERE id=?`,
      [name.trim(), email.trim().toLowerCase(), phone.trim(), slot_id],
      function(updErr){
        if (updErr) {
          setFlash(req, 'error', req.t('flash.slotBookFailed'));
          return res.redirect('/');
        }
        setFlash(req, 'ok', req.t('flash.bookingConfirmed'));
        return res.redirect('/');
      });
  });
});

// Routes: Admin auth
app.get('/admin/login', (req, res) => {
  if (req.session.user) return res.redirect('/admin');
  res.render('admin/login', { title: req.t('pageTitles.adminLogin') });
});
app.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;
  if (await verifyAdmin(username, password)) {
    req.session.user = ADMIN_USER;
    return res.redirect('/admin');
  }
  setFlash(req, 'error', req.t('flash.invalidLogin'));
  res.redirect('/admin/login');
});
app.get('/admin/logout', (req, res) => {
  req.session.destroy(()=> res.redirect('/'));
});

// Routes: Admin dashboard
app.get('/admin', requireAuth, (req, res) => {
  db.all(`SELECT * FROM slots ORDER BY start_time ASC`, [], (err, rows) => {
    if (err) return res.status(500).send('DB error');
    const introContent = {};
    SUPPORTED_LOCALES.forEach(locale => {
      introContent[locale] = translate(locale, 'index.description');
    });

    db.all(`SELECT locale, value FROM settings WHERE key = ?`, ['index.intro'], (settingsErr, settingRows) => {
      if (!settingsErr && Array.isArray(settingRows)) {
        settingRows.forEach(row => {
          if (row && row.locale && row.value) {
            introContent[row.locale] = row.value;
          }
        });
      }
      res.render('admin/dashboard', { title: req.t('pageTitles.admin'), slots: rows, introContent });
    });
  });
});

app.post('/admin/slots/create', requireAuth, (req, res) => {
  const { start_time, end_time } = req.body;
  if (!start_time || !end_time) { setFlash(req,'error',req.t('flash.startEndRequired')); return res.redirect('/admin'); }
  db.run(`INSERT OR IGNORE INTO slots (start_time, end_time, created_by) VALUES (?, ?, 'admin')`,
    [start_time, end_time],
    function(err){
      if (err) setFlash(req,'error',req.t('flash.slotCreateFailed'));
      else if (this.changes === 0) setFlash(req,'error',req.t('flash.slotExists'));
      else setFlash(req,'ok',req.t('flash.slotCreated'));
      return res.redirect('/admin');
    });
});

app.post('/admin/slots/bulk', requireAuth, (req, res) => {
  const { date, start, end, duration } = req.body;
  if (!date || !start || !end) { setFlash(req,'error',req.t('flash.bulkRequired')); return res.redirect('/admin'); }
  const dur = Math.max(5, parseInt(duration||'20',10));

  let cursor = `${date}T${start}`;
  const endIso = `${date}T${end}`;
  const inserts = [];

  while (new Date(cursor) < new Date(endIso)) {
    const next = addMinutesLocal(cursor, dur);
    if (new Date(next) > new Date(endIso)) break;
    inserts.push([cursor, next]);
    cursor = next;
  }

  const stmt = db.prepare(`INSERT OR IGNORE INTO slots (start_time, end_time, created_by) VALUES (?, ?, 'admin')`);
  db.serialize(()=>{
    db.run('BEGIN TRANSACTION');
    for (const [s,e] of inserts) {
      stmt.run([s,e]);
    }
    db.run('COMMIT', (err)=>{
      stmt.finalize();
      if (err) setFlash(req,'error',req.t('flash.bulkFailed'));
      else setFlash(req,'ok',req.t('flash.bulkSuccess', { count: inserts.length }));
      res.redirect('/admin');
    });
  });
});

app.post('/admin/slot/:id/note', requireAuth, (req, res) => {
  const { id } = req.params;
  const { note } = req.body;
  db.run(`UPDATE slots SET note=? WHERE id=?`, [note || '', id], function(err){
    if (err) setFlash(req,'error',req.t('flash.noteSaveFailed'));
    else setFlash(req,'ok',req.t('flash.noteSaved'));
    res.redirect('/admin');
  });
});

app.post('/admin/slot/:id/book', requireAuth, (req, res) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;
  db.get(`SELECT * FROM slots WHERE id=?`, [id], (err, slot) => {
    if (err || !slot) { setFlash(req,'error',req.t('flash.slotNotFound')); return res.redirect('/admin'); }
    if (slot.booked_by_name) { setFlash(req,'error',req.t('flash.slotAlreadyBooked')); return res.redirect('/admin'); }
    db.run(`UPDATE slots SET booked_by_name=?, booked_by_email=?, booked_by_phone=? WHERE id=?`,
      [name.trim(), (email||'').trim().toLowerCase(), (phone||'').trim(), id],
      function(updErr){
        if (updErr) setFlash(req,'error',req.t('flash.slotBookFailed'));
        else setFlash(req,'ok',req.t('flash.slotBooked'));
        res.redirect('/admin');
      });
  });
});

app.post('/admin/slot/:id/clear', requireAuth, (req, res) => {
  const { id } = req.params;
  db.run(`UPDATE slots SET booked_by_name = NULL, booked_by_email = NULL, booked_by_phone = NULL WHERE id = ?`, [id], function(err){
    if (err) setFlash(req,'error',req.t('flash.clearFailed'));
    else if (this.changes === 0) setFlash(req,'error',req.t('flash.slotNotFound'));
    else setFlash(req,'ok',req.t('flash.clearSuccess'));
    res.redirect('/admin');
  });
});

app.post('/admin/slot/:id/delete', requireAuth, (req, res) => {
  const { id } = req.params;
  db.get(`SELECT * FROM slots WHERE id = ?`, [id], (err, slot) => {
    if (err || !slot) {
      setFlash(req, 'error', req.t('flash.slotNotFound'));
      return res.redirect('/admin');
    }
    if (slot.booked_by_name) {
      setFlash(req, 'error', req.t('flash.deleteRequiresClear'));
      return res.redirect('/admin');
    }
    db.run(`DELETE FROM slots WHERE id = ?`, [id], function(delErr) {
      if (delErr) setFlash(req, 'error', req.t('flash.deleteFailed'));
      else setFlash(req, 'ok', req.t('flash.deleteSuccess'));
      res.redirect('/admin');
    });
  });
});

app.post('/admin/settings/intro', requireAuth, (req, res) => {
  const entries = SUPPORTED_LOCALES.map(locale => ({
    locale,
    value: (req.body[`intro_${locale}`] || '').trim()
  }));

  if (entries.length === 0) {
    setFlash(req, 'error', req.t('flash.introUpdateFailed'));
    return res.redirect('/admin');
  }

  let pending = entries.length;
  let encounteredError = false;

  const finalize = () => {
    if (encounteredError) setFlash(req, 'error', req.t('flash.introUpdateFailed'));
    else setFlash(req, 'ok', req.t('flash.introUpdated'));
    res.redirect('/admin');
  };

  entries.forEach(({ locale, value }) => {
    if (value) {
      db.run(
        `INSERT INTO settings (key, locale, value) VALUES (?, ?, ?) ON CONFLICT(key, locale) DO UPDATE SET value = excluded.value`,
        ['index.intro', locale, value],
        err => {
          if (err) encounteredError = true;
          if (--pending === 0) finalize();
        }
      );
    } else {
      db.run(
        `DELETE FROM settings WHERE key = ? AND locale = ?`,
        ['index.intro', locale],
        err => {
          if (err) encounteredError = true;
          if (--pending === 0) finalize();
        }
      );
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
