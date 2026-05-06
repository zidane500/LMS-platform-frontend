import React, { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { Navbar } from "./components/Navbar";
import { useApp } from "./context/AppContext";
import { ReportWidget } from "./components/ReportWidget";
import { CallProvider } from "./context/CallContext";

export const Layout: React.FC = () => {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  if (!currentUser) {
    return null;
  }

  return (
    <CallProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <Navbar />
        <Outlet />

        {/* Widget de signalement — visible sur toutes les pages */}
        <ReportWidget />
      </div>
    </CallProvider>
  );
};
