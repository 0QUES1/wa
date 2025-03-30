document.addEventListener('DOMContentLoaded', function() {
    // API Key - Sign up at openweathermap.org to get your own free API key
    const apiKey = '8e9e8be06c6da2917c090d025ec55fa3'; // Replace with your actual API key
    
    // DOM Elements
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const locationBtn = document.getElementById('location-btn');
    const unitBtn = document.getElementById('unit-btn');
    const weatherContainer = document.getElementById('weather-container');
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    
    // Weather elements
    const locationEl = document.getElementById('location');
    const dateEl = document.getElementById('date');
    const weatherIcon = document.getElementById('weather-icon');
    const descriptionEl = document.getElementById('description');
    const tempEl = document.getElementById('temp');
    const feelsLikeEl = document.getElementById('feels-like');
    const humidityEl = document.getElementById('humidity');
    const windEl = document.getElementById('wind');
    const pressureEl = document.getElementById('pressure');
    const visibilityEl = document.getElementById('visibility');
    const uvIndexEl = document.getElementById('uv-index');
    const forecastEl = document.getElementById('forecast');
    
    // App state
    let currentCity = 'Delhi';
    let currentUnit = localStorage.getItem('weatherUnit') || 'celsius';
    let currentWeatherData = null;
    let forecastData = null;
    
    // Initialize the app
    updateUnitButton();
    fetchWeather(currentCity);
    
    // Event listeners
    searchBtn.addEventListener('click', searchWeather);
    searchInput.addEventListener('keypress', (e) => e.key === 'Enter' && searchWeather());
    locationBtn.addEventListener('click', getLocation);
    unitBtn.addEventListener('click', toggleUnit);
    
    function searchWeather() {
        const city = searchInput.value.trim();
        if (city) {
            currentCity = city;
            fetchWeather(city);
        }
    }
    
    function toggleUnit() {
        currentUnit = currentUnit === 'celsius' ? 'fahrenheit' : 'celsius';
        localStorage.setItem('weatherUnit', currentUnit);
        updateUnitButton();
        updateAllTemperatures();
    }
    
    function updateUnitButton() {
        unitBtn.textContent = currentUnit === 'celsius' ? '°C' : '°F';
        unitBtn.style.animation = 'none';
        void unitBtn.offsetWidth; // Trigger reflow
        unitBtn.style.animation = 'pulse 0.5s ease';
    }
    
    function getLocation() {
        loading.style.display = 'block';
        weatherContainer.style.display = 'none';
        error.style.display = 'none';
        
        if (!navigator.geolocation) {
            showError("Geolocation is not supported by your browser");
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                fetchWeatherByCoords(latitude, longitude);
            },
            err => {
                loading.style.display = 'none';
                showError("Could not access your location. Please enable location services.");
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    }
    
    async function fetchWeatherByCoords(lat, lon) {
        try {
            const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
            const response = await fetch(url);
            
            if (!response.ok) throw new Error('Location not found');
            
            const data = await response.json();
            currentCity = `${data.name}, ${data.sys.country}`;
            searchInput.value = data.name;
            fetchWeather(currentCity);
        } catch (err) {
            showError("Could not fetch weather for your location");
            fetchWeather(currentCity);
        }
    }
    
    async function fetchWeather(city) {
        try {
            loading.style.display = 'block';
            weatherContainer.style.display = 'none';
            error.style.display = 'none';
            
            // Fetch current weather
            const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;
            const currentResponse = await fetch(currentWeatherUrl);
            
            if (!currentResponse.ok) {
                throw new Error('City not found');
            }
            
            currentWeatherData = await currentResponse.json();
            
            // Fetch forecast (5-day)
            const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`;
            const forecastResponse = await fetch(forecastUrl);
            forecastData = await forecastResponse.json();
            
            // Update UI with weather data
            updateCurrentWeather(currentWeatherData);
            updateForecast(forecastData);
            
            weatherContainer.style.display = 'block';
            loading.style.display = 'none';
        } catch (err) {
            console.error('Error fetching weather data:', err);
            loading.style.display = 'none';
            showError("Could not fetch weather data. Please try another location.");
        }
    }
    
    function updateCurrentWeather(data) {
        locationEl.textContent = `${data.name}, ${data.sys.country}`;
        
        const now = new Date();
        dateEl.textContent = now.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        const weather = data.weather[0];
        weatherIcon.src = `https://openweathermap.org/img/wn/${weather.icon}@2x.png`;
        descriptionEl.textContent = weather.description;
        
        // Store original values in dataset
        tempEl.dataset.celsius = Math.round(data.main.temp);
        feelsLikeEl.dataset.celsius = Math.round(data.main.feels_like);
        
        updateAllTemperatures();
        
        humidityEl.textContent = `${data.main.humidity}%`;
        windEl.textContent = `${(data.wind.speed * 3.6).toFixed(1)} km/h`;
        pressureEl.textContent = `${data.main.pressure} hPa`;
        visibilityEl.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
        uvIndexEl.textContent = 'N/A';
    }
    
    function updateAllTemperatures() {
        if (!currentWeatherData) return;
        
        // Update current temp
        const tempC = parseFloat(tempEl.dataset.celsius);
        const feelsLikeC = parseFloat(feelsLikeEl.dataset.celsius);
        
        if (currentUnit === 'fahrenheit') {
            tempEl.innerHTML = `${Math.round((tempC * 9/5) + 32)}<sup>°F</sup>`;
            feelsLikeEl.textContent = `${Math.round((feelsLikeC * 9/5) + 32)}°F`;
        } else {
            tempEl.innerHTML = `${tempC}<sup>°C</sup>`;
            feelsLikeEl.textContent = `${feelsLikeC}°C`;
        }
        
        // Update forecast if available
        if (forecastData) {
            updateForecast(forecastData);
        }
    }
    
    function updateForecast(data) {
        forecastEl.innerHTML = '';
        
        const dailyForecast = {};
        const today = new Date().toLocaleDateString('en-US', { weekday: 'short' });
        
        data.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const day = date.toLocaleDateString('en-US', { weekday: 'short' });
            
            // Skip today's forecast
            if (day === today) return;
            
            if (!dailyForecast[day]) {
                dailyForecast[day] = {
                    temps: [],
                    icons: [],
                    descriptions: []
                };
            }
            
            dailyForecast[day].temps.push(item.main.temp);
            dailyForecast[day].icons.push(item.weather[0].icon);
            dailyForecast[day].descriptions.push(item.weather[0].description);
        });
        
        // Create forecast cards for the next 5 unique days
        const days = Object.keys(dailyForecast).slice(0, 5);
        
        days.forEach(day => {
            const dayData = dailyForecast[day];
            const maxTempC = Math.max(...dayData.temps);
            const minTempC = Math.min(...dayData.temps);
            
            let maxTemp, minTemp;
            if (currentUnit === 'fahrenheit') {
                maxTemp = Math.round((maxTempC * 9/5) + 32);
                minTemp = Math.round((minTempC * 9/5) + 32);
            } else {
                maxTemp = Math.round(maxTempC);
                minTemp = Math.round(minTempC);
            }
            
            // Get most frequent icon/description
            const mostFrequentIcon = mode(dayData.icons);
            const mostFrequentDesc = mode(dayData.descriptions);
            
            const forecastCard = document.createElement('div');
            forecastCard.className = 'forecast-card';
            forecastCard.innerHTML = `
                <p class="forecast-day">${day}</p>
                <img class="forecast-icon" src="https://openweathermap.org/img/wn/${mostFrequentIcon}@2x.png" alt="${mostFrequentDesc}">
                <p class="forecast-desc">${mostFrequentDesc}</p>
                <div class="forecast-temp">
                    <span class="max-temp">${maxTemp}°</span>
                    <span class="min-temp">${minTemp}°</span>
                </div>
            `;
            
            forecastEl.appendChild(forecastCard);
        });
    }
    
    // Helper function to find mode (most frequent value) in array
    function mode(arr) {
        const counts = {};
        arr.forEach(val => counts[val] = (counts[val] || 0) + 1);
        return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    }
    
    function showError(message) {
        error.innerHTML = `<p>${message}</p>`;
        error.style.display = 'block';
        weatherContainer.style.display = 'none';
        loading.style.display = 'none';
    }
});