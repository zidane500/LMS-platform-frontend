import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lock, Star, Zap, Trophy, CheckCircle } from "lucide-react";
import { Badge, BadgeTier } from "./BadgesData";

interface BadgeCardProps {
  badge: Badge;
  onSelect: (badge: Badge) => void;
  index: number;
}

const tierConfig: Record<
  BadgeTier,
  { label: string; border: string; shine: string; starColor: string }
> = {
  common: {
    label: "Commun",
    border: "border-slate-500/30",
    shine: "from-slate-400/10 to-transparent",
    starColor: "text-slate-400",
  },
  rare: {
    label: "Rare",
    border: "border-blue-500/40",
    shine: "from-blue-400/20 to-transparent",
    starColor: "text-blue-400",
  },
  epic: {
    label: "Épique",
    border: "border-violet-500/50",
    shine: "from-violet-400/25 to-transparent",
    starColor: "text-violet-400",
  },
  legendary: {
    label: "Légendaire",
    border: "border-amber-400/60",
    shine: "from-amber-300/30 to-transparent",
    starColor: "text-amber-400",
  },
};

export function BadgeCard({ badge, onSelect, index }: BadgeCardProps) {
  const [hovered, setHovered] = useState(false);

  const isLocked = badge.status === "locked";
  const isInProgress = badge.status === "in-progress";
  const isUnlocked = badge.status === "unlocked";

  const progress = (badge as any).progress ?? 0;

  const tier = tierConfig[badge.tier];

  const TierIcon =
    badge.tier === "legendary"
      ? Trophy
      : badge.tier === "epic"
        ? Zap
        : badge.tier === "rare"
          ? Star
          : Star;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
      whileHover={{ y: -6, scale: 1.02 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={() => onSelect(badge)}
      className="relative cursor-pointer group"
    >
      {/* Glow effect */}
      <AnimatePresence>
        {hovered && !isLocked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 rounded-2xl blur-xl -z-10"
            style={{ background: badge.glowColor }}
          />
        )}
      </AnimatePresence>

      {/* Legendary border */}
      {badge.tier === "legendary" && !isLocked && (
        <div className="absolute inset-0 rounded-2xl z-0 overflow-hidden">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-50%] opacity-60"
            style={{
              background:
                "conic-gradient(transparent, #fbbf24, transparent, #a78bfa, transparent)",
            }}
          />
        </div>
      )}

      {/* Card */}
      <div
        className={`relative z-10 rounded-2xl border backdrop-blur-md overflow-hidden transition-all duration-300
          ${tier.border}
          ${isLocked ? "bg-[rgba(15,15,30,0.6)]" : "bg-[rgba(20,20,45,0.85)]"}
          ${badge.tier === "legendary" && !isLocked ? "m-[1px]" : ""}
        `}
        style={{
          boxShadow:
            hovered && !isLocked
              ? `0 0 30px ${badge.glowColor}, 0 8px 32px rgba(0,0,0,0.5)`
              : "0 4px 20px rgba(0,0,0,0.3)",
        }}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-br ${tier.shine} pointer-events-none`}
        />

        {!isLocked && (
          <div
            className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${badge.gradient} opacity-70`}
          />
        )}

        <div className="p-5 flex flex-col items-center gap-3">
          {/* ICON */}
          <div className="relative">
            <motion.div
              animate={
                hovered && !isLocked
                  ? { scale: [1, 1.15, 1.1], rotate: [0, -5, 5, 0] }
                  : {}
              }
              transition={{ duration: 0.4 }}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl relative overflow-hidden
                ${
                  isLocked
                    ? "bg-[rgba(255,255,255,0.03)]"
                    : `bg-gradient-to-br ${badge.gradient}`
                }
              `}
              style={{
                boxShadow: !isLocked ? `0 4px 16px ${badge.glowColor}` : "none",
                filter:
                  isLocked && !isInProgress
                    ? "grayscale(1) opacity(0.4)"
                    : "none",
              }}
            >
              {isLocked && !isInProgress ? (
                <Lock className="w-6 h-6 text-slate-600" />
              ) : (
                <span className="drop-shadow-lg">{badge.icon}</span>
              )}

              {!isLocked && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
              )}
            </motion.div>

            {/* ✅ Unlocked check */}
            {isUnlocked && (
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
            )}

            {/* 🔄 Progress indicator */}
            {isInProgress && (
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                <span className="text-[8px] font-bold text-white">
                  {progress}%
                </span>
              </div>
            )}

            {/* Tier */}
            {badge.tier !== "common" && (
              <div
                className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center
                  ${
                    badge.tier === "legendary"
                      ? "bg-amber-400"
                      : badge.tier === "epic"
                        ? "bg-violet-500"
                        : "bg-blue-500"
                  }
                `}
              >
                <TierIcon className="w-2.5 h-2.5 text-white" fill="white" />
              </div>
            )}
          </div>

          {/* NAME */}
          <div className="text-center">
            <p
              className={`text-sm font-semibold leading-tight ${
                isLocked ? "text-slate-500" : "text-white"
              }`}
            >
              {badge.name}
            </p>

            <span
              className={`text-[10px] uppercase tracking-widest font-medium mt-0.5 block ${tier.starColor} ${
                isLocked ? "opacity-40" : ""
              }`}
            >
              {tier.label}
            </span>
          </div>

          {/* XP */}
          {isUnlocked && (
            <div
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide
                bg-gradient-to-r ${badge.gradient} text-white`}
            >
              +{badge.xpReward} XP
            </div>
          )}

          {/* PROGRESS BAR */}
          {!isUnlocked && (
            <div className="w-full mt-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-slate-400">
                  {isInProgress ? "En cours" : "Verrouillé"}
                </span>
                <span className="text-[10px] font-semibold text-white">
                  {progress}%
                </span>
              </div>

              <div className="w-full h-1.5 rounded-full bg-[rgba(255,255,255,0.08)] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{
                    duration: 1,
                    delay: index * 0.05 + 0.3,
                    ease: "easeOut",
                  }}
                  className="h-full rounded-full"
                  style={{
                    background: isInProgress
                      ? "linear-gradient(90deg, #f59e0b, #f97316)"
                      : "rgba(100,116,139,0.4)",
                  }}
                />
              </div>

              {(badge as any).progressDetail && (
                <p className="text-[9px] text-slate-500 mt-1 text-center">
                  {(badge as any).progressDetail}
                </p>
              )}
            </div>
          )}

          {/* DATE */}
          {isUnlocked && badge.unlockedAt && (
            <p className="text-[10px] text-slate-500 mt-0.5">
              Obtenu le {new Date(badge.unlockedAt).toLocaleDateString("fr-FR")}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
