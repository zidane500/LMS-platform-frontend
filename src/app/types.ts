export type UserRole = 'admin' | 'instructor' | 'learner';

export type InstructorRequestStatus = 'pending' | 'accepted' | 'rejected';

export type CourseLevel = 'Débutant' | 'Intermédiaire' | 'Avancé';

export type ContentType = 'video' | 'pdf' | 'scorm' | 'audio';

export type QuestionType = 'mcq' | 'true-false' | 'text';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string;
  preferredLanguage: string;
  targetDomains: string[];
  technologies: string[];
  role: UserRole;
  avatar?: string;
}

export interface InstructorRequest {
  id: string;
  userId: string;
  user?: User;
  specialty: string;
  experience: number;
  motivation: string;
  languages: string[];
  cvUrl: string;
  certificateUrl: string;
  status: InstructorRequestStatus;
  createdAt: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: CourseLevel;
  estimatedDuration: number;
  prerequisites: string[];
  thumbnail: string;
  instructorId: string;
  instructor?: User;
  modules: Module[];
  createdAt: string;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string;
  duration: number;
  order: number;
  contents: Content[];
}

export interface Content {
  id: string;
  moduleId: string;
  type: ContentType;
  title: string;
  duration: number;
  thumbnail?: string;
  summary: string;
  url: string;
}

export interface Quiz {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  duration: number;
  passingScore: number;
  maxAttempts: number;
  questions: Question[];
}

export interface Question {
  id: string;
  quizId: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  feedback?: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  answers: Record<string, string | string[]>;
  completedAt: string;
}

export interface Progress {
  userId: string;
  courseId: string;
  moduleProgress: Record<string, number>;
  overallProgress: number;
  completedContents: string[];
  quizAttempts: QuizAttempt[];
  badges: Badge[];
  lastActivity: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
}
