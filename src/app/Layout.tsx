import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import { Navbar } from "./components/Navbar";
import { useApp } from "./context/AppContext";
import { ReportWidget } from "./components/ReportWidget";

export const Layout: React.FC = () => {
  const { currentUser } = useApp();
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Navbar />
      <Outlet />
      {/* ✅ Widget de signalement — visible sur toutes les pages */}
      <ReportWidget />
    </div>
  );
};
