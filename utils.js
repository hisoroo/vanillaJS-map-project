import L from "leaflet";

export function generateId() {
  const currentTime = Date.now();
  const randomComponent = Math.floor(Math.random() * 10000);
  return (currentTime + randomComponent).toString().slice(-10);
}

export class CustomIcon extends L.Icon {
  constructor(iconUrl) {
    super({
      iconSize: [40, 40],
      iconAnchor: [21, 39],
      popupAnchor: [0, -40],
      iconUrl,
    });
  }
}

export function generateRandomColor() {
  let randomColor;
  do {
    randomColor = Math.floor(Math.random() * 16777215).toString(16);
    // Upewnij się, że kolor ma 6 znaków
    randomColor = randomColor.padStart(6, "0");
  } while (isColorTooLight(randomColor));
  return `#${randomColor}`;
}

function isColorTooLight(color) {
  // Konwertuj kolor z formatu hex na wartości RGB
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  // Oblicz jasność koloru
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  // Zwróć true, jeśli jasność jest większa niż 200 (wartość progowa)
  return brightness > 200;
}
