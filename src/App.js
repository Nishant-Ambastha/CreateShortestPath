import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';

function App() {
  const [cities, setCities] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [map, setMap] = useState(null);

  useEffect(() => {
    async function fetchCities() {
      try {
        const response = await axios.get('http://localhost:5000/cities'); // Replace with your backend URL
        const formattedCities = response.data.map(city => ({
          value: city.name,
          label: city.name + ' (' + city.state + ')',
          latitude: parseFloat(city.lat),
          longitude: parseFloat(city.lon),
        }));
        setCities(formattedCities);
      } catch (error) {
        console.error('Failed to fetch cities', error);
      }
    }

    fetchCities();
  }, []);

  useEffect(() => {
    if (window.google && map) {
      const bounds = new window.google.maps.LatLngBounds();
      selectedCities.forEach(city => {
        const position = new window.google.maps.LatLng(city.latitude, city.longitude);
        bounds.extend(position);
        new window.google.maps.Marker({
          position: position,
          map: map,
          title: city.label,
        });
      });
      if (selectedCities.length > 0) {
        map.fitBounds(bounds);
      }
    }
  }, [selectedCities, map]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      const newMap = new window.google.maps.Map(document.getElementById('map'), {
        center: { lat: 0, lng: 0 },
        zoom: 2,
      });
      setMap(newMap);
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleCitySelect = selectedOptions => {
    setSelectedCities(selectedOptions);
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Select
        options={cities}
        isMulti
        onChange={handleCitySelect}
        value={selectedCities}
        placeholder="Select cities..."
        isSearchable
        style={{ width: '30%', padding: '10px' }}
      />
      <div style={{ flex: 1 }}>
        <div id="map" style={{ height: '100%', width: '100%' }}></div>
      </div>
    </div>
  );
}

export default App;