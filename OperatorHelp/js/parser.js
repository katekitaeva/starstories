// Разбор ответов DeepSeek по меткам «МЕТКА: значение». Чистая функция, без DOM.

export const LABELS = { "ЗАКАЗ": "order", "ПРОБЛЕМА": "problem", "ТРЕБОВАНИЕ": "demand", "ИЗМЕНЕНИЕ": "changed",
                        "ЮРИДИЧЕСКОЕ": "legal", "КОНТАКТЫ": "contacts", "ЗАДАЧИ": "tasks" };      // шаг 1
export const NAMES = { order: "заказ", problem: "проблема", demand: "требование", changed: "изменение",
                       legal: "юридическое", contacts: "контакты", tasks: "задачи" };
export const LABELS2 = { "ХРОНОЛОГИЯ": "chrono", "СТАТУС": "status", "ТЕМЫ": "themes" };          // шаг 2
export const LABELS4 = { "ЧЕКЛИСТ": "check", "СООБЩЕНИЕ": "reply", "КОММЕНТАРИЙ": "comment" };      // шаг 4
const STRIP_QUOTE = ["problem", "demand", "changed", "legal"];

export function parseAnswer(text, labels = LABELS, keepBlank = false) {
  const raw = {}; let key = null;
  text.split(/\r?\n/).forEach(l => {
    const line = l.replace(/\*+/g, "").trim();
    const m = line.replace(/^\d+[.)]\s*/, "").match(/^([A-Za-zА-Яа-яЁё]+)\s*:\s*(.*)$/);
    const field = m && labels[m[1].toUpperCase()];
    if (field) { key = field; raw[key] = m[2] ? [m[2]] : []; }
    else if (key && (line || keepBlank)) raw[key].push(line);
  });
  const res = {};
  for (const k in raw) {
    let v = raw[k].join("\n").trim();
    if (STRIP_QUOTE.includes(k)) v = v.replace(/\s*[—–-]\s*[«"„“].*$/s, "").trim();
    if (k === "order") { const n = v.match(/\d[\d-]{4,}\d/); if (n) v = n[0]; }
    if (!v || /^не найден/i.test(v)) continue;
    res[k] = v;
  }
  return res;
}
