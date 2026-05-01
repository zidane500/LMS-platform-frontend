import React from "react";
import { motion } from "motion/react";
import {
  Clock,
  BookOpen,
  User,
  Edit,
  Trash2,
  Lock,
  Unlock,
} from "lucide-react";
import { Course } from "../types";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";

interface CourseCardProps {
  course: Course;
  progress?: number;
  isEnrolled?: boolean;
  hasCertificate?: boolean;
  isUnlocked?: boolean;
  isOwner?: boolean; // ✅ AJOUTÉ
  onEnroll?: () => void;
  onView: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showAdminActions?: boolean;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  progress,
  isEnrolled = false,
  hasCertificate = false,
  isUnlocked = false,
  isOwner = false, // ✅ AJOUTÉ
  onEnroll,
  onView,
  onEdit,
  onDelete,
  showAdminActions = false,
}) => {
  const levelColors = {
    Débutant:
      "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
    Intermédiaire:
      "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
    Avancé:
      "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  };

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card className="overflow-hidden h-full flex flex-col group cursor-pointer hover:shadow-xl transition-shadow">
        {/* ── Miniature ── */}
        <div className="relative overflow-hidden">
          <motion.img
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.4 }}
            src={
              course.thumbnail ||
              "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80"
            }
            alt={course.title}
            className="w-full h-48 object-cover"
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80";
            }}
          />

          {/* 🔐 Icône formation codée */}
          {course.is_coded && (
            <div className="absolute top-2 right-2 z-10">
              {isUnlocked ? (
                <div
                  className="flex items-center gap-1.5 bg-green-600/90 backdrop-blur-sm
                    text-white text-xs font-semibold px-2.5 py-1.5 rounded-full
                    shadow-lg shadow-green-900/30 border border-green-400/30"
                >
                  <Unlock className="w-3 h-3" />
                  <span>Décodée</span>
                </div>
              ) : (
                <div
                  className="flex items-center gap-1.5 bg-purple-600/90 backdrop-blur-sm
                    text-white text-xs font-semibold px-2.5 py-1.5 rounded-full
                    shadow-lg shadow-purple-900/30 border border-purple-400/30"
                >
                  <Lock className="w-3 h-3" />
                  <span>Codée</span>
                </div>
              )}
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Actions admin */}
          {showAdminActions && (
            <div className="absolute top-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              {onEdit && (
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 bg-white/90 hover:bg-white shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  <Edit className="w-4 h-4 text-blue-600" />
                </Button>
              )}
              {onDelete && (
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 bg-white/90 hover:bg-white shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              )}
            </div>
          )}

          {/* Barre de progression */}
          {progress !== undefined && (
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center justify-between text-white text-sm mb-1">
                <span>Progression</span>
                <span className="font-bold">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>

        {/* ── Contenu ── */}
        <CardContent className="flex-1 p-6">
          <div className="flex items-center justify-between mb-3 gap-2">
            <Badge variant="outline">{course.category}</Badge>
            <Badge className={levelColors[course.level]}>{course.level}</Badge>
          </div>

          <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {course.title}
          </h3>

          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
            {course.description}
          </p>

          <div className="flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{course.estimatedDuration}h</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              <span>{course.modules?.length || 0} modules</span>
            </div>
            {course.instructor && (
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>
                  {course.instructor.firstName} {course.instructor.lastName}
                </span>
              </div>
            )}
          </div>

          {/* Formations prérequises */}
          {course.is_coded &&
            course.prerequis_formations &&
            course.prerequis_formations.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1.5 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Prérequis (
                  {course.prerequis_formations.length}) :
                </p>
                <div className="flex flex-wrap gap-1">
                  {course.prerequis_formations.slice(0, 2).map((p) => (
                    <span
                      key={p.id}
                      className="text-xs px-2 py-0.5 rounded-full
                               bg-purple-50 text-purple-700 border border-purple-200
                               dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700
                               truncate max-w-[120px]"
                      title={p.titre}
                    >
                      {p.titre}
                    </span>
                  ))}
                  {course.prerequis_formations.length > 2 && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full
                                   bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400"
                    >
                      +{course.prerequis_formations.length - 2}
                    </span>
                  )}
                </div>
              </div>
            )}
        </CardContent>

        {/* ── Footer ── */}
        <CardFooter className="p-6 pt-0 flex flex-col gap-2">
          {hasCertificate && (
            <span
              className="inline-flex items-center justify-center gap-1 text-xs px-2.5 py-1 rounded-full
                     font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400
                     border border-yellow-200 dark:border-yellow-800 self-center"
            >
              🎓 Formation terminée
            </span>
          )}

          {isEnrolled && (
            <span
              className="inline-flex items-center justify-center gap-1 text-xs px-2.5 py-1 rounded-full
                     font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400
                     border border-green-200 dark:border-green-800 self-center"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Vous êtes inscrit
            </span>
          )}

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full"
          >
            {(() => {
              // ✅ Créateur de la formation → "Voir le cours" (même si formation codée non débloquée)
              if (course.is_coded && isOwner) {
                return (
                  <Button onClick={onView} className="w-full">
                    Voir le cours
                  </Button>
                );
              }

              // ✅ Formation codée NON débloquée ET utilisateur non créateur
              if (course.is_coded && !isUnlocked && !isOwner) {
                return (
                  <Button
                    onClick={onEnroll || onView}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-md"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Essai de l'obtenir
                  </Button>
                );
              }

              // ✅ Formation normale ou débloquée → comportement standard
              if (progress !== undefined) {
                return (
                  <Button onClick={onView} className="w-full">
                    {hasCertificate ? "Revoir le cours" : "Continuer le cours"}
                  </Button>
                );
              }

              return (
                <Button
                  onClick={onEnroll || onView}
                  variant="outline"
                  className="w-full"
                >
                  Voir le cours
                </Button>
              );
            })()}
          </motion.div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
