const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const getDailyForecast = require('./request_yr');
const moment = require('moment');
const app = express();
const port = 3000;

// Middleware для обработки JSON в запросах
app.use(bodyParser.json());

app.use(express.static('public'));

// Загрузка данных о городах из JSON файла
const citiesData = require('./cities.json');

// Кэш для хранения полученныз запросов
// Также можно использовать redis
const forecastCache = {};

// Функция для получения прогноза с учетом кэширования
async function getWeatherForecast(lat, lon) {
    const cacheKey = `${lat},${lon}`;

    // Проверяем, есть ли прогноз в кэше и его срок годности
    if (forecastCache[cacheKey] && moment().diff(forecastCache[cacheKey].timestamp, 'minutes') < 1) {
        console.log('Return weather from cache')
        return forecastCache[cacheKey].data;
    } else {
        // Если прогноза нет или он устарел, делаем запрос к стороннему API
        try {
            const forecast = await getDailyForecast.getDailyForecast(lat, lon);

            // Обновляем кэш с новыми данными
            forecastCache[cacheKey] = {
                data: forecast,
                timestamp: moment()
            };

            return forecast;
        } catch (error) {
            console.error('Error fetching weather forecast:', error);
            throw new Error('Failed to fetch weather forecast');
        }
    }
}

// Роут для главной страницы
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/templates/index.html'));
});

// Роут для страницы АПИ
app.get('/api', (req, res) => {
    res.sendFile(path.join(__dirname + '/templates/api.html'))
})


// Роут для обработки запросов на получение погоды
app.get('/weather', (req, res) => {
    var { city, lat, lon } = req.query;

    // Проверка, был ли выбран город или введены координаты
    if (!city && (!lat || !lon)) {
        return res.status(400).json({ error: 'Форма пустая. Выберите город или введите координаты' });
    }

    // Если выбран город, находим его координаты из данных о городах
    if (city) {
        const cityData = citiesData[city];
        [lat, lon] = cityData.split(',');
    }

    if (!city && (lat || lon)){
        // Если не указан город, проверяем валидность введенных координат
        if (!isValidCoordinates(lat, lon)) {
            return res.status(400).json({ error: 'Координаты содержат недопустимые символы' });
        }
    }

    let latitude = truncateDecimal(lat, 4);
    let longitude = truncateDecimal(lon, 4);

    getWeatherForecast(latitude, longitude)
        .then(forecast => {
            if (forecast) {
                const result = []; 
                // Получение уникальных дат с температурами
                const uniqueDates = getUniqueDatesWithTemperature(forecast);
                res.json({ weather: uniqueDates });
            } else {
                // Проверяем валидность введенных координат
                if (!isValidCoordinates(lat, lon)) {
                    return res.status(400).json({ error: 'Неверные координаты' });
                }
            }
        })
        .catch(error => {
            res.status(500).json({ error: 'Failed to fetch weather forecast' });
        });
});

function getUniqueDatesWithTemperature(dataArray) {
    const uniqueDates = {};
    // Создание array с уникальными датами
    dataArray.forEach(item => {
        const time = new Date(item.time);
        const hour = time.getHours();
        const dateString = time.toString();
    // Проверка на соответствие условию ~14.00
        if (hour === 14) {
        uniqueDates[dateString] = item.temperature;
        }
    });

    // Преобразование объекта в массив
    const resultArray = Object.keys(uniqueDates).map(time => ({
        time,
        temperature: uniqueDates[time]
}));

return resultArray;
}

// Функция для проверки валидности координат
function isValidCoordinates(lat, lon) {
   lat = replaceCom(lat)
   lon = replaceCom(lon)
  const latPattern = /^-?\d+\.\d+$/;
  const lonPattern = /^-?\d+\.\d+$/;

  return latPattern.test(lat) && lonPattern.test(lon);
}

// Функция для проверки и коррекции длины дробной части координат
function truncateDecimal(coord, maxDecimalPlaces) {
  const [wholePart, decimalPart] = coord.split('.');
  if (decimalPart && decimalPart.length > maxDecimalPlaces) {
    coord = wholePart + '.' + decimalPart.slice(0,maxDecimalPlaces)
    return coord;
  }
  return coord;
}

function replaceCom(x){
    x = x.replace(/,/g, ".");
    return x
}

// // Запуск серверa
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
