
window.onload = function() {
  loadLanguage();
};

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll('[data-include]').forEach(async function (el) {
    const file = el.getAttribute("data-include");
    const res = await fetch(file);
    if (res.ok) {
  el.innerHTML = await res.text();
  const lang = localStorage.getItem("lang") || "en";
  applyTranslation(lang);
}
  });
});
