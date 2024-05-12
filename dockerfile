# Используем официальный образ Node.js
FROM node:latest

# Метаданные для образа
LABEL Test task for UKResheniya by Nikolai Nikolaev

# Установка рабочей директории
WORKDIR /usr/src/app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Установка зависимостей
RUN npm install

# Копирование исходного кода приложения в контейнер
COPY . .

# Определяем порт, который будет использоваться приложением
EXPOSE 3000

# Команда для запуска приложения
CMD ["node", "server.js"]