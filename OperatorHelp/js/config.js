// Константы и справочники. Здесь нет логики и обращений к DOM.

export const TOTAL = 6;         // шагов по структуре формы: 1 прочитать, 2 что произошло, 3 контекст клиента,
                                // 4 выбор инструкций (ещё не собран), 5 решение и тексты, 6 запись кейса (за границами MVP)
export const STEP_COUNT = 4;    // секций, которые уже есть на странице (растёт по мере сборки шагов 4–6)

export const STORAGE_KEY = "claim-guide";
export const CONN_KEY = "operator-conn";

// Поля (value), которые сохраняются в localStorage и восстанавливаются при загрузке
export const FIELDS = ["ticket", "order", "problem", "demand", "changed", "legal", "contacts", "tasks", "chatlink", "answer", "chrono", "status", "answer2", "c-acc", "c-orders", "c-cancels", "c-returns", "c-sum", "c-status", "client-url", "answer4", "out-check", "out-reply", "out-comment"];
// Чекбоксы (checked), которые сохраняются так же
export const CHECKS = ["k1", "k2", "l1", "l2", "l3", "l4"];

// Инструкция «Памятка» (Loyalty team): основание критериев шага 3
export const MEMO_URL = "https://customer-support-help.o3t.ru/instrukcii-vydelennyh-grupp/instrukciya-dlya-vydelennoi-gruppy-loyalty-team/problemy-i-resheniya/pamyatka";

// Вкладки карточки клиента в CRM: [название, путь после /clients/<клиент>]. Адрес вкладки «Клиент» не подтверждён.
export const CRM_TABS = [
  ["Клиент", ""], ["Коммуникации", "communications"], ["Заказы", "orders"], ["Озон Доставка", "ozon-delivery"],
  ["Возвраты и арбитражи", "returns-arbitrations"], ["Баланс", "balance"], ["CTASK", "ctask"],
  ["Комментарии", "comments"], ["Отзывы", "reviews"], ["Premium", "loyalty"]
];

// Страницы инструкций Loyalty для промта шага 4 (путь внутри operator-data/cache/pages/)
export const LOY = "instrukcii-vydelennyh-grupp/instrukciya-dlya-vydelennoi-gruppy-loyalty-team/";
export const DOCS = [
  { id: "schema", title: "Общая схема", path: LOY + "problemy-i-resheniya/obshchaya-shema" },
  { id: "memo", title: "Памятка", path: LOY + "problemy-i-resheniya/pamyatka" },
  { id: "examples", title: "Примеры индивидуальных решений", path: LOY + "problemy-i-resheniya/primery-individualnyh-reshenii" },
  { id: "accruals", title: "Начисления", path: LOY + "problemy-i-resheniya/nachisleniya" },
  { id: "tov", title: "Tone of Voice Loyalty", path: LOY + "mehanika-raboty-na-aktivnostyah/tone-of-voice-loyalty1" }
];
