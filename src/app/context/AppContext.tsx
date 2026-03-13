// src/app/context/AppContext.tsx
//
// Ce contexte gère les données de l'application (formations, modules, quiz...)
// L'authentification est gérée par AuthContext.
// On réexporte currentUser depuis AuthContext pour la compatibilité
// avec les composants existants.

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, Course, Progress, InstructorRequest, Quiz, Module } from '../types';
import { mockCourses, mockModules, mockQuizzes, mockProgress, mockInstructorRequests } from '../data/mockData';
import { useAuth } from './AuthContext';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  courses: Course[];
  setCourses: (courses: Course[]) => void;
  quizzes: Quiz[];
  setQuizzes: (quizzes: Quiz[]) => void;
  modules: Module[];
  setModules: (modules: Module[]) => void;
  userProgress: Record<string, Progress>;
  setUserProgress: (progress: Record<string, Progress>) => void;
  instructorRequests: InstructorRequest[];
  setInstructorRequests: (requests: InstructorRequest[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // On récupère currentUser et setCurrentUser depuis AuthContext
  // Cela évite de dupliquer l'état utilisateur
  const { currentUser, setCurrentUser } = useAuth();

  const [courses, setCourses] = useState<Course[]>(
    mockCourses.map(course => ({ ...course, modules: mockModules.filter(m => m.courseId === course.id) }))
  );
  const [quizzes, setQuizzes] = useState<Quiz[]>(mockQuizzes);
  const [modules, setModulesState] = useState<Module[]>(mockModules);
  const [userProgress, setUserProgress] = useState<Record<string, Progress>>(mockProgress);
  const [instructorRequests, setInstructorRequests] = useState<InstructorRequest[]>(mockInstructorRequests);

  const setModules = useCallback((newModules: Module[]) => {
    setModulesState(newModules);
    setCourses(prev =>
      prev.map(course => ({
        ...course,
        modules: newModules.filter(m => m.courseId === course.id),
      }))
    );
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        courses,
        setCourses,
        quizzes,
        setQuizzes,
        modules,
        setModules,
        userProgress,
        setUserProgress,
        instructorRequests,
        setInstructorRequests,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
