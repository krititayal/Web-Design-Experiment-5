const form = document.querySelector('#search-form');
const input = document.querySelector('#city');
const message = document.querySelector('#message');
const result = document.querySelector('#result');

const weatherCodes = {
  0: ['Clear sky', '☀'],
  1: ['Mostly clear', '🌤'],
  2: ['Partly cloudy', '⛅'],
  3: ['Overcast', '☁'],
  45: ['Fog', '〰'],
  48: ['Fog', '〰'],
  51: ['Drizzle', '☂'],
  53: ['Drizzle', '☂'],
  55: ['Heavy drizzle', '☂'],
  61: ['Light rain', '☂'],
  63: ['Rain', '☂'],
  65: ['Heavy rain', '☂'],
  71: ['Light snow', '❄'],
  73: ['Snow', '❄'],
  75: ['Heavy snow', '❄'],
  80: ['Rain showers', '☂'],
  81: ['Showers', '☂'],
  82: ['Heavy showers', '☂'],
  95: ['Thunderstorm', '⚡'],
  96: ['Storm with hail', '⚡'],
  99: ['Storm with hail', '⚡']
};

function describeWeather(code) {
  return weatherCodes[code] || ['Changing skies', '☁'];
}

function formatDay(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'short'
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const place = input.value.trim();
  if (!place) return;

  message.textContent = 'Looking up the forecast…';
  result.hidden = true;

  try {
    const geocodingUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
    geocodingUrl.search = new URLSearchParams({
      name: place,
      count: '1',
      language: 'en',
      format: 'json'
    });

    const geocodingResponse = await fetch(geocodingUrl);
    if (!geocodingResponse.ok) {
      throw new Error('The location service is unavailable. Please try again.');
    }

    const locationData = await geocodingResponse.json();
    const location = locationData.results?.[0];
    if (!location) {
      throw new Error(`No place found for “${place}”. Try adding a country name.`);
    }

    const forecastUrl = new URL('https://api.open-meteo.com/v1/forecast');
    forecastUrl.search = new URLSearchParams({
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      current: 'temperature_2m,weather_code',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min',
      timezone: 'auto',
      forecast_days: '5'
    });

    const forecastResponse = await fetch(forecastUrl);
    if (!forecastResponse.ok) {
      throw new Error('The forecast service did not respond. Please try again.');
    }

    const forecastData = await forecastResponse.json();
    const current = forecastData.current;
    const daily = forecastData.daily;

    document.querySelector('#location').textContent = [
      location.name,
      location.admin1,
      location.country
    ].filter(Boolean).join(', ');
    document.querySelector('#date').textContent = new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
    document.querySelector('#temperature').textContent = `${Math.round(current.temperature_2m)}°`;
    document.querySelector('#condition').textContent = describeWeather(current.weather_code)[0];
    document.querySelector('#icon').textContent = describeWeather(current.weather_code)[1];
    document.querySelector('#high').textContent = `${Math.round(daily.temperature_2m_max[0])}°`;
    document.querySelector('#low').textContent = `${Math.round(daily.temperature_2m_min[0])}°`;

    const forecastList = document.querySelector('#forecast');
    forecastList.replaceChildren();

    daily.time.slice(1).forEach((date, index) => {
      const dayIndex = index + 1;
      const row = document.createElement('div');
      row.className = 'day';

      const name = document.createElement('span');
      name.textContent = formatDay(date);

      const icon = document.createElement('span');
      icon.className = 'wx';
      icon.textContent = describeWeather(daily.weather_code[dayIndex])[1];
      icon.setAttribute('aria-label', describeWeather(daily.weather_code[dayIndex])[0]);

      const temperatures = document.createElement('span');
      temperatures.className = 'temps';
      const high = Math.round(daily.temperature_2m_max[dayIndex]);
      const low = Math.round(daily.temperature_2m_min[dayIndex]);
      temperatures.innerHTML = `<b>${high}°</b> / ${low}°`;

      row.append(name, icon, temperatures);
      forecastList.append(row);
    });

    result.hidden = false;
    message.textContent = '';
  } catch (error) {
    message.textContent = error.message || 'Something went wrong. Please try again.';
  }
});
