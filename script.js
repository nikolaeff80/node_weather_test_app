document.getElementById('weatherForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const location = document.getElementById('location').value;
    
    try {
      const response = await fetch(`/weather?location=${location}`);
      const data = await response.json();
      // console.log(data);
      document.getElementById('weatherInfo').innerText = JSON.stringify(data);
    } catch (error) {
      console.error(error);
      document.getElementById('weatherInfo').innerText = 'Failed to fetch weather data';
    }
  });
  