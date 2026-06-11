function setupForm(formId, successId, apiEndpoint) {
  const form = document.getElementById(formId);
  const success = document.getElementById(successId);
  if (!form || !success) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    // Map form fields to API payload
    const payload = {
      email: data.email || '',
      company: data.company || null,
      phone: data.phone || null,
      // districtId: map from select values or use default
      districtId: mapDistrict(data.city || data.district || 'srodmiescie'),
      numVehicles: parseInt(data.vehicles) || 1,
      kmDailyPerVehicle: parseInt(data.km?.split('-')[0]) || 100,
      months: parseInt(data.months) || 3,
      budgetMonthlyPLN: data.budget ? parseInt(data.budget) : null,
      impressionsTotal: 0,
    };

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        form.style.display = 'none';
        success.style.display = 'block';
      } else {
        const err = await response.json().catch(() => ({}));
        alert(`Błąd: ${err.error || 'Nie udało się wysłać formularza'}`);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      alert('Błąd połączenia. Spróbuj ponownie.');
    }
  });
}

// Map Polish district names to districtId
function mapDistrict(value) {
  const districtMap = {
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
  return districtMap[value?.toLowerCase()] || 'srodmiescie';
}

setupForm('driver-form', 'driver-success', '/api/leads');
setupForm('ad-form', 'ad-form-success', '/api/leads');
