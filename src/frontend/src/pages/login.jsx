import React, { useState, useRef, useEffect } from "react";
import {
  User,
  ChevronDown,
  BookOpen,
  ShieldCheck,
  GraduationCap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, SOCKET_URL } from "../../src/config.js";

const ResponsiveLogin = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("Student");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    role: "",
  });

  const handleChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value,
    });
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const roles = [
    { name: "Student", icon: <GraduationCap size={18} /> },
    { name: "Driver", icon: <BookOpen size={18} /> },
  ];

  const handleLogin = async (e) => {
    e.preventDefault();

    const userData = {
      email: loginData.email,
      password: loginData.password,
      role: role.toLowerCase(),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);

        localStorage.setItem("role", data.user.role);

        alert("Login successful!");

        const userRole = data.user.role.toLowerCase();
        if (userRole === "student") {
          navigate("/student");
        } else if (userRole === "driver") {
          navigate("/driver");
        } else {
          navigate("/");
        }
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Server error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-6">
      {/* Main Card: flex-col for mobile, flex-row for desktop */}
      <div className="flex flex-col md:flex-row w-full max-w-5xl bg-white rounded-[30px] md:rounded-[50px] overflow-hidden shadow-2xl transition-all duration-300">
        {/* Left Section: Blue Branding */}
        <div className="w-full md:w-1/2 bg-[#0066da] p-10 md:p-16 flex flex-col justify-center items-center text-white text-center">
          <div className="mb-6 p-4 bg-white/10 rounded-3xl backdrop-blur-sm">
            <User size={60} strokeWidth={1.5} />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Portal Access</h2>
          <p className="text-blue-100 max-w-xs opacity-80">
            Login to your dashboard to manage your courses and profile.
          </p>
        </div>

        {/* Right Section: Form */}
        <div className="w-full md:w-1/2 bg-[#f4f8ff] p-8 sm:p-12 md:p-16 flex flex-col justify-center">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-[#003366]">Welcome..</h1>
          </header>

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-[#003366] font-semibold mb-2 ml-1">
                Email
              </label>
              <input
                name="email"
                value={loginData.email}
                onChange={handleChange}
                type="email"
                placeholder="Enter your College Email"
                className="w-full px-5 py-4 rounded-2xl bg-white border-none shadow-sm focus:ring-2 focus:ring-blue-400 outline-none transition-all placeholder:text-gray-400"
              />
            </div>

            <div>
              <label className="block text-[#003366] font-semibold mb-2 ml-1">
                Password
              </label>
              <input
                name="password"
                value={loginData.password}
                onChange={handleChange}
                type="password"
                placeholder="Password here"
                className="w-full px-5 py-4 rounded-2xl bg-white border-none shadow-sm focus:ring-2 focus:ring-blue-400 outline-none transition-all placeholder:text-gray-400"
              />
            </div>

            <div className="pt-2">
              <label className="block text-[#003366] font-semibold mb-3 ml-1 text-sm">
                Dashboard
              </label>

              {/* Responsive Row: Stacks on very small screens, side-by-side otherwise */}
              <div className="flex flex-col sm:flex-row gap-4 h-auto sm:h-[60px]">
                {/* Dropdown Container */}
                <div className="relative flex-1 group" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center justify-between w-full h-full bg-[#0066da] text-white px-5 py-4 sm:py-0 rounded-2xl hover:bg-[#0055b8] active:scale-[0.98] transition-all shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <User size={20} />
                      <span className="font-bold tracking-wide">{role}</span>
                    </div>
                    <ChevronDown
                      size={20}
                      className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {/* Dropdown Menu Overlay */}
                  {isOpen && (
                    <div className="absolute bottom-full sm:bottom-auto sm:top-full left-0 w-full mb-2 sm:mb-0 sm:mt-2 bg-white rounded-2xl shadow-xl border border-blue-50 overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                      {roles.map((r) => (
                        <button
                          key={r.name}
                          type="button"
                          onClick={() => {
                            setRole(r.name);
                            setIsOpen(false);
                          }}
                          className="flex items-center gap-3 w-full px-5 py-4 text-left text-[#003366] hover:bg-blue-50 font-medium transition-colors"
                        >
                          <span className="text-[#0066da]">{r.icon}</span>
                          {r.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="flex-1 bg-[#0066da] text-white font-black uppercase tracking-widest text-sm rounded-2xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md py-4 sm:py-0"
                >
                  Login
                </button>
              </div>
            </div>

            <p className="text-center text-gray-500 text-sm pt-6 font-medium">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="text-[#0066da] font-black hover:underline underline-offset-4 bg-transparent border-none p-0 cursor-pointer"
              >
                Sign up
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResponsiveLogin;
