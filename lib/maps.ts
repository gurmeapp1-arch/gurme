// Anahtar gerektirmeyen Google Haritalar bağlantıları
const query = (name: string, district: string, address?: string | null) =>
  encodeURIComponent([name, address, district, "İstanbul"].filter(Boolean).join(", "));

export const mapsLink = (name: string, district: string, address?: string | null) =>
  `https://www.google.com/maps/search/?api=1&query=${query(name, district, address)}`;
