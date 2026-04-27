// src/app/routes.tsx
//
// Configuration de toutes les routes de l'application

import { createBrowserRouter } from "react-router";
import { Layout } from "./Layout";
import { LandingPage } from "./pages/LandingPage";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword"; // ← NOUVEAU
import { ResetPassword } from "./pages/ResetPassword";
import { Dashboard } from "./pages/Dashboard";
import { Courses } from "./pages/Courses";
import { CourseDetail } from "./pages/CourseDetail";
import { CreateCourse } from "./pages/CreateCourse";
import { EditCourse } from "./pages/EditCourse";
import { Profile } from "./pages/Profile";
import { EditProfile } from "./pages/EditProfile";
import { BecomeInstructor } from "./pages/BecomeInstructor";
import { Admin } from "./pages/Admin";
import { UserManagement } from "./pages/UserManagement";
import { Certificates } from "./pages/Certificates";
import { Reports } from "./pages/Reports";
import { NotFound } from "./pages/NotFound";
import { Quiz } from "./pages/Quiz";
import { EditQuiz } from "./pages/EditQuiz";
import { InstructorProgress } from "./pages/InstructorProgress";
import { BadgesPage } from "./pages/BadgesPage";
import { VerifyCertificate } from "./pages/VerifyCertificate";
import { AdminUserProfile } from "./pages/AdminUserProfile";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/register",
    Component: Register,
  },
  {
    // ← NOUVELLE ROUTE : mot de passe oublié
    path: "/forgot-password",
    Component: ForgotPassword,
  },
  {
    path: "/reset-password",
    Component: ResetPassword,
  },
  {
    path: "/app",
    Component: Layout,
    children: [
      {
        index: true,
        Component: Dashboard,
      },
      {
        path: "dashboard",
        Component: Dashboard,
      },
      {
        path: "courses",
        Component: Courses,
      },
      {
        path: "courses/:id",
        Component: CourseDetail,
      },
      {
        path: "courses/create",
        Component: CreateCourse,
      },
      {
        path: "courses/edit/:courseId",
        Component: EditCourse,
      },
      {
        path: "courses/:courseId/modules/:moduleId/quiz/create",
        Component: EditQuiz,
      },
      {
        path: "courses/:courseId/modules/:moduleId/quiz/:quizId/edit",
        Component: EditQuiz,
      },
      {
        path: "courses/:courseId/modules/:moduleId/quiz/:quizId",
        Component: Quiz,
      },
      {
        path: "profile",
        Component: Profile,
      },
      {
        path: "profile/edit",
        Component: EditProfile,
      },
      {
        path: "profile/edit/:userId",
        Component: EditProfile,
      },
      {
        path: "become-instructor",
        Component: BecomeInstructor,
      },
      {
        path: "admin",
        Component: Admin,
      },
      {
        path: "admin/user-management",
        Component: UserManagement,
      },
      {
        path: "certificates",
        Component: Certificates,
      },
      {
        path: "instructor/progress",
        Component: InstructorProgress,
      },
      {
        path: "badges",
        Component: BadgesPage,
      },
      {
        path: "reports",
        Component: Reports,
      },
      {
        path: "admin/user-profile/:userId",
        Component: AdminUserProfile,
      },
    ],
  },
  {
    path: "/verify/:numero",
    Component: VerifyCertificate,
  },
  {
    path: "*",
    Component: NotFound,
  },
]);
