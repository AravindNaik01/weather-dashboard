const cityNameE1 = document.querySelector("#city-name-date");
const temperatureE1 = document.querySelector("#temperature");
const humudityE1 = document.querySelector("#humidity");
const windSpeedE1 = document.querySelector("#wind-speed");
const forecastContainerE1 = document.querySelector("#forecast-container");

const searchFormEl = document.querySelector("#search-form");
const searchInputEl = document.querySelector("#search-input");

const loaderEl = document.querySelector("#loader");
const errorContainerEl = document.querySelector("#error-container");

const historyContainerEl = document.querySelector("#history-container");


function displayCurrentWeather(data) {
  const currentdate = new Date().toLocaleDateString();
  cityNameE1.textContent = `${data.name}(${currentdate})`;
  temperatureE1.textContent = `${Math.round(data.main.temp)}`;
  humudityE1.textContent = `${data.main.humidity}`;
  windSpeedE1.textContent = `${data.wind.speed}`;
}

function displayForecast(forecastList) {
  // forecastContainerEl.innerHTML = '';

  for (let i = 0; i < forecastList.length; i += 8) {
    const dailyForecast = forecastList[i];

    console.log("Daily forecast data:", dailyForecast);

    const card = document.createElement("div");
    card.classList.add("forecast-card");

    const date = new Date(dailyForecast.dt_txt);
    const dateEl = document.createElement("h3");
    dateEl.textContent = date.toLocaleDateString();

    const iconCode = dailyForecast.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    const iconEl = document.createElement("img");
    iconEl.setAttribute("src", iconUrl);
    iconEl.setAttribute("alt", dailyForecast.weather[0].description);

    const tempEl = document.createElement("p");
    tempEl.textContent = `Temp: ${Math.round(dailyForecast.main.temp)} °C`;

    const humidityEl = document.createElement("p");
    humidityEl.textContent = `Humidity: ${dailyForecast.main.humidity}%`;

    card.append(dateEl, iconEl, tempEl, humidityEl);

    console.log(card);
    forecastContainerE1.append(card);
  }
}

//last added
function renderHistory() {
  const history = JSON.parse(localStorage.getItem("weatherHistory") || "[]");
  historyContainerEl.innerHTML = "";

  for (const city of history) {
    const historyBtn = document.createElement("button");
    historyBtn.textContent = city;
    historyBtn.classList.add("history-btn");
    historyBtn.setAttribute("data-city", city);
    historyContainerEl.append(historyBtn);
  }
}

function saveCityToHistory(city) {
  const historyString = localStorage.getItem("weatherHistory") || "[]";

  let history = JSON.parse(historyString);
  history = history.filter(
    (existingCity) => existingCity.toLowerCase() !== city.toLowerCase()
  );

  // 4. Add the new city to the beginning of the array.
  history.unshift(city);
  if (history.length > 10) {
    history = history.slice(0, 10);
  }
  // 6. Stringify the updated array and save it back to localStorage.
  localStorage.setItem("weatherHistory", JSON.stringify(history));
  renderHistory();
}

async function fetchWeather(city) {
  try {
    errorContainerEl.classList.add("hidden");
    // cityNameE1.textContent = "";
    // temperatureE1.textContent = "";
    // humudityE1.textContent = "";
    // windSpeedE1.textContent = "";
    forecastContainerE1.innerHTML = "";

    loaderEl.classList.remove("hidden");
    // const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;
    // const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`;

    const response = await fetch(`/api/weather/${city}`);
     
      if (!response.ok) {
      const errorData = await response.json();
            throw new Error(errorData.error || 'An unknown error occurred.');

      }
    
    const { currentWeather, forecast } = await response.json();
    
    displayCurrentWeather(currentWeather);
    displayForecast(forecast.list);
    saveCityToHistory(currentWeather.name);
    // console.log(weatherData);
  } catch (error) {
    console.error("failed to fetch the weather data:", error);
    errorContainerEl.textContent =
      "Sorry, the city could not be found. Please check your spelling and try again.";
    errorContainerEl.classList.remove("hidden");
  } finally {
    loaderEl.classList.add("hidden");
  }
  renderHistory();
}
// fetchWeather("udupi");

searchFormEl.addEventListener("submit", (event) => {
  event.preventDefault();
  const city = searchInputEl.value.trim();
  console.log(`Form submitted!:${city}`);
  // fetchWeather(event);
  if (city) {
    fetchWeather(city);
    searchInputEl.value = "";
    console.log(`Input is valid. Ready to fetch weather for ${city}.`);
  } else {
    console.log("Please enter a city name.");
  }
});

searchFormEl.addEventListener("submit", (event) => {
  event.preventDefault();
  const city = searchInputEl.value.trim();
  if (city) {
    fetchWeather(city);
    searchInputEl.value = "";
  }
});

historyContainerEl.addEventListener("click", (event) => {
  if (event.target.matches(".history-btn")) {
    const city = event.target.dataset.city;
    fetchWeather(city);
  }
});

// --- INITIALIZATION
renderHistory();

// 
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      console.log('User location found:', { latitude, longitude });

      // ✅ You need to call fetchWeatherByCoords here
    },
    (error) => {
      console.error('Error getting user location:', error.message);
    }
  );
}
 else {
  // This message is for browsers that don't support the API at all.
  console.log('Geolocation is not available on this browser.');
}

// In public/script.js

// This is the updated function
async function fetchWeatherByCoords(lat, lon) {
  try {
    // --- UI Reset Logic ---
    errorContainerEl.classList.add('hidden');
    // ... clear other elements ...
    forecastContainerEl.innerHTML = '';
    loaderEl.classList.remove('hidden');
    
    // --- THE CRITICAL CHANGE ---
    // We call our new coordinates endpoint, passing lat and lon as a query string.
    const response = await fetch(`/api/weather/coords?lat=${lat}&lon=${lon}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'An unknown error occurred.');
    }

    // The data structure is identical to our other endpoint, so we handle it the same way.
    const { currentWeather, forecast } = await response.json();

    displayCurrentWeather(currentWeather);
    displayForecast(forecast.list);
    saveCityToHistory(currentWeather.name);
    
  } catch (error) {
    console.error('Frontend Coords Fetch Error:', error);
    // Give a slightly different error for geolocation failure
    errorContainerEl.textContent = 'Could not fetch weather for your location. ' + error.message;
    errorContainerEl.classList.remove('hidden');
  } finally {
    loaderEl.classList.add('hidden');
  }
}