function setupForm(formId, successId) {
  const form = document.getElementById(formId);
  const success = document.getElementById(successId);
  if (!form || !success) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    form.style.display = 'none';
    success.style.display = 'block';
  });
}

setupForm('driver-form', 'driver-success');
setupForm('ad-form', 'ad-form-success');
