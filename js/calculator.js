const districtEl = document.getElementById('calc-district');
const monthsEl = document.getElementById('calc-months');
const vehiclesEl = document.getElementById('calc-vehicles');
const vehiclesValEl = document.getElementById('vehicles-val');
const packageEl = document.getElementById('calc-package');

const resKm = document.getElementById('res-km');
const resDistricts = document.getElementById('res-districts');
const resDaily = document.getElementById('res-daily');

const KM_PER_VEHICLE_PER_MONTH = 1800;
const CONTACTS_PER_KM = 24;

function districtsLabel(v) {
  if (v === 1) return '2–3';
  if (v <= 2) return '3–4';
  if (v <= 4) return '4–6';
  if (v <= 6) return '5–8';
  return '7–12';
}

function fmt(n) {
  return n.toLocaleString('pl-PL');
}

function calculate() {
  const vehicles = parseInt(vehiclesEl.value, 10);
  const months = parseInt(monthsEl.value, 10);

  const totalKm = vehicles * KM_PER_VEHICLE_PER_MONTH * months;
  const dailyKm = vehicles * (KM_PER_VEHICLE_PER_MONTH / 30);
  const daily = Math.round(dailyKm * CONTACTS_PER_KM);

  resKm.textContent = fmt(totalKm);
  resDistricts.textContent = districtsLabel(vehicles);
  resDaily.textContent = fmt(daily);
  vehiclesValEl.textContent = vehicles;
}

packageEl?.addEventListener('change', function () {
  if (this.value === 'start') {
    vehiclesEl.value = 1;
    monthsEl.value = 3;
  } else if (this.value === 'scale') {
    vehiclesEl.value = 3;
    monthsEl.value = 6;
  }
  calculate();
});

vehiclesEl?.addEventListener('input', calculate);
monthsEl?.addEventListener('change', calculate);
districtEl?.addEventListener('change', calculate);

calculate();
