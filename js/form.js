/**
 * AdRide — obsługa formularzy landing page (adride.pl)
 * 1. Zapis leada do aplikacji: https://app.adride.pl/api/leads (CORS)
 * 2. Tracking do apix-drive (no-cors, fire-and-forget) z pełnym
 *    zestawem parametrów: UTM, strona, timing, scroll, urządzenie, czas.
 */

var ADRIDE_API = 'https://app.adride.pl/api/leads';
var APIX_WEBHOOK = 'https://a1.apix-drive.com/web-hooks/15083/4pnjdpx6';

// ---------------------------------------------------------------------------
// Tracking — stan strony
// ---------------------------------------------------------------------------
var pageLoadedAt = Date.now();
var maxScrollDepth = 0;
var formStartTimes = {};

window.addEventListener('scroll', function () {
  var doc = document.documentElement;
  var scrollable = doc.scrollHeight - window.innerHeight;
  if (scrollable <= 0) return;
  var depth = Math.round((window.scrollY / scrollable) * 100);
  if (depth > maxScrollDepth) maxScrollDepth = Math.min(depth, 100);
}, { passive: true });

function getUtmParams() {
  var params = new URLSearchParams(window.location.search);
  var out = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (key) {
    var v = params.get(key);
    if (v) out[key] = v;
  });
  return out;
}

function browserName(ua) {
  if (/edg\//i.test(ua)) return 'Edge';
  if (/opr\//i.test(ua)) return 'Opera';
  if (/chrome/i.test(ua)) return 'Chrome';
  if (/safari/i.test(ua)) return 'Safari';
  if (/firefox/i.test(ua)) return 'Firefox';
  return 'Inna';
}

function osName(ua) {
  if (/windows/i.test(ua)) return 'Windows';
  if (/android/i.test(ua)) return 'Android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
  if (/mac os/i.test(ua)) return 'macOS';
  if (/linux/i.test(ua)) return 'Linux';
  return 'Inny';
}

/**
 * Wyślij dane formularza + parametry śledzenia do apix-drive.
 * Tryb no-cors — odpowiedź "opaque", wysyłka fire-and-forget,
 * nigdy nie blokuje głównego flow formularza.
 */
function sendToApixWebhook(formType, formData) {
  try {
    var now = Date.now();
    var ua = navigator.userAgent;
    var isMobile = /mobi|android|iphone|ipad/i.test(ua);
    var startedAt = formStartTimes[formType];
    var fillTimeSec = startedAt ? Math.round((now - startedAt) / 1000) : null;
    var navEntry = performance.getEntriesByType
      ? performance.getEntriesByType('navigation')[0]
      : null;
    var pageLoadMs = navEntry ? Math.round(navEntry.loadEventEnd - navEntry.startTime) : null;

    var payload = Object.assign(
      { form_type: formType },
      formData,
      getUtmParams(),
      {
        referrer: document.referrer || null,
        page_url: window.location.href,
        url_strony: window.location.href,
        page_load_time: pageLoadMs,
        czas_na_stronie: Math.round((now - pageLoadedAt) / 1000),
        form_fill_time: fillTimeSec,
        czas_wypelnienia_formularza: fillTimeSec,
        scroll_depth: maxScrollDepth,
        pozycja_scrolla: maxScrollDepth,
        device_type: isMobile ? 'mobile' : 'desktop',
        czy_mobile: isMobile,
        screen_resolution: window.screen.width + 'x' + window.screen.height,
        rozdzielczosc: window.screen.width + 'x' + window.screen.height,
        pixel_ratio: window.devicePixelRatio,
        user_agent: ua,
        przegladarka: browserName(ua),
        system: osName(ua),
        jezyk: navigator.language,
        timestamp: new Date().toISOString(),
        godzina_wyslania: new Date().toLocaleTimeString('pl-PL'),
        strefa_czasowa: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }
    );

    fetch(APIX_WEBHOOK, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(function () { /* tracking jest best-effort */ });
  } catch (e) { /* tracking nigdy nie psuje formularza */ }
}

// ---------------------------------------------------------------------------
// Formularze leadowe
// ---------------------------------------------------------------------------
function setupForm(formId, successId, formType) {
  var form = document.getElementById(formId);
  var success = document.getElementById(successId);
  if (!form || !success) return;

  // Zarejestruj początek wypełniania (pierwszy input)
  form.addEventListener('input', function () {
    if (!formStartTimes[formType]) formStartTimes[formType] = Date.now();
  }, { once: true });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    var formData = new FormData(form);
    var data = Object.fromEntries(formData);

    // 1. Tracking do apix-drive — zawsze, niezależnie od wyniku API
    sendToApixWebhook(formType, data);

    // 2. Zapis leada do aplikacji
    var payload = {
      email: data.email || '',
      company: data.company || null,
      phone: data.phone || null,
      districtId: mapDistrict(data.city || data.district || 'srodmiescie'),
      numVehicles: parseInt(data.vehicles) || 1,
      kmDailyPerVehicle: parseInt((data.km || '').split('-')[0]) || 100,
      months: parseInt(data.months) || 3,
      budgetMonthlyPLN: data.budget ? parseInt(data.budget) : null,
      impressionsTotal: 0,
    };

    try {
      var response = await fetch(ADRIDE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        form.style.display = 'none';
        success.style.display = 'block';
      } else {
        var err = await response.json().catch(function () { return {}; });
        alert('Błąd: ' + (err.error || 'Nie udało się wysłać formularza'));
      }
    } catch (error) {
      console.error('Form submission error:', error);
      alert('Błąd połączenia. Spróbuj ponownie.');
    }
  });
}

// Map Polish district names to districtId
function mapDistrict(value) {
  var districtMap = {
    'warszawa-centrum': 'srodmiescie',
    'warszawa-mokotow': 'mokotow',
    'warszawa-praga': 'praga',
    'warszawa-wola': 'wola',
    'warszawa-bielany': 'bielany',
    'okolice': 'srodmiescie',
    'mokotów': 'mokotow',
    'śródmieście': 'srodmiescie',
    'wola': 'wola',
    'praga-południe': 'praga',
    'ursynów': 'mokotow',
    'bielany': 'bielany',
    'bemowo': 'wola',
    'ochota': 'wola',
    'żoliborz': 'bielany',
    'targówek': 'praga',
    'wilanów': 'mokotow',
    'białołęka': 'praga',
  };
  return districtMap[(value || '').toLowerCase()] || 'srodmiescie';
}

setupForm('driver-form', 'driver-success', 'lead_kierowca');
setupForm('ad-form', 'ad-form-success', 'lead_reklamodawca');
