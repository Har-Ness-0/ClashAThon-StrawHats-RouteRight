import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Check,
  X,
  User,
  Power,
  Radio,
  AlertTriangle,
  Navigation,
} from "lucide-react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { io } from "socket.io-client";
import { useLocation } from "react-router-dom";
import { API_BASE_URL, SOCKET_URL } from "../../src/config.js";


// --- CONFIG ---
const socket = io(`${SOCKET_URL}`, {
  transports: ["websocket"],
  upgrade: false,
});
const getToken = () => localStorage.getItem("token");

const driverIcon = L.divIcon({
  className: "custom-driver-marker",
  html: `
    <div class="relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12">
      <div class="absolute w-full h-full bg-[#007AFF] rounded-full opacity-20 animate-ping" style="animation-duration: 2.5s;"></div>
      <div class="relative w-5 h-5 md:w-6 md:h-6 bg-[#007AFF] rounded-full border-[3px] border-white shadow-md z-10 flex items-center justify-center"></div>
    </div>
  `,
  iconSize: [48, 48],
  iconAnchor: [24, 24],
});
const stopIcon = L.divIcon({
  className: "custom-stop-marker",
  html: `<div class="w-4 h-4 bg-white border-[3px] border-[#1A56DB] rounded-full shadow-sm"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});
const INITIAL_MAP_CENTER = [26.4525, 87.2718];

const DriverPanel = () => {
  const [mapRef, setMapRef] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [currentSpeed, setCurrentSpeed] = useState(0); // Track speed dynamically
  const [error, setError] = useState(null);
  const [appeals, setAppeals] = useState([]);

  const watchIdRef = useRef(null);
  const demoIntervalRef = useRef(null);
  const [routeStops, setRouteStops] = useState([]);
  const [destination, setDestination] = useState("Loading Destination...");

  // Refs to keep socket listeners perfectly synced with current state
  const isTrackingRef = useRef(isTracking);
  const currentLocationRef = useRef(currentLocation);
  const currentSpeedRef = useRef(currentSpeed);

  const location = useLocation();
  const { busId, busNumber } = location.state || {};
  const currentRoute = busNumber || "699d903c43bed83f3998d582";

  // Making refs synced with state instantly
  useEffect(() => {
    isTrackingRef.current = isTracking;
    currentLocationRef.current = currentLocation;
    currentSpeedRef.current = currentSpeed;
  }, [isTracking, currentLocation, currentSpeed]);

  // --- FETCH APPEALS ---
  const fetchAppeals = async () => {
    const token = getToken();
    try {
      const res = await fetch(`${API_BASE_URL}/wait-requests/driver-req`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setAppeals(data);
      }
    } catch (err) {
      console.error("Network Error fetching appeals:", err);
    }
  };

  useEffect(() => {
    socket.emit("join-route", currentRoute);
    fetchAppeals();

    socket.on("receive-wait-request", () => {
      fetchAppeals();
    });

    // Handle late-joining students
    socket.on("request-location", () => {
      if (isTrackingRef.current && currentLocationRef.current) {
        socket.emit("send-location", {
          id: socket.id,
          routeId: currentRoute,
          latitude: currentLocationRef.current[0],
          longitude: currentLocationRef.current[1],
          speed: currentSpeedRef.current, //Send current speed to late joiners
        });
      }
    });

    return () => {
      if (watchIdRef.current !== null)
        navigator.geolocation.clearWatch(watchIdRef.current);
      if (demoIntervalRef.current !== null)
        clearInterval(demoIntervalRef.current);
      socket.off("receive-wait-request");
      socket.off("request-location");
    };
  }, []);

  // --- FETCH ROUTE STOPS & DESTINATION ---
  useEffect(() => {
    const fetchStops = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/student/${currentRoute}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const busData = await res.json();
          if (busData.route && busData.route.stops) {
            const stopsArray = busData.route.stops;
            setRouteStops(stopsArray);

            // The last stop in the array is the destinationn
            if (stopsArray.length > 0) {
              setDestination(stopsArray[stopsArray.length - 1].stopName);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching stops:", err);
      }
    };

    if (currentRoute) {
      fetchStops();
    }
  }, [currentRoute]);
  // --- REAL TRACKING LOGIC ---
  const toggleTracking = () => {
    if (isTracking) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (demoIntervalRef.current !== null) {
        clearInterval(demoIntervalRef.current);
        demoIntervalRef.current = null;
      }
      setIsTracking(false);
      setCurrentLocation(null);
      setCurrentSpeed(0); // Reset speed

      socket.emit("driver-offline", { routeId: currentRoute, id: socket.id });
    } else {
      if (!navigator.geolocation) return setError("Geolocation not supported.");
      setError(null);
      setIsTracking(true);

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, speed } = position.coords;
          setCurrentLocation([latitude, longitude]);

          // GPS speed is in meters/second. Convert to km/h. Fallback to 0 if null.
          const calcSpeed = speed ? Math.round(speed * 3.6) : 0;
          setCurrentSpeed(calcSpeed);

          socket.emit("send-location", {
            routeId: currentRoute,
            latitude,
            longitude,
            speed: calcSpeed, //Broadcast real speed
          });

          if (mapRef) {
            mapRef.flyTo([latitude, longitude], 16, {
              animate: true,
              duration: 1,
            });
          }
        },
        (err) => {
          setError("Failed to get location. Enable GPS.");
          setIsTracking(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
      );
    }
  };

  // --- FAKE TRACKING for HACKATHON DEMO ---
  const startDemoDrive = () => {
    // Clear any existing tracking first
    if (watchIdRef.current !== null)
      navigator.geolocation.clearWatch(watchIdRef.current);
    if (demoIntervalRef.current !== null)
      clearInterval(demoIntervalRef.current);

    setIsTracking(true);
    const demoSpeed = 45; // Set fake speed
    setCurrentSpeed(demoSpeed);

    // Starting coordinates
    let lat = 26.4525;
    let lng = 87.2718;
    const startPos = [lat, lng];

    if (mapRef) {
      mapRef.flyTo(startPos, 16, { animate: true, duration: 1.5 });
    }

    const demoInterval = setInterval(() => {
      lat += 0.0003;
      lng += 0.0003;

      const newPos = [lat, lng];
      setCurrentLocation(newPos);

      // 1. DEFINE THE PAYLOAD FIRST
      const payload = {
        id: socket.id, // for the student map to track this specific driver
        routeId: currentRoute, // MUST match the student's routeId
        latitude: lat,
        longitude: lng,
        speed: demoSpeed,
      };

      // 3. EMIT IT TO THE SERVER
      socket.emit("send-location", payload);
    }, 2000);

    demoIntervalRef.current = demoInterval;
  };
  // --- HANDLE ACTION ---
  const handleAction = async (id, newStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/wait-requests/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ status: newStatus.toLowerCase() }),
      });

      if (res.ok) {
        setAppeals((prev) =>
          prev.map((appeal) =>
            appeal._id === id
              ? { ...appeal, status: newStatus.toLowerCase() }
              : appeal,
          ),
        );
        socket.emit("respond-wait-request", {
          routeId: currentRoute,
          requestId: id,
          status: newStatus.toLowerCase(),
        });
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const handleRecenter = () => {
    if (mapRef && currentLocation) {
      mapRef.flyTo(currentLocation, 16, { animate: true, duration: 1.5 });
    }
  };

  const today = new Date();
  const dateString = today.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex flex-col min-h-screen md:h-screen bg-[#F2F2F7] font-sans selection:bg-blue-200">
      {/* HEADER */}
      <header className="h-[64px] md:h-[72px] bg-white/80 backdrop-blur-xl border-b border-black/[0.04] px-4 md:px-8 flex items-center justify-between shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-9 h-9 md:w-11 md:h-11 bg-gradient-to-tr from-[#007AFF] to-[#5AC8FA] rounded-full flex items-center justify-center text-white shadow-sm shrink-0">
            <User size={18} className="md:w-[22px] md:h-[22px]" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-[14px] md:text-[15px] font-semibold text-slate-800 leading-tight tracking-tight">
              Ishwor Adams
            </h1>
            <p className="text-[12px] md:text-[13px] text-slate-500 font-medium">
              {currentRoute} <span className="hidden sm:inline">• Driver</span>
            </p>
          </div>
          <div className="h-4 w-[1px] bg-slate-200 mx-1 md:mx-2"></div>
          <div
            className={`px-2 md:px-3.5 py-1 md:py-1.5 rounded-full flex items-center gap-1.5 text-[10px] md:text-[12px] font-bold tracking-wide transition-colors ${isTracking ? "bg-[#34C759]/10 text-[#34C759]" : "bg-slate-100 text-slate-500"}`}
          >
            {isTracking ? (
              <Radio
                size={12}
                className="animate-pulse md:w-[14px] md:h-[14px]"
              />
            ) : (
              <Power size={12} className="md:w-[14px] md:h-[14px]" />
            )}
            <span className="hidden sm:inline">
              {isTracking ? "BROADCASTING" : "OFFLINE"}
            </span>
            <span className="sm:hidden">{isTracking ? "LIVE" : "OFF"}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[13px] md:text-[14px] font-semibold text-slate-800 tracking-tight">
            {dateString}
          </p>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row gap-4 md:gap-6 p-4 md:p-6 overflow-y-auto md:overflow-hidden">
        {/* MAP AREA */}
        <div className="w-full md:w-[45%] flex flex-col gap-4 md:gap-6 shrink-0">
          <div className="h-[45vh] md:h-auto md:flex-1 bg-white rounded-[24px] md:rounded-[32px] shadow-sm border border-black/[0.02] overflow-hidden relative isolate">
            {error ? (
              <div className="w-full h-full flex flex-col items-center justify-center px-6 text-center">
                <AlertTriangle size={36} className="text-[#FF3B30] mb-3" />
                <h2 className="text-base font-semibold">Location Error</h2>
                <p className="text-sm text-slate-500">{error}</p>
              </div>
            ) : (
              <MapContainer
                center={currentLocation || INITIAL_MAP_CENTER}
                zoom={15}
                zoomControl={false}
                style={{ height: "100%", width: "100%" }}
                ref={setMapRef}
              >
                <TileLayer
                  url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&scale=2"
                  attribution="&copy; Google Maps"
                />
                {currentLocation && (
                  <Marker position={currentLocation} icon={driverIcon} />
                )}
                {isTracking &&
                  routeStops.map((stop, index) => (
                    <Marker
                      key={stop._id || `driver-stop-${index}`}
                      position={[stop.lat, stop.lng]}
                      icon={stopIcon}
                    />
                  ))}
              </MapContainer>
            )}

            <button
              onClick={handleRecenter}
              className="absolute bottom-4 right-4 z-[1000] w-12 h-12 bg-[#007AFF] text-white rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-all border-2 border-white"
            >
              <Navigation size={22} className="fill-white/20" />
            </button>

            {/* DYNAMIC SPEEDOMETER UI */}
            {isTracking && (
              <div className="absolute top-4 right-4 z-[1000] w-14 h-14 bg-white/90 backdrop-blur-md rounded-2xl shadow-md border border-white flex flex-col items-center justify-center text-slate-800">
                <span className="text-xl font-bold leading-none">
                  {currentSpeed}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">
                  km/h
                </span>
              </div>
            )}
          </div>

          {/* CONTROLS */}
          <div className="bg-white rounded-[24px] md:rounded-[32px] shadow-sm border border-black/[0.02] flex flex-col md:flex-row items-start md:items-center justify-between p-4 md:px-8 md:h-24 shrink-0 gap-4 md:gap-0">
            {/* Destination Info */}
            <div className="flex flex-col w-full md:w-auto">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                Final Destination
              </span>
              <div className="flex items-center gap-1.5 w-full">
                <MapPin
                  size={18}
                  className="text-[#007AFF] fill-blue-50 shrink-0"
                />
                <span className="text-[16px] md:text-[18px] font-bold text-slate-800 tracking-tight truncate max-w-[250px] md:max-w-[200px]">
                  {destination}
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex w-full md:w-auto gap-2 md:gap-3">
              <button
                onClick={startDemoDrive}
                className="flex-1 md:flex-none px-3 md:px-4 py-3 md:py-3.5 rounded-full font-bold text-[13px] md:text-[14px] bg-purple-100 text-purple-700 hover:bg-purple-200 active:scale-95 transition-all whitespace-nowrap"
              >
                Demo Route
              </button>
              <button
                onClick={toggleTracking}
                className={`flex-1 md:flex-none px-4 md:px-8 py-3 md:py-3.5 rounded-full font-semibold text-[13px] md:text-[14px] shadow-sm active:scale-[0.96] transition-all whitespace-nowrap md:min-w-[120px] ${
                  isTracking
                    ? "bg-[#FF3B30]/10 text-[#FF3B30]"
                    : "bg-[#34C759] text-white"
                }`}
              >
                {isTracking ? "Stop Ride" : "Start Ride"}
              </button>
            </div>
          </div>
        </div>

        {/* --- APPEALS LIST --- */}
        <div className="w-full md:w-[55%] flex-1 bg-white rounded-[24px] md:rounded-[32px] shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-black/[0.02] flex flex-col overflow-hidden min-h-[400px] md:min-h-0">
          <div className="px-5 md:px-8 pt-6 md:pt-8 pb-3 md:pb-4 shrink-0 bg-white z-10">
            <h2 className="text-[20px] md:text-[22px] font-bold text-slate-800 tracking-tight">
              Wait Appeals
            </h2>
            <p className="text-[13px] md:text-[14px] text-slate-500 mt-0.5 md:mt-1">
              Manage incoming requests from students.
            </p>
          </div>
          <div className="w-full flex flex-col flex-1 overflow-hidden">
            <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_1fr] font-semibold text-[12px] text-slate-400 uppercase tracking-wider pb-3 px-8 border-b border-slate-100 shrink-0">
              <div>Student</div>
              <div>Time</div>
              <div>Stop</div>
              <div className="text-right">Action</div>
            </div>
            <div className="overflow-y-auto px-4 md:px-4 pb-4 flex-1">
              <div className="flex flex-col gap-2 md:gap-1 mt-1 md:mt-2">
                {appeals.length === 0 ? (
                  <p className="text-center text-slate-400 mt-10">
                    No pending appeals.
                  </p>
                ) : (
                  appeals.map((appeal) => (
                    <div
                      key={appeal._id}
                      className="flex flex-col md:grid md:grid-cols-[1.5fr_1fr_1fr_1fr] md:items-center py-3.5 px-4 rounded-[16px] transition-colors hover:bg-slate-50 border border-slate-100 md:border-transparent gap-3 md:gap-0"
                    >
                      <div className="flex justify-between items-start md:block w-full">
                        <div className="font-semibold text-slate-800 text-[15px] md:text-[14px]">
                          {appeal.requestedBy?.name || "Student"}
                        </div>
                        <div className="md:hidden bg-slate-100 text-slate-600 text-[11px] font-bold px-2 py-1 rounded-md tracking-wide">
                          {appeal.stopName}
                        </div>
                      </div>

                      <div className="text-slate-500 font-medium text-[13px] md:text-[14px] flex items-center md:block">
                        <span className="md:hidden text-slate-400 mr-1">
                          Wait:{" "}
                        </span>
                        {appeal.waitMinutes} mins
                      </div>

                      <div className="hidden md:block text-slate-600 font-medium text-[14px] truncate pr-2">
                        {appeal.stopName}
                      </div>

                      <div className="flex justify-end items-center gap-2 border-t border-slate-100 md:border-none pt-3 md:pt-0 mt-1 md:mt-0 w-full md:w-auto">
                        {appeal.status === "pending" ? (
                          <>
                            <button
                              onClick={() =>
                                handleAction(appeal._id, "DECLINED")
                              }
                              className="w-10 h-10 md:w-10 md:h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-[#FF3B30]/10 hover:text-[#FF3B30] active:scale-95 transition-all"
                            >
                              <X size={18} strokeWidth={2.5} />
                            </button>
                            <button
                              onClick={() =>
                                handleAction(appeal._id, "APPROVED")
                              }
                              className="flex-1 md:flex-none h-10 px-4 md:w-10 md:p-0 rounded-full bg-[#34C759]/10 text-[#34C759] flex items-center justify-center gap-1.5 md:gap-0 hover:bg-[#34C759]/20 active:scale-95 transition-all font-semibold text-[14px]"
                            >
                              <span className="md:hidden">Accept</span>
                              <Check
                                size={18}
                                strokeWidth={3}
                                className="shrink-0"
                              />
                            </button>
                          </>
                        ) : (
                          <span
                            className={`px-3 py-1.5 text-[11px] font-bold rounded-full uppercase tracking-wider ${appeal.status === "approved" ? "text-[#34C759] bg-[#34C759]/10" : "text-[#FF3B30] bg-[#FF3B30]/10"}`}
                          >
                            {appeal.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DriverPanel;
