// Шаг 1. Прочитать претензию: разбор ответа DeepSeek (промт step001) и проверка обязательных полей.

import { $, copyText } from "../ui.js";
import { save } from "../state.js";
import { goTo } from "../nav.js";
import { parseAnswer, NAMES } from "../parser.js";

let promptText = "";

export async function loadPrompt() {
  const st = $("prompt-state");
  try {
    const r = await fetch("prompts/step001.md", { cache: "no-store" });
    if (!r.ok) throw new Error(r.status);
    promptText = await r.text();
    $("prompt-text").textContent = promptText;
  } catch (e) {
    st.textContent = "Не удалось загрузить prompts/step001.md. Откройте страницу через GitHub Pages, а не файлом с диска.";
  }
}

export function initStep1() {
  $("next-1").addEventListener("click", () => {
    const err = $("err-1");
    const required = ["ticket", "order", "demand"];
    let empty = false;
    required.forEach(id => {
      const el = $(id);
      const bad = !el.value.trim();
      el.classList.toggle("invalid", bad);
      if (bad) empty = true;
    });
    if (empty) {
      err.textContent = "Заполните номер тикета, номер заказа и требование клиента.";
      return;
    }
    err.textContent = "";
    goTo(2);
  });

  $("parse").addEventListener("click", () => {
    const msg = $("parse-msg");
    const res = parseAnswer($("answer").value);
    const got = Object.keys(res);
    if (!got.length) {
      msg.textContent = "Не нашёл меток ЗАКАЗ:, ПРОБЛЕМА:, ТРЕБОВАНИЕ: и других. Вставьте ответ DeepSeek целиком.";
      return;
    }
    got.forEach(k => { const el = $(k); el.value = res[k]; el.classList.remove("invalid"); });
    const miss = Object.keys(NAMES).filter(k => !(k in res)).map(k => NAMES[k]);
    msg.textContent = "Заполнено: " + got.map(k => NAMES[k]).join(", ") + "." +
      (miss.length ? " Не найдено: " + miss.join(", ") + "." : "") + " Номер тикета впишите сами.";
    $("helper").open = false;
    save();
  });

  $("copy-prompt").addEventListener("click", async () => {
    if (!promptText) await loadPrompt();
    if (!promptText) return;
    const ok = await copyText(promptText);
    const st = $("prompt-state");
    st.textContent = ok ? "Промт скопирован ✅" : "Не удалось скопировать ⚠️";
    setTimeout(() => { st.textContent = ""; }, 2000);
  });
}
