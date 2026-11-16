// Ziyaretçinin hangi bağlantıdan geldiğini (?kaynak=qr gibi) tarayıcıda saklar
const KEY = "gurme_kaynak";

export function captureSource() {
  try {
    const k = new URLSearchParams(window.location.search).get("kaynak");
    if (k) localStorage.setItem(KEY, k.slice(0, 40));
  } catch {
    /* sessiz geç */
  }
}

export function readSource(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}
