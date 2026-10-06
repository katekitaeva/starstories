// Ссылки на CRM. Адрес CRM в публичном коде не хранится: оператор вставляет адрес карточки клиента
// (шаг 1), страница берёт из него хост и идентификатор клиента, хост запоминает в этом браузере.

import { CRM_TABS } from "./config.js";

const KEY = "operator-crm";
const field = () => document.getElementById("client-url");

/** Разбор адреса карточки: { origin, clientId|null } или null, если это не адрес http(s). */
export function parseClientUrl(raw) {
  try {
    const u = new URL((raw || "").trim());
    if (!/^https?:$/.test(u.protocol)) return null;
    const m = u.pathname.match(/\/clients\/([^/?#]+)/);
    return { origin: u.origin, clientId: m ? decodeURIComponent(m[1]) : null };
  } catch (e) { return null; }
}

export function rememberOrigin(origin) { try { localStorage.setItem(KEY, JSON.stringify({ origin })); } catch (e) {} }
export function savedOrigin() { try { return (JSON.parse(localStorage.getItem(KEY) || "null") || {}).origin || null; } catch (e) { return null; } }

/** Хост берётся из поля, а если поле пустое, из запомненного в браузере. Идентификатор клиента только из поля. */
export function crmContext() {
  const ref = parseClientUrl(field() ? field().value : "");
  return { origin: (ref && ref.origin) || savedOrigin(), clientId: ref ? ref.clientId : null };
}

export function ticketUrl(n) {
  const { origin } = crmContext();
  return origin && /^\d+$/.test(n) ? `${origin}/tickets/${n}` : null;
}
export function orderUrl(n) {
  const { origin, clientId } = crmContext();
  return origin && clientId && /^[\d-]+$/.test(n) ? `${origin}/clients/${encodeURIComponent(clientId)}/orders/${n}` : null;
}
/** Вкладки карточки клиента: [[название, адрес], …] или null, если нет хоста или идентификатора клиента. */
export function tabUrls() {
  const { origin, clientId } = crmContext();
  if (!origin || !clientId) return null;
  const base = `${origin}/clients/${encodeURIComponent(clientId)}`;
  return CRM_TABS.map(([name, path]) => [name, path ? `${base}/${path}` : base]);
}
