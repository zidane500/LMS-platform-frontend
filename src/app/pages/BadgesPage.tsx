// src/app/pages/BadgesPage.tsx
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";

import {
  Trophy,
  Star,
  Lock,
  CheckCircle,
  Clock,
  Search,
  Sparkles,
  Flame,
  Zap,
  Medal,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getMesProgressions,
  getProgression,
} from "../services/progressionService";
import {
  Badge,
  BadgeCategory,
  badgesCatalogue,
  categoryMeta,
  mapBackendBadge,
} from "../components/badges/BadgesData";
import { BadgeCard } from "../components/badges/BadgeCard";
import { BadgeModal } from "../components/badges/BadgeModal";
import { toast } from "sonner";

const CATEGORIES: { id: BadgeCategory | "all"; label: string; icon: string }[] =
  [
    { id: "all", label: "Tous", icon: "🏆" },
    { id: "progression", label: "Progression", icon: "🎓" },
    { id: "performance", label: "Performance", icon: "🧠" },
    { id: "engagement", label: "Engagement", icon: "⏱️" },
    { id: "accomplissement", label: "Accomplissement", icon: "🏅" },
    { id: "niveaux", label: "Niveaux", icon: "📊" },
    { id: "speciaux", label: "Spéciaux", icon: "🌟" },
  ];

type FilterStatus = "all" | "unlocked" | "in-progress" | "locked";

export function BadgesPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<
    BadgeCategory | "all"
  >("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  // ── Charger les badges depuis le backend ──────────────────
  useEffect(() => {
    if (!currentUser || currentUser.role !== "learner") {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const progressions = await getMesProgressions();
        const details = await Promise.all(
          progressions.map((p) =>
            getProgression(p.formation_id).catch(() => null),
          ),
        );
        const badgesObtenus = details.flatMap((d) => d?.badges ?? []);
        const badgesMapped: Badge[] = badgesObtenus.map((b) =>
          mapBackendBadge(b, "unlocked"),
        );
        const dedup = new Map<string, Badge>();
        badgesMapped.forEach((b) => {
          if (
            !dedup.has(b.id) ||
            (b.unlockedAt &&
              dedup.get(b.id)!.unlockedAt &&
              b.unlockedAt > dedup.get(b.id)!.unlockedAt!)
          ) {
            dedup.set(b.id, b);
          }
        });
        badgesCatalogue.forEach((b) => {
          if (!dedup.has(b.id)) dedup.set(b.id, { ...b, status: "locked" });
        });
        setAllBadges(Array.from(dedup.values()));
      } catch {
        toast.error("Impossible de charger les badges");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [currentUser]);

  const stats = useMemo(() => {
    const unlocked = allBadges.filter((b) => b.status === "unlocked").length;
    const inProgress = allBadges.filter(
      (b) => b.status === "in-progress",
    ).length;
    const locked = allBadges.filter((b) => b.status === "locked").length;
    const totalXP = allBadges
      .filter((b) => b.status === "unlocked")
      .reduce((acc, b) => acc + b.xpReward, 0);
    return { unlocked, inProgress, locked, total: allBadges.length, totalXP };
  }, [allBadges]);

  const filteredBadges = useMemo(() => {
    return allBadges.filter((b) => {
      const matchCat =
        selectedCategory === "all" || b.category === selectedCategory;
      const matchStatus = filterStatus === "all" || b.status === filterStatus;
      const matchSearch =
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.description.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchStatus && matchSearch;
    });
  }, [allBadges, selectedCategory, filterStatus, search]);

  const completionPct =
    stats.total > 0 ? Math.round((stats.unlocked / stats.total) * 100) : 0;

  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{
          background:
            "linear-gradient(135deg, #05050f 0%, #0a0a1e 40%, #0f0820 100%)",
        }}
      >
        <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background:
          "linear-gradient(135deg, #05050f 0%, #0a0a1e 40%, #0f0820 100%)",
      }}
    >
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-10 blur-3xl"
          style={{
            background: "radial-gradient(circle, #7c3aed, transparent)",
          }}
        />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-8 blur-3xl"
          style={{
            background: "radial-gradient(circle, #0ea5e9, transparent)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        {/* Retour */}
        <button
          onClick={() => navigate("/app")}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Retour au dashboard
        </button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-white text-2xl font-bold tracking-tight">
                    Mes Badges & Récompenses
                  </h1>
                </div>
              </div>
              <p className="text-slate-400 text-sm max-w-lg">
                Débloquez des badges en progressant dans vos formations, quiz et
                activités.
              </p>
            </div>

            {/* Progression globale */}
            <div
              className="rounded-2xl border border-white/8 p-5 min-w-[220px]"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-400 uppercase tracking-widest">
                  Progression globale
                </span>
                <span className="text-lg font-bold text-white">
                  {completionPct}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/8 overflow-hidden mb-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPct}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                {stats.unlocked} / {stats.total} badges débloqués
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
        >
          {[
            {
              icon: <CheckCircle className="w-5 h-5" />,
              label: "Débloqués",
              value: stats.unlocked,
              color: "text-emerald-400",
              bg: "from-emerald-500/20 to-teal-500/10",
              border: "border-emerald-500/20",
            },
            {
              icon: <Clock className="w-5 h-5" />,
              label: "En cours",
              value: stats.inProgress,
              color: "text-amber-400",
              bg: "from-amber-500/20 to-orange-500/10",
              border: "border-amber-500/20",
            },
            {
              icon: <Lock className="w-5 h-5" />,
              label: "Verrouillés",
              value: stats.locked,
              color: "text-slate-400",
              bg: "from-slate-500/10 to-transparent",
              border: "border-slate-500/20",
            },
            {
              icon: <Zap className="w-5 h-5" />,
              label: "Total XP",
              value: stats.totalXP.toLocaleString(),
              color: "text-violet-400",
              bg: "from-violet-500/20 to-indigo-500/10",
              border: "border-violet-500/20",
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + i * 0.07 }}
              className={`rounded-2xl border ${stat.border} bg-gradient-to-br ${stat.bg} backdrop-blur-sm p-4 flex items-center gap-3`}
            >
              <div className={`${stat.color} opacity-80`}>{stat.icon}</div>
              <div>
                <p className={`text-xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Filtres */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8 space-y-4"
        >
          <div className="relative max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher un badge..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500/50 transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <motion.button
                key={cat.id}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() =>
                  setSelectedCategory(cat.id as BadgeCategory | "all")
                }
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200
                  ${
                    selectedCategory === cat.id
                      ? "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/30"
                      : "bg-white/4 border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                  }`}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </motion.button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              {
                id: "all" as FilterStatus,
                label: "Tous",
                icon: <Star className="w-3 h-3" />,
              },
              {
                id: "unlocked" as FilterStatus,
                label: "Débloqués",
                icon: <CheckCircle className="w-3 h-3" />,
              },
              {
                id: "in-progress" as FilterStatus,
                label: "En cours",
                icon: <Flame className="w-3 h-3" />,
              },
              {
                id: "locked" as FilterStatus,
                label: "Verrouillés",
                icon: <Lock className="w-3 h-3" />,
              },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterStatus(f.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium border transition-all
                  ${
                    filterStatus === f.id
                      ? "bg-white/12 border-white/20 text-white"
                      : "bg-transparent border-white/8 text-slate-500 hover:text-slate-300"
                  }`}
              >
                {f.icon}
                {f.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Grille badges */}
        <AnimatePresence mode="wait">
          {filteredBadges.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl mb-4">
                🔍
              </div>
              <p className="text-slate-300 font-semibold">Aucun badge trouvé</p>
              <p className="text-slate-500 text-sm mt-1">
                Essayez de modifier vos filtres
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {selectedCategory === "all" &&
              !search &&
              filterStatus === "all" ? (
                <div className="space-y-12">
                  {(Object.keys(categoryMeta) as BadgeCategory[]).map((cat) => {
                    const catBadges = filteredBadges.filter(
                      (b) => b.category === cat,
                    );
                    if (catBadges.length === 0) return null;
                    const meta = categoryMeta[cat];
                    const unlockedCount = catBadges.filter(
                      (b) => b.status === "unlocked",
                    ).length;
                    return (
                      <div key={cat}>
                        <div className="flex items-center gap-3 mb-5">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-gradient-to-br ${meta.gradient}`}
                            style={{ boxShadow: `0 4px 12px ${meta.color}40` }}
                          >
                            {meta.icon}
                          </div>
                          <div>
                            <h2 className="text-white font-bold">
                              {meta.label}
                            </h2>
                            <p className="text-[11px] text-slate-500">
                              {unlockedCount}/{catBadges.length} débloqués
                            </p>
                          </div>
                          <div className="flex-1 h-px bg-white/5 ml-2" />
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{
                              background: `${meta.color}18`,
                              color: meta.color,
                            }}
                          >
                            {catBadges.length} badges
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                          {catBadges.map((badge, i) => (
                            <BadgeCard
                              key={badge.id}
                              badge={badge}
                              onSelect={setSelectedBadge}
                              index={i}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {filteredBadges.map((badge, i) => (
                    <BadgeCard
                      key={badge.id}
                      badge={badge}
                      onSelect={setSelectedBadge}
                      index={i}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Badges essentiels */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16"
        >
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-white font-bold">Badges Essentiels</h2>
            <span className="text-xs text-slate-500 ml-1">
              — Les plus importants
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              "premier_contenu",
              "module_complete",
              "quiz_reussi",
              "quiz_parfait",
              "formation_complete",
              "certifie",
            ]
              .map((code) => allBadges.find((b) => b.id === code))
              .filter(Boolean)
              .map((badge, i) => (
                <motion.div
                  key={badge!.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.55 + i * 0.06 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedBadge(badge!)}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-white/8 cursor-pointer group transition-all hover:border-white/15"
                  style={{ background: "rgba(255,255,255,0.03)" }}
                >
                  <div
                    className={`w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center text-2xl
                    ${badge!.status === "locked" ? "bg-white/5" : `bg-gradient-to-br ${badge!.gradient}`}`}
                    style={{
                      boxShadow:
                        badge!.status !== "locked"
                          ? `0 4px 12px ${badge!.glowColor}`
                          : "none",
                    }}
                  >
                    {badge!.status === "locked" ? (
                      <span className="opacity-20">{badge!.icon}</span>
                    ) : (
                      badge!.icon
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white truncate">
                        {badge!.name}
                      </p>
                      <span
                        className="px-1.5 py-0.5 text-[9px] uppercase tracking-wide font-bold rounded-full"
                        style={{
                          background:
                            badge!.status === "unlocked"
                              ? "rgba(16,185,129,0.15)"
                              : badge!.status === "in-progress"
                                ? "rgba(245,158,11,0.15)"
                                : "rgba(100,116,139,0.15)",
                          color:
                            badge!.status === "unlocked"
                              ? "#10b981"
                              : badge!.status === "in-progress"
                                ? "#f59e0b"
                                : "#64748b",
                        }}
                      >
                        {badge!.status === "unlocked"
                          ? "✓ Obtenu"
                          : badge!.status === "in-progress"
                            ? "En cours"
                            : "Verrouillé"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {badge!.condition}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p
                      className={`text-xs font-bold bg-gradient-to-r ${badge!.gradient} bg-clip-text text-transparent`}
                    >
                      +{badge!.xpReward}
                    </p>
                    <p className="text-[9px] text-slate-500">XP</p>
                  </div>
                  <Medal className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" />
                </motion.div>
              ))}
          </div>
        </motion.div>

        <div className="mt-16 pt-8 border-t border-white/5 text-center">
          <p className="text-[19px] text-slate-600">
            LMS Platform · Système de badges & récompenses
          </p>
        </div>
      </div>

      <BadgeModal
        badge={selectedBadge}
        onClose={() => setSelectedBadge(null)}
      />
    </div>
  );
}
