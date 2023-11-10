import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";

//Taken from google
function calculateDistance(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371; // Earth's radius in kilometers

  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = earthRadius * c; // Distance in kilometers

  return distance;
}

//Brute force TSP will not work. I need to use Nearest neighbour or effcient TSP(Traveling Salesman Problem) algo
function nearestNeighborTSP(cities) {
  const remainingCities = [...cities];
  const startCity = remainingCities.shift(); // Start with the first city
  const orderedCities = [startCity];

  while (remainingCities.length > 0) {
    let minDistance = Infinity;
    let nearestCity = null;

    orderedCities.slice(-1).forEach((cityA) => {
      remainingCities.forEach((cityB) => {
        const dist = calculateDistance(
          cityA.latitude,
          cityA.longitude,
          cityB.latitude,
          cityB.longitude
        );
        if (dist < minDistance) {
          minDistance = dist;
          nearestCity = cityB;
        }
      });
    });

    if (nearestCity) {
      orderedCities.push(nearestCity);
      const index = remainingCities.indexOf(nearestCity);
      if (index > -1) {
        remainingCities.splice(index, 1);
      }
    } else {
      // In case nearest city is not found (could be due to disconnected graph)
      break;
    }
  }

  return orderedCities.map((city) => city.label);
}

function App() {
  const [cities, setCities] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [map, setMap] = useState(null);
  const [ShowCityLabel, setShowCityLabel] = useState("");

  useEffect(() => {
    async function fetchCities() {
      try {
        const response = await axios.get("http://localhost:5000/cities");
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
    const script = document.createElement("script");
    script.src =
      "https://maps.googleapis.com/maps/api/js?key=AIzaSyBZdbI8cT6dvLfBN2ORpPaTOl8ElNt3YvE";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      const newMap = new window.google.maps.Map(
        document.getElementById("map"),
        {
          center: { lat: 18.975, lng: 72.825833 }, // Set default center and zoom
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

  function GetLabelString(orderedCities) {
    return (
      <>
        Hi traveller,
        <br></br>I am happy to help you.
        <br></br>
        You are travelling from <b>{orderedCities[0]}</b> to{" "}
        <b>{orderedCities[orderedCities.length - 1]}</b>{" "}
        {orderedCities.map((e, index) =>
          index != 0 && index < orderedCities.length - 1 ? (
            <>
              {" "}
              {index == 1 ? (
                <>
                  <span> via</span>
                </>
              ) : (
                <>
                  <span>, </span>
                </>
              )}{" "}
              <b>{e}</b>{" "}
            </>
          ) : (
            ""
          )
        )}
        <br></br>
        You should travel in below sequence.{" "}
        {orderedCities.map((e, index) => (
          <>
            <li><b>{e}</b></li>
          </>
        ))}
        <span>.</span>
      </>
    );
  }

  useEffect(() => {
    if (window.google && map && selectedCities.length > 1) {
      const bounds = new window.google.maps.LatLngBounds();
      const orderedCities = nearestNeighborTSP(selectedCities); // Get the ordered cities
      const orderedCityObjects = selectedCities.filter((city) =>
        orderedCities.includes(city.label)
      );

      orderedCityObjects.forEach((city) => {
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
      if (orderedCityObjects.length > 0) {
        map.fitBounds(bounds);
        setShowCityLabel(GetLabelString(orderedCities)); // Get the ordered city names
      }
    }
  }, [selectedCities, map]);

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
      <div style={{ padding: "10px" }}>{ShowCityLabel}</div>
      <br />
      <div style={{ margin: "1% 1% 1% 1%" }}>
        <div
          id="map"
          style={{ height: "80%", width: "98%", position: "absolute" }}
        ></div>
      </div>
    </div>
  );
}

export default App;
