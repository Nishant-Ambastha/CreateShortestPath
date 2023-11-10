import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";

function App() {
  const [cities, setCities] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [map, setMap] = useState(null);

  useEffect(() => {
    async function fetchCities() {
      try {
        const response = await axios.get("http://localhost:5000/cities"); // Replace with your backend URL
        const formattedCities = response.data.map((city) => ({
          value: city.name,
          label: city.name + " (" + city.state + ")",
          latitude: parseFloat(city.lat),
          longitude: parseFloat(city.lon),
        }));
        setCities(formattedCities);
      } catch (error) {
        console.error("Failed to fetch cities", error);
      }
    }

    fetchCities();
  }, []);

  useEffect(() => {
    console.log(selectedCities);
    if (window.google && map) {
      const bounds = new window.google.maps.LatLngBounds();
      selectedCities.forEach((city) => {
        const position = new window.google.maps.LatLng(
          city.latitude,
          city.longitude
        );
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
    const script = document.createElement("script");
    script.src =
      "https://maps.googleapis.com/maps/api/js?key=AIzaSyBZdbI8cT6dvLfBN2ORpPaTOl8ElNt3YvE";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      const newMap = new window.google.maps.Map(
        document.getElementById("map"),
        {
          center: { lat: 18.975, lng: 72.825833 },
          zoom: 2,
        }
      );
      setMap(newMap);
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleCitySelect = (selectedOptions) => {
    setSelectedCities(selectedOptions);
  };

  return (
    <div>
      <div style={{ width: "50%", padding: "10px" }}>
      <Select
        options={cities}
        isMulti
        onChange={handleCitySelect}
        value={selectedCities}
        placeholder="Select cities..."
        isSearchable
      />
      </div>
      <br></br>
      <div style={{margin:"1% 1% 1% 1%"}}>
        <div id="map" style={{ height: "80%", width: "98%", position:"absolute" }}></div>
      </div>
    </div>
  );
}

export default App;
