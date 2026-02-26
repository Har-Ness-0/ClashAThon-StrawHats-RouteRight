import React, { useState, useEffect } from "react";
import {
  MapPin,
  ChevronDown,
  Plus,
  Minus,
  X,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  Navigation,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
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

const busIcon = L.divIcon({
  className: "custom-bus-marker",
  html: `
    <div class="relative flex items-center justify-center w-12 h-12">
      <div class="absolute w-full h-full bg-[#4285F4] rounded-full opacity-25 animate-ping" style="animation-duration: 2s;"></div>
      <div class="relative w-5 h-5 bg-[#4285F4] rounded-full border-[3px] border-white shadow-md z-10"></div>
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

const MapEventHandler = ({ onMapInteract }) => {
  useMapEvents({ click: onMapInteract, dragstart: onMapInteract });
  return null;
};

const INITIAL_MAP_CENTER = [26.4525, 87.2718];

const StudentLiveMap = () => {
  const navigate = useNavigate();
  const [mapRef, setMapRef] = useState(null);
  const [liveMarkers, setLiveMarkers] = useState({});
  const [status, setStatus] = useState("idle");
  const [routeStops, setRouteStops] = useState([]);
  const [selectedStop, setSelectedStop] = useState(null);
  const [waitTime, setWaitTime] = useState(2);
  const [isExpanded, setIsExpanded] = useState(true);
  const [currentRequestId, setCurrentRequestId] = useState(null);
  const location = useLocation();
  const { busId, busNumber } = location.state || {};
  const currentRoute = busId || busNumber || "699d903c43bed83f3998d582";
  const [realCalculatedEta, setRealCalculatedEta] = useState(null);
  const [nextStopName, setNextStopName] = useState("Loading...");

  // Calculate straight-line distance between two coordinates in km
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Get ETA dynamically for ANY stop in the dropdown list
  const getStopEta = (stop) => {
    if (!stop || !stop.lat || !stop.lng)
      return stop.eta ? `${stop.eta} min` : "--";

    const markerIds = Object.keys(liveMarkers);
    if (markerIds.length === 0) return stop.eta ? `${stop.eta} min` : "--";

    const bus = liveMarkers[markerIds[0]];
    const distanceInKm = calculateDistance(
      bus.lat,
      bus.lng,
      stop.lat,
      stop.lng,
    );

    if (distanceInKm < 0.05) return "Arriving!";
    if (bus.speed === 0) return "Idle";

    return `${Math.ceil((distanceInKm / 25) * 60)} min`;
  };

  // REAL ETA CALCULATOR
  useEffect(() => {
    if (!selectedStop || !selectedStop.lat || !selectedStop.lng) {
      setRealCalculatedEta(null);
      return;
    }

    const markerIds = Object.keys(liveMarkers);
    if (markerIds.length === 0) {
      setRealCalculatedEta(null);
      return;
    }

    const bus = liveMarkers[markerIds[0]];
    const distanceInKm = calculateDistance(
      bus.lat,
      bus.lng,
      selectedStop.lat,
      selectedStop.lng,
    );

    if (distanceInKm < 0.05) {
      setRealCalculatedEta("Arriving!");
    } else if (bus.speed === 0) {
      setRealCalculatedEta("Idle"); // Handle Idle state for big display
    } else {
      const etaMins = Math.ceil((distanceInKm / 25) * 60);
      setRealCalculatedEta(etaMins);
    }
  }, [liveMarkers, selectedStop]);

  // Fetch stops from DB
  useEffect(() => {
    const fetchStops = async () => {
      try {
        const token = getToken();
        const res = await fetch(`${API_BASE_URL}/student/${busId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const busData = await res.json();
          if (busData.route && busData.route.stops) {
            setRouteStops(busData.route.stops);
            const stopsArray = busData.route.stops;
            if (stopsArray.length > 0) {
              setSelectedStop(stopsArray[stopsArray.length - 1]);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching stops:", err);
      }
    };

    if (busId) {
      fetchStops();
    }
  }, [busId]);

  // --- DYNAMIC NEXT STOP CALCULATOR ---
  useEffect(() => {
    if (routeStops.length === 0) return;

    const markerIds = Object.keys(liveMarkers);
    if (markerIds.length === 0) {
      setNextStopName(routeStops[0]?.stopName || "--");
      return;
    }

    const bus = liveMarkers[markerIds[0]];
    let closestStop = null;
    let minDistance = Infinity;
    let closestIndex = 0;

    // Looping throgugh all stops to find the closest one to the bus
    routeStops.forEach((stop, index) => {
      const dist = calculateDistance(bus.lat, bus.lng, stop.lat, stop.lng);
      if (dist < minDistance) {
        minDistance = dist;
        closestStop = stop;
        closestIndex = index;
      }
    });

    if (closestStop) {
      // If the bus is basically AT the stop (less than 50 meters away), show the *following* stop
      if (minDistance < 0.05) {
        const nextIndex = (closestIndex + 1) % routeStops.length;
        setNextStopName(routeStops[nextIndex].stopName);
      } else {
        // Otherwise, the closest stop is the next stop
        setNextStopName(closestStop.stopName);
      }
    }
  }, [liveMarkers, routeStops]);
  // --- SOCKET LISTENERS ---
  useEffect(() => {
    // 1. Join the room
    console.log("STUDENT JOINING ROOM:", currentRoute);
    socket.emit("join-route", currentRoute);
    socket.emit("request-location", currentRoute);

    // 2. Listen for the bus moving
    socket.on("receive-location", (data) => {
      const { id, latitude, longitude, speed } = data;

      setLiveMarkers((prev) => ({
        ...prev,
        [id]: {
          lat: latitude,
          lng: longitude,
          speed: speed || 0,
          lastUpdate: Date.now(),
        },
      }));
    });

    socket.on("driver-offline", (data) => {
      setLiveMarkers((prev) => {
        const newState = { ...prev };
        delete newState[data.id];
        return newState;
      });
    });

    return () => {
      socket.off("receive-location");
      socket.off("driver-offline");
    };
  }, [currentRoute]);

  // --- LISTEN FOR DRIVER WAIT RESPONSE ---
  useEffect(() => {
    const handleDriverResponse = (data) => {
      if (data && data.status) {
        // This updates the UI to show the green Check or red X
        setStatus(data.status.toLowerCase());

        // Automatically reset back to "idle" after 6 seconds
        setTimeout(() => {
          setStatus("idle");
          setWaitTime(2);
        }, 6000);
      }
    };

    // EXACT MATCH WITH YOUR BACKEND:
    socket.on("wait-request-status", handleDriverResponse);

    return () => {
      socket.off("wait-request-status", handleDriverResponse);
    };
  }, []);

  // Cleanup old markers
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveMarkers((prev) => {
        const now = Date.now();
        const updated = { ...prev };
        Object.entries(prev).forEach(([id, driver]) => {
          if (now - driver.lastUpdate > 200000) delete updated[id];
        });
        return updated;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleRecenter = () => {
    const markerIds = Object.keys(liveMarkers);
    if (mapRef && markerIds.length > 0) {
      const driver = liveMarkers[markerIds[0]];
      mapRef.flyTo([driver.lat, driver.lng], 15, {
        animate: true,
        duration: 1.5,
      });
    } else if (mapRef) {
      mapRef.flyTo(INITIAL_MAP_CENTER, 15, { animate: true, duration: 1.5 });
    }
  };

  const handleStartRequest = () => {
    setIsExpanded(true);
    setStatus("selecting_time");
  };

  // --- SEND WAIT REQUEST ---
  const handleSendRequest = async () => {
    setStatus("pending");
    const token = getToken();
    const payload = {
      busId: busId,
      stopName: selectedStop?.stopName,
      waitMinutes: Number(waitTime),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/wait-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentRequestId(data._id);
        socket.emit("send-wait-request", {
          routeId: currentRoute,
          requestId: data._id,
        });
      } else {
        const errorData = await res.json().catch(() => ({}));
        setStatus("idle");
        alert(`Failed: ${errorData.message || "Unknown Server Error"}`);
      }
    } catch (error) {
      console.error("Network/Fetch Error:", error);
      setStatus("idle");
    }
  };

  const handleReset = () => {
    setStatus("idle");
    setWaitTime(2);
  };

  const formattedTime = `0${waitTime}:00`.slice(-5);

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-900 font-sans overflow-hidden select-none">
      {/* HEADER */}
      <header className="absolute left-4 right-4 z-40 flex justify-between items-center pointer-events-none top-[max(1rem,env(safe-area-inset-top))] mt-2">
        <button
          onClick={() => navigate(-1)}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-xl shadow-lg text-slate-700 active:scale-90 transition-all pointer-events-auto border border-white/50"
        >
          <ArrowLeft size={22} strokeWidth={2.5} />
        </button>
        <div className="bg-white/90 backdrop-blur-xl px-4 py-2.5 rounded-full shadow-lg border border-white/50 flex items-center gap-2.5 pointer-events-auto">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </div>
          <span className="text-[13px] font-extrabold text-slate-800 tracking-wide">
            KO-25 Live
          </span>
        </div>
      </header>

      {/* MAP AREA */}
      <main className="absolute inset-0 z-0 bg-[#EBEBEB] touch-none">
        <MapContainer
          center={INITIAL_MAP_CENTER}
          zoom={15}
          zoomControl={false}
          style={{ height: "100%", width: "100%", zIndex: 0 }}
          ref={setMapRef}
        >
          <TileLayer
            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&scale=2"
            attribution="&copy; Google Maps"
            maxZoom={20}
          />
          <MapEventHandler onMapInteract={() => setIsExpanded(false)} />
          {Object.entries(liveMarkers).map(([id, position]) => (
            <Marker
              key={id}
              position={[position.lat, position.lng]}
              icon={busIcon}
            />
          ))}

          {Object.keys(liveMarkers).length > 0 &&
            routeStops.map((stop, index) => (
              <Marker
                key={stop._id || `stop-${index}`}
                position={[stop.lat, stop.lng]}
                icon={stopIcon}
              />
            ))}
        </MapContainer>
      </main>

      {/* BOTTOM SHEET */}
      <div
        className={`absolute bottom-0 w-full bg-white/95 backdrop-blur-3xl rounded-t-[36px] shadow-[0_-20px_50px_rgba(0,0,0,0.15)] z-30 px-6 pb-[max(2rem,env(safe-area-inset-bottom))] flex flex-col border-t border-white transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isExpanded ? "translate-y-0" : "translate-y-[calc(100%-115px)]"}`}
      >
        {/* FABs */}
        <div className="absolute bottom-full right-4 mb-6 flex flex-col gap-4 z-40 pointer-events-none">
          <div className="w-14 h-14 bg-white/95 backdrop-blur-xl rounded-[20px] shadow-[0_8px_25px_rgba(0,0,0,0.12)] border border-white flex flex-col items-center justify-center text-slate-800 pointer-events-auto">
            {/* NEW: Dynamic Speedometer Output */}
            <span className="text-[22px] font-black leading-none tracking-tighter">
              {Object.values(liveMarkers)[0]?.speed || 0}
            </span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
              km/h
            </span>
          </div>
          <button
            onClick={handleRecenter}
            className="w-14 h-14 bg-[#1A56DB] backdrop-blur-xl rounded-full shadow-[0_8px_25px_rgba(26,86,219,0.35)] border border-blue-400/50 text-white flex items-center justify-center active:scale-90 transition-all pointer-events-auto"
          >
            <Navigation size={22} className="fill-white/20" />
          </button>
        </div>

        {/* CLICKABLE HEADER AREA */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex flex-col pt-4 pb-2 cursor-pointer active:opacity-70 transition-opacity"
        >
          <div className="w-12 h-1.5 bg-slate-300/80 rounded-full mx-auto mb-5 shrink-0"></div>
          <div
            className={`transition-all duration-400 ease-[cubic-bezier(0.25,1,0.5,1)] overflow-hidden ${status === "selecting_time" || status !== "idle" ? "max-h-0 opacity-0 mb-0" : "max-h-24 opacity-100"}`}
          >
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-400 font-bold tracking-widest uppercase mb-1">
                  Arriving In
                </span>
                <div className="flex items-baseline gap-1">
                  {/*  Displays "Idle", "Arriving!", or numerical minutes */}
                  <h2
                    className={`text-5xl font-black text-[#1A56DB] tracking-tighter leading-none ${realCalculatedEta === "Idle" || realCalculatedEta === "Arriving!" ? "text-3xl" : ""}`}
                  >
                    {realCalculatedEta !== null
                      ? realCalculatedEta
                      : selectedStop?.eta
                        ? selectedStop.eta
                        : "--"}
                  </h2>
                  {/* Hide 'min' text if status is Idle or Arriving */}
                  {realCalculatedEta !== "Idle" &&
                    realCalculatedEta !== "Arriving!" && (
                      <span className="text-lg font-bold text-slate-400 mb-1">
                        min
                      </span>
                    )}
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className="text-[11px] text-slate-400 font-bold tracking-widest uppercase mb-1">
                  Next Stop
                </span>
                <p className="text-xl font-bold text-slate-800 tracking-tight truncate max-w-[140px]">
                  {nextStopName}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* --- DYNAMIC UI AREA --- */}
        <div className="flex flex-col gap-4 mt-4 w-full">
          {/* STATE: IDLE */}
          {status === "idle" && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-300">
              <div
                onClick={() => setStatus("selecting_stop")}
                className="flex items-center justify-between bg-slate-50 border border-slate-200/60 px-5 py-4 rounded-[20px] active:bg-slate-100 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                    Drop me at
                  </span>
                  <div className="flex items-center gap-2.5">
                    <MapPin size={20} className="text-[#1A56DB] fill-blue-50" />
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">
                      {selectedStop?.stopName || "Select a stop"}
                    </h2>
                  </div>
                </div>
                <div className="w-9 h-9 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center">
                  <ChevronDown size={20} className="text-slate-400" />
                </div>
              </div>

              <button
                onClick={handleStartRequest}
                className="w-full h-[64px] bg-[#1A56DB] text-white font-bold text-lg rounded-[20px] shadow-[0_8px_20px_-6px_rgba(26,86,219,0.5)] transition-transform active:scale-[0.97] flex items-center justify-center shrink-0"
              >
                Request Driver to Wait
              </button>
            </div>
          )}

          {/* STATE: SELECTING STOP */}
          {status === "selecting_stop" && (
            <div className="flex flex-col w-full bg-white animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-xl font-black text-slate-800 tracking-tight">
                  Select Stop
                </h3>
                <button
                  onClick={() => setStatus("idle")}
                  className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 active:scale-90 transition-all"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-2 pb-2">
                {routeStops.map((stop, index) => (
                  <div
                    key={stop._id || index}
                    onClick={() => {
                      setSelectedStop(stop);
                      setStatus("idle");
                    }}
                    className={`px-5 py-3.5 rounded-[16px] border font-bold cursor-pointer active:scale-95 transition-all flex items-center justify-between ${selectedStop?._id === stop._id ? "bg-blue-50 border-blue-200 text-[#1A56DB]" : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100"}`}
                  >
                    <span>{stop.stopName}</span>
                    <span className="text-sm font-medium opacity-60">
                      {getStopEta(stop)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STATE: SELECTING TIME */}
          {status === "selecting_time" && (
            <div className="flex flex-col gap-5 w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-800 tracking-tight">
                  Wait Duration
                </h3>
                <button
                  onClick={handleReset}
                  className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 active:bg-slate-200 active:scale-90 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex gap-3 w-full">
                {[1, 2, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => setWaitTime(num)}
                    className={`flex-1 py-3.5 rounded-[16px] text-base font-black transition-all active:scale-95 ${waitTime === num ? "bg-blue-100 text-[#1A56DB] border-2 border-blue-300 shadow-inner" : "bg-slate-50 text-slate-500 border-2 border-transparent hover:bg-slate-100"}`}
                  >
                    {num} min
                  </button>
                ))}
              </div>

              <div className="flex gap-3 w-full">
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-[20px] flex items-center justify-between px-3 h-[64px]">
                  <button
                    onClick={() => setWaitTime(Math.max(1, waitTime - 1))}
                    className="w-12 h-12 bg-white rounded-[14px] shadow-sm flex items-center justify-center text-slate-600 active:scale-90 transition-transform"
                  >
                    <Minus size={22} />
                  </button>
                  <span className="text-3xl font-black text-slate-800 tabular-nums tracking-tighter">
                    {formattedTime}
                  </span>
                  <button
                    onClick={() => setWaitTime(Math.min(60, waitTime + 1))}
                    className="w-12 h-12 bg-white rounded-[14px] shadow-sm flex items-center justify-center text-slate-600 active:scale-90 transition-transform"
                  >
                    <Plus size={22} />
                  </button>
                </div>
                <button
                  onClick={handleSendRequest}
                  className="px-8 h-[64px] bg-slate-900 text-white font-bold text-lg rounded-[20px] shadow-lg active:scale-[0.96] transition-transform"
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {/* STATES: PENDING / APPROVED / DECLINED */}
          {(status === "pending" ||
            status === "approved" ||
            status === "declined") && (
            <div className="w-full h-[64px] shrink-0">
              {status === "pending" && (
                <div className="w-full h-full bg-slate-100 rounded-[20px] flex items-center justify-center gap-3 animate-in fade-in duration-300">
                  <Loader2 className="animate-spin text-slate-400" size={24} />
                  <span className="text-slate-600 font-bold tracking-tight">
                    Awaiting driver response...
                  </span>
                </div>
              )}

              {status === "approved" && (
                <div className="w-full h-full bg-[#34C759]/10 border border-[#34C759]/20 rounded-[20px] flex items-center justify-center gap-2 text-[#34C759] animate-in zoom-in-95 duration-300">
                  <CheckCircle2 size={24} className="fill-[#34C759]/20" />
                  <span className="font-bold tracking-tight">
                    Driver accepted your wait request!
                  </span>
                </div>
              )}

              {status === "declined" && (
                <div className="w-full h-full bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-[20px] flex items-center justify-center gap-2 text-[#FF3B30] animate-in zoom-in-95 duration-300">
                  <XCircle size={24} className="fill-[#FF3B30]/20" />
                  <span className="font-bold tracking-tight">
                    Sorry, driver cannot wait right now.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentLiveMap;
