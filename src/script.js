// Enkel state / util
const qs = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function persist(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
}
function readPersist(key, fallback = null) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch (e) { return fallback; }
}

// År i footer
qs('#year').textContent = new Date().getFullYear();

// Tema-hantering
const themeBtn = qs('#themeToggle');
const savedTheme = readPersist('theme');
if (savedTheme) {
  document.documentElement.dataset.theme = savedTheme;
  themeBtn.setAttribute('aria-pressed', savedTheme === 'dark' ? 'true' : 'false');
}

// Växla tema
themeBtn.addEventListener('click', () => {
  const current = document.documentElement.dataset.theme;
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = next;
  persist('theme', next);
  themeBtn.setAttribute('aria-pressed', next === 'dark' ? 'true' : 'false');
});

// Form för e-postnotifiering – med Formspree backend
const form = qs('#notifyForm');
const emailInput = qs('#emailInput');
const formMessage = qs('#formMessage');
const submitBtn = form.querySelector('button[type="submit"]');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = emailInput.value.trim();
  
  if (!email) {
    showMessage('Fyll i en e-postadress.', true);
    return;
  }
  if (!validateEmail(email)) {
    showMessage('Ogiltig e-postadress.', true);
    return;
  }

  // Visa laddningstillstånd
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Skickar...';
  submitBtn.disabled = true;

  try {
    // Skicka till Formspree (ersätt YOUR_FORM_ID med ditt Formspree form-ID)
    const response = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email,
        _subject: 'Ny lanseringsanmälan - Ekonomiappen.se',
        timestamp: new Date().toISOString()
      })
    });

    if (response.ok) {
      // Spara även lokalt som backup
      const existing = readPersist('notifyList', []);
      if (!existing.includes(email)) {
        existing.push(email);
        persist('notifyList', existing);
      }
      showMessage('Tack! Du är nu med på lanseringslistan.');
      form.reset();
    } else {
      throw new Error('Serverfel');
    }
  } catch (error) {
    // Fallback: spara endast lokalt om nätverk misslyckas
    console.error('Form submission error:', error);
    const existing = readPersist('notifyList', []);
    if (!existing.includes(email)) {
      existing.push(email);
      persist('notifyList', existing);
      showMessage('Tillfälligt nätverksfel – din e-post sparades lokalt.');
      form.reset();
    } else {
      showMessage('Ett fel uppstod. Försök igen senare.', true);
    }
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
});

function validateEmail(str) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

function showMessage(msg, isError = false) {
  formMessage.textContent = msg;
  formMessage.style.color = isError ? 'var(--danger)' : 'var(--accent)';
}

// Lokal påminnelse med Notification API (om tillgängligt) + fallback
const reminderBtn = qs('#reminderBtn');
const reminderMsg = qs('#reminderMsg');

reminderBtn.addEventListener('click', async () => {
  // Sätt en "påminnelse" 5 sek senare i demo
  const delayMs = 5000;
  reminderMsg.textContent = 'Påminnelse schemalagd (demo, 5 sek)...';

  setTimeout(async () => {
    if ('Notification' in window) {
      let perm = Notification.permission;
      if (perm === 'default') {
        perm = await Notification.requestPermission();
      }
      if (perm === 'granted') {
        new Notification('Ekonomiappen.se', {
          body: 'Vi kommer snart! Tack för ditt intresse.',
          tag: 'ekonomiappen-launch',
        });
      } else {
        reminderMsg.textContent = 'Notiser blockerade. Påminnelse visas här istället.';
      }
    }
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      reminderMsg.textContent = 'Påminnelse: Ekonomiappen.se lanseras snart!';
    } else {
      reminderMsg.textContent = 'Notis skickad.';
    }
  }, delayMs);
});

// IntersectionObserver för sektioner
const animateTargets = qsa('[data-animate]');
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReduced && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

  animateTargets.forEach(el => observer.observe(el));
} else {
  animateTargets.forEach(el => el.classList.add('visible'));
}

// Accessibilitetsförbättring: hoppa till main vid laddning om hash
window.addEventListener('load', () => {
  if (location.hash === '#main') {
    qs('#main').focus();
  }
});

// Enkel "progressiv mätning" (endast i minnet)
const perf = window.performance;
if (perf && perf.mark) {
  perf.mark('landing_loaded');
  setTimeout(() => {
    perf.measure('interactive_delay', 'landing_loaded');
    const measures = perf.getEntriesByName('interactive_delay');
    if (measures[0]) {
      console.log('Interaktiv fördröjning (ms):', measures[0].duration.toFixed(2));
    }
  }, 0);
}