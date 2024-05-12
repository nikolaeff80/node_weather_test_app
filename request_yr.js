
async function getDailyForecast(latitude, longitude) {
    const forecastEndpoint = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${latitude}&lon=${longitude}`;

    try {
        const fetch = await import('node-fetch');
        // Отправка запроса на API yr.no
        const response = await fetch.default(forecastEndpoint, {
            headers: {
                'User-Agent': 'TestWeatherApp/0.1',
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            }
        });
        // Проверка ответа
        console.log('Request to API yr.no')
        if (!response.ok) {
            throw new Error(`Failed to fetch weather data: ${response.status}`);
        }
        console.log(response.status)
        const data = await response.json();
       
        // Очистка данных и создание объекта Array для дальнейшей обработки
        const dailyForecasts = data.properties.timeseries.map(entry => {
            const time = new Date(entry.time);
            const temperature = entry.data.instant.details.air_temperature;
            return { time, temperature };
        });

        return dailyForecasts;
    } catch (error) {
        console.error('Error fetching weather data:', error.message);
        return null;
    }
}

module.exports = { getDailyForecast };