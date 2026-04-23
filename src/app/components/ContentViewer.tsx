// src/app/components/ContentViewer.tsx
// Composant lecteur de contenu pédagogique
// Gère : Vidéo (YouTube/MP4), PDF, Audio, SCORM

import React, { useState, useEffect } from "react";
import { CheckCircle, ExternalLink, Play } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { marquerConsulte } from "../services/contenuService";
import { toast } from "sonner";
import type { Content } from "../types";
import { toastQueue } from "../utils/toastQueue";

interface ContentViewerProps {
  content: Content & {
    progression?: { complete: boolean; pourcentage: number } | null;
  };
  formationId: string;
  moduleId: string;
  onComplete?: () => void;
  canAccess: boolean; // false si non inscrit
  isLearner?: boolean;
}

export const ContentViewer: React.FC<ContentViewerProps> = ({
  content,
  formationId,
  moduleId,
  onComplete,
  canAccess,
  isLearner = false,
}) => {
  const [isComplete, setIsComplete] = useState(
    content.progression?.complete ?? false,
  );
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    setIsComplete(content.progression?.complete ?? false);
  }, [content.progression]);

  // Extraire l'ID YouTube depuis une URL
  const getYoutubeId = (url: string): string | null => {
    const patterns = [
      /youtube\.com\/watch\?v=([^&]+)/,
      /youtu\.be\/([^?]+)/,
      /youtube\.com\/embed\/([^?]+)/,
    ];
    for (const p of patterns) {
      const m = url.match(p);
      if (m) return m[1];
    }
    return null;
  };

  const handleMarquerComplete = async () => {
    setMarking(true);
    try {
      const res = (await marquerConsulte(
        formationId,
        moduleId,
        content.id,
        100,
      )) as any;
      setIsComplete(true);
      toast.success("Contenu marqué comme terminé !");

      // ✅ NOUVEAU — déduplique par code badge
      if (res?.nouveaux_badges?.length > 0) {
        const seen = new Set<string>();
        res.nouveaux_badges.forEach((badge: any) => {
          if (!seen.has(badge.code)) {
            seen.add(badge.code);
          }
        });
      }

      onComplete?.();
    } catch {
      toast.error("Impossible d'enregistrer la progression");
    } finally {
      setMarking(false);
    }
  };

  // ── Accès refusé ──────────────────────────────────────────
  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed rounded-xl border-gray-200 dark:border-slate-700 text-center p-6">
        <div className="text-5xl mb-3">🔒</div>
        <p className="text-gray-600 dark:text-gray-400 font-medium">
          Inscrivez-vous à cette formation pour accéder aux contenus
        </p>
      </div>
    );
  }

  if (!content.url) {
    return (
      <div className="flex items-center justify-center py-6 text-gray-400">
        Contenu non disponible
      </div>
    );
  }

  // ── Rendu du lecteur selon le type ────────────────────────
  const renderPlayer = () => {
    switch (content.type) {
      // ── Vidéo ──────────────────────────────────────────────
      case "video": {
        const youtubeId = getYoutubeId(content.url);
        if (youtubeId) {
          return (
            <div
              className="relative w-full rounded-xl overflow-hidden bg-black"
              style={{ paddingBottom: "56.25%" }}
            >
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&controls=1`}
                title={content.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          );
        }
        // Vidéo locale — preload="auto" active le seek
        // ✅ APRÈS — URL via route streaming Laravel
        const streamUrl = content.url?.includes("/storage/contenus/")
          ? content.url.replace(
              /^https?:\/\/[^/]+\/storage\//,
              "http://localhost:8000/api/stream/",
            )
          : content.url;

        return (
          <video
            controls
            preload="auto"
            className="w-full rounded-xl bg-black max-h-96"
            onEnded={isLearner ? handleMarquerComplete : undefined}
          >
            <source src={streamUrl} />
            Votre navigateur ne supporte pas la lecture vidéo.
          </video>
        );
      }

      // ── PDF ────────────────────────────────────────────────
      case "pdf": {
        // Détecter vrai PDF ou document externe
        const isPdfFile =
          content.url.toLowerCase().includes(".pdf") ||
          content.url.includes("/storage/");

        const isExternalDoc = !isPdfFile;

        // Si document externe
        if (isExternalDoc) {
          return (
            <div className="space-y-3">
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-6 text-center">
                <div className="text-5xl mb-3">📄</div>

                <p className="text-sm text-blue-800 dark:text-blue-300 mb-4 font-medium">
                  Document externe
                </p>

                <a
                  href={content.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ouvrir le document
                </a>
              </div>
            </div>
          );
        }

        // Si vrai PDF local
        return (
          <div className="space-y-3">
            <div className="w-full rounded-xl overflow-hidden border dark:border-slate-700 bg-gray-100 dark:bg-slate-800">
              <iframe
                src={`${content.url}#toolbar=1&navpanes=0`}
                className="w-full"
                style={{ height: "600px" }}
                title={content.title}
              />
            </div>

            <a
              href={content.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
            >
              <ExternalLink className="w-4 h-4" />
              Ouvrir le PDF dans un nouvel onglet
            </a>
          </div>
        );
      }
      // ── Audio ──────────────────────────────────────────────
      case "audio": {
        // ✅ Même fix que la vidéo — streaming pour les fichiers locaux
        const audioUrl = content.url?.includes("/storage/contenus/")
          ? content.url.replace(
              /^https?:\/\/[^/]+\/storage\//,
              "http://localhost:8000/api/stream/",
            )
          : content.url;

        return (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <Play className="w-8 h-8 text-white ml-1" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {content.title}
                </p>
                {content.duration > 0 && (
                  <p className="text-sm text-gray-500">
                    {content.duration} minutes
                  </p>
                )}
              </div>
            </div>
            <audio
              controls
              preload="auto"
              className="w-full"
              onEnded={isLearner ? handleMarquerComplete : undefined}
            >
              <source src={audioUrl} />
              Votre navigateur ne supporte pas la lecture audio.
            </audio>
          </div>
        );
      }

      // ── SCORM ──────────────────────────────────────────────
      case "scorm": {
        return (
          <div className="space-y-3">
            <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
              <p className="text-sm text-purple-800 dark:text-purple-300 mb-3">
                📂 Ce contenu est un module SCORM interactif.
              </p>
              <a
                href={content.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Lancer le module SCORM
              </a>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* En-tête du contenu */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {content.title}
          </h3>
          {content.summary && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {content.summary}
            </p>
          )}
        </div>
        {isComplete && (
          <Badge className="bg-green-100 text-green-700 shrink-0 gap-1">
            <CheckCircle className="w-3 h-3" /> Terminé
          </Badge>
        )}
      </div>

      {/* Barre de progression */}
      {isLearner && content.progression && !isComplete && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Progression</span>
            <span>{content.progression.pourcentage}%</span>
          </div>
          <Progress value={content.progression.pourcentage} className="h-2" />
        </div>
      )}

      {/* Lecteur */}
      <div>{renderPlayer()}</div>

      {/* Bouton marquer comme terminé */}
      {isLearner && !isComplete && (
        <div className="flex justify-end pt-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-green-600 border-green-200 hover:bg-green-50"
            onClick={handleMarquerComplete}
            disabled={marking}
          >
            {marking ? (
              <>
                <div className="w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />{" "}
                Enregistrement...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" /> Marquer comme terminé
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
