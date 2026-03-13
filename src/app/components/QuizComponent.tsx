import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle, ArrowRight, Award, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import type { Quiz, Question } from '../types';

interface QuizComponentProps {
  quiz: Quiz;
  onComplete: (score: number, answers: Record<string, string | string[]>) => void;
}

export const QuizComponent: React.FC<QuizComponentProps> = ({ quiz, onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);

  // Refs pour garder les valeurs à jour indépendamment du cycle de rendu React
  const pendingScoreRef = useRef(0);
  const pendingAnswersRef = useRef<Record<string, string | string[]>>({});

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  const checkAnswer = (answer: string | string[]) => {
    let correct = false;

    if (currentQuestion.type === 'text' && typeof answer === 'string' && typeof currentQuestion.correctAnswer === 'string') {
      correct = answer.toLowerCase() === currentQuestion.correctAnswer.toLowerCase();
    } else {
      correct = Array.isArray(currentQuestion.correctAnswer)
        ? JSON.stringify(answer) === JSON.stringify(currentQuestion.correctAnswer)
        : answer === currentQuestion.correctAnswer;
    }

    setIsCorrect(correct);
    setShowFeedback(true);

    // BUG FIX: on calcule le nouveau score et les nouvelles réponses immédiatement
    // pour ne pas dépendre d'un état React potentiellement stale dans handleNext
    const newScore = correct ? score + 1 : score;
    const newAnswers = { ...answers, [currentQuestion.id]: answer };

    setScore(newScore);
    setAnswers(newAnswers);

    // On stocke les valeurs à jour dans des refs pour que handleNext y accède de façon fiable
    pendingScoreRef.current = newScore;
    pendingAnswersRef.current = newAnswers;
  };

  const handleNext = () => {
    setShowFeedback(false);
    
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // BUG FIX: on utilise les refs (valeurs à jour) au lieu de l'état stale
      const finalScore = Math.round((pendingScoreRef.current / quiz.questions.length) * 100);
      setCompleted(true);
      onComplete(finalScore, pendingAnswersRef.current);
    }
  };

  const handleRetry = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setShowFeedback(false);
    setCompleted(false);
    setScore(0);
    pendingScoreRef.current = 0;
    pendingAnswersRef.current = {};
  };

  if (completed) {
    const finalScore = Math.round((score / quiz.questions.length) * 100);
    const passed = finalScore >= quiz.passingScore;

    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-2xl mx-auto"
      >
        <Card className={`border-2 ${passed ? 'border-green-500' : 'border-orange-500'}`}>
          <CardContent className="p-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="mb-6"
            >
              {passed ? (
                <div className="text-8xl mb-4">🎉</div>
              ) : (
                <div className="text-8xl mb-4">📚</div>
              )}
            </motion.div>

            <h2 className="text-3xl font-bold mb-4">
              {passed ? 'Félicitations !' : 'Presque !'}
            </h2>

            <div className="mb-6">
              <div className="text-6xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {finalScore}%
              </div>
              <p className="text-gray-600">
                {score} bonnes réponses sur {quiz.questions.length}
              </p>
            </div>

            <Progress value={finalScore} className="h-4 mb-6" />

            <div className="space-y-4">
              {passed ? (
                <>
                  <Badge className="bg-green-600 text-white text-lg px-6 py-2">
                    <Award className="w-5 h-5 mr-2" />
                    Quiz réussi !
                  </Badge>
                  <p className="text-gray-600">
                    Score de passage : {quiz.passingScore}%
                  </p>
                </>
              ) : (
                <>
                  <Badge variant="secondary" className="text-lg px-6 py-2">
                    Score de passage : {quiz.passingScore}%
                  </Badge>
                  <p className="text-gray-600">
                    Continuez à apprendre et réessayez !
                  </p>
                </>
              )}

              <div className="flex gap-4 justify-center mt-8">
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  className="gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Réessayer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{quiz.title}</CardTitle>
            <Badge variant="outline">
              Question {currentQuestionIndex + 1}/{quiz.questions.length}
            </Badge>
          </div>
          <Progress value={progress} className="h-2 mt-4" />
        </CardHeader>
      </Card>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 100 }}
        >
          <Card>
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-6">
                {currentQuestion.question}
              </h3>

              <div className="space-y-3">
                {currentQuestion.type === 'text' ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      disabled={showFeedback}
                      className={`w-full p-4 rounded-lg border-2 transition-all outline-none ${
                        showFeedback
                          ? isCorrect
                            ? 'border-green-500 bg-green-50'
                            : 'border-red-500 bg-red-50'
                          : 'border-gray-200 focus:border-blue-500'
                      }`}
                      placeholder="Tapez votre réponse ici..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !showFeedback && e.currentTarget.value.trim()) {
                          checkAnswer(e.currentTarget.value.trim());
                        }
                      }}
                      onBlur={(e) => {
                        if (!showFeedback && e.currentTarget.value.trim()) {
                          // Optionally auto-check on blur, but better to use a submit button
                        }
                      }}
                      id="text-answer-input"
                    />
                    {!showFeedback && (
                      <Button 
                        onClick={() => {
                          const input = document.getElementById('text-answer-input') as HTMLInputElement;
                          if (input && input.value.trim()) {
                            checkAnswer(input.value.trim());
                          }
                        }}
                      >
                        Valider la réponse
                      </Button>
                    )}
                    {showFeedback && !isCorrect && (
                      <div className="text-red-600 text-sm mt-2 font-medium">
                        Réponse attendue : {currentQuestion.correctAnswer}
                      </div>
                    )}
                  </div>
                ) : (
                  currentQuestion.options?.map((option, index) => {
                    const isSelected = answers[currentQuestion.id] === option;
                    const showResult = showFeedback && isSelected;

                    return (
                      <motion.button
                        key={index}
                        whileHover={{ scale: showFeedback ? 1 : 1.02 }}
                        whileTap={{ scale: showFeedback ? 1 : 0.98 }}
                        onClick={() => !showFeedback && checkAnswer(option)}
                        disabled={showFeedback}
                        className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                          showResult
                            ? isCorrect
                              ? 'border-green-500 bg-green-50'
                              : 'border-red-500 bg-red-50'
                            : isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{option}</span>
                          {showResult && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 500 }}
                            >
                              {isCorrect ? (
                                <CheckCircle className="w-6 h-6 text-green-600" />
                              ) : (
                                <XCircle className="w-6 h-6 text-red-600" />
                              )}
                            </motion.div>
                          )}
                        </div>
                      </motion.button>
                    );
                  })
                )}
              </div>

              {showFeedback && currentQuestion.feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-6 p-4 rounded-lg ${
                    isCorrect ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'
                  }`}
                >
                  <p className={`text-sm ${isCorrect ? 'text-green-800' : 'text-blue-800'}`}>
                    💡 {currentQuestion.feedback}
                  </p>
                </motion.div>
              )}

              {showFeedback && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6"
                >
                  <Button
                    onClick={handleNext}
                    className="w-full gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {currentQuestionIndex < quiz.questions.length - 1 ? (
                      <>
                        Question suivante
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Voir les résultats
                        <Award className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
