Backlog Plateforme LMS

1. Épics 
EPIC 1 : Authentification et gestion des utilisateurs
EPIC 2 : Gestion des formations et modules
EPIC 3 : Gestion des contenus pédagogiques
EPIC 4 : Quiz et évaluations
EPIC 5 : Suivi de la progression
EPIC 6 : Certification
EPIC 7 : Dashboards et reporting
EPIC 8 : Exigences transverses (sécurité, performance, UX)

EPIC 1 – Authentification & gestion des utilisateurs
US 1.1 – Inscription d’un apprenant
En tant qu’apprenant
Je veux créer un compte
Afin d’accéder aux formations
Champs :
Prénom
Nom
Date de naissance
Numéro de téléphone
Email
Mot de passe
Langue préférée
Domaines cibles
Technologies
Critères d’acceptation :
Tous les champs obligatoires sont validés


Validation de l’email (format correct + unicité)


Validation de la force du mot de passe (minimum 8 caractères, 1 majuscule, 1 chiffre)


Email de confirmation envoyé
US 1.2 – Connexion utilisateur 
En tant que utilisateur
Je veux me connecter à la plateforme avec un identifiant et un mot de passe
Afin de accéder à mon espace personnel
Critères d’acceptation :
Authentification sécurisée
Message d’erreur en cas d’échec
Redirection selon le rôle
Fonction “Mot de passe oublié”
Réinitialisation par email

US 1.3 – Gestion des rôles utilisateurs
En tant qu’administrateur
Je veux attribuer des rôles (admin,formateur, apprenant)
Afin de contrôler les droits d’accès
Critères d’acceptation :
Rôles modifiables
Permissions associées automatiquement selon rôle
US 1.4 – Demande du rôle Formateur
En tant qu’utilisateur
Je veux soumettre une demande pour devenir formateur
Afin de pouvoir créer et gérer des formations
Champs du formulaire :
Spécialité
Expérience (nombre d’années)
Motivation (texte libre)
Langue(s) enseignée(s)
CV (PDF obligatoire)
Attestation / diplôme (PDF obligatoire)
Critères d’acceptation :
Validation côté serveur du type et de la taille des fichiers
Seuls les fichiers PDF sont acceptés
Statut initial = “En attente”
Notification de confirmation envoyée au candidat
L’utilisateur peut suivre le statut de sa demande

US 1.5 – Validation des demandes formateur
En tant qu’administrateur
Je veux valider ou refuser
Afin de garantir la qualité pédagogique 
Critères d’acceptation :
Liste des demandes avec statut (En attente / Acceptée / Refusée)
Consultation des documents uploadés
Action “Accepter” ou “Refuser”
Si accepté → rôle utilisateur mis à jour automatiquement et notification envoyée 
Si refusé → notification envoyée à l’utilisateur
US 1.6 — Modifier le profil utilisateur
En tant qu’apprenant ou formateur
Je veux modifier mon profil
Afin de maintenir mes informations à jour
Champs modifiables :
•        Prénom / Nom
•        Photo de profil
•        Numéro de téléphone
•        Langue préférée
•        Domaines / Technologies
Critères d'acceptation :
•        Validation des champs modifiés
•        Sauvegarde confirmée visuellement
•        Photo de profil redimensionnée automatiquement
US 1.7 — Supprimer / Modifier un compte
En tant qu’administrateur
Je veux modifier ou supprimer un compte utilisateur
Afin de maintenir la qualité et la sécurité de la plateforme
Critères d'acceptation :
•        Modification des informations d'un compte (nom, email, rôle)
•        Suppression d'un compte
•        Confirmation avant suppression définitive
•        Notification envoyée à l'utilisateur concerné



US 2.3 — Rechercher et filtrer une formation 
En tant qu’utilisateurs
Je veux rechercher et filtrer les formations disponibles
Afin de trouver rapidement une formation adaptée à mes besoins
Critères d'acceptation :
•        Recherche par titre (mot-clé)
•        Filtre par catégorie
•        Filtre par niveau (Débutant / Intermédiaire / Avancé)
•        Résultats affichés en temps réel ou après soumission
•        Message affiché si aucun résultat trouvé

US 2.4 — Consulter le détail d'une formation 
En tant qu’utilisateurs
Je veux consulter la fiche détaillée d'une formation
Afin de décider si je souhaite m'y inscrire
Critères d'acceptation :
•        Affichage : titre, description, niveau, durée, prérequis, formateur
•        Liste des modules inclus
•        Bouton d'inscription visible
•        Indicateur si déjà inscrit

US 2.5 — Modifier l'ordre des modules
En tant qu’administrateur ou formateur
Je veux réorganiser l'ordre des modules d'une formation par glisser-déposer
Afin de adapter la progression pédagogique
Critères d'acceptation :
                •        Sauvegarde automatique de l'ordre

US 2.6 — Supprimer une formation
En tant qu’administrateur ou formateur
Je veux supprimer une formation
Afin de retirer du contenu obsolète ou erroné
Critères d'acceptation :
•        Confirmation avant suppression
•        Suppression en cascade des modules et contenus associés
•        Les apprenants inscrits reçoivent une notification
•        Les certificats déjà émis restent accessibles


EPIC 2 – Gestion des formations et modules
US 2.1 – Créer une formation
En tant qu’administrateur ou formateur
Je veux créer une formation
Afin de structurer un parcours pédagogique
Champs :
Titre
Description
Catégorie
Niveau (Débutant / Intermédiaire / Avancé)
Durée estimée
Prérequis



Critères d’acceptation :
Validation des champs obligatoires
US 2.2 – Structurer une formation en modules (Gestion des modules)
En tant qu’administrateur ou formateur
Je veux organiser une formation en modules
Afin de proposer un apprentissage progressif
Champs :
Titre
Description
Durée
Critères d’acceptation :
Ajout / modification / suppression de modules
Ordre personnalisable

EPIC 3 – Gestion des contenus pédagogiques
US 3.1 – Ajouter un contenu pédagogique
En tant que formateur
Je veux ajouter un contenu
Afin de transmettre les connaissances

Champs :
Type (vidéo, PDF, SCORM, audio)
Durée
Miniature (pour vidéo)
Résumé


Critères d’acceptation :
Validation du format
Taille maximale respectée
Association obligatoire à un module
US 3.2 – Consulter un contenu
En tant qu’apprenant
Je veux consulter les contenus de formation
Afin de suivre mon parcours
Critères d’acceptation :
Lecture en ligne
Accès conditionné à l’inscription
Traçabilité de la consultation (lecture complète / partielle)
US 3.3 — Modifier un contenu pédagogique
En tant que formateur ou administrateur
Je veux modifier un contenu existant
Afin de corriger ou mettre à jour le matériel pédagogique
Critères d'acceptation :
•        Modification du fichier source (vidéo, PDF, audio, SCORM)
•        Modification des métadonnées (titre, résumé, durée)

US 3.4 — Supprimer un contenu pédagogique
En tant qu’ administrateur ou formateur
Je veux supprimer un contenu d'un module
Afin de retirer du matériel obsolète ou incorrect
Critères d'acceptation :
•        Confirmation avant suppression
•        Impact sur la progression des apprenants signalé
•        Suppression définitive du fichier associé


EPIC 4 – Quiz et évaluations
US 4.1 – Créer un quiz
En tant que formateur
Je veux créer un quiz interactif
Afin de évaluer les apprenants
Champs :
Titre
Description
Nombre de questions
Durée
Seuil de réussite


Critères d’acceptation :
Types de questions : QCM / vrai-faux / texte libre
Validation automatique
Feedback après réponse

US 4.2 – Passer un quiz
En tant qu’apprenant
Je veux passer un quiz
Afin de valider mes acquis
Critères d’acceptation :
Affichage du score
Validation selon seuil
Revoir les réponses après soumission
Limite de tentatives
Suivi du score cumulatif




US 4.3 — Modifier un quiz
En tant qu’ administrateur ou formateur
Je veux modifier un quiz existant
Afin de corriger les questions ou ajuster le seuil de réussite
Critères d'acceptation :
•        Modification du titre, description, seuil de réussite, durée
•        Ajout / modification / suppression de questions
•        Les résultats passés des apprenants ne sont pas modifiés
•        Option de réinitialisation des tentatives des apprenants
US 4.4 — Supprimer un quiz
En tant qu’ administrateur ou formateur
Je veux supprimer un quiz existant
Afin de retirer une évaluation obsolète d'un module
Critères d'acceptation :
•        Confirmation avant suppression
•        Suppression des résultats associés aux apprenants
•        Recalcul de la progression si le quiz était obligatoire


EPIC 5 – Suivi de la progression
US 5.1 – Visualiser la progression d’apprenant
En tant qu’apprenant
Je veux voir ma progression détaillée
Afin de suivre mon avancement dans chaque formation

Critères d’acceptation :
Pourcentage global par formation
Progression par module
Indicateurs graphiques : (barres de progression, badges)
Affichage des badges obtenus
Historique des quiz passés avec scores
Mise à jour automatique après chaque activité
US 5.2 – Visualiser la progression de formateur
En tant que formateur
Je veux suivre la progression des apprenants
Afin de adapter mon accompagnement
Critères d’acceptation :
Vue par formation
Progression par apprenant
Filtrage par : (formation / module / période)
Statistiques détaillées
export des statistiques
US 5.3 — Voir les badges obtenus 
En tant qu’ apprenant
Je veux voir les badges que j'ai obtenus
Afin de valoriser ma progression et mes accomplissements
Critères d'acceptation :
•        Affichage des badges dans le profil et le dashboard
•        Badge attribué automatiquement selon les règles définies                                                                (ex: 100% module, quiz réussi du premier coup)
•        Notification à l'obtention d'un badge


EPIC 6 – Certification
US 6.1 – Générer un certificat
En tant que administrateur
Je veux générer automatiquement un certificat
Afin de valider une formation complétée
Champs :
Nom de l’apprenant
Nom du formateur
Titre de la formation
Date
Numéro unique
QR code de vérification
Mention (Passable / Bien / Très Bien / Excellent)
Critères d’acceptation :
Génération PDF
Numéro unique
Signature numérique
Certificat infalsifiable
La mention est calculée automatiquement à partir de la moyenne des meilleures tentatives de tous les quiz de la formation 
50% ≤ moyenne < 70% → Passable                   70% ≤ moyenne < 85% → Bien 
- 85% ≤ moyenne < 95% → Très Bien                moyenne ≥ 95% → Excellent 
- La mention est affichée sur le PDF du certificat 
- La mention est figée à la date d'émission et ne change plus


US 6.2 – Télécharger un certificat
En tant qu’apprenant
Je veux télécharger mon certificat
Afin de prouver mes compétences
Critères d’acceptation :
Téléchargement disponible uniquement si :
Formation complétée
Quiz validé
Accès restreint au propriétaire


EPIC 7 – Dashboards et reporting
US 7.1 – Dashboard apprenant
En tant qu’apprenant
Je veux un tableau de bord personnel
Afin de voir mes formations et résultats
Critères d’acceptation :
Formations en cours / terminées
Progression par module
Score total
Badges
Formations à venir
Notifications personnalisées

US 7.2 – Dashboard formateur
En tant que formateur
Je veux un tableau de bord analytique
Afin de mesurer l’efficacité des formations
Critères d’acceptation :
Taux de réussite
Engagement global
Temps moyen passé par module
Filtrage par : (apprenant / module / période)
Export des rapports en CSV / PDF

US 7.3 – Dashboard admin
En tant que admin
Je veux un tableau de bord analytique
Afin de mesurer l’efficacité du plateforme
Critères d’acceptation :
Nombre total d'utilisateurs (Nb apprenants, Nb formateurs)
Nombre de formations actives / en attente 
Taux de complétion global des formations
Nombre de certificats émis
Nombre de demandes formateur en attente
Graphiques Analytique d'activité 
US 7.4 — Exporter les rapports 
En tant qu’ administrateur ou formateur 
Je veux exporter les données 
Afin de analyser les résultats 
Formats d'export :
•        CSV 
•        PDF 
Critères d'acceptation :
•        Choix du format avant téléchargement
•        Export filtré selon les critères sélectionnés (apprenant / module / période)
•        Données exportées : progression, scores, temps passé, taux de réussite
•        Nom de fichier incluant la date d'export






EPIC 8 – Exigences transverses
US 8.1 – Sécurité
En tant qu’utilisateur
Je veux que mes données soient sécurisées
Afin de garantir la confidentialité
Critères d’acceptation :
Mots de passe chiffrés
Protection XSS / CSRF
US 8.2 – Responsive design
En tant qu’utilisateur
 Je veux accéder à la plateforme sur tout appareil
 Afin de me former partout
Critères d’acceptation :
Desktop / tablette / mobile


UX cohérente


