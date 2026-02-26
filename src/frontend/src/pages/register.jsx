import React, { useState, useRef, useEffect } from "react";
import {
  User,
  ChevronDown,
  BookOpen,
  ShieldCheck,
  GraduationCap,
  ArrowRight,
  UserPlus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, SOCKET_URL } from "../../src/config.js";



const Register = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("Student");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Smooth click-away logic
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const roles = [
    {
      name: "Student",

      icon: <GraduationCap size={18} />,
      desc: "Access courses & grades",
    },
    {
      name: "Driver",
      icon: <BookOpen size={18} />,
      desc: "Manage classes & content",
    },
  ];

  const handleRegister = async (e) => {
    e.preventDefault();

    const userData = {
      name: formData.fullName,
      email: formData.email,
      password: formData.password,
      role: role.toLowerCase(),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Account created successfully!");
        navigate("/#");

        // Use useNavigate() from react-router-dom to redirect here
      }
    } catch (error) {
      alert("Server error. Please try again.");
    }

    // finally {
    //   setIsLoading(false); // Stop loading regardless of success/fail
    // }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 sm:p-8 font-sans antialiased text-slate-900">
      {/* Main Container: Sharp focus on whitespace and shadows */}
      <div className="flex flex-col md:flex-row w-full max-w-6xl bg-white rounded-[40px] overflow-hidden shadow-[0_32px_64px_-15px_rgba(0,0,0,0.08)] border border-slate-100 transition-all duration-500 hover:shadow-[0_40px_80px_-15px_rgba(0,102,218,0.12)]">
        {/* Left Branding: High Contrast Deep Blue */}
        <div className="w-full md:w-[42%] bg-[#0066da] p-12 md:p-16 flex flex-col justify-between items-start text-white relative overflow-hidden">
          {/* Subtle Decorative Circle */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <div className="mb-10 inline-flex p-4 bg-white/15 rounded-3xl backdrop-blur-md border border-white/20">
              <UserPlus size={48} strokeWidth={1.5} />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
              Start your <br />
              <span className="text-blue-200">Bus Tracking.</span>
            </h2>
            <p className="text-blue-100/80 text-lg max-w-sm leading-relaxed">
              Track your college's bus route and never get late for your stop.
            </p>
          </div>

          <div className="relative z-10 mt-12 pt-8 border-t border-white/10 w-full"></div>
        </div>

        {/* Right Section: The Elegant Form */}
        <div className="w-full md:w-[58%] bg-white p-8 sm:p-16 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <header className="mb-10 text-center md:text-left">
              <h1 className="text-4xl font-extrabold text-[#003366] tracking-tight mb-2">
                Create Account
              </h1>
              <p className="text-slate-500 font-medium">
                Please enter your details to register.
              </p>
            </header>

            <form className="space-y-6" onSubmit={handleRegister}>
              {/* Floating-style Input Group */}
              <div className="space-y-4">
                <div className="group">
                  <label className="block text-slate-700 font-bold mb-2 ml-1 text-sm group-focus-within:text-[#0066da] transition-colors">
                    Full Name
                  </label>
                  <input
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    type="text"
                    placeholder="e.g. John Doe"
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-[#0066da] outline-none transition-all duration-300 placeholder:text-slate-400"
                  />
                </div>

                <div className="group">
                  <label className="block text-slate-700 font-bold mb-2 ml-1 text-sm group-focus-within:text-[#0066da] transition-colors">
                    College Email
                  </label>
                  <input
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    type="email"
                    placeholder="name@university.edu"
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-[#0066da] outline-none transition-all duration-300 placeholder:text-slate-400"
                  />
                </div>

                <div className="group">
                  <label className="block text-slate-700 font-bold mb-2 ml-1 text-sm group-focus-within:text-[#0066da] transition-colors">
                    Password
                  </label>
                  <input
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    type="password"
                    placeholder="*******"
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-[#0066da] outline-none transition-all duration-300 placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Dropdown Section */}
              <div className="relative" ref={dropdownRef}>
                <label className="block text-slate-700 font-bold mb-2 ml-1 text-sm">
                  Account Type
                </label>
                <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className={`flex items-center justify-between w-full px-6 py-4 rounded-2xl transition-all duration-300 shadow-sm border ${isOpen ? "bg-white border-[#0066da] ring-4 ring-blue-500/10" : "bg-slate-50 border-slate-100 hover:border-slate-300"}`}
                >
                  <div className="flex items-center gap-4">
                    <span className="p-2 bg-blue-100 text-[#0066da] rounded-xl">
                      {roles.find((r) => r.name === role)?.icon}
                    </span>
                    <span className="font-bold text-[#003366]">{role}</span>
                  </div>
                  <ChevronDown
                    size={20}
                    className={`text-slate-400 transition-transform duration-500 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Floating Dropdown Menu */}
                {isOpen && (
                  <div className="absolute z-50 top-[calc(100%+8px)] left-0 w-full bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 py-3 animate-in fade-in zoom-in-95 duration-200">
                    {roles.map((r) => (
                      <button
                        key={r.name}
                        type="button"
                        onClick={() => {
                          setRole(r.name);
                          setIsOpen(false);
                        }}
                        className="flex items-center gap-4 w-full px-6 py-4 text-left hover:bg-slate-50 transition-colors group"
                      >
                        <div
                          className={`p-2 rounded-xl transition-colors ${role === r.name ? "bg-[#0066da] text-white" : "bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-[#0066da]"}`}
                        >
                          {r.icon}
                        </div>
                        <div>
                          <p className="font-bold text-[#003366] leading-none mb-1">
                            {r.name}
                          </p>
                          <p className="text-xs text-slate-400 font-medium">
                            {r.desc}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/*Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="group relative w-full bg-[#0066da] text-white font-bold py-5 rounded-2xl overflow-hidden transition-all duration-300 hover:bg-[#0055b8] hover:shadow-[0_10px_30px_-10px_rgba(0,102,218,0.5)] active:scale-[0.98]"
                >
                  <span className="flex items-center justify-center gap-2 tracking-wider uppercase text-sm">
                    Create My Account
                    <ArrowRight
                      size={18}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </span>
                </button>
              </div>

              <p className="text-center text-slate-400 text-sm font-semibold mt-8">
                Already tracking?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="text-[#0066da] font-black hover:underline underline-offset-4 bg-transparent border-none p-0 cursor-pointer"
                >
                  Sign in here
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
