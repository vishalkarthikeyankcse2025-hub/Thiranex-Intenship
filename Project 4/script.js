// ==========================================
// DOM ELEMENTS
// ==========================================

const searchForm = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");

const loading = document.getElementById("loading");
const errorMessage = document.getElementById("error-message");

const weatherCard = document.getElementById("weather-card");

const cityName = document.getElementById("city-name");
const countryName = document.getElementById("country-name");

const temperature = document.getElementById("temperature");
const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("wind-speed");
const weatherDescription = document.getElementById("weather-description");


// ==========================================
// API URLS
// ==========================================

const GEOCODING_API =
    "https://geocoding-api.open-meteo.com/v1/search";

const WEATHER_API =
    "https://api.open-meteo.com/v1/forecast";


// ==========================================
// WEATHER CODE DESCRIPTIONS
// ==========================================

function getWeatherDescription(code) {

    const weatherCodes = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",

        45: "Fog",
        48: "Depositing rime fog",

        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",

        56: "Light freezing drizzle",
        57: "Dense freezing drizzle",

        61: "Slight rain",
        63: "Moderate rain",
        65: "Heavy rain",

        66: "Light freezing rain",
        67: "Heavy freezing rain",

        71: "Slight snow",
        73: "Moderate snow",
        75: "Heavy snow",

        77: "Snow grains",

        80: "Slight rain showers",
        81: "Moderate rain showers",
        82: "Violent rain showers",

        85: "Slight snow showers",
        86: "Heavy snow showers",

        95: "Thunderstorm",

        96: "Thunderstorm with slight hail",
        99: "Thunderstorm with heavy hail"
    };

    return weatherCodes[code] || "Unknown";
}


// ==========================================
// SHOW LOADING
// ==========================================

function showLoading() {

    loading.style.display = "block";

    errorMessage.style.display = "none";

    weatherCard.style.display = "none";
}


// ==========================================
// HIDE LOADING
// ==========================================

function hideLoading() {

    loading.style.display = "none";
}


// ==========================================
// SHOW ERROR
// ==========================================

function showError(message) {

    hideLoading();

    errorMessage.textContent = message;

    errorMessage.style.display = "block";

    weatherCard.style.display = "none";
}


// ==========================================
// DISPLAY WEATHER
// ==========================================

function displayWeather(location, weatherData) {

    const currentWeather = weatherData.current;


    // Location
    cityName.textContent = location.name;

    countryName.textContent =
        `${location.admin1 || ""}${location.admin1 ? ", " : ""}${location.country}`;


    // Temperature
    temperature.textContent =
        Math.round(currentWeather.temperature_2m);


    // Humidity
    humidity.textContent =
        `${currentWeather.relative_humidity_2m}%`;


    // Wind speed
    windSpeed.textContent =
        `${Math.round(currentWeather.wind_speed_10m)} km/h`;


    // Weather description
    weatherDescription.textContent =
        getWeatherDescription(currentWeather.weather_code);


    // Show card
    weatherCard.style.display = "block";
}


// ==========================================
// GET CITY COORDINATES
// ==========================================

async function getCityCoordinates(city) {

    const url =
        `${GEOCODING_API}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

    const response = await fetch(url);


    // Check HTTP status
    if (!response.ok) {
        throw new Error("Unable to search for the city.");
    }


    const data = await response.json();


    // No matching city
    if (!data.results || data.results.length === 0) {
        throw new Error("City not found. Please enter a valid city name.");
    }


    return data.results[0];
}


// ==========================================
// GET WEATHER DATA
// ==========================================

async function getWeatherData(latitude, longitude) {

    const url =
        `${WEATHER_API}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&temperature_unit=celsius&wind_speed_unit=kmh`;

    const response = await fetch(url);


    // Check HTTP status
    if (!response.ok) {
        throw new Error("Unable to fetch weather data.");
    }


    const data = await response.json();

    return data;
}


// ==========================================
// SEARCH WEATHER
// ==========================================

async function searchWeather(city) {

    showLoading();

    try {

        // Step 1:
        // Find the city
        const location =
            await getCityCoordinates(city);


        // Step 2:
        // Get coordinates
        const latitude =
            location.latitude;

        const longitude =
            location.longitude;


        // Step 3:
        // Fetch weather
        const weatherData =
            await getWeatherData(latitude, longitude);


        // Step 4:
        // Display weather
        displayWeather(location, weatherData);

        hideLoading();

    } catch (error) {

        console.error("Weather Error:", error);

        showError(error.message);
    }
}


// ==========================================
// SEARCH FORM EVENT
// ==========================================

searchForm.addEventListener("submit", function (event) {

    event.preventDefault();


    const city =
        cityInput.value.trim();


    // Empty search
    if (city === "") {

        showError("Please enter a city name.");

        cityInput.focus();

        return;
    }


    searchWeather(city);
});