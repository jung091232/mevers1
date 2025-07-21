
document.addEventListener("DOMContentLoaded", function () {
  // Load external components referenced via data-include attributes
  const includePromises = Array.from(document.querySelectorAll('[data-include]')).map(async function (el) {
    const file = el.getAttribute('data-include');
    const res = await fetch(file);
    if (res.ok) {
      el.innerHTML = await res.text();
    }
  });
  Promise.all(includePromises).then(() => {
    // After all includes loaded, apply the saved language or default to English
    const savedLang = localStorage.getItem('language') || 'en';
    if (typeof setLanguage === 'function') {
      setLanguage(savedLang);
    }
  });
});
