import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Lock,
  CheckCircle,
  Clock,
  Trophy,
  Zap,
  Star,
  Award,
} from "lucide-react";
import { Badge, BadgeTier } from "./BadgesData";

interface BadgeModalProps {
  badge: Badge | null;
  onClose: () => void;
}

const tierConfig: Record<
  BadgeTier,
  { label: string; color: string; bg: string }
> = {
  common: { label: "Commun", color: "text-slate-300", bg: "bg-slate-700/50" },
  rare: { label: "Rare", color: "text-blue-300", bg: "bg-blue-900/40" },
  epic: { label: "Épique", color: "text-violet-300", bg: "bg-violet-900/40" },
  legendary: {
    label: "Légendaire",
    color: "text-amber-300",
    bg: "bg-amber-900/40",
  },
};

export function BadgeModal({ badge, onClose }: BadgeModalProps) {
  if (!badge) return null;

  const isLocked = badge.status === "locked";
  const isInProgress = badge.status === "in-progress";
  const tier = tierConfig[badge.tier];

  const StatusIcon = isLocked ? Lock : isInProgress ? Clock : CheckCircle;
  const statusLabel = isLocked
    ? "Verrouillé"
    : isInProgress
      ? "En cours"
      : "Débloqué";
  const statusColor = isLocked
    ? "text-slate-400"
    : isInProgress
      ? "text-amber-400"
      : "text-emerald-400";

  const TierIcon =
    badge.tier === "legendary"
      ? Trophy
      : badge.tier === "epic"
        ? Zap
        : badge.tier === "rare"
          ? Star
          : Award;

  return (
    <AnimatePresence>
      {badge && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-md pointer-events-auto rounded-3xl overflow-hidden border border-white/10"
              style={{
                background: "rgba(12, 12, 28, 0.95)",
                boxShadow: `0 0 60px ${badge.glowColor}, 0 20px 60px rgba(0,0,0,0.8)`,
              }}
            >
              {/* Top gradient bar */}
              {!isLocked && (
                <div
                  className={`h-1 w-full bg-gradient-to-r ${badge.gradient}`}
                />
              )}

              {/* Animated bg glow */}
              {!isLocked && (
                <div
                  className="absolute inset-0 pointer-events-none opacity-10"
                  style={{
                    background: `radial-gradient(circle at 50% 0%, ${badge.glowColor} 0%, transparent 70%)`,
                  }}
                />
              )}

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors z-10"
              >
                <X className="w-4 h-4 text-slate-300" />
              </button>

              <div className="p-8 flex flex-col items-center text-center gap-5">
                {/* Badge icon */}
                <div className="relative">
                  {/* Outer ring for legendary */}
                  {badge.tier === "legendary" && !isLocked && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="absolute inset-[-8px] rounded-3xl opacity-50"
                      style={{
                        background:
                          "conic-gradient(transparent, #fbbf24, transparent, #a78bfa, transparent)",
                      }}
                    />
                  )}

                  <motion.div
                    animate={
                      !isLocked
                        ? {
                            boxShadow: [
                              `0 0 20px ${badge.glowColor}`,
                              `0 0 40px ${badge.glowColor}`,
                              `0 0 20px ${badge.glowColor}`,
                            ],
                          }
                        : {}
                    }
                    transition={{ duration: 2, repeat: Infinity }}
                    className={`relative z-10 w-24 h-24 rounded-3xl flex items-center justify-center text-5xl
                      ${isLocked ? "bg-[rgba(255,255,255,0.04)]" : `bg-gradient-to-br ${badge.gradient}`}
                    `}
                  >
                    {isLocked ? (
                      <>
                        <span className="opacity-10 text-5xl">
                          {badge.icon}
                        </span>
                        <Lock className="absolute w-8 h-8 text-slate-500" />
                      </>
                    ) : (
                      <>
                        <span className="drop-shadow-xl relative z-10">
                          {badge.icon}
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl" />
                      </>
                    )}
                  </motion.div>
                </div>

                {/* Name & tier */}
                <div>
                  <h3 className="text-white text-xl font-bold">{badge.name}</h3>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${tier.bg} ${tier.color}`}
                    >
                      <TierIcon className="w-3 h-3" />
                      {tier.label}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium ${statusColor}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {statusLabel}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-slate-300 text-sm leading-relaxed">
                  {badge.description}
                </p>

                {/* Condition */}
                <div className="w-full rounded-2xl bg-white/5 border border-white/8 p-4">
                  <p className="text-[11px] uppercase tracking-widest text-slate-500 mb-2 font-medium">
                    Condition d'obtention
                  </p>
                  <p className="text-slate-200 text-sm">{badge.condition}</p>
                </div>

                {/* Progress */}
                {isInProgress && badge.progress !== undefined && (
                  <div className="w-full">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-slate-400">
                        Progression
                      </span>
                      <span className="text-xs font-bold text-white">
                        {badge.progress}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-white/8 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${badge.progress}%` }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className={`h-full rounded-full bg-gradient-to-r ${badge.gradient}`}
                      />
                    </div>
                  </div>
                )}

                {/* XP & Date row */}
                <div className="w-full grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/5 border border-white/8 p-3 text-center">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">
                      Récompense
                    </p>
                    <p
                      className={`text-sm font-bold bg-gradient-to-r ${badge.gradient} bg-clip-text text-transparent`}
                    >
                      +{badge.xpReward} XP
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/8 p-3 text-center">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">
                      {badge.status === "unlocked" ? "Obtenu le" : "Statut"}
                    </p>
                    <p className="text-sm font-bold text-white">
                      {badge.status === "unlocked" && badge.unlockedAt
                        ? new Date(badge.unlockedAt).toLocaleDateString("fr-FR")
                        : isInProgress
                          ? "En cours"
                          : "Non débloqué"}
                    </p>
                  </div>
                </div>

                {/* CTA */}
                {isLocked && (
                  <button className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-sm cursor-not-allowed">
                    Badge verrouillé — Continuez votre progression !
                  </button>
                )}
                {!isLocked && (
                  <button
                    className={`w-full py-3 rounded-xl bg-gradient-to-r ${badge.gradient} text-white text-sm font-semibold transition-opacity hover:opacity-90`}
                  >
                    {isInProgress ? "Voir ma progression" : "Partager ce badge"}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
