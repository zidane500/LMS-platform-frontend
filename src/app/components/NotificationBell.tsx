import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, CheckCheck, X, ChevronDown } from "lucide-react";
import {
  getNotifications,
  getNonLues,
  marquerLu,
  marquerToutLu,
  supprimerNotification,
} from "../services/notificationService";
import type { Notification } from "../services/notificationService";
import { useAuth } from "../context/AuthContext";

export const NotificationBell: React.FC = () => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";

  const filterOptions = isAdmin
    ? [
        { value: "info", label: "Info" },
        { value: "warning", label: "Signales" },
      ]
    : [
        { value: "info", label: "Info" },
        { value: "certificat", label: "Certificat" },
        { value: "badge", label: "Badge" },
        { value: "rappel", label: "Rappel" },
      ];

  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const activeFilterLabel =
    filterOptions.find((option) => option.value === filter)?.label || null;

  const loadCount = async () => {
    if (!currentUser) return;
    try {
      setCount(await getNonLues());
    } catch {}
  };

  const loadNotifications = async () => {
    if (!currentUser) return;
    try {
      setNotifications(await getNotifications());
    } catch {}
  };

  useEffect(() => {
    loadCount();
    const interval = setInterval(loadCount, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowFilter(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    setOpen((prev) => !prev);
    if (!open) loadNotifications();
  };

  const handleLu = async (id: number) => {
    await marquerLu(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, lu: true } : n)),
    );
    setCount((prev) => Math.max(0, prev - 1));
  };

  const handleToutLu = async () => {
    await marquerToutLu();
    setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
    setCount(0);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "badge":
        return "🏆";
      case "certificat":
        return "🎓";
      case "success":
        return "✅";
      case "warning":
        return "⚠️";
      case "error":
        return "🔴";
      case "rappel":
        return "⏰";
      default:
        return "ℹ️";
    }
  };

  const getTypeBg = (type: string, isUnread: boolean) => {
    if (!isUnread) return "";
    switch (type) {
      case "warning":
        return "bg-yellow-50/40 dark:bg-yellow-950/20";
      case "error":
        return "bg-red-50/40 dark:bg-red-950/20";
      case "badge":
        return "bg-purple-50/40 dark:bg-purple-950/20";
      case "certificat":
        return "bg-green-50/40 dark:bg-green-950/20";
      default:
        return "bg-blue-50/40 dark:bg-blue-950/20";
    }
  };

  const getTypeDot = (type: string) => {
    switch (type) {
      case "warning":
        return "bg-yellow-400";
      case "error":
        return "bg-red-500";
      case "badge":
        return "bg-purple-500";
      case "certificat":
        return "bg-green-500";
      default:
        return "bg-blue-500";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "warning":
        return { text: "Attention", cls: "text-yellow-500" };
      case "error":
        return { text: "Erreur", cls: "text-red-500" };
      case "badge":
        return { text: "Badge", cls: "text-purple-500" };
      case "certificat":
        return { text: "Certificat", cls: "text-green-500" };
      case "rappel":
        return { text: "Rappel", cls: "text-orange-400" };
      default:
        return { text: "Info", cls: "text-blue-500" };
    }
  };

  const filteredNotifications = notifications.filter(
    (notif) => !filter || notif.type?.toLowerCase() === filter.toLowerCase(),
  );
  const filterLabels: Record<string, string> = {
    tout: "Tout",
    info: "Info",
    rappel: "Rappel", // ✅ NOUVEAU
    certificat: "Certificat",
    badge: "Badge",
  };

  // Et dans le filtre
  const filtered = notifications.filter((n) => {
    if (filter === "tout") return true;
    if (filter === "info") return n.type === "info" || n.type === "success";
    return n.type === filter;
  });

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {count}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-12 w-[340px] sm:w-[420px] max-w-[92vw] z-50 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden"
          >
            <div className="relative flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200 dark:border-slate-700 gap-2">
              <span className="font-semibold text-xs sm:text-sm dark:text-white shrink-0">
                🔔 <span className="hidden sm:inline">Notifications</span>
              </span>

              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[120px]">
                <div className="relative">
                  <button
                    onClick={() => setShowFilter((prev) => !prev)}
                    className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 truncate"
                  >
                    {activeFilterLabel
                      ? `Filtre: ${activeFilterLabel}`
                      : "Filtrer par"}
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {showFilter && (
                    <div className="absolute left-1/2 top-full mt-3 -translate-x-1/2 w-32 sm:w-36 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-2xl z-[80] overflow-hidden">
                      {filterOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setFilter(option.value);
                            setShowFilter(false);
                          }}
                          className={`w-full text-left px-2 py-1 text-base font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700 ${
                            filter === option.value
                              ? "bg-gray-200 dark:bg-slate-700"
                              : ""
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() => {
                          setFilter(null);
                          setShowFilter(false);
                        }}
                        className="w-full text-left px-4 py-3 text-base font-medium  hover:bg-gray-100 dark:hover:bg-slate-700"
                      >
                        Tout
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="ml-auto flex items-center gap-2">
                {count > 0 && (
                  <button
                    onClick={handleToutLu}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 whitespace-nowrap"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Tout lire
                  </button>
                )}
                <button
                  onClick={() => {
                    setOpen(false);
                    setShowFilter(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto rounded-b-2xl">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    {filter
                      ? "Aucune notification pour ce filtre"
                      : "Aucune notification"}
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notif) => {
                  const label = getTypeLabel(notif.type);

                  return (
                    <div
                      key={notif.id}
                      className={`flex items-start gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-100 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer overflow-hidden ${getTypeBg(
                        notif.type,
                        !notif.lu,
                      )}`}
                      onClick={() => !notif.lu && handleLu(notif.id)}
                    >
                      <span className="text-xl shrink-0 mt-0.5">
                        {getTypeIcon(notif.type)}
                      </span>

                      <div className="flex-1 min-w-0 overflow-hidden">
                        <span
                          className={`text-xs font-semibold uppercase tracking-wide ${label.cls}`}
                        >
                          {label.text}
                        </span>

                        <p
                          className={`text-xs sm:text-sm leading-snug mt-0.5 whitespace-pre-line break-words overflow-hidden ${
                            !notif.lu
                              ? "font-medium dark:text-white"
                              : "text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {notif.message}
                        </p>

                        <p className="text-xs text-gray-400 mt-1">
                          {notif.created_at}
                        </p>
                      </div>

                      {!notif.lu && (
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${getTypeDot(notif.type)}`}
                        />
                      )}
                      {/* ✅ Bouton suppression manuelle */}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await supprimerNotification(notif.id);
                          setNotifications((prev) =>
                            prev.filter((n) => n.id !== notif.id),
                          );
                          if (!notif.lu)
                            setCount((prev) => Math.max(0, prev - 1));
                        }}
                        className="ml-1 text-gray-300 hover:text-red-400 dark:text-slate-600 dark:hover:text-red-400 transition-colors rounded p-0.5 hover:bg-red-50 dark:hover:bg-red-950/20"
                        title="Supprimer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
