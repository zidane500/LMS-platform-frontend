import React from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { QuizComponent } from '../components/QuizComponent';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

export const Quiz: React.FC = () => {
  const { courseId, quizId } = useParams<{ courseId: string; quizId: string }>();
  const navigate = useNavigate();
  const { currentUser, userProgress, setUserProgress, quizzes } = useApp();

  const quiz = quizzes.find(q => q.id === quizId);

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-purple-50/30">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-800 mb-4">Quiz non trouvé</p>
          <Button onClick={() => navigate(`/courses/${courseId}`)}>
            Retour au cours
          </Button>
        </div>
      </div>
    );
  }

  const handleComplete = (score: number, answers: Record<string, string | string[]>) => {
    if (!currentUser || !courseId) return;

    const progressKey = `${currentUser.id}-${courseId}`;
    const currentProgress = userProgress[progressKey];

    if (currentProgress) {
      const newAttempt = {
        id: Date.now().toString(),
        quizId: quiz.id,
        userId: currentUser.id,
        score,
        answers,
        completedAt: new Date().toISOString(),
      };

      const updatedProgress = {
        ...currentProgress,
        quizAttempts: [...currentProgress.quizAttempts, newAttempt],
        lastActivity: new Date().toISOString(),
      };

      // Add badge if score is high
      if (score >= quiz.passingScore && score === 100) {
        updatedProgress.badges = [
          ...currentProgress.badges,
          {
            id: 'b-perfect-' + Date.now(),
            name: 'Score Parfait',
            description: 'Réussi un quiz avec 100%',
            icon: '⭐',
            earnedAt: new Date().toISOString(),
          },
        ];
      }

      setUserProgress({
        ...userProgress,
        [progressKey]: updatedProgress,
      });

      if (score >= quiz.passingScore) {
        toast.success(`🎉 Quiz réussi avec ${score}% !`);
      } else {
        toast.info(`Quiz terminé avec ${score}%. Continuez à apprendre !`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigate(`/courses/${courseId}`)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au cours
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <QuizComponent quiz={quiz} onComplete={handleComplete} />
        </motion.div>
      </div>
    </div>
  );
};
