import Navbar from "./components/Navbar";
import Logo from "./components/Logo";
import Galaxy from "./components/Galaxy";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Profile from "./components/Profile";
import Projects from "./components/Projects";
import Achievements from "./components/Achievements";
import ProjectView from "./components/ProjectView";
import AchievementView from "./components/AchievementView";
import Skills from './components/Skills';
import Certifications from "./components/Certifications";
import CertificationView from "./components/CertificationView";

import { useAuth } from "./context/AuthContext";
import { ToastProvider } from "./components/Toast";
import { GoogleOAuthProvider } from '@react-oauth/google';

const Home = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="w-screen h-screen relative overflow-hidden bg-black">
      <div className="absolute inset-0 z-0">
        <Galaxy />
      </div>

      {!isAuthenticated && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none px-4">
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-1000">
            <div className="mb-6 p-6 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-[0_0_100px_rgba(255,255,255,0.1)]">
              <Logo className="w-24 h-24 md:w-32 md:h-32 text-transparent fill-white stroke-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
            </div>

            <h1 className="text-7xl md:text-9xl font-black text-white tracking-tighter mb-4 drop-shadow-2xl">
              Query<span className="text-gray-400">Port</span>
            </h1>

            <div className="space-y-2 text-center">
              <p className="text-2xl md:text-4xl font-light text-gray-200 tracking-widest uppercase">
                Unlock Your Potential
              </p>
              <p className="text-sm md:text-lg text-gray-400 font-light tracking-wider max-w-md mx-auto">
                The ultimate platform to showcase your projects, achievements, and skills to the world.
              </p>
            </div>
          </div>
        </div>
      )}

      {isAuthenticated && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-1000">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1 border-2 border-white/20 mb-6 shadow-2xl backdrop-blur-sm">
              <div className="w-full h-full rounded-full overflow-hidden">
                <img
                  src={user?.avatar || "https://res.cloudinary.com/dja9j771q/image/upload/v1710134447/avatar_uy0i8a.png"}
                  alt={user?.name}
                  className="w-full h-full object-cover opacity-90"
                />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-widest uppercase text-center drop-shadow-2xl">
              Welcome Back
            </h1>
            <p className="mt-4 text-xl text-gray-400 font-light tracking-widest uppercase">
              {user?.name}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
      <ToastProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:projectId" element={<ProjectView />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/achievements/:id" element={<AchievementView />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/certifications" element={<Certifications />} />
          <Route path="/certifications/:id" element={<CertificationView />} />

          <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
        </Routes>
      </ToastProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
