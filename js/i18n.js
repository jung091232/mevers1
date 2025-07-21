
function setLanguage(lang) {
  const currentLang = localStorage.getItem("lang");
  if (currentLang === lang) return;
  localStorage.setItem("lang", lang);
  document.documentElement.setAttribute("lang", lang);
  window.location.reload();
}

async function applyTranslation(lang) {
  const response = await fetch(`lang/${lang}.json`);
  const translations = await response.json();
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (translations[key]) {
      el.innerText = translations[key];
    }
  });

  const select = document.querySelector("select");
  if (select) {
    select.value = lang;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const lang = localStorage.getItem("lang") || "en";
  applyTranslation(lang);
  document.documentElement.setAttribute("lang", lang);
});
