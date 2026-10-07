// Загрузка сохранённого кейса через модальное окно

import { $ } from "./ui.js";
import { conn, ghGet } from "./github.js";
import { loadCaseIntoForm } from "./cases.js";
import { renderThemes, renderSummary } from "./steps/step2.js";
import { renderVerdict } from "./steps/step3.js";
import { renderPreview } from "./steps/step5.js";
import { updateClientUrlMsg } from "./steps/step1.js";
import { updPh } from "./steps/step4.js";
import { render, goTo } from "./nav.js";

let casesList = [];

export function initCaseLoader() {
  const btn = $("load-case-btn");
  const modal = $("case-modal");
  const closeBtn = $("modal-close");
  const searchInput = $("modal-search");
  const listEl = $("modal-case-list");

  if (!btn || !modal) return;

  const closeModal = () => { modal.hidden = true; };
  const openModal = async () => {
    modal.hidden = false;
    listEl.innerHTML = '<li class="hint" style="padding:10px;">Загружаю архив кейсов…</li>';
    const c = conn();
    if (!c || !c.token) {
      listEl.innerHTML = '<li class="hint er" style="padding:10px;color:var(--er);">Сначала подключитесь к operator-data через шестерёнку (⚙) вверху страницы.</li>';
      return;
    }
    try {
      const raw = await ghGet("cases/manifest.json");
      const data = JSON.parse(raw);
      casesList = data.cases || [];
      renderModalList();
    } catch (e) {
      listEl.innerHTML = `<li class="hint" style="padding:10px;line-height:1.4;">Не удалось прочитать cases/manifest.json (${e.message}). Убедитесь, что архив кейсов инициализирован в репозитории.</li>`;
    }
  };

  function renderModalList() {
    const q = (searchInput.value || "").toLowerCase().trim();
    const filtered = casesList.filter(c => {
      if (!q) return true;
      const hay = [
        c.ticket || "",
        c.order || "",
        c.title || "",
        c.problem || "",
        ...(c.themes || []).map(t => typeof t === "string" ? t : (t.path || ""))
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });

    if (!filtered.length) {
      listEl.innerHTML = '<li class="hint" style="padding:10px;">Кейсов по вашему запросу не найдено.</li>';
      return;
    }

    listEl.innerHTML = "";
    filtered.forEach(c => {
      const li = document.createElement("li");
      li.className = "modal-item";
      const title = c.title ? `«${c.title}»` : (c.ticket ? "Тикет #" + c.ticket : (c.order ? "Заказ " + c.order : "Кейс"));
      const date = c.date || "—";
      const problem = (c.problem || "").slice(0, 80) + (c.problem && c.problem.length > 80 ? "…" : "");

      li.innerHTML = `
        <div class="modal-item-top">
          <span>${title}</span>
          <span class="hint" style="font-size:11px;">${date}</span>
        </div>
        <div class="modal-item-sub">${problem || "Без описания проблемы"}</div>
      `;

      li.addEventListener("click", async () => {
        closeModal();
        let fullCard = c;
        if (c.file) {
          try {
            const rawFile = await ghGet(`cases/${c.file}`);
            fullCard = { ...c, ...JSON.parse(rawFile) };
          } catch (err) {
            console.warn("Could not fetch full card from file, using manifest item:", err);
          }
        }
        loadCaseIntoForm(fullCard, c.file);
        renderSummary();
        renderThemes();
        renderVerdict();
        updPh();
        updateClientUrlMsg();
        render();
        renderPreview();
        goTo(5);
      });

      listEl.appendChild(li);
    });
  }

  btn.addEventListener("click", openModal);
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
  if (searchInput) {
    searchInput.addEventListener("input", renderModalList);
  }
}
