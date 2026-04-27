import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { EmergencyProvider } from './context/EmergencyContext';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Guidance from './pages/Guidance';
import Evacuation from './pages/Evacuation';
import Dispatch from './pages/Dispatch';
import Login from './pages/Login';
import SettingsPage from './pages/SettingsPage';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { Navigate, useLocation } from 'react-router-dom';

import './index.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isLoggedIn } = useSettings();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return children;
};

// Vocal Accessibility Screen Reader Hook
const ScreenReader = () => {
  const location = useLocation();
  const { speak, voiceEnabled, t } = useSettings();

  useEffect(() => {
    if (voiceEnabled) {
      let pageName = "Home Dashboard";
      if (location.pathname === '/evacuation') pageName = "Evacuation Route Finder";
      if (location.pathname === '/guidance') pageName = "Medical Guidance Playbook";
      if (location.pathname === '/settings') pageName = "Emergency Settings Profile";
      
      // Delay slightly so it doesn't speak over clicks
      setTimeout(() => speak(`Navigated to ${pageName}`), 500);
    }
  }, [location.pathname, voiceEnabled]);

  return null;
};

function App() {
  return (
    <SettingsProvider>
      <EmergencyProvider>
        <Router>
          <ScreenReader />
          <Routes>
            {/* Dispatch is a full-screen desktop dashboard */}
            <Route path="/dispatch" element={<Dispatch />} />
            
            {/* Login Route */}
            <Route path="/login" element={
              <div className="app-container">
                <Login />
              </div>
            } />
            
            {/* Mobile App Routes (Protected) */}
            <Route path="/*" element={
              <ProtectedRoute>
                <div className="app-container">
                  <div className="screen-content">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/guidance" element={<Guidance />} />
                      <Route path="/evacuation" element={<Evacuation />} />
                      <Route path="/settings" element={<SettingsPage />} />
                    </Routes>
                  </div>
                  <Navigation />
                </div>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </EmergencyProvider>
    </SettingsProvider>
  );
}

export default App;
