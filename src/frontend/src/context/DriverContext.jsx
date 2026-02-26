/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
} from "react";

const DriverContext = createContext(null);

const initialState = {
  isLoading: true, // Wait for DB fetch
  driverName: "Loading...",
  busLocation: { lat: 26.4525, lng: 87.2718 },
  speed: 0,
  socketStatus: "offline",
  currentStopIndex: 0,
  rideStarted: false,
  rideStartTime: null,
  rideCompleted: false,
  stops: [], // Emptied out, will fill from DB
  appeals: [], // Will fill from WaitRequest DB
  buses: [], // Will fill from Bus DB
};

function driverReducer(state, action) {
  switch (action.type) {
    case "SET_INITIAL_DATA":
      return {
        ...state,
        isLoading: false,
        driverName: action.payload.driverName,
        buses: action.payload.buses,
        // Grab the stops from the first populated route as a default fallback
        stops: action.payload.buses[0]?.route?.stops || [],
      };
    case "FETCH_ERROR":
      return { ...state, isLoading: false, driverName: "Error loading driver" };
    case "UPDATE_BUS_LOCATION":
      return { ...state, busLocation: action.payload };
    case "SET_SPEED":
      return { ...state, speed: action.payload };
    case "SET_SOCKET_STATUS":
      return { ...state, socketStatus: action.payload };
    case "ACCEPT_APPEAL":
      return {
        ...state,
        appeals: state.appeals.map((a) =>
          a.id === action.payload ? { ...a, status: "approved" } : a,
        ),
      };
    case "DECLINE_APPEAL":
      return {
        ...state,
        appeals: state.appeals.map((a) =>
          a.id === action.payload ? { ...a, status: "declined" } : a,
        ),
      };
    case "NEXT_STOP":
      return {
        ...state,
        currentStopIndex: Math.min(
          state.currentStopIndex + 1,
          state.stops.length - 1,
        ),
      };
    case "START_RIDE":
      return { ...state, rideStarted: true, rideStartTime: Date.now() };
    case "COMPLETE_RIDE":
      return { ...state, rideCompleted: true };
    default:
      return state;
  }
}

export function DriverProvider({ children }) {
  const [state, dispatch] = useReducer(driverReducer, initialState);

  // --- Fetch driever data on mount---
  useEffect(() => {
    const fetchDriverData = async () => {
      try {
        const token = localStorage.getItem("token"); 
        
        // 1. Fetch User Data
        const userRes = await fetch("http://localhost:5000/api/authenticate", { 
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!userRes.ok) throw new Error("Failed to authenticate");
        const userData = await userRes.json();
        
        const driverName = userData.user.name || "Driver"; 
        // SAFETY CHECK: Handle both _id and id depending on your setup
        const loggedInUserId = userData.user._id || userData.user.id; 


        // Fetch ALL Buses
        const busRes = await fetch("http://localhost:5000/api/driver/buses", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!busRes.ok) throw new Error("Failed to fetch buses");
        const allBusesData = await busRes.json();


        // Format data and check assignment
        let formattedBuses = allBusesData.map((bus) => {
          // SAFETY CHECK: If the driver was populated, it might be an object instead of a string
          const busDriverId = bus.driver?._id || bus.driver;

      
          return {
            id: bus._id,
            plateNumber: bus.busNumber || bus.plateNumber, // Catching both naming conventions
            route: bus.route?.name || "Unknown Route", 
            rawRouteData: bus.route, 
            status: bus.status === "departed" ? "on-the-way" : "ready",
            isAssigned: String(busDriverId) === String(loggedInUserId) 
          };
        });

        // to Sort so the assigned bus is always at the top
        formattedBuses.sort((a, b) => (b.isAssigned === true ? 1 : 0) - (a.isAssigned === true ? 1 : 0));

        dispatch({
          type: "SET_INITIAL_DATA",
          payload: {
            driverName: driverName, 
            buses: formattedBuses,
          }
        });

      } catch (error) {
        console.error("Failed to load driver data:", error);
        dispatch({ type: "FETCH_ERROR" });
      }
    };

    fetchDriverData();
  }, []);

  const acceptAppeal = useCallback((id) => {
    dispatch({ type: "ACCEPT_APPEAL", payload: id });
  }, []);

  const declineAppeal = useCallback((id) => {
    dispatch({ type: "DECLINE_APPEAL", payload: id });
  }, []);

  const markStopReached = useCallback(() => {
    dispatch({ type: "NEXT_STOP" });
  }, []);

  const startRide = useCallback(() => {
    dispatch({ type: "START_RIDE" });
  }, []);

  const completeRide = useCallback(() => {
    dispatch({ type: "COMPLETE_RIDE" });
  }, []);

  const value = {
    ...state,
    acceptAppeal,
    declineAppeal,
    markStopReached,
    startRide,
    completeRide,
  };

  return (
    <DriverContext.Provider value={value}>
      {/* simple loading spinner here to the UI while fetching */}
      {state.isLoading ? (
        <div className="min-h-screen flex items-center justify-center bg-[#F2F2F7]">
          Loading Driver Data...
        </div>
      ) : (
        children
      )}
    </DriverContext.Provider>
  );
}

export function useDriver() {
  const context = useContext(DriverContext);
  if (!context) {
    throw new Error("useDriver must be used within a DriverProvider");
  }
  return context;
}
