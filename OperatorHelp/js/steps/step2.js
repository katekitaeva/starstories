// Шаг 2. Что произошло: сводка шага 1, хронология, статус, темы обращения.
// Справочник тем и правила выбора читаются из приватного operator-data (derived/claim-types.json, derived/theme-rules.md).

import { $, val, copyText, copyBtn, deepseekLink, linkOrCopy } from "../ui.js";
import { ticketUrl, orderUrl } from "../crm.js";
import { state, save } from "../state.js";
import { goTo, onRender } from "../nav.js";
import { parseAnswer, LABELS2 } from "../parser.js";
import { ghGet, conn } from "../github.js";
import { THEMES_PATH, THEME_RULES_PATH } from "../config.js";

// значок (DR) при сравнении путей не учитывается: DeepSeek может его опустить
const norm = x => x.toLowerCase().replace(/\s*\(dr\)/g, "").replace(/\s+/g, " ").trim();
let TYPES = [], TYPE_MAP = {}, TYPE_LINES = [], SOURCE = null, RULES = "", RULES_DATE = "";
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
  rows.forEach(([label, id]) => {
    const v = val(id);
    if (!v) return;
    add(label, id === "ticket" ? linkOrCopy(v, ticketUrl(v)) : id === "order" ? linkOrCopy(v, orderUrl(v)) : copyBtn(v));
  });
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
  renderThemeOrder();
}

/* Номер заказа рядом с темами: оператор переносит в тикет и то и другое */
function renderThemeOrder() {
  const slot = $("theme-order"), o = val("order");
  slot.textContent = "";
  if (!o) return;
  slot.append("Заказ для тикета: ", linkOrCopy(o, orderUrl(o)));
}

/* ---------- Справочник тем (3 уровня) ---------- */
function indexTypes(nodes, prefix, hidden = false) {
  nodes.forEach(n => {
    const path = [...prefix, n.name].join(" > ");
    const leaf = !(n.children && n.children.length);
    const skip = hidden || n.prompt === false;           // темы 3-й линии и «ЧС на объекте» DeepSeek не предлагаем
    TYPE_MAP[norm(path)] = { path, comment: n.comment || "", dr: !!n.dr, bind: n.bind || null, leaf, hidden: n.prompt === false };
    if (leaf && !skip) TYPE_LINES.push(path + (n.comment ? " — подсказка: " + n.comment : ""));
    if (!leaf && !skip && n.comment) TYPE_LINES.push("Направление «" + n.name + "»: " + n.comment);
    indexTypes(n.children || [], [...prefix, n.name], skip);
  });
}

/* Подсказка о привязке под выбранной темой: что привязывать к тикету */
const BIND_LABEL = { order: "заказ", package: "упаковка", item: "позиция", comment: "комментарий", promo: "ID акции" };
function bindLine(info) {
  if (!info) return null;
  const box = document.createElement("small");
  box.className = "tbind";
  if (info.hidden && info.comment) box.append(info.comment.replace(/[.\s]+$/, "") + ". ");
  if (info.dr) box.append("DR: привяжите все заказы и упаковки, по которым есть проблема. ");
  if (info.bind) {
    const keys = Object.keys(BIND_LABEL).filter(k => info.bind[k] && info.bind[k] !== "off");
    if (keys.length) {
      box.append("Привязка: ");
      keys.forEach((k, i) => {
        if (i) box.append(", ");
        box.append(BIND_LABEL[k]);
        // номер заказа с шага 1 стоит прямо в строке, следом иконка копирования (там, где привязка заказа не отключена)
        if (k === "order" && val("order")) { box.append(" "); box.append(linkOrCopy(val("order"), orderUrl(val("order")))); }
        box.append(" — " + (info.bind[k] === "req" ? "обязательно" : k === "comment" ? "по желанию" : "если есть"));
      });
    }
  }
  return box.childNodes.length ? box : null;
}

/* Голубая плашка с обоснованием DeepSeek под темой */
const SVG_NS = "http://www.w3.org/2000/svg";
function whyPlate(text) {
  const d = document.createElement("div");
  d.className = "why";
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "i"); svg.setAttribute("aria-hidden", "true"); svg.setAttribute("focusable", "false");
  const use = document.createElementNS(SVG_NS, "use");
  use.setAttribute("href", "assets/icons.svg#i-info");
  svg.append(use);
  const span = document.createElement("span"), b = document.createElement("b");
  b.textContent = "Обоснование DeepSeek: ";
  span.append(b, text);
  d.append(svg, span);
  return d;
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
const connected = () => { const c = conn(); return !!(c && c.token); };

function renderThemeSource() {
  $("theme-source").textContent = SOURCE && SOURCE.pageDate ? "Справочник тем от " + SOURCE.pageDate + "." : "";
}

async function loadTypes() {
  TYPES = []; TYPE_MAP = {}; TYPE_LINES = []; SOURCE = null;
  const hint = $("theme-hint");
  try {
    if (!connected()) throw new Error("нет подключения к operator-data");
    const data = JSON.parse(await ghGet(THEMES_PATH));
    TYPES = data.types || []; SOURCE = data.source || null;
    indexTypes(TYPES, []);
    hint.textContent = "";
  } catch (e) {
    hint.textContent = connected()
      ? "Справочник тем не загружен (" + e.message + "). Проверьте подключение к operator-data; темы можно вписывать вручную."
      : "Справочник тем лежит в operator-data: подключитесь через шестерёнку вверху. Пока темы можно вписывать вручную.";
  }
  sels.forEach(s => { s.value = ""; });
  for (let k = 0; k < 3; k++) fillLevel(k);
  renderThemeSource();
  // темы, уже добавленные раньше: сверить с загруженным справочником
  if (TYPES.length) {
    state.themes.forEach(t => { const hit = TYPE_MAP[norm(t.path)]; t.unknown = !hit; if (hit) t.path = hit.path; });
    save();
  }
}

async function loadRules() {
  RULES = ""; RULES_DATE = "";
  if (!connected()) return;
  try {
    const raw = await ghGet(THEME_RULES_PATH);
    const fm = raw.match(/^---\n([\s\S]*?)\n---\n/);
    RULES_DATE = (fm && (fm[1].match(/^pageDate: (.*)$/m) || [])[1]) || "";
    RULES = (fm ? raw.slice(fm[0].length) : raw).trim();
  } catch (e) { RULES = ""; }
}

/* ---------- Выбранные темы ---------- */
function addTheme(path, status, note) {
  const hit = TYPE_MAP[norm(path)];
  const p = hit ? hit.path : path;
  const ex = state.themes.find(t => norm(t.path) === norm(p));
  if (ex) { if (note && !ex.note) ex.note = note; return; }
  state.themes.push({ path: p, status, note: note || "", unknown: TYPES.length > 0 && !hit });
}
export function renderThemes() {
  const ul = $("theme-list");
  ul.innerHTML = "";
  state.themes.forEach((t, i) => {
    const li = document.createElement("li");
    const body = document.createElement("div");
    body.className = "tbody";
    const name = document.createElement("span");
    name.textContent = t.path + (t.unknown ? " ⚠️ нет в списке" : "");
    body.append(name);
    if (t.note) body.append(whyPlate(t.note));
    const line = bindLine(TYPE_MAP[norm(t.path)]);
    if (line) body.append(line);
    const st = document.createElement("select");
    st.add(new Option("в тикете", "в тикете")); st.add(new Option("добавляю я", "добавляю"));
    st.value = t.status;
    st.addEventListener("change", () => { t.status = st.value; save(); });
    const del = document.createElement("button");
    del.type = "button"; del.className = "x"; del.textContent = "✕"; del.setAttribute("aria-label", "Убрать тему");
    del.addEventListener("click", () => { state.themes.splice(i, 1); save(); renderThemes(); });
    li.append(body, st, del);
    ul.appendChild(li);
  });
}

/* ---------- Инициализация ---------- */
export function initStep2() {
  onRender(2, renderSummary);
  onRender(2, renderThemes);

  sels.forEach((s, i) => s.addEventListener("change", () => {
    for (let k = i + 1; k < 3; k++) fillLevel(k);
    $("theme-hint").textContent = picked().comment ? "Подсказка: " + picked().comment : "";
  }));

  $("add-theme").addEventListener("click", () => {
    const path = val("theme-manual") || picked().path;
    if (!path) return;
    const hit = TYPE_MAP[norm(path)];
    if (hit && !hit.leaf) { $("theme-hint").textContent = "Выберите тему до конца: направление, категорию и тему (третий список)."; return; }
    addTheme(path, "добавляю", "");
    $("theme-manual").value = "";
    sels[0].value = ""; for (let k = 1; k < 3; k++) fillLevel(k);
    $("theme-hint").textContent = "";
    save(); renderThemes();
  });

  // промт step002 (публичный шаблон) подгружается вместе со справочником и правилами из operator-data
  let prompt2Tpl = "";
  const tplReady = fetch("prompts/step002.md", { cache: "no-store" })
    .then(r => { if (!r.ok) throw new Error(r.status); return r.text(); })
    .then(t => { prompt2Tpl = t; })
    .catch(() => {});
  const rulesBlock = () => RULES ? "ПРАВИЛА ВЫБОРА ТЕМ" + (RULES_DATE ? " (инструкция «Правила выбора тем обращений», " + RULES_DATE + ")" : "") + "\n" + RULES : "";
  // {{ПРАВИЛА}} в шаблоне необязателен: без него правила и список тем вставляются на место {{ТИПЫ}}
  const buildPrompt2 = () => {
    if (!TYPE_LINES.length) return prompt2Tpl.replace("{{ПРАВИЛА}}", "").replace("{{ТИПЫ}}", "(список тем не загружен)");
    const list = TYPE_LINES.join("\n");
    if (prompt2Tpl.includes("{{ПРАВИЛА}}")) return prompt2Tpl.replace("{{ПРАВИЛА}}", rulesBlock()).replace("{{ТИПЫ}}", list);
    const head = "СПИСОК ТЕМ (выбирайте только из него; пишите путь целиком, как в списке; значок (DR) входит в название)\n";
    return prompt2Tpl.replace("{{ТИПЫ}}", (RULES ? rulesBlock() + "\n\n" : "") + head + list);
  };
  let ready = Promise.resolve();
  const loadAll = () => {
    ready = Promise.all([loadTypes(), loadRules(), tplReady]).then(() => {
      if (prompt2Tpl) $("prompt2-text").textContent = buildPrompt2();
      renderThemes();
    });
    return ready;
  };
  loadAll();
  document.addEventListener("operator:changed", loadAll);   // подключили или забыли токен: перечитать справочник

  $("copy-prompt2").addEventListener("click", async () => {
    await ready;
    const st = $("prompt2-state");
    if (!prompt2Tpl) { st.textContent = "Не удалось загрузить prompts/step002.md. Откройте страницу через GitHub Pages."; return; }
    const ok = await copyText(buildPrompt2());
    st.textContent = !ok ? "Не удалось скопировать ⚠️" :
      !TYPE_LINES.length ? "Скопирован без списка тем ⚠️ (справочник не загружен: подключитесь к operator-data)" :
      !RULES ? "Скопирован без правил выбора тем ⚠️ (derived/theme-rules.md не найден)" : "Промт скопирован ✅";
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
        addTheme(parts[0], /тикет/i.test(parts[1] || "") ? "в тикете" : "добавляю", parts.slice(2).join(" | ").trim());
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
