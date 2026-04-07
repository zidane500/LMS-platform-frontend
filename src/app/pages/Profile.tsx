// src/app/pages/Profile.tsx
import React from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { User, Mail, Phone, Calendar, Globe, Edit } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";

export const Profile: React.FC = () => {
  const { currentUser } = useApp();
  const navigate = useNavigate();

  if (!currentUser) {
    navigate("/login");
    return null;
  }

  const avatarUrl = currentUser.avatar
    ? `${currentUser.avatar}?v=${currentUser.avatar.split("/").pop()}`
    : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-slate-950 dark:to-purple-950/30">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className="h-48 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl" />
          <div className="absolute bottom-0 left-8 transform translate-y-1/2">
            <div className="w-32 h-32 rounded-full bg-white dark:bg-slate-900 p-1 shadow-xl">
              <Avatar className="w-full h-full">
                <AvatarImage
                  src={avatarUrl}
                  className="object-cover rounded-full"
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-4xl rounded-full">
                  {currentUser.firstName[0]}
                  {currentUser.lastName[0]}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </motion.div>

        {/* Nom + bouton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="ml-44 space-y-2"
        >
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold dark:text-white">
                {currentUser.firstName} {currentUser.lastName}
              </h1>
              <Badge className="capitalize mt-2">
                {currentUser.role === "learner"
                  ? "Apprenant"
                  : currentUser.role === "instructor"
                    ? "Formateur"
                    : "Administrateur"}
              </Badge>
            </div>
            <Button
              onClick={() => navigate("/app/profile/edit")}
              className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600"
            >
              <Edit className="w-4 h-4" /> Modifier mon profil
            </Button>
          </div>
        </motion.div>

        {/* Informations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Nom complet</p>
                    <p className="font-medium dark:text-white">
                      {currentUser.firstName} {currentUser.lastName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium dark:text-white">
                      {currentUser.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Téléphone</p>
                    <p className="font-medium dark:text-white">
                      {currentUser.phone || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Date de naissance</p>
                    <p className="font-medium dark:text-white">
                      {currentUser.dateOfBirth
                        ? new Date(currentUser.dateOfBirth).toLocaleDateString(
                            "fr-FR",
                          )
                        : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Langue préférée</p>
                    <p className="font-medium dark:text-white capitalize">
                      {currentUser.preferredLanguage}
                    </p>
                  </div>
                </div>
              </div>

              {(currentUser.targetDomains?.length ?? 0) > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">
                    Domaines d'intérêt
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {currentUser.targetDomains!.map((d, i) => (
                      <Badge key={i} variant="secondary">
                        {d}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {(currentUser.technologies?.length ?? 0) > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Technologies</p>
                  <div className="flex flex-wrap gap-2">
                    {currentUser.technologies!.map((t, i) => (
                      <Badge key={i}>{t}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
