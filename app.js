const searchInput = document.querySelector("#location-search");
const searchButton = document.querySelector("#location-button");
const searchResults = document.querySelector("#search-results");
const forecastGrid = document.querySelector("#forecast-grid");
const template = document.querySelector("#forecast-card-template");

const locationName = document.querySelector("#location-name");
const locationDetail = document.querySelector("#location-detail");
const weatherLabel = document.querySelector("#weather-label");
const currentTemperature = document.querySelector("#current-temperature");
const weatherIcon = document.querySelector("#weather-icon");
const feelsLike = document.querySelector("#feels-like");
const humidity = document.querySelector("#humidity");
const windSpeed = document.querySelector("#wind-speed");
const precipitation = document.querySelector("#precipitation");
const updatedAt = document.querySelector("#updated-at");

const weatherCodes = {
  0: { label: "Clear sky", icon: "☀️" },
  1: { label: "Mostly clear", icon: "🌤️" },
  2: { label: "Partly cloudy", icon: "⛅" },
  3: { label: "Overcast", icon: "☁️" },
  45: { label: "Fog", icon: "🌫️" },
  48: { label: "Rime fog", icon: "🌫️" },
  51: { label: "Light drizzle", icon: "🌦️" },
  53: { label: "Drizzle", icon: "🌦️" },
  55: { label: "Dense drizzle", icon: "🌧️" },
  56: { label: "Freezing drizzle", icon: "🌧️" },
  57: { label: "Heavy freezing drizzle", icon: "🌧️" },
  61: { label: "Light rain", icon: "🌦️" },
  63: { label: "Rain", icon: "🌧️" },
  65: { label: "Heavy rain", icon: "🌧️" },
  66: { label: "Freezing rain", icon: "🌧️" },
  67: { label: "Heavy freezing rain", icon: "🌧️" },
  71: { label: "Light snow", icon: "🌨️" },
  73: { label: "Snow", icon: "🌨️" },
  75: { label: "Heavy snow", icon: "❄️" },
  77: { label: "Snow grains", icon: "❄️" },
  80: { label: "Rain showers", icon: "🌦️" },
  81: { label: "Heavy showers", icon: "🌧️" },
  82: { label: "Violent showers", icon: "⛈️" },
  85: { label: "Snow showers", icon: "🌨️" },
  86: { label: "Heavy snow showers", icon: "🌨️" },
  95: { label: "Thunderstorm", icon: "⛈️" },
  96: { label: "Thunderstorm with hail", icon: "⛈️" },
  99: { label: "Severe thunderstorm", icon: "⛈️" },
};

let searchTimer = null;

function getWeatherCodeInfo(code) {
  return weatherCodes[code] ?? { label: "Unknown", icon: "🌡️" };
}

function formatDegrees(value) {
  return `${Math.round(value)}deg`;
}

function formatPercent(value) {
  return `${Math.round(value)}%`;
}

function formatWind(value) {
  return `${Math.round(value)} km/h`;
}

function formatDateLabel(dateString, index) {
  const date = new Date(`${dateString}T12:00:00`);
  if (index === 0) {
    return "Today";
  }
  return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date);
}

function renderResults(results) {
  searchResults.innerHTML = "";

  if (!results.length) {
    const empty = document.createElement("li");
    empty.className = "location-detail";
    empty.textContent = "No matching locations yet.";
    searchResults.append(empty);
    return;
  }

  results.forEach((place) => {
    const item = document.createElement("li");
    item.className = "result-item";

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `${place.name}, ${place.admin1 ?? place.country}`;
    button.addEventListener("click", () => selectLocation(place));

    item.append(button);
    searchResults.append(item);
  });
}

function setLoadingState(message) {
  locationName.textContent = message;
  locationDetail.textContent = "Please wait a moment";
  weatherLabel.textContent = "Fetching current conditions";
  currentTemperature.textContent = "--";
  weatherIcon.textContent = "⏳";
  feelsLike.textContent = "--";
  humidity.textContent = "--";
  windSpeed.textContent = "--";
  precipitation.textContent = "--";
  updatedAt.textContent = "Last updated: --";
  forecastGrid.innerHTML = "";
}

function setErrorState(message) {
  locationName.textContent = "Weather unavailable";
  locationDetail.textContent = message;
  weatherLabel.textContent = "Try a different city";
  currentTemperature.textContent = "--";
  weatherIcon.textContent = "⚠️";
}

async function searchLocations(query) {
  if (!query.trim()) {
    searchResults.innerHTML = "";
    return;
  }

  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", query.trim());
  url.searchParams.set("count", "8");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to search places");
    }

    const data = await response.json();
    renderResults(data.results ?? []);
  } catch (error) {
    renderResults([]);
  }
}

async function fetchWeather(latitude, longitude) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", latitude);
  url.searchParams.set("longitude", longitude);
  url.searchParams.set(
    "current",
    [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "is_day",
      "precipitation",
      "weather_code",
      "wind_speed_10m",
    ].join(",")
  );
  url.searchParams.set(
    "daily",
    [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
    ].join(",")
  );
  url.searchParams.set("forecast_days", "6");
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Forecast request failed");
  }

  return response.json();
}

function renderForecast(data) {
  forecastGrid.innerHTML = "";

  data.daily.time.forEach((dateString, index) => {
    const card = template.content.firstElementChild.cloneNode(true);
    const codeInfo = getWeatherCodeInfo(data.daily.weather_code[index]);

    card.querySelector(".forecast-day").textContent = formatDateLabel(dateString, index);
    card.querySelector(".forecast-icon").textContent = codeInfo.icon;
    card.querySelector(".forecast-summary").textContent = codeInfo.label;
    card.querySelector(".forecast-high").textContent = `${formatDegrees(
      data.daily.temperature_2m_max[index]
    )} high`;
    card.querySelector(".forecast-low").textContent = `${formatDegrees(
      data.daily.temperature_2m_min[index]
    )} low`;
    card.querySelector(".forecast-rain").textContent = `${formatPercent(
      data.daily.precipitation_probability_max[index]
    )} rain chance`;

    forecastGrid.append(card);
  });
}

function applyTheme(isDay) {
  document.body.dataset.theme = isDay ? "day" : "night";
}

async function selectLocation(place) {
  searchInput.value = `${place.name}, ${place.country}`;
  searchResults.innerHTML = "";
  setLoadingState(`Loading ${place.name}`);

  try {
    const data = await fetchWeather(place.latitude, place.longitude);
    const codeInfo = getWeatherCodeInfo(data.current.weather_code);
    const detailParts = [place.admin1, place.country].filter(Boolean);

    localStorage.setItem("weather-atlas:last-place", JSON.stringify(place));

    locationName.textContent = place.name;
    locationDetail.textContent = detailParts.join(", ");
    weatherLabel.textContent = codeInfo.label;
    currentTemperature.textContent = Math.round(data.current.temperature_2m);
    weatherIcon.textContent = codeInfo.icon;
    feelsLike.textContent = formatDegrees(data.current.apparent_temperature);
    humidity.textContent = formatPercent(data.current.relative_humidity_2m);
    windSpeed.textContent = formatWind(data.current.wind_speed_10m);
    precipitation.textContent = `${data.current.precipitation.toFixed(1)} mm`;
    updatedAt.textContent = `Last updated: ${new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(data.current.time))}`;

    renderForecast(data);
    applyTheme(Boolean(data.current.is_day));
  } catch (error) {
    setErrorState("Something went wrong while fetching the forecast.");
  }
}

function handleSearchSubmit() {
  const query = searchInput.value.trim();
  if (!query) {
    return;
  }
  searchLocations(query);
}

searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchLocations(searchInput.value);
  }, 280);
});

searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    handleSearchSubmit();
  }
});

searchButton.addEventListener("click", handleSearchSubmit);

document.querySelectorAll(".quick-pick").forEach((button) => {
  button.addEventListener("click", () => {
    searchInput.value = button.dataset.city ?? "";
    handleSearchSubmit();
  });
});

async function loadInitialLocation() {
  const savedPlace = localStorage.getItem("weather-atlas:last-place");
  if (savedPlace) {
    try {
      await selectLocation(JSON.parse(savedPlace));
      return;
    } catch (error) {
      localStorage.removeItem("weather-atlas:last-place");
    }
  }

  const fallbackPlace = {
    name: "Hyderabad",
    admin1: "Telangana",
    country: "India",
    latitude: 17.384,
    longitude: 78.4564,
  };

  await selectLocation(fallbackPlace);
}

loadInitialLocation();
