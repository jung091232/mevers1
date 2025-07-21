
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

    // Set up mobile navigation toggle after the nav component has been injected.
    // On smaller screens a hamburger icon is shown. When tapped it shows or
    // hides the associated menu. We check for both the toggle button and
    // menu; if present we attach a click handler. Without this handler the
    // mobile menu would never open on pages that load nav.html dynamically.
    const toggle = document.querySelector('.mobile-menu-toggle');
    const menu = document.querySelector('.mobile-menu');
    if (toggle && menu) {
      toggle.addEventListener('click', () => {
        const current = getComputedStyle(menu).display;
        if (current !== 'none') {
          menu.style.display = 'none';
        } else {
          menu.style.display = 'flex';
          // ensure items stack vertically when opened
          menu.style.flexDirection = 'column';
        }
      });
    }
  });
});
