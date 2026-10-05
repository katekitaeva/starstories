// Константы и справочники. Здесь нет логики и обращений к DOM.

export const TOTAL = 10;        // сегментов в полоске прогресса (как в исходнике)
export const STEP_COUNT = 4;    // реально существующих шагов на странице

export const STORAGE_KEY = "claim-guide";
export const CONN_KEY = "operator-conn";

// Поля (value), которые сохраняются в localStorage и восстанавливаются при загрузке
export const FIELDS = ["ticket", "order", "problem", "demand", "changed", "legal", "contacts", "tasks", "chatlink", "answer", "chrono", "status", "answer2", "c-acc", "c-ret", "c-can", "c-sum", "c-status", "answer4", "out-check", "out-reply", "out-comment"];
// Чекбоксы (checked), которые сохраняются так же
export const CHECKS = ["k1", "k2", "k3", "l1", "l2", "l3", "l4"];

// Страницы инструкций Loyalty для промта шага 4 (путь внутри operator-data/cache/pages/)
export const LOY = "instrukcii-vydelennyh-grupp/instrukciya-dlya-vydelennoi-gruppy-loyalty-team/";
export const DOCS = [
  { id: "schema", title: "Общая схема", path: LOY + "problemy-i-resheniya/obshchaya-shema" },
  { id: "memo", title: "Памятка", path: LOY + "problemy-i-resheniya/pamyatka" },
  { id: "examples", title: "Примеры индивидуальных решений", path: LOY + "problemy-i-resheniya/primery-individualnyh-reshenii" },
  { id: "accruals", title: "Начисления", path: LOY + "problemy-i-resheniya/nachisleniya" },
  { id: "tov", title: "Tone of Voice Loyalty", path: LOY + "mehanika-raboty-na-aktivnostyah/tone-of-voice-loyalty1" }
];
