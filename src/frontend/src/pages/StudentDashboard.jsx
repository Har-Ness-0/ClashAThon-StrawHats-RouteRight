import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bus, MapPin, ChevronRight, Navigation } from "lucide-react";
import { io } from "socket.io-client"; // NEW: Import Socket.io
import { API_BASE_URL, SOCKET_URL } from "../../src/config.js";

//Setup socket connection
const socket = io(`${SOCKET_URL}`, {
  transports: ["websocket"],
  upgrade: false,
});

//Routes are not dynamic due to time constraint, it was to be in fetching from DB
const ROUTES = [
  {
    id: 1,
    name: "Dulari - Biratnagar",
    status: "Not Departed",
    busNo: "KO - 25 - 4378",
  },
  {
    id: 2,
    name: "Dulari - Dharan",
    status: "Not Departed",
    busNo: "KO - 25 - 5671",
  },
  {
    id: 3,
    name: "Dulari - Kerkha",
    status: "Not Departed",
    busNo: "KO - 25 - 1492",
  },
  {
    id: 4,
    name: "Dulari - Damak",
    status: "Not Departed",
    busNo: "KO - 25 - 2396",
  },
  {
    id: 5,
    name: "Dulari - Kanchi Chowk",
    status: "Not Departed",
    busNo: "KO - 25 - 9982",
  },
];

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState({ weekday: "", dayMonth: "" });
  const [isMvpLive, setIsMvpLive] = useState(false); // Track if driver is active

  const MVP_ROUTE_ID = "699d903c43bed83f3998d582";

  useEffect(() => {
    const today = new Date();
    setCurrentDate({
      weekday: today.toLocaleDateString("en-US", { weekday: "long" }),
      dayMonth: today.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
      }),
    });

    // Socket Listeners to check if the bus is active right now
    socket.emit("join-route", MVP_ROUTE_ID);
    socket.emit("request-location", MVP_ROUTE_ID); // Ask if driver is already running

    socket.on("receive-location", () => {
      setIsMvpLive(true); // Driver is broadcastingg
    });

    socket.on("driver-offline", () => {
      setIsMvpLive(false); // Driver stopped the ride
    });

    return () => {
      socket.off("receive-location");
      socket.off("driver-offline");
    };
  }, []);

  const handleRouteClick = (route, isLive) => {
    if (route.id === 1) {
      if (isLive) {
        navigate("/student/panel", {
          state: {
            busId: MVP_ROUTE_ID,
            busNumber: route.busNo,
          },
        });
      } else {
        alert(
          "This bus hasn't departed yet. Wait for the driver to start the ride!",
        );
      }
    } else {
      alert(
        "This route is currently offline. Please use 'Dulari - Biratnagar' for the MVP demo.",
      );
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 font-['Inter'] pb-10">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');`}</style>

      {/* Header */}
      <header className="pt-10 px-6 pb-4 max-w-2xl mx-auto w-full sticky top-0 bg-slate-50/90 backdrop-blur-md z-50">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-sm text-slate-500 font-medium mb-1">
              {currentDate.weekday}, {currentDate.dayMonth}
            </p>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Live Routes
            </h1>
          </div>

          {/* Profile Avatar */}
          <div className="flex flex-col items-center">
            <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm ring-2 ring-white">
              AS
            </div>
          </div>
        </div>
      </header>

      {/* Main List */}
      <main className="max-w-2xl mx-auto px-5 mt-4 space-y-4">
        {ROUTES.map((route) => {
          // Dynamically determine if this specific card should be styled as "Live"
          const isThisRouteMvp = route.id === 1;
          const isCurrentlyLive = isThisRouteMvp && isMvpLive;
          const displayStatus = isCurrentlyLive ? "Departed" : "Not Departed";
          const isDeparted = displayStatus === "Departed";

          return (
            <div
              key={route.id}
              onClick={() => handleRouteClick(route, isCurrentlyLive)}
              className={`group bg-white rounded-2xl p-5 transition-all duration-200 cursor-pointer border active:scale-[0.99] ${
                isCurrentlyLive
                  ? "border-blue-100 shadow-md shadow-blue-900/5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-900/10"
                  : "border-slate-100 shadow-sm opacity-80 hover:opacity-100"
              }`}
            >
              {/* Card Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2
                    className={`text-xl font-bold mb-1.5 tracking-tight ${isCurrentlyLive ? "text-slate-900" : "text-slate-600"}`}
                  >
                    {route.name}
                  </h2>
                  <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                    <Bus
                      size={16}
                      className={
                        isCurrentlyLive ? "text-blue-500" : "text-slate-400"
                      }
                    />
                    <span>{route.busNo}</span>
                  </div>
                </div>

                {/* Status Badge */}
                <div
                  className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2 ${
                    isDeparted
                      ? isCurrentlyLive
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10"
                        : "bg-slate-100 text-slate-500"
                      : "bg-rose-50 text-rose-600 ring-1 ring-rose-600/10"
                  }`}
                >
                  {isCurrentlyLive && isDeparted && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  )}
                  {displayStatus}
                </div>
              </div>

              {/* Action Area */}
              <div
                className={`rounded-xl p-4 flex items-center justify-between transition-colors ${
                  isCurrentlyLive
                    ? "bg-blue-50/50 group-hover:bg-blue-50/80"
                    : "bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  {isCurrentlyLive ? (
                    <div className="relative flex items-center justify-center w-6 h-6 text-blue-600">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-20 duration-1000"></span>
                      <Navigation
                        size={18}
                        className="fill-blue-600 drop-shadow-sm"
                      />
                    </div>
                  ) : (
                    <MapPin size={18} className="text-slate-400" />
                  )}
                  <span
                    className={`text-sm font-semibold ${isCurrentlyLive ? "text-blue-700" : "text-slate-500"}`}
                  >
                    {isCurrentlyLive
                      ? "Track Live Location"
                      : "Location Offline"}
                  </span>
                </div>

                <ChevronRight
                  size={20}
                  className={` transition-transform duration-200 ${
                    isCurrentlyLive
                      ? "text-blue-400 group-hover:translate-x-1 group-hover:text-blue-600"
                      : "text-slate-300"
                  }`}
                />
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
};

export default StudentDashboard;
