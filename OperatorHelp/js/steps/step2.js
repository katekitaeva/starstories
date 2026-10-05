// Шаг 2. Что произошло: сводка шага 1, хронология, статус, темы обращения (промт step002 + data/claim-types.json).

import { $, val, copyText, copyBtn, deepseekLink } from "../ui.js";
import { state, save } from "../state.js";
import { goTo, onRender } from "../nav.js";
import { parseAnswer, LABELS2 } from "../parser.js";

const norm = x => x.toLowerCase().replace(/\s+/g, " ").trim();
let TYPES = [], TYPE_MAP = {}, TYPE_LINES = [];
const sels = ["t1", "t2", "t3"].map(id => document.getElementById(id));

/* ---------- Сводка шага 1 ---------- */
export function renderSummary() {
  const box = $("sum-card");
  box.textContent = "";
  const rows = [["Тикет", "ticket"], ["Заказ", "order"], ["Проблема", "problem"], ["Требование", "demand"],
                ["Менялось позже", "changed"], ["Юридические упоминания", "legal"], ["Контакты", "contacts"], ["Задачи", "tasks"]];
  const add = (label, node) => {
    const r = document.createElement("div"); r.className = "srow";
    const l = document.createElement("span"); l.className = "slabel"; l.textContent = label;
    r.append(l, node); box.appendChild(r);
  };
  rows.forEach(([label, id]) => { const v = val(id); if (v) add(label, copyBtn(v)); });
  const link = val("chatlink");
  if (/^https?:\/\//i.test(link)) add("Чат DeepSeek", deepseekLink(link));
  const slot = $("chat-link-slot");
  const phrase = "в тот же чат DeepSeek, где вы разбирали претензию";
  slot.textContent = "";
  if (/^https?:\/\//i.test(link)) {
    const a = document.createElement("a");
    a.href = link; a.target = "_blank"; a.rel = "noopener"; a.textContent = phrase;
    slot.appendChild(a);
  } else slot.textContent = phrase;
}

/* ---------- Справочник тем (3 уровня) ---------- */
function indexTypes(nodes, prefix) {
  nodes.forEach(n => {
    const path = [...prefix, n.name].join(" > ");
    TYPE_MAP[norm(path)] = { path, comment: n.comment || "" };
    TYPE_LINES.push(path + (n.comment ? " — подсказка: " + n.comment : ""));
    indexTypes(n.children || [], [...prefix, n.name]);
  });
}
function levelList(k) {
  let list = TYPES;
  for (let j = 0; j < k; j++) { const v = sels[j].value; if (v === "") return []; list = list[+v].children || []; }
  return list;
}
function fillLevel(k) {
  const s = sels[k], list = levelList(k);
  s.innerHTML = "";
  s.add(new Option(["Тип", "Подтип", "Уточнение"][k] + "…", ""));
  list.forEach((n, i) => s.add(new Option(n.name, i)));
  s.hidden = !list.length;
}
function picked() {
  const names = []; let list = TYPES, comment = "";
  for (const s of sels) {
    if (s.value === "") break;
    const n = list[+s.value]; names.push(n.name);
    if (n.comment) comment = n.comment;
    list = n.children || [];
  }
  return { path: names.join(" > "), comment };
}
async function loadTypes() {
  try {
    const r = await fetch("data/claim-types.json", { cache: "no-store" });
    if (!r.ok) throw new Error(r.status);
    TYPES = (await r.json()).types || [];
    indexTypes(TYPES, []);
    fillLevel(0);
  } catch (e) {
    $("theme-hint").textContent = "Список тем не загружен (data/claim-types.json). Темы можно вписывать вручную.";
    sels[0].hidden = true;
  }
}

/* ---------- Выбранные темы ---------- */
function addTheme(path, status, note) {
  const hit = TYPE_MAP[norm(path)];
  const p = hit ? hit.path : path;
  if (state.themes.some(t => norm(t.path) === norm(p))) return;
  state.themes.push({ path: p, status, note: note || "", unknown: TYPES.length > 0 && !hit });
}
export function renderThemes() {
  const ul = $("theme-list");
  ul.innerHTML = "";
  state.themes.forEach((t, i) => {
    const li = document.createElement("li");
    const name = document.createElement("span");
    name.textContent = t.path + (t.unknown ? " ⚠️ нет в списке" : "");
    if (t.note) name.title = t.note;
    const st = document.createElement("select");
    st.add(new Option("в тикете", "в тикете")); st.add(new Option("добавляю я", "добавляю"));
    st.value = t.status;
    st.addEventListener("change", () => { t.status = st.value; save(); });
    const del = document.createElement("button");
    del.type = "button"; del.className = "x"; del.textContent = "✕"; del.setAttribute("aria-label", "Убрать тему");
    del.addEventListener("click", () => { state.themes.splice(i, 1); save(); renderThemes(); });
    li.append(name, st, del);
    ul.appendChild(li);
  });
}

/* ---------- Инициализация ---------- */
export function initStep2() {
  onRender(2, renderSummary);

  sels.forEach((s, i) => s.addEventListener("change", () => {
    for (let k = i + 1; k < 3; k++) fillLevel(k);
    $("theme-hint").textContent = picked().comment ? "Подсказка: " + picked().comment : "";
  }));

  $("add-theme").addEventListener("click", () => {
    const path = val("theme-manual") || picked().path;
    if (!path) return;
    addTheme(path, "добавляю", "");
    $("theme-manual").value = "";
    sels[0].value = ""; for (let k = 1; k < 3; k++) fillLevel(k);
    $("theme-hint").textContent = "";
    save(); renderThemes();
  });

  // промт step002 подгружается вместе со списком тем
  let prompt2Tpl = "";
  const typesReady = loadTypes();
  const prompt2Ready = fetch("prompts/step002.md", { cache: "no-store" })
    .then(r => { if (!r.ok) throw new Error(r.status); return r.text(); })
    .then(t => { prompt2Tpl = t; })
    .catch(() => {});
  const buildPrompt2 = () => prompt2Tpl.replace("{{ТИПЫ}}", TYPE_LINES.length ? TYPE_LINES.join("\n") : "(список тем не загружен)");
  Promise.all([typesReady, prompt2Ready]).then(() => {
    if (prompt2Tpl) $("prompt2-text").textContent = buildPrompt2();
  });

  $("copy-prompt2").addEventListener("click", async () => {
    await Promise.all([typesReady, prompt2Ready]);
    const st = $("prompt2-state");
    if (!prompt2Tpl) { st.textContent = "Не удалось загрузить prompts/step002.md. Откройте страницу через GitHub Pages."; return; }
    const ok = await copyText(buildPrompt2());
    st.textContent = ok ? (TYPE_LINES.length ? "Промт скопирован ✅" : "Скопирован без списка тем ⚠️ (data/claim-types.json не загружен)") : "Не удалось скопировать ⚠️";
    setTimeout(() => { st.textContent = ""; }, 3500);
  });

  $("parse2").addEventListener("click", () => {
    const msg = $("parse2-msg");
    const res = parseAnswer($("answer2").value, LABELS2);
    if (!Object.keys(res).length) {
      msg.textContent = "Не нашёл меток ХРОНОЛОГИЯ:, СТАТУС:, ТЕМЫ:. Вставьте ответ DeepSeek целиком.";
      return;
    }
    const done = [];
    if (res.chrono) { $("chrono").value = res.chrono; done.push("хронология"); }
    if (res.status) { $("status").value = res.status; done.push("статус"); }
    let unknown = 0;
    if (res.themes) {
      res.themes.split("\n").forEach(line => {
        const parts = line.replace(/^[-•]\s*/, "").split("|").map(x => x.trim());
        if (!parts[0]) return;
        addTheme(parts[0], /тикет/i.test(parts[1] || "") ? "в тикете" : "добавляю", parts[2] || "");
      });
      state.themes.forEach(t => { if (t.unknown) unknown++; });
      renderThemes(); done.push("темы");
    }
    msg.textContent = "Заполнено: " + done.join(", ") + "." + (unknown ? " Тем вне списка: " + unknown + " (отмечены ⚠️), проверьте." : "");
    $("helper2").open = false;
    save();
  });

  $("next-2").addEventListener("click", () => {
    const err = $("err-2");
    const bad = [];
    ["chrono", "status"].forEach(id => {
      const el = $(id), empty = !el.value.trim();
      el.classList.toggle("invalid", empty);
      if (empty) bad.push(id === "chrono" ? "хронологию" : "статус");
    });
    if (!state.themes.length) bad.push("хотя бы одну тему");
    if (bad.length) { err.textContent = "Заполните: " + bad.join(", ") + "."; return; }
    err.textContent = "";
    goTo(3);
  });
}
