import React from "react";
import { useNavigate } from "react-router-dom";
import { DriverProvider, useDriver } from "../context/DriverContext";

// INLINE SVG ICONS

const BusIcon = ({ size = 22, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M8 6v6" />
    <path d="M16 6v6" />
    <path d="M2 12h19.6" />
    <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H6C4.9 6 3.9 6.8 3.6 7.8l-1.4 5c-.1.4-.2.8-.2 1.2 0 .4.1.8.2 1.2C2.5 16.3 3 18 3 18h3" />
    <circle cx="7" cy="18" r="2" />
    <circle cx="17" cy="18" r="2" />
  </svg>
);

const LocationIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="text-white"
  >
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
  </svg>
);

const CampusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-gray-500"
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);

const ChevronRight = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-[#C7C7CC]"
  >
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);


// BUS CARD COMPONENT
const BusCard = ({ bus, isActive, onClick }) => {
  // Mocking A to B route split
  const routeParts = bus.route
    ? bus.route.split(" to ")
    : ["Unknown", "Destination"];
  const origin = routeParts[0];
  const destination = routeParts[1] || "Route";

  return (
    <div
      className={`bg-white rounded-[20px] p-4 sm:p-5 transition-transform active:scale-[0.98] ${isActive ? "shadow-[0_2px_12px_rgb(0,0,0,0.06)]" : "shadow-sm opacity-90"}`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? "bg-[#007AFF] shadow-md shadow-blue-200" : "bg-gray-200"}`}
          >
            <BusIcon
              size={18}
              className={isActive ? "text-white" : "text-gray-500"}
            />
          </div>
          <div>
            <h3 className="text-lg font-bold text-black tracking-tight leading-none mb-1">
              {bus.plateNumber}
            </h3>
            <p className="text-[13px] text-[#8E8E93] font-medium tracking-tight">
              Assigned Vehicle
            </p>
          </div>
        </div>

        {/* Status Badge */}
        {isActive ? (
          <div className="bg-[#E5F1FF] text-[#007AFF] text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF] animate-pulse"></span>
            Active Shift
          </div>
        ) : (
          <div className="bg-[#F2F2F7] text-[#8E8E93] text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide flex items-center gap-1.5">
            Parked
          </div>
        )}
      </div>

      {/* Route Info */}
      <div
        className={`rounded-2xl p-3.5 mb-4 border ${isActive ? "bg-[#F8FBFF] border-[#E5F1FF]" : "bg-[#F2F2F7] border-transparent"}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-[11px] text-[#8E8E93] font-semibold uppercase tracking-wider mb-0.5">
              From
            </p>
            <p className="font-semibold text-black text-sm truncate">
              {origin}
            </p>
          </div>

          <div className="px-3 flex flex-col items-center justify-center">
            {isActive ? (
              <div className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center">
                <LocationIcon className="text-[#007AFF] w-3 h-3" />
              </div>
            ) : (
              <CampusIcon />
            )}
          </div>

          <div className="flex-1 text-right">
            <p className="text-[11px] text-[#8E8E93] font-semibold uppercase tracking-wider mb-0.5">
              To
            </p>
            <p className="font-semibold text-black text-sm truncate">
              {isActive ? destination : "Campus Garage"}
            </p>
          </div>
        </div>

        {!isActive && (
          <p className="text-xs text-[#8E8E93] text-center mt-3 font-medium">
            Currently sitting in the University parking lot.
          </p>
        )}
      </div>

      <button
        onClick={isActive ? onClick : undefined}
        disabled={!isActive}
        className={`w-full py-3.5 rounded-[14px] font-semibold text-[15px] flex items-center justify-center gap-1 transition-colors ${
          isActive
            ? "bg-[#007AFF] text-white hover:bg-[#0066CC]"
            : "bg-[#F2F2F7] text-[#C7C7CC] cursor-not-allowed"
        }`}
      >
        {isActive ? "Start Live Location" : "Route Unavailable"}
      </button>
    </div>
  );
};

// DRIVER DASHBOARD
const DriverDashboardInner = () => {
  const { driverName, buses } = useDriver();
  const navigate = useNavigate();

  const today = new Date();
  const dateOptions = { weekday: "long", month: "long", day: "numeric" };
  const formattedDate = today
    .toLocaleDateString("en-US", dateOptions)
    .toUpperCase();

  return (
    <div className="min-h-screen w-full bg-[#F2F2F7] font-sans selection:bg-blue-200 pb-10">
      {/* HEADER */}
      <header className="pt-12 px-5 sm:px-8 pb-4 max-w-2xl mx-auto w-full sticky top-0 bg-[#F2F2F7]/90 backdrop-blur-xl z-50">
        <p className="text-[13px] text-[#8E8E93] font-semibold tracking-wider mb-1">
          {formattedDate}
        </p>
        <div className="flex justify-between items-end">
          <h1 className="text-3xl font-bold text-black tracking-tight leading-none">
            Welcome,
            <br />
            {driverName ? driverName.split(" ")[0] : "Driver"}
          </h1>
          <div className="w-10 h-10 rounded-full bg-[#E5E5EA] flex items-center justify-center overflow-hidden">
            <BusIcon size={20} className="text-[#8E8E93]" />
          </div>
        </div>
      </header>

      {/* Main List */}
      <main className="max-w-2xl mx-auto px-4 sm:px-8 mt-4 space-y-4">
        {buses && buses.length > 0 ? (
          buses.map((bus, index) => {
            const isActiveRoute = bus.isAssigned;

            return (
              <BusCard
                key={bus.id}
                bus={bus}
                isActive={isActiveRoute}
                onClick={() =>
                  navigate("/driver/panel", {
                    state: {
                      busId: bus._id,
                      busNumber: bus.busNumber,
                    },
                  })
                }
              />
            );
          })
        ) : (
          <div className="mt-10 flex flex-col items-center justify-center text-[#8E8E93]">
            <CampusIcon size={40} className="mb-2 opacity-50" />
            <p className="text-[15px] font-medium">No routes assigned today.</p>
          </div>
        )}
      </main>
    </div>
  );
};

//  EXPORT

const DriverDashboard = () => (
  <DriverProvider>
    <DriverDashboardInner />
  </DriverProvider>
);

export default DriverDashboard;
