"use strict";

import L from "leaflet";
import "leaflet-routing-machine";
import { CustomIcon, generateId, generateRandomColor } from "./utils.js";
import { metTableForRunning, metTableForCycling } from "./MET.js";

const userSettingsButton = document.querySelector(".user-settings");
const modal = document.getElementById("userModal");
const modalCloseButton = document.getElementsByClassName("close")[0];
const modalSaveButton = document.getElementById("saveUser");
const addWorkoutButton = document.querySelector(".add-workout");
const workoutList = document.querySelector(".workout-list");

const users = [];
const workouts = [];

class User {
  constructor(name, age, weight, height) {
    this.name = name;
    this.age = age;
    this.weight = weight;
    this.height = height;
    this.id = generateId();
    this.workouts = [];
  }
}

class App {
  #map;
  #defaultMapZoom = 13;
  #markerSwitch = true;
  #routes = [];
  #currentRoute = {};
  #routeId = generateId();
  #canAddMarkers = false;

  constructor() {
    this._getCurrentPosition();
    this._initEventHandlers();
  }

  _initEventHandlers() {
    userSettingsButton.addEventListener("click", (e) => {
      e.stopPropagation();
      modal.style.display = "flex";
    });

    modalCloseButton.addEventListener("click", this._closeModal.bind(this));

    window.addEventListener("click", (event) => {
      if (event.target == modal) this._closeModal();
    });

    modalSaveButton.addEventListener("click", this._saveUser.bind(this));

    document.addEventListener("keydown", (event) => {
      if (modal.style.display === "flex" && event.key === "Enter") {
        this._saveUser();
      }
    });

    addWorkoutButton.addEventListener("click", () => {
      addWorkoutButton.style.display = "none";
      this._chooseWorkout();
    });
  }

  _showLoadingAnimation() {
    const loadingAnimation = document.getElementById('loading-animation');
    if (loadingAnimation) {
      loadingAnimation.style.display = 'flex';
    }
  }

  _hideLoadingAnimation() {
    const loadingAnimation = document.getElementById('loading-animation');
    if (loadingAnimation) {
      loadingAnimation.classList.add('fade-out');
      setTimeout(() => {
        loadingAnimation.style.display = 'none';
      }, 1000); // Match the duration of the fade-out transition
    }
  }

  _getCurrentPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._initMap.bind(this),
        function error() {
          alert("Couldn't get your location");
        }
      );
    }
  }

  _initMap(position) {
    const { latitude, longitude } = position.coords;
    this._hideLoadingAnimation();
    this.#map = L.map("map").setView(
      [latitude, longitude],
      this.#defaultMapZoom
    );
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(this.#map);

    this.#map.on("click", (e) => {
      if (this.#canAddMarkers) {
        this._handleMapClick(e);
      } else {
        console.log("Cannot add markers. Click 'Add Workout' first.");
      }
    });
  }

  _handleMapClick(e) {
    this._addMarker(e.latlng);
    if (!this.#markerSwitch) {
      this.#currentRoute = {
        ...this.#currentRoute,
        id: this.#routeId++,
        start: e.latlng,
      };
    } else {
      this.#currentRoute.end = e.latlng;
      this._drawRoute(this.#currentRoute);
    }
  }

  _addMarker(coords) {
    const { lat, lng } = coords;
    const markerIcon = this.#markerSwitch
      ? new CustomIcon("marker_white.svg")
      : new CustomIcon("marker_black.svg");
    L.marker([lat, lng], { icon: markerIcon })
      .addTo(this.#map)
      .bindPopup(
        (this.#markerSwitch ? "Departure " : "Destination ") +
          `<br>Latitude: ${lat.toFixed(2)}<br>Longitude: ${lng.toFixed(2)}`
      );

    this._toggleMarkerSwitch();
  }

  _drawRoute(route) {
    const start = route.start;
    const end = route.end;

    const routingControl = L.Routing.control({
      waypoints: [start, end],
      router: L.Routing.osrmv1({
        serviceUrl: "https://router.project-osrm.org/route/v1",
        profile: "foot",
      }),
      createMarker: function () {
        return null;
      },
      lineOptions: {
        styles: [{ color: generateRandomColor(), opacity: 0.4, weight: 4 }],
      },
      show: false,
      showAlternatives: false,
    }).addTo(this.#map);

    routingControl.on("routesfound", this._handleNewWorkoutRoute.bind(this));
  }

  _handleNewWorkoutRoute(e) {
    const routes = e.routes;
    if (routes && routes.length > 0) {
      this.#currentRoute = {
        ...this.#currentRoute,
        distance: (routes[0].summary.totalDistance / 1000).toFixed(2),
        routeName: routes[0].name,
      };
      this.#routes[this.#routes.length - 1] = this.#currentRoute;
      this._renderWorkout(this.#currentRoute);
      this.#canAddMarkers = false;
    } else {
      console.error("No routes found");
    }
  }

  _toggleMarkerSwitch() {
    this.#markerSwitch = !this.#markerSwitch;
  }

  _closeModal() {
    modal.style.display = "none";
  }

  _saveUser() {
    const name = document.getElementById("name").value;
    const age = document.getElementById("age").value;
    const weight = document.getElementById("weight").value;
    const height = document.getElementById("height").value;
    //this or requred in html
    if (name && age && weight && height) {
      const user = new User(name, age, weight, height);
      console.log(user);
      users.push(user);
      this._closeModal();
    } else {
      alert("Please fill in all fields.");
    }
  }

  _renderWorkout(workout) {
    workouts.push(new Workout(workout.routeName, workout.distance));
    const html = `
      <li class="workout ${workout.type}" data-id="${workout.id}" data-workout-type="${workout.type}">
        <h2>${workout.routeName.replace(/,/g, " \u2192 ")}</h2>
        <div class="workout-details">
          <span>Distance: ${workout.distance} km</span>
        </div>
      </li>`;
    workoutList.insertAdjacentHTML("beforeend", html);
    setTimeout(() => {
      const workoutElement = workoutList.querySelector(
        `li[data-id="${workout.id}"]`
      );
      if (workoutElement) {
        workoutElement.classList.add("show");
      }
    }, 10);
    workoutList.appendChild(addWorkoutButton);
    addWorkoutButton.style.display = "block";
  }

  _chooseWorkout() {
    addWorkoutButton.style.display = "none";
    const html = `
      <div class="workout-type">
        <button class="workout-type-button" data-type="running">🏃🏻‍♂️</button>
        <button class="workout-type-button" data-type="cycling">🚴🏼‍♂️</button>
      </div>`;
    workoutList.insertAdjacentHTML("beforeend", html);
    const workoutTypeButtons = document.querySelectorAll(
      ".workout-type-button"
    );
    workoutTypeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        this.#currentRoute = {
          ...this.#currentRoute,
          type: button.dataset.type,
        };
        this.#routes[this.#routes.length] = this.#currentRoute;
        this.#canAddMarkers = true;
        const workoutTypeDiv = document.querySelector(".workout-type");
        if (workoutTypeDiv) {
          workoutTypeDiv.remove();
        }
      });
    });
  }
}

class Workout {
  id = generateId();

  constructor(routeName, distance) {
    this.routeName = routeName; // array of latlng
    this.distance = distance; // in km
  }
}

const app = new App();
