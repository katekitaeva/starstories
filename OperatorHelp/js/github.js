// Подключение к приватному репозиторию operator-data (токен хранится в localStorage браузера).

import { CONN_KEY } from "./config.js";
import { $, val } from "./ui.js";

export function conn() { try { return JSON.parse(localStorage.getItem(CONN_KEY) || "null"); } catch (e) { return null; } }

export async function ghGet(path) {
  const c = conn();
  if (!c || !c.token) throw new Error("нет подключения к operator-data");
  const url = "https://api.github.com/repos/" + encodeURIComponent(c.owner) + "/" + encodeURIComponent(c.repo) +
    "/contents/" + path.split("/").map(encodeURIComponent).join("/") + "?ref=" + encodeURIComponent(c.branch || "main");
  const r = await fetch(url, { headers: { Authorization: "Bearer " + c.token, Accept: "application/vnd.github.raw+json" }, cache: "no-store" });
  if (!r.ok) throw new Error(r.status + " " + path);
  return r.text();
}

export function connSummary() {
  const c = conn();
  const bd = $("conn-sum"), on = !!(c && c.token);
  bd.textContent = on ? "подключено: " + c.owner + "/" + c.repo + " (" + (c.branch || "main") + ")" : "не подключено";
  bd.className = "sync-badge " + (on ? "ok" : "off");
  if (c) { $("c-owner").value = c.owner || ""; $("c-repo").value = c.repo || "operator-data"; $("c-branch").value = c.branch || "main"; }
}

export function initConnection() {
  // шестерёнка в шапке открывает и закрывает панель настроек
  $("settingsBtn").addEventListener("click", () => $("conn").classList.toggle("open"));
  $("c-save").addEventListener("click", async () => {
    const c = { owner: val("c-owner"), repo: val("c-repo") || "operator-data", branch: val("c-branch") || "main", token: $("c-token").value.trim() };
    const msg = $("c-msg");
    if (!c.owner || !c.token) { msg.textContent = "Заполните владельца и токен."; return; }
    try { localStorage.setItem(CONN_KEY, JSON.stringify(c)); } catch (e) {}
    $("c-token").value = "";
    try {
      const m = JSON.parse(await ghGet("cache/manifest.json"));
      msg.textContent = "Подключено. Страниц в кэше: " + Object.keys(m.pages).length;
      $("conn").classList.remove("open");
    } catch (e) { msg.textContent = "Не удалось прочитать cache/manifest.json (" + e.message + "). Проверьте логин, репозиторий и права токена."; }
    connSummary();
    document.dispatchEvent(new CustomEvent("operator:changed"));
  });
  $("c-forget").addEventListener("click", () => {
    try { localStorage.removeItem(CONN_KEY); } catch (e) {}
    connSummary(); $("c-msg").textContent = "Токен удалён из браузера.";
    document.dispatchEvent(new CustomEvent("operator:changed"));
  });
}
