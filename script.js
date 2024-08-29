import L from "leaflet";

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(function success(position) {
    const { latitude, longitude } = position.coords;

    const map = L.map("map").setView([latitude, longitude], 13);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    L.marker([latitude, longitude])
      .addTo(map)
      .bindPopup("You are here")
      .openPopup();
  }, function error() {
    console.log("Unable to retrieve your location");
  });
}
