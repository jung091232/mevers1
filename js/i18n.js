// Return the translation value for a key.  Keys may be provided in two
// formats: either flat (e.g. "staking.hero_title") or nested (e.g.
// { staking: { hero_title: "..." } }).  We first try a flat lookup and
// then fall back to a nested lookup.
function getValueFromNestedKey(obj, key) {
  if (obj[key] !== undefined) {
    return obj[key];
  }
  return key.split('.').reduce((o, k) => (o || {})[k], obj);
}

/**
 * Apply translations for the given language.
 *
 * This helper fetches the appropriate JSON file (lang/{lang}.json),
 * persists the selected language in localStorage and then applies
 * translated strings to any elements using the `data-i18n` attribute.
 *
 * It also supports translating placeholder text via the
 * `data-i18n-placeholder` attribute.  When found, the element's
 * `placeholder` property will be replaced with the corresponding value
 * from the translation file.
 *
 * @param {string} lang ISO language code (e.g. "en", "kr", "ja").
 */
function setLanguage(lang) {
  // Persist the selected language so it can be restored on subsequent page loads
  localStorage.setItem('language', lang);
  // Fetch the translation file for the chosen language
  fetch(`lang/${lang}.json`)
    .then(response => response.json())
    .then(translations => {
      // Apply innerHTML translations
      document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const value = getValueFromNestedKey(translations, key);
        if (value !== undefined) {
          element.innerHTML = value;
        }
      });
      // Apply placeholder translations (e.g. for input elements)
      document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        const value = getValueFromNestedKey(translations, key);
        if (value !== undefined) {
          element.setAttribute('placeholder', value);
        }
      });
    });
}

/**
 * Retrieve the previously selected language from storage.  Defaults to
 * English ("en") if no language has been saved.
 *
 * @returns {string} The saved language code.
 */
function getSavedLanguage() {
  return localStorage.getItem('language') || 'en';
}
