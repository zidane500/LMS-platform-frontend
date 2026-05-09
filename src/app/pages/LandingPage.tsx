import React, { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Link } from "react-router";
import {
  GraduationCap,
  BookOpen,
  Award,
  Users,
  TrendingUp,
  ArrowRight,
  ChevronRight,
  CheckCircle,
  Play,
  Globe,
  Zap,
  Shield,
  BarChart3,
  Menu,
  X,
  Star,
  Building,
  Lightbulb,
  Rocket,
} from "lucide-react";

/* ─────────────────────────── data ─────────────────────────── */

const features = [
  {
    icon: BookOpen,
    color: "#2D5BE3",
    bg: "#EEF2FF",
    title: "Formations d'excellence",
    description:
      "Accédez à des centaines de cours conçus par des experts de l'industrie pour propulser votre carrière.",
  },
  {
    icon: Award,
    color: "#0D9488",
    bg: "#F0FDFA",
    title: "Certifications reconnues",
    description:
      "Validez vos compétences avec des certifications officielles, reconnues par les entreprises du monde entier.",
  },
  {
    icon: BarChart3,
    color: "#7C3AED",
    bg: "#F5F3FF",
    title: "Analyse de progression",
    description:
      "Suivez votre évolution grâce à un tableau de bord détaillé et des indicateurs de performance en temps réel.",
  },
  {
    icon: Users,
    color: "#EA580C",
    bg: "#FFF7ED",
    title: "Communauté engagée",
    description:
      "Rejoignez un réseau de milliers de professionnels ambitieux pour échanger, apprendre et collaborer.",
  },
  {
    icon: Globe,
    color: "#0369A1",
    bg: "#F0F9FF",
    title: "Accessible partout",
    description:
      "Apprenez depuis n'importe quel appareil, en ligne ou hors ligne, à votre propre rythme.",
  },
  {
    icon: Shield,
    color: "#15803D",
    bg: "#F0FDF4",
    title: "Open Source & Sécurisé",
    description:
      "Basé sur la plateforme Open edX certifiée, votre contenu et vos données restent toujours sous votre contrôle.",
  },
];

const stats = [
  { value: "10k+", label: "Apprenants actifs", color: "#2D5BE3" },
  { value: "500+", label: "Formations", color: "#0D9488" },
  { value: "50+", label: "Experts qualifiés", color: "#7C3AED" },
  { value: "98%", label: "Taux de satisfaction", color: "#EA580C" },
];

const partners = ["FSEGN"];

const testimonials = [
  {
    quote:
      "LMS Pro a complètement transformé notre programme de formation interne. Le taux d'engagement a augmenté de 300% en 6 mois.",
    author: "Marie Dupont",
    role: "DRH, TechCorp France",
    avatar: "MD",
    color: "#2D5BE3",
  },
  {
    quote:
      "La qualité des certifications et le suivi analytique sont incomparables. Nos équipes progressent deux fois plus vite.",
    author: "Jean-Paul Martin",
    role: "CTO, Innovate SAS",
    avatar: "JM",
    color: "#0D9488",
  },
  {
    quote:
      "Enfin une plateforme pensée pour les entreprises modernes. Interface intuitive et support réactif — exactement ce qu'il nous fallait.",
    author: "Sophie Lefèvre",
    role: "Responsable Formation, GroupeNext",
    avatar: "SL",
    color: "#7C3AED",
  },
];

const useCases = [
  {
    icon: Building,
    title: "Entreprises",
    desc: "Formez vos équipes avec des parcours personnalisés et mesurez l'impact en temps réel.",
    color: "#2D5BE3",
    bg: "#EEF2FF",
  },
  {
    icon: GraduationCap,
    title: "Universités",
    desc: "Déployez des programmes académiques hybrides avec outils de suivi et certification.",
    color: "#0D9488",
    bg: "#F0FDFA",
  },
  {
    icon: Lightbulb,
    title: "Créateurs de contenu",
    desc: "Monétisez votre expertise en créant et distribuant des formations à grande échelle.",
    color: "#7C3AED",
    bg: "#F5F3FF",
  },
  {
    icon: Rocket,
    title: "Startups & Scale-ups",
    desc: "Accélérez l'onboarding et la montée en compétences avec des modules sur-mesure.",
    color: "#EA580C",
    bg: "#FFF7ED",
  },
];

/* ─────────────────────────── component ─────────────────────── */

export const LandingPage: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, -80]);

  useEffect(() => {
    const unsub = scrollY.on("change", (v) => setScrolled(v > 20));
    return () => unsub();
  }, [scrollY]);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans overflow-x-hidden">
      {/* ── NAVBAR ── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center shadow-sm"
              style={{ background: "linear-gradient(135deg,#2D5BE3,#0D9488)" }}
            >
              <GraduationCap className="w-6 h-6 text-white" />
            </div>

            <span className="text-2xl font-extrabold tracking-tight text-gray-900">
              LMS
            </span>
          </Link>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/login"
              className="text-base font-bold text-white px-7 py-3 rounded-full transition-all hover:opacity-90 hover:shadow-lg hover:shadow-blue-200"
              style={{
                background: "linear-gradient(135deg,#14B8A6,#0F766E)",
                boxShadow: "0 10px 25px rgba(20,184,166,0.35)",
              }}
            >
              Connexion
            </Link>

            <Link
              to="/register"
              className="text-base font-bold text-white px-7 py-3 rounded-full transition-all hover:opacity-90 hover:shadow-lg hover:shadow-blue-200"
              style={{ background: "linear-gradient(135deg,#2D5BE3,#1A42B8)" }}
            >
              S'inscrire
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            {menuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-white border-t border-gray-100 px-6 py-4 flex flex-col gap-3 shadow-sm"
          >
            <Link
              to="/login"
              className="text-sm font-semibold text-white px-5 py-3 rounded-full text-center"
              style={{ background: "linear-gradient(135deg,#2D5BE3,#1A42B8)" }}
              onClick={() => setMenuOpen(false)}
            >
              Connexion
            </Link>

            <Link
              to="/register"
              className="text-sm font-semibold text-white px-5 py-3 rounded-full text-center"
              style={{ background: "linear-gradient(135deg,#2D5BE3,#1A42B8)" }}
              onClick={() => setMenuOpen(false)}
            >
              S'inscrire
            </Link>
          </motion.div>
        )}
      </header>

      {/* ── HERO ── */}
      <section
        className="relative pt-28 pb-0 overflow-hidden"
        style={{
          background:
            "linear-gradient(160deg, #0B1E4B 0%, #0E3D6E 40%, #0A5A5A 100%)",
        }}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full opacity-20"
            style={{
              background:
                "radial-gradient(circle, #2D5BE3 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute bottom-[10%] left-[-5%] w-[400px] h-[400px] rounded-full opacity-10"
            style={{
              background:
                "radial-gradient(circle, #0D9488 0%, transparent 70%)",
            }}
          />
          {/* Dot grid */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        <motion.div
          style={{ y: heroY }}
          className="relative z-10 max-w-7xl mx-auto px-6"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-8"
          ></motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center text-white mx-auto max-w-4xl"
            style={{
              fontSize: "clamp(2.5rem, 6vw, 5rem)",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
            }}
          >
            La plateforme d'apprentissage{" "}
            <span
              style={{
                background: "linear-gradient(90deg,#60A5FA,#34D399)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              LMS
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mt-6 mb-10 text-lg md:text-xl max-w-2xl mx-auto"
            style={{ color: "rgba(255,255,255,0.65)", lineHeight: 1.7 }}
          >
            Rejoignez la plateforme d'apprentissage la plus innovante.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link to="/register">
              <button
                className="flex items-center gap-2 px-7 py-4 rounded-full text-sm font-bold text-white transition-all hover:opacity-90 hover:shadow-2xl"
                style={{
                  background: "linear-gradient(135deg,#2D5BE3,#0D9488)",
                  boxShadow: "0 4px 24px rgba(45,91,227,0.4)",
                }}
              >
                Commencer gratuitement <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link to="/formations">
              <button className="flex items-center gap-2 px-7 py-4 rounded-full text-sm font-semibold border border-white/20 text-white/90 hover:bg-white/10 transition-all">
                Voir les formations
              </button>
            </Link>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-6 text-sm mb-16"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            {["Support 24/7"].map((t, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> {t}
              </span>
            ))}
          </motion.div>

          {/* Hero image / dashboard mock */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative max-w-5xl mx-auto"
          >
            <div
              className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
              style={{
                boxShadow:
                  "0 40px 120px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1600&q=80"
                alt="LMS Pro Dashboard"
                className="w-full object-cover"
                style={{ height: "420px" }}
              />
              {/* Overlay gradient */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(180deg, transparent 60%, rgba(11,30,75,0.6) 100%)",
                }}
              />
            </div>

            {/* Floating stats cards */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="absolute -left-8 top-1/3 hidden lg:block"
            >
              <div
                className="bg-white rounded-2xl p-4 shadow-2xl flex items-center gap-3"
                style={{ minWidth: 180 }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "#EEF2FF" }}
                >
                  <TrendingUp
                    className="w-5 h-5"
                    style={{ color: "#2D5BE3" }}
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">
                    Taux de réussite
                  </p>
                  <p className="text-lg font-bold text-gray-900">+95%</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2, duration: 0.5 }}
              className="absolute -right-8 top-1/2 hidden lg:block"
            >
              <div
                className="bg-white rounded-2xl p-4 shadow-2xl flex items-center gap-3"
                style={{ minWidth: 200 }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "#F0FDFA" }}
                >
                  <Award className="w-5 h-5" style={{ color: "#0D9488" }} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">
                    Certifications délivrées
                  </p>
                  <p className="text-lg font-bold text-gray-900">12 489</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Wave */}
        <div className="relative z-10 -mb-px">
          <svg
            viewBox="0 0 1440 80"
            preserveAspectRatio="none"
            className="w-full"
            style={{ display: "block", marginTop: "3rem" }}
          >
            <path
              d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* ── PARTNERS / TRUSTED BY ── */}
      <section className="py-14 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs font-bold tracking-widest text-gray-400 uppercase mb-8">
            Faites confiance par des institutions de premier plan
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
            {partners.map((p, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="text-base font-bold text-gray-300 hover:text-gray-500 transition-colors tracking-tight cursor-default"
              >
                {p}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* ── USE CASES ── */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-sm font-bold tracking-widest uppercase mb-3"
              style={{ color: "#2D5BE3" }}
            >
              Qui utilise LMS ?
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight"
            >
              Une plateforme pour tous
            </motion.h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((uc, i) => {
              const Icon = uc.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group bg-white rounded-2xl p-7 border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all cursor-pointer"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: uc.bg }}
                  >
                    <Icon className="w-6 h-6" style={{ color: uc.color }} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {uc.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {uc.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-16 items-start">
            {/* Left copy */}
            <div className="lg:w-1/3 lg:sticky top-28">
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-sm font-bold tracking-widest uppercase mb-3"
                style={{ color: "#0D9488" }}
              >
                Fonctionnalités
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-5"
              >
                Conçu pour l'excellence pédagogique
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-gray-500 text-lg leading-relaxed mb-8"
              >
                Chaque fonctionnalité est pensée pour maximiser l'engagement des
                apprenants et l'efficacité des formateurs.
              </motion.p>
              <Link to="/register">
                <button
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{
                    background: "linear-gradient(135deg,#2D5BE3,#0D9488)",
                  }}
                >
                  S'inscrire <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>

            {/* Right grid */}
            <div className="lg:w-2/3 grid sm:grid-cols-2 gap-5">
              {features.map((feat, i) => {
                const Icon = feat.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="group p-6 rounded-2xl border border-gray-100 hover:border-transparent hover:shadow-xl transition-all bg-white"
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                      style={{ background: feat.bg }}
                    >
                      <Icon className="w-5 h-5" style={{ color: feat.color }} />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-2">
                      {feat.title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {feat.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section
        className="py-24 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #0B1E4B 0%, #0E3D6E 50%, #0A5A5A 100%)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
              Des résultats qui parlent d'eux-mêmes
            </h2>
            <p
              style={{ color: "rgba(255,255,255,0.55)" }}
              className="text-lg max-w-xl mx-auto"
            >
              Des milliers d'organisations font déjà confiance à LMS pour
              transformer leurs équipes.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative rounded-2xl p-8 text-center border border-white/10 overflow-hidden"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                <div
                  className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity rounded-2xl"
                  style={{
                    background: `radial-gradient(circle at center, ${stat.color}22 0%, transparent 70%)`,
                  }}
                />
                <div
                  className="text-4xl md:text-5xl font-black mb-2 text-white"
                  style={{
                    background: `linear-gradient(135deg, white, ${stat.color})`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {stat.value}
                </div>
                <div
                  className="text-sm font-medium"
                  style={{ color: "rgba(255,255,255,0.55)" }}
                >
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-sm font-bold tracking-widest uppercase mb-3"
              style={{ color: "#7C3AED" }}
            >
              Comment ça marche ?
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight"
            >
              Lancez-vous en 3 étapes
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div
              className="absolute top-12 left-1/4 right-1/4 h-px hidden md:block"
              style={{
                background: "linear-gradient(90deg,#2D5BE3,#0D9488,#7C3AED)",
              }}
            />

            {[
              {
                step: "01",
                title: "Créez un compte",
                desc: "Inscrivez-vous gratuitement et configurez votre plateforme en quelques minutes, sans aucune compétence technique.",
                color: "#2D5BE3",
                bg: "#EEF2FF",
              },
              {
                step: "02",
                title: "Consulter aux formations",
                desc: "Explorez les formations disponibles, accédez aux contenus pédagogiques interactifs et suivez les cours adaptés à vos objectifs.",
                color: "#0D9488",
                bg: "#F0FDFA",
              },
              {
                step: "03",
                title: "Demander role formateur",
                desc: "Soumettez une demande pour devenir formateur et commencez à créer, gérer et publier vos propres cours sur la plateforme.",
                color: "#7C3AED",
                bg: "#F5F3FF",
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative"
              >
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-black"
                  style={{ background: step.bg, color: step.color }}
                >
                  {step.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                  {step.title}
                </h3>
                <p className="text-gray-500 text-center leading-relaxed">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VISUAL SPLIT SECTION ── */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <p
                className="text-sm font-bold tracking-widest uppercase mb-3"
                style={{ color: "#EA580C" }}
              >
                Plateforme d’apprentissage intelligente
              </p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-5">
                Écosystème pédagogique moderne
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed mb-8">
                LMS repose sur une architecture moderne basée sur React, Laravel
                et PostgreSQL, garantissant performance, sécurité et
                évolutivité, d'une communauté active et d'intégrations infinies.
              </p>
              <ul className="flex flex-col gap-3 mb-8">
                {[
                  "Plus de 50 millions d'apprenants dans le monde",
                  "Compatible avec les standards SCORM & xAPI",

                  "API RESTful complète pour vos développements",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm text-gray-600"
                  >
                    <CheckCircle
                      className="w-5 h-5 mt-0.5 flex-shrink-0"
                      style={{ color: "#0D9488" }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1573496130488-f3bd89d03653?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaXZlcnNlJTIwdGVhbSUyMGxlYXJuaW5nJTIwY29sbGFib3JhdGlvbiUyMHdvcmtzcGFjZXxlbnwxfHx8fDE3NzgyNzA1NjR8MA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Équipe apprenante"
                  className="w-full object-cover"
                  style={{ height: "420px" }}
                />
              </div>
              {/* Floating badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-5 shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {["#2D5BE3", "#0D9488", "#EA580C"].map((c, i) => (
                      <div
                        key={i}
                        className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: c }}
                      >
                        {["A", "B", "C"][i]}
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Nouveaux apprenants</p>
                    <p className="text-sm font-bold text-gray-900">
                      +128 cette semaine
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-sm font-bold tracking-widest uppercase mb-3"
              style={{ color: "#2D5BE3" }}
            >
              Témoignages
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight"
            >
              Ils nous font confiance
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-gray-50 rounded-2xl p-7 border border-gray-100 hover:shadow-lg transition-all"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star
                      key={s}
                      className="w-4 h-4 fill-current"
                      style={{ color: "#FBBF24" }}
                    />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed mb-6 text-sm">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ background: t.color }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {t.author}
                    </p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section
        className="py-24 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #0B1E4B 0%, #0E3D6E 50%, #0A5A5A 100%)",
        }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] rounded-full opacity-10"
            style={{
              background: "radial-gradient(circle, #2D5BE3, transparent)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
              Prêt à développer
              <br />
              vos compétences ?
            </h2>
            <p
              className="text-xl mb-10 max-w-2xl mx-auto"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              Rejoignez les organisations les plus performantes et donnez à vos
              équipes les outils pour exceller.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <button className="flex items-center gap-2 px-8 py-4 rounded-full text-sm font-bold text-gray-900 bg-white hover:bg-gray-100 transition-all shadow-2xl">
                  Créer un compte gratuitement{" "}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link to="/formations">
                <button className="flex items-center gap-2 px-7 py-4 rounded-full text-sm font-semibold border border-white/20 text-white/90 hover:bg-white/10 transition-all">
                  Voir les formations
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-950 text-gray-400 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col items-center justify-center mb-12 text-center">
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg,#2D5BE3,#0D9488)",
                }}
              >
                <GraduationCap className="w-5 h-5 text-white" />
              </div>

              <span className="text-xl font-bold tracking-tight text-white">
                LMS
              </span>
            </div>

            <p className="text-sm text-gray-500 max-w-md">
              Plateforme moderne d’apprentissage en ligne avec suivi
              intelligent, quiz interactifs et intégration IA.
            </p>
          </div>

          <div className="border-t border-white/5 pt-8 flex justify-center">
            <p className="text-xs text-center">
              © {new Date().getFullYear()} LMS. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
