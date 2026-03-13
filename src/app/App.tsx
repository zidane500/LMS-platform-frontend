// src/app/App.tsx
//
// Point d'entrée de l'application.
// IMPORTANT : AuthProvider doit être AUTOUR de AppProvider
// car AppProvider utilise useAuth() en interne.

import { RouterProvider } from 'react-router';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <ThemeProvider>
      {/* AuthProvider EN PREMIER — gère le token et l'utilisateur connecté */}
      <AuthProvider>
        {/* AppProvider EN DEUXIÈME — peut utiliser useAuth() */}
        <AppProvider>
          <RouterProvider router={router} />
          <Toaster position="top-right" richColors />
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
