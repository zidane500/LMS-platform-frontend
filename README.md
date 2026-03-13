# 🎓 Plateforme LMS - Learning Management System

Une plateforme d'apprentissage moderne et professionnelle développée avec React, TypeScript et Tailwind CSS.

## ✨ Fonctionnalités

### 🔐 Authentification & Gestion des Utilisateurs
- ✅ Inscription avec validation complète
- ✅ Connexion sécurisée avec animations professionnelles
- ✅ Gestion des rôles (Admin, Formateur, Apprenant)
- ✅ Demande pour devenir formateur
- ✅ Validation des demandes par l'administrateur
- ✅ **Modification de profil avec upload de photo**
- ✅ **Suppression de photo de profil**

### 🎨 Personnalisation
- ✅ **Mode sombre/clair avec toggle animé**
- ✅ **Basculement fluide entre les thèmes**
- ✅ **Préférences sauvegardées localement**

### 📚 Gestion des Formations
- ✅ Catalogue de formations avec filtres avancés
- ✅ Détails complets des formations
- ✅ Création de formations (Formateurs/Admins)
- ✅ Organisation en modules
- ✅ Inscription aux formations

### 📖 Contenus Pédagogiques
- ✅ Différents types de contenus (vidéo, PDF, audio)
- ✅ Lecture de contenus
- ✅ Traçabilité de la progression

### 📝 Quiz & Évaluations
- ✅ Quiz interactifs avec animations fluides
- ✅ Différents types de questions (QCM, Vrai/Faux)
- ✅ Feedback immédiat
- ✅ Score et validation
- ✅ Système de badges

### 📊 Suivi de Progression
- ✅ Dashboard personnalisé
- ✅ Progression détaillée par formation
- ✅ Progression par module
- ✅ Badges obtenus
- ✅ Historique des quiz
- ✅ Statistiques pour les formateurs
- ✅ Panneau d'administration complet

## 🎨 Design & Animations

- **Interface ultra-moderne** avec design épuré et professionnel
- **Page de connexion redesignée** avec animations subtiles et élégantes
- **Formes géométriques flottantes** pour un effet moderne
- **Grille de fond** pour plus de profondeur
- **Animations fluides** avec Motion (Framer Motion)
- **Transitions de page** élégantes
- **Composants interactifs** avec hover effects
- **Design responsive** (mobile, tablette, desktop)
- **Mode sombre complet** avec transitions douces
- **Thème cohérent** avec Tailwind CSS v4

## 🛠️ Technologies Utilisées

- **React 18.3** - Framework UI
- **TypeScript** - Typage statique
- **React Router 7** - Navigation
- **Tailwind CSS v4** - Styling
- **Motion (Framer Motion)** - Animations
- **Radix UI** - Composants accessibles
- **Recharts** - Graphiques
- **Sonner** - Notifications toast
- **Lucide React** - Icônes

## 🚀 Démarrage

### Prérequis
- Node.js 18+
- npm ou pnpm

### Installation

```bash
# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev

# Build pour la production
npm run build
```

## 👥 Comptes de Démonstration

### Administrateur
- **Email:** admin@lms.com
- **Rôle:** Admin
- Accès complet à la plateforme et au panneau d'administration

### Apprenant
- **Email:** jean.dupont@email.com
- **Rôle:** Learner
- Accès aux formations et progression

### Formateur
- **Email:** marie.martin@email.com
- **Rôle:** Instructor
- Création de formations et gestion des contenus

*Note: Le mot de passe peut être n'importe quelle valeur en mode démo*

## 📱 Pages Principales

- `/login` - Connexion
- `/register` - Inscription
- `/` - Dashboard principal
- `/courses` - Catalogue de formations
- `/courses/:id` - Détails d'une formation
- `/courses/create` - Création de formation
- `/courses/:courseId/quiz/:quizId` - Quiz interactif
- `/profile` - Profil utilisateur
- `/become-instructor` - Demande formateur
- `/admin` - Panneau d'administration

## 🎯 Fonctionnalités Clés

### Pour les Apprenants
- Inscription et profil personnalisé
- Navigation dans le catalogue de formations
- Inscription aux formations
- Suivi de progression en temps réel
- Passage de quiz interactifs
- Obtention de badges
- Demande pour devenir formateur

### Pour les Formateurs
- Création de formations
- Organisation en modules
- Ajout de contenus pédagogiques
- Création de quiz
- Suivi de la progression des apprenants

### Pour les Administrateurs
- Gestion des utilisateurs
- Validation des demandes formateur
- Vue d'ensemble de la plateforme
- Statistiques et rapports
- Gestion complète des formations

## 🎨 Système de Badges

Les apprenants peuvent obtenir différents badges :
- 🎯 **Nouveau Départ** - Inscription à une formation
- 🏆 **Quiz Master** - Réussite d'un quiz
- ⭐ **Score Parfait** - Quiz réussi avec 100%

## 📊 Progression

Le système de progression suit :
- Pourcentage global par formation
- Progression par module
- Contenus complétés
- Quiz réussis
- Scores obtenus

## 🔄 Prochaines Étapes Suggérées

Pour une implémentation complète en production, considérez :

1. **Backend avec Supabase**
   - Authentification réelle avec Supabase Auth
   - Base de données PostgreSQL pour les données
   - Storage pour les fichiers (CV, certificats, contenus)
   - Row Level Security pour la sécurité

2. **Fonctionnalités Avancées**
   - Upload réel de fichiers
   - Lecteur vidéo intégré
   - Chat en direct entre formateurs et apprenants
   - Système de notifications push
   - Export de certificats PDF
   - Analytics détaillées

3. **Améliorations UX**
   - Mode sombre
   - Multi-langue complet
   - Recherche avancée
   - Filtres sauvegardés
   - Recommandations personnalisées

## 📄 License

Ce projet est développé pour démonstration et apprentissage.

---

Développé avec ❤️ en utilisant les dernières technologies React