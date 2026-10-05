// Точка входа: подключает шаги и запускает страницу.
// Порядок в конце файла повторяет исходный монолит.

import { FIELDS, CHECKS } from "./config.js";
import { state, save, load } from "./state.js";
import { $ } from "./ui.js";
import { render, initNav } from "./nav.js";
import { connSummary, initConnection } from "./github.js";
import { initStep1, loadPrompt } from "./steps/step1.js";
import { initStep2, renderThemes } from "./steps/step2.js";
import { initStep3 } from "./steps/step3.js";
import { initStep4, updPh } from "./steps/step4.js";

initNav();
initStep1();
initStep2();
initStep3();
initStep4();
initConnection();

// автосохранение всех полей
FIELDS.forEach(f => $(f).addEventListener("input", save));

// «Начать новую претензию»
$("reset").addEventListener("click", () => {
  if (!confirm("Очистить все поля и начать заново?")) return;
  FIELDS.forEach(f => $(f).value = "");
  CHECKS.forEach(c => $(c).checked = false);
  state.current = 1; state.themes = [];
  renderThemes(); save(); render();
  window.scrollTo(0, 0);
});

connSummary();
loadPrompt();
load(); renderThemes(); render(); updPh();
