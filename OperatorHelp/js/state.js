// Единое состояние формы и его сохранение в localStorage.
// current и themes лежат в объекте state: модули не могут переприсваивать чужие let.

import { FIELDS, CHECKS, STORAGE_KEY } from "./config.js";

export const state = { current: 1, themes: [] };

export function save() {
  try {
    const data = { current: state.current, themes: state.themes, checks: {} };
    CHECKS.forEach(c => data.checks[c] = document.getElementById(c).checked);
    FIELDS.forEach(f => data[f] = document.getElementById(f).value);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) { console.warn("save():", e); }
}

export function load() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!data) return;
    FIELDS.forEach(f => { if (data[f]) document.getElementById(f).value = data[f]; });
    state.current = data.current || 1;
    state.themes = data.themes || [];
    CHECKS.forEach(c => { if (data.checks && data.checks[c]) document.getElementById(c).checked = true; });
  } catch (e) { console.warn("load():", e); }
}
