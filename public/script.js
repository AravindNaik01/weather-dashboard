// DOM Elements
const cityNameEl = document.querySelector("#city-name-date");
const temperatureEl = document.querySelector("#temperature");
const humidityEl = document.querySelector("#humidity");
const windSpeedEl = document.querySelector("#wind-speed");
const weatherConditionsEl = document.querySelector("#weather-conditions");
const forecastContainerEl = document.querySelector("#forecast-container");
const currentDateEl = document.querySelector("#current-date");

const searchFormEl = document.querySelector("#search-form");
const searchInputEl = document.querySelector("#search-input");

const loaderEl = document.querySelector("#loader");
const errorContainerEl = document.querySelector("#error-container");

const historyContainerEl = document.querySelector("#history-container");
const clearHistoryBtn = document.querySelector("#clear-history");

// Display current weather data
function displayCurrentWeather(data) {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  cityNameEl.textContent = data.name;
  currentDateEl.textContent = currentDate;
  
  // Update weather icon
  const iconCode = data.weather[0].icon;
  const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  document.querySelector('#weather-icon').setAttribute('src', iconUrl);
  document.querySelector('#weather-icon').setAttribute('alt', data.weather[0].description);
  
  // Update weather data
  temperatureEl.textContent = Math.round(data.main.temp);
  humidityEl.textContent = data.main.humidity;
  windSpeedEl.textContent = Math.round(data.wind.speed * 3.6); // Convert m/s to km/h
  weatherConditionsEl.textContent = data.weather[0].main;
}

// Display 5-day forecast
function displayForecast(forecastList) {
  forecastContainerEl.innerHTML = '';

  // Get forecast for noon each day (adjust index as needed)
  for (let i = 0; i < forecastList.length; i += 8) {
    const dailyForecast = forecastList[i];
    const date = new Date(dailyForecast.dt_txt);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    
    const card = document.createElement("div");
    card.classList.add("forecast-card");

    const dateEl = document.createElement("h3");
    dateEl.textContent = dayName;

    const iconCode = dailyForecast.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    const iconEl = document.createElement("img");
    iconEl.setAttribute("src", iconUrl);
    iconEl.setAttribute("alt", dailyForecast.weather[0].description);

    const tempEl = document.createElement("p");
    tempEl.classList.add("forecast-temp");
    tempEl.textContent = `${Math.round(dailyForecast.main.temp)}°`;

    const descEl = document.createElement("p");
    descEl.classList.add("forecast-desc");
    descEl.textContent = dailyForecast.weather[0].main;

    card.append(dateEl, iconEl, tempEl, descEl);
    forecastContainerEl.append(card);
  }
}

// Render search history
function renderHistory() {
  const history = JSON.parse(localStorage.getItem("weatherHistory") || "[]");
  historyContainerEl.innerHTML = "";

  history.forEach(city => {
    const historyBtn = document.createElement("button");
    historyBtn.classList.add("history-btn");
    historyBtn.innerHTML = `<i class="fas fa-history"></i> ${city}`;
    historyBtn.setAttribute("data-city", city);
    historyContainerEl.append(historyBtn);
  });
}

// Save city to search history
function saveCityToHistory(city) {
  const historyString = localStorage.getItem("weatherHistory") || "[]";
  let history = JSON.parse(historyString);
  
  // Remove duplicates (case insensitive)
  history = history.filter(
    existingCity => existingCity.toLowerCase() !== city.toLowerCase()
  );
  
  // Add new city to beginning of array
  history.unshift(city);
  
  // Limit to 10 items
  if (history.length > 10) {
    history = history.slice(0, 10);
  }
  
  localStorage.setItem("weatherHistory", JSON.stringify(history));
  renderHistory();
}

// Clear search history
function clearHistory() {
  localStorage.removeItem("weatherHistory");
  renderHistory();
}

// Fetch weather data from API
async function fetchWeather(city) {
  try {
    // Show loader and clear previous results
    errorContainerEl.classList.add("hidden");
    forecastContainerEl.innerHTML = "";
    loaderEl.classList.remove("hidden");
    
    const response = await fetch(`/api/weather/${city}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch weather data');
    }
    
    const { currentWeather, forecast } = await response.json();
    
    displayCurrentWeather(currentWeather);
    displayForecast(forecast.list);
    saveCityToHistory(currentWeather.name);
    
  } catch (error) {
    console.error("Failed to fetch weather data:", error);
    errorContainerEl.textContent = error.message || "Failed to fetch weather data. Please try again.";
    errorContainerEl.classList.remove("hidden");
  } finally {
    loaderEl.classList.add("hidden");
  }
}

// Fetch weather by coordinates
async function fetchWeatherByCoords(lat, lon) {
  try {
    errorContainerEl.classList.add("hidden");
    forecastContainerEl.innerHTML = "";
    loaderEl.classList.remove("hidden");
    
    const response = await fetch(`/api/weather/coords?lat=${lat}&lon=${lon}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || 
                         errorData.error || 
                         `Server responded with status ${response.status}`;
      throw new Error(errorMessage);
    }

    const { currentWeather, forecast } = await response.json();
    displayCurrentWeather(currentWeather);
    displayForecast(forecast.list);
    saveCityToHistory(currentWeather.name);
    
  } catch (error) {
    console.error("Failed to fetch weather by coordinates:", error);
    errorContainerEl.textContent = `Could not fetch weather for your location. ${error.message}`;
    errorContainerEl.classList.remove("hidden");
    
    // Fallback: Show a default city when location fails
    if (!localStorage.getItem("weatherHistory")) {
      fetchWeather("London"); // Default fallback city
    }
  } finally {
    loaderEl.classList.add("hidden");
  }
}

// Get user's current location
function getCurrentLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        fetchWeatherByCoords(latitude, longitude);
      },
      error => {
        console.error("Error getting location:", error);
        errorContainerEl.textContent = "Location access denied. Please search for a city manually.";
        errorContainerEl.classList.remove("hidden");
      }
    );
  } else {
    console.log("Geolocation not supported");
    errorContainerEl.textContent = "Geolocation is not supported by your browser.";
    errorContainerEl.classList.remove("hidden");
  }
}

// Event Listeners
searchFormEl.addEventListener("submit", (event) => {
  event.preventDefault();
  const city = searchInputEl.value.trim();
  
  if (city) {
    fetchWeather(city);
    searchInputEl.value = "";
  }
});

historyContainerEl.addEventListener("click", (event) => {
  if (event.target.closest(".history-btn")) {
    const city = event.target.closest(".history-btn").dataset.city;
    fetchWeather(city);
  }
});

clearHistoryBtn.addEventListener("click", clearHistory);

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  renderHistory();
  getCurrentLocation();
});