import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Plus, X, Trash2, Edit2, Save, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import type { Quiz, Question, QuestionType } from '../types';

export const EditQuiz: React.FC = () => {
  const { courseId, moduleId, quizId } = useParams<{ courseId: string; moduleId: string; quizId?: string }>();
  const navigate = useNavigate();
  const { currentUser, courses, modules, quizzes, setQuizzes } = useApp();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 15,
    passingScore: 70,
    maxAttempts: 3,
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);

  // New Question Form
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  
  const [qType, setQType] = useState<QuestionType>('mcq');
  const [qText, setQText] = useState('');
  const [qOptions, setQOptions] = useState<string[]>(['', '']);
  const [qCorrect, setQCorrect] = useState<string>('');
  const [qFeedback, setQFeedback] = useState('');

  const course = courses.find(c => c.id === courseId);
  const module = modules.find(m => m.id === moduleId);

  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'instructor')) {
      navigate('/app');
      return;
    }

    if (!course || !module) {
      toast.error('Cours ou module introuvable');
      navigate('/app/courses');
      return;
    }

    if (quizId) {
      const existing = quizzes.find(q => q.id === quizId);
      if (existing) {
        setFormData({
          title: existing.title,
          description: existing.description,
          duration: existing.duration,
          passingScore: existing.passingScore,
          maxAttempts: existing.maxAttempts,
        });
        setQuestions(existing.questions);
      } else {
        toast.error('Quiz introuvable');
        navigate(`/app/courses/edit/${courseId}`);
      }
    } else {
      // Default new quiz
      setFormData(prev => ({ ...prev, title: `Quiz : ${module.title}` }));
    }
  }, [courseId, moduleId, quizId, courses, modules, quizzes, currentUser, navigate]);

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (questions.length === 0) {
      toast.error('Veuillez ajouter au moins une question au quiz');
      return;
    }
    setLoading(true);

    setTimeout(() => {
      const finalQuizId = quizId || `q-${Date.now()}`;
      const updatedQuiz: Quiz = {
        id: finalQuizId,
        moduleId: moduleId!,
        ...formData,
        // BUG FIX : on corrige le quizId de chaque question (qui valait 'temp' lors de la création)
        questions: questions.map(q => ({ ...q, quizId: finalQuizId })),
      };

      if (quizId) {
        setQuizzes(quizzes.map(q => q.id === quizId ? updatedQuiz : q));
        toast.success('Quiz mis à jour avec succès');
      } else {
        setQuizzes([...quizzes, updatedQuiz]);
        toast.success('Quiz créé avec succès');
      }
      
      navigate(`/app/courses/edit/${courseId}`);
      setLoading(false);
    }, 800);
  };

  // Question Management Functions
  const resetQuestionForm = () => {
    setQType('mcq');
    setQText('');
    setQOptions(['', '']);
    setQCorrect('');
    setQFeedback('');
    setIsAddingQuestion(false);
    setEditingQuestionId(null);
  };

  const editQuestion = (q: Question) => {
    setQType(q.type);
    setQText(q.question);
    setQOptions(q.options || ['', '']);
    setQCorrect(typeof q.correctAnswer === 'string' ? q.correctAnswer : q.correctAnswer[0] || '');
    setQFeedback(q.feedback || '');
    setEditingQuestionId(q.id);
    setIsAddingQuestion(true);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const saveQuestion = () => {
    if (!qText.trim()) {
      toast.error('La question est obligatoire');
      return;
    }

    if (qType === 'mcq') {
      const validOptions = qOptions.filter(o => o.trim());
      if (validOptions.length < 2) {
        toast.error('Un QCM nécessite au moins 2 options valides');
        return;
      }
      if (!qCorrect || !validOptions.includes(qCorrect)) {
        toast.error('Veuillez sélectionner la réponse correcte parmi les options');
        return;
      }
    } else if (qType === 'true-false') {
      if (!qCorrect) {
        toast.error('Veuillez indiquer si c\'est vrai ou faux');
        return;
      }
    } else if (qType === 'text') {
      if (!qCorrect.trim()) {
        toast.error('La réponse correcte attendue est obligatoire');
        return;
      }
    }

    const newQuestion: Question = {
      id: editingQuestionId || `qst-${Date.now()}`,
      quizId: quizId || 'temp',
      type: qType,
      question: qText,
      options: qType === 'mcq' ? qOptions.filter(o => o.trim()) : qType === 'true-false' ? ['Vrai', 'Faux'] : undefined,
      correctAnswer: qCorrect,
      feedback: qFeedback,
    };

    if (editingQuestionId) {
      setQuestions(questions.map(q => q.id === editingQuestionId ? newQuestion : q));
    } else {
      setQuestions([...questions, newQuestion]);
    }
    
    resetQuestionForm();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/30 pb-12">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Button variant="ghost" onClick={() => navigate(`/app/courses/edit/${courseId}`)} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour au module
          </Button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {quizId ? 'Modifier le quiz' : 'Créer un quiz'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Module : {module?.title}
          </p>
        </motion.div>

        <form onSubmit={handleSaveQuiz} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres du quiz</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2 md:col-span-1">
                <Label>Titre du quiz *</Label>
                <Input required value={formData.title} onChange={(e) => handleChange('title', e.target.value)} />
              </div>
              
              <div className="space-y-2 col-span-2 md:col-span-1">
                <Label>Durée (minutes) *</Label>
                <Input type="number" required min="1" value={formData.duration} onChange={(e) => handleChange('duration', parseInt(e.target.value) || 0)} />
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Description *</Label>
                <Textarea required value={formData.description} onChange={(e) => handleChange('description', e.target.value)} rows={2} />
              </div>

              <div className="space-y-2">
                <Label>Seuil de réussite (%) *</Label>
                <Input type="number" required min="1" max="100" value={formData.passingScore} onChange={(e) => handleChange('passingScore', parseInt(e.target.value) || 0)} />
              </div>

              <div className="space-y-2">
                <Label>Tentatives max *</Label>
                <Input type="number" required min="1" max="10" value={formData.maxAttempts} onChange={(e) => handleChange('maxAttempts', parseInt(e.target.value) || 0)} />
              </div>
            </CardContent>
          </Card>

          {/* List of existing questions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Questions ({questions.length})</h2>
              {!isAddingQuestion && (
                <Button type="button" onClick={() => setIsAddingQuestion(true)} className="gap-2">
                  <Plus className="w-4 h-4" /> Ajouter une question
                </Button>
              )}
            </div>

            {questions.map((q, index) => (
              <Card key={q.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <Badge className="mb-2" variant="outline">
                        {q.type === 'mcq' ? 'QCM' : q.type === 'true-false' ? 'Vrai / Faux' : 'Texte Libre'}
                      </Badge>
                      <h3 className="font-semibold text-lg">{index + 1}. {q.question}</h3>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" variant="ghost" onClick={() => editQuestion(q)}>
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => removeQuestion(q.id)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                  
                  {q.type === 'mcq' && q.options && (
                    <ul className="mt-2 space-y-1 pl-4">
                      {q.options.map((opt, i) => (
                        <li key={i} className={`flex items-center gap-2 text-sm ${opt === q.correctAnswer ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                          {opt === q.correctAnswer ? <CheckCircle2 className="w-4 h-4" /> : <span className="w-4 h-4 inline-block rounded-full border border-gray-300" />}
                          {opt}
                        </li>
                      ))}
                    </ul>
                  )}

                  {q.type === 'true-false' && (
                    <div className="mt-2 text-sm font-medium text-green-600 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Réponse: {q.correctAnswer}
                    </div>
                  )}

                  {q.type === 'text' && (
                    <div className="mt-2 text-sm font-medium text-green-600 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Réponse attendue: {q.correctAnswer}
                    </div>
                  )}

                  {q.feedback && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded text-sm">
                      <span className="font-semibold">Feedback:</span> {q.feedback}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {questions.length === 0 && !isAddingQuestion && (
              <div className="text-center p-8 bg-gray-50 border border-dashed rounded-lg">
                <p className="text-gray-500">Aucune question n'a été ajoutée à ce quiz.</p>
              </div>
            )}
          </div>

          {/* Form to add/edit question */}
          {isAddingQuestion && (
            <Card className="border-2 border-blue-200 shadow-md">
              <CardHeader className="bg-blue-50/50 pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle>{editingQuestionId ? 'Modifier la question' : 'Nouvelle question'}</CardTitle>
                  <Button type="button" variant="ghost" size="sm" onClick={resetQuestionForm}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Type de question</Label>
                  <Select value={qType} onValueChange={(val: QuestionType) => {
                    setQType(val);
                    if (val === 'true-false') {
                      setQCorrect('Vrai');
                    } else {
                      setQCorrect('');
                    }
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mcq">QCM (Choix Multiples)</SelectItem>
                      <SelectItem value="true-false">Vrai ou Faux</SelectItem>
                      <SelectItem value="text">Texte Libre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Intitulé de la question *</Label>
                  <Input value={qText} onChange={e => setQText(e.target.value)} placeholder="Posez votre question ici..." />
                </div>

                {qType === 'mcq' && (
                  <div className="space-y-3">
                    <Label>Options de réponse</Label>
                    {qOptions.map((opt, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <Input 
                          value={opt} 
                          onChange={e => {
                            const newOpts = [...qOptions];
                            newOpts[i] = e.target.value;
                            setQOptions(newOpts);
                            if (qCorrect === opt && opt !== '') {
                              setQCorrect(e.target.value);
                            }
                          }}
                          placeholder={`Option ${i + 1}`} 
                        />
                        {qOptions.length > 2 && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => setQOptions(qOptions.filter((_, idx) => idx !== i))}>
                            <X className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                        <Button 
                          type="button" 
                          variant={qCorrect === opt && opt ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => opt && setQCorrect(opt)}
                          className={qCorrect === opt && opt ? 'bg-green-600 hover:bg-green-700' : ''}
                        >
                          Correcte
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => setQOptions([...qOptions, ''])} className="gap-2 mt-2">
                      <Plus className="w-4 h-4" /> Ajouter une option
                    </Button>
                  </div>
                )}

                {qType === 'true-false' && (
                  <div className="space-y-2">
                    <Label>Réponse correcte</Label>
                    <Select value={qCorrect} onValueChange={setQCorrect}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Vrai">Vrai</SelectItem>
                        <SelectItem value="Faux">Faux</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {qType === 'text' && (
                  <div className="space-y-2">
                    <Label>Réponse attendue (mot-clé exact) *</Label>
                    <Input value={qCorrect} onChange={e => setQCorrect(e.target.value)} placeholder="Ex: React" />
                    <p className="text-xs text-gray-500">L'apprenant devra taper exactement cette réponse.</p>
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  <Label>Feedback explicatif (affiché après réponse)</Label>
                  <Textarea value={qFeedback} onChange={e => setQFeedback(e.target.value)} placeholder="Expliquez pourquoi c'est la bonne réponse..." rows={2} />
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetQuestionForm}>Annuler</Button>
                  <Button type="button" onClick={saveQuestion} className="gap-2 bg-blue-600">
                    <Save className="w-4 h-4" /> Enregistrer la question
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="pt-6 border-t flex gap-4">
            <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600" disabled={loading || isAddingQuestion}>
              {loading ? 'Enregistrement...' : 'Enregistrer le quiz entier'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};