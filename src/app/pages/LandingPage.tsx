import React from "react";
import { motion } from "motion/react";
import { Link } from "react-router";
import {
  GraduationCap,
  BookOpen,
  Award,
  Users,
  TrendingUp,
  Sparkles,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export const LandingPage: React.FC = () => {
  const features = [
    {
      icon: BookOpen,
      title: "Formations de qualité",
      description: "Accédez à des centaines de cours créés par des experts",
    },
    {
      icon: Award,
      title: "Certifications reconnues",
      description: "Obtenez des certificats validés et téléchargeables",
    },
    {
      icon: TrendingUp,
      title: "Suivi de progression",
      description: "Visualisez votre avancement avec des analytics détaillés",
    },
    {
      icon: Users,
      title: "Communauté active",
      description: "Apprenez avec des milliers d'apprenants motivés",
    },
  ];

  const stats = [
    { value: "10,000+", label: "Apprenants actifs" },
    { value: "500+", label: "Formations disponibles" },
    { value: "50+", label: "Formateurs experts" },
    { value: "95%", label: "Taux de satisfaction" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 overflow-hidden">
      {/* ✅ Masque les boutons natifs du navigateur (PiP, plein écran) sur la vidéo */}
      <style>{`
        video::-webkit-media-controls,
        video::-webkit-media-controls-enclosure,
        video::-webkit-media-controls-overlay-play-button,
        video::-webkit-media-controls-panel {
          display: none !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `}</style>

      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          animate={{ x: [0, 100, 0], y: [0, -100, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ top: "10%", left: "10%" }}
        />
        <motion.div
          className="absolute w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
          animate={{ x: [0, -100, 0], y: [0, 100, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          style={{ bottom: "10%", right: "10%" }}
        />
        <motion.div
          className="absolute w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"
          animate={{ x: [0, -50, 0], y: [0, 50, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          style={{ top: "50%", left: "50%" }}
        />
      </div>

      {/* Hero Section */}
      <div className="relative">
        <div className="container mx-auto px-4 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 mb-6"
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-purple-300 text-sm">Plateforme LMS</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-5xl lg:text-7xl font-bold mb-6 leading-tight"
              >
                <span className="bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                  Apprenez sans limites,
                </span>
                <br />
                <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Réussissez ensemble
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl text-gray-300 mb-8 leading-relaxed"
              >
                Rejoignez la plateforme d'apprentissage la plus innovante.
                Formations de qualité, suivi personnalisé et certifications
                reconnues.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-4"
              >
                <Link to="/login">
                  <motion.button
                    whileHover={{
                      scale: 1.05,
                      boxShadow: "0 20px 60px rgba(168, 85, 247, 0.4)",
                    }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/50 flex items-center gap-2"
                  >
                    Commencer gratuitement
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-6 mt-8"
              >
                {[1, 2, 3, 4, 5].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                  >
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </motion.div>
                ))}
                <span className="text-gray-400">
                  Plus de 10,000 apprenants satisfaits
                </span>
              </motion.div>
            </motion.div>

            {/* ✅ Right Content - Hero Video avec cartes repositionnées */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
              style={{
                padding: "2.5rem 1rem",
              }} /* espace pour les cartes qui débordent */
            >
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative z-10"
              >
                {/* ✅ Carte Certification — AU-DESSUS de la vidéo, côté gauche */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 }}
                  style={{
                    position: "absolute",
                    top: "-4rem",
                    left: "0.5rem",
                    zIndex: 20,
                  }}
                >
                  <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 shadow-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                        <Award className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-white font-semibold">
                          Certification
                        </div>
                        <div className="text-gray-300 text-sm">
                          +150 cette semaine
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>

                {/* ✅ Vidéo — sans contrôles natifs */}
                <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/30">
                  {/* Overlay intercepte les clics pour bloquer les contrôles */}
                  <div
                    className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-blue-500/20 z-10"
                    style={{ pointerEvents: "all", cursor: "default" }}
                  />
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    disablePictureInPicture
                    className="w-full h-auto block"
                    style={{ objectFit: "cover" }}
                  >
                    <source src="/videos/hero-video.mp4" type="video/mp4" />
                  </video>
                </div>

                {/* ✅ Carte 95% Réussite — EN-DESSOUS de la vidéo, côté droit */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2 }}
                  style={{
                    position: "absolute",
                    bottom: "-5.5rem",
                    right: "0.5rem",
                    zIndex: 20,
                  }}
                >
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                    className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 shadow-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-white font-semibold">
                          95% Réussite
                        </div>
                        <div className="text-gray-300 text-sm">
                          Taux de complétion
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative py-20"
      >
        <div className="container mx-auto px-4">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
                    className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2"
                  >
                    {stat.value}
                  </motion.div>
                  <div className="text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Features Section */}
      <div className="relative py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Pourquoi choisir notre plateforme ?
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Une expérience d'apprentissage complète et innovante
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="group"
                >
                  <div className="relative h-full backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
                    <motion.div
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                      className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/50"
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </motion.div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400">{feature.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative py-20"
      >
        <div className="container mx-auto px-4">
          <div className="relative backdrop-blur-xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-white/20 rounded-3xl p-12 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10"></div>
            <div className="relative z-10 text-center max-w-3xl mx-auto">
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center"
              >
                <GraduationCap className="w-10 h-10 text-white" />
              </motion.div>
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                Prêt à commencer votre parcours ?
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Rejoignez des milliers d'apprenants et transformez votre
                carrière dès aujourd'hui
              </p>
              <Link to="/login">
                <motion.button
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 20px 60px rgba(168, 85, 247, 0.4)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="px-10 py-5 bg-white text-purple-600 rounded-xl font-bold text-lg shadow-lg hover:shadow-2xl transition-shadow"
                >
                  Commencer maintenant
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
