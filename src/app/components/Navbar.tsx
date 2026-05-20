import React, { useState } from "react";
import { Link, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  User,
  LogOut,
  Menu,
  X,
  Shield,
  UserPlus,
  Award,
  Trophy, // ← ajouter
  Inbox,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext"; // ← ajouter
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./NotificationBell";

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { currentUser } = useApp();
  const { logout } = useAuth(); // ← ajouter : récupérer la vraie fonction logout
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!currentUser) return null;

  const getRoleLabel = (role?: string): string => {
    switch (role) {
      case "learner":
        return "Apprenant";
      case "instructor":
        return "Formateur";
      case "admin":
        return "Admin";
      default:
        return "Utilisateur";
    }
  };

  // ✅ FIX : utiliser logout() qui supprime le token du localStorage
  const handleLogout = async () => {
    await logout();
  };

  const [avatarKey, setAvatarKey] = React.useState(Date.now());
  React.useEffect(() => {
    setAvatarKey(Date.now());
  }, [currentUser?.avatar]);

  const avatarUrl = currentUser.avatar
    ? `${currentUser.avatar}?t=${avatarKey}`
    : undefined;

  const navItems = [
    { path: "/app", label: "Dashboard", icon: LayoutDashboard },
    { path: "/app/courses", label: "Formations", icon: BookOpen },
    { path: "/app/profile/edit", label: "Profil", icon: User },
  ];

  if (currentUser.role === "instructor" || currentUser.role === "admin") {
    navItems.push({ path: "/app/inbox", label: "Messages", icon: Inbox });
  }

  if (currentUser.role === "learner" || currentUser.role === "instructor") {
    navItems.push({
      path: "/app/certificates",
      label: "Certificats",
      icon: Award,
    });
  }

  // ✅ Ajouter le lien Badges pour les apprenants
  if (currentUser.role === "learner") {
    navItems.push({ path: "/app/badges", label: "Badges", icon: Trophy });
  }

  if (currentUser.role === "admin") {
    navItems.push({
      path: "/app/admin",
      label: "Administration",
      icon: Shield,
    });
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-slate-700"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <GraduationCap className="w-8 h-8 text-blue-600" />
            </motion.div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              LMS Platform
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className="gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center gap-4">
            {currentUser.role === "learner" && (
              <Link to="/app/become-instructor">
                <Button
                  variant="outline"
                  className="gap-2 border-purple-200 text-purple-600 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-950/30"
                >
                  <UserPlus className="w-4 h-4" />
                </Button>
              </Link>
            )}
            <ThemeToggle />
            <NotificationBell />
            <div className="text-right">
              <p className="text-sm font-medium dark:text-white">
                {currentUser.firstName} {currentUser.lastName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {getRoleLabel(currentUser.role)}
              </p>
            </div>
            <Avatar>
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {currentUser.firstName[0]}
                {currentUser.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>

          {/* Mobile right controls */}
          <div className="flex items-center gap-2 md:hidden">
            <NotificationBell />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700"
            >
              <div className="px-4 py-4 space-y-2">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium dark:text-white">
                    Thème
                  </span>
                  <ThemeToggle />
                </div>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        className="w-full justify-start gap-2"
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
                {/* Bouton devenir formateur mobile */}
                {currentUser.role === "learner" && (
                  <Link
                    to="/app/become-instructor"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 border-purple-200 text-purple-600 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-950/30"
                    >
                      <UserPlus className="w-4 h-4" />
                      Devenir formateur
                    </Button>
                  </Link>
                )}
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};
