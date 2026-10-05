// Мелкие DOM-помощники и копирование в буфер. Без знания о шагах.

export const $ = id => document.getElementById(id);
export const val = id => $(id).value.trim();
export const num = id => { const v = $(id).value.trim(); return v === "" ? null : Number(v); };

export async function copyText(text, icon) {
  let ok = false;
  try {
    await navigator.clipboard.writeText(text);
    ok = true;
  } catch (e) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { ok = document.execCommand("copy"); } catch (e2) {}
    ta.remove();
  }
  if (icon) {
    icon.textContent = ok ? " ✅" : " ⚠️";
    setTimeout(() => { icon.textContent = " 📋"; }, 1500);
  }
  return ok;
}

export function copyBtn(text) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "copy";
  b.title = "Нажмите, чтобы скопировать";
  const t = document.createElement("span");
  t.textContent = text;
  const icon = document.createElement("span");
  icon.textContent = " 📋";
  b.append(t, icon);
  b.addEventListener("click", () => copyText(text, icon));
  return b;
}

export function deepseekLink(url) {
  const a = document.createElement("a");
  a.href = url; a.target = "_blank"; a.rel = "noopener";
  const img = document.createElement("img");
  img.src = "https://chat.deepseek.com/favicon.ico";
  img.alt = ""; img.width = 16; img.height = 16;
  img.style.cssText = "vertical-align:-3px;margin-right:6px";
  img.onerror = () => img.replaceWith(document.createTextNode("🐳 "));
  a.append(img, "Чат DeepSeek");
  return a;
}
