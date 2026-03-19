// src/app/pages/EditCourse.tsx — connecté au vrai backend
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Plus, X, BookOpen, Play, Edit, Trash2, FileText, Music, Box, Video, Loader2, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  getFormation, updateFormation, addModule,
  updateModule, deleteModule as apiDeleteModule, reorderModules,
} from '../services/formationService';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';
import type { CourseLevel, Module, Content, ContentType, Course } from '../types';

const ContentIcon: React.FC<{ type: ContentType; className?: string }> = ({ type, className = 'w-4 h-4' }) => {
  switch (type) {
    case 'video':  return <Video    className={`${className} text-blue-500`}   />;
    case 'pdf':    return <FileText className={`${className} text-red-500`}    />;
    case 'audio':  return <Music    className={`${className} text-green-500`}  />;
    case 'scorm':  return <Box      className={`${className} text-purple-500`} />;
    default:       return <Play     className={`${className} text-gray-400`}   />;
  }
};

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  video: 'Vidéo', pdf: 'PDF', audio: 'Audio', scorm: 'SCORM',
};
const CONTENT_TYPE_COLORS: Record<ContentType, string> = {
  video: 'bg-blue-100 text-blue-700',
  pdf:   'bg-red-100 text-red-700',
  audio: 'bg-green-100 text-green-700',
  scorm: 'bg-purple-100 text-purple-700',
};
const defaultContentForm = {
  title: '', type: 'video' as ContentType, url: '', duration: 0, summary: '', thumbnail: '',
};

export const EditCourse: React.FC = () => {
  const navigate     = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const { currentUser } = useAuth();
  const { quizzes, setQuizzes } = useApp();

  const [course, setCourse]               = useState<Course | null>(null);
  const [courseModules, setCourseModules] = useState<Module[]>([]);
  const [pageLoading, setPageLoading]     = useState(true);
  const [loading, setLoading]             = useState(false);
  const [activeTab, setActiveTab]         = useState('info');

  const [formData, setFormData] = useState({
    title: '', description: '', category: '',
    level: 'Débutant' as CourseLevel,
    estimatedDuration: 0, thumbnail: '', statut: 'brouillon',
  });
  const [prerequisites, setPrerequisites]     = useState<string[]>([]);
  const [newPrerequisite, setNewPrerequisite] = useState('');

  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule]         = useState<Module | null>(null);
  const [moduleForm, setModuleForm]               = useState({ title: '', description: '', duration: 0 });
  const [savingModule, setSavingModule]           = useState(false);

  const [contentModalModuleId, setContentModalModuleId] = useState<string | null>(null);
  const [editingContent, setEditingContent]             = useState<Content | null>(null);
  const [contentForm, setContentForm]                   = useState(defaultContentForm);

  useEffect(() => {
    if (!courseId) return;
    setPageLoading(true);
    getFormation(courseId)
      .then(c => {
        setCourse(c);
        setCourseModules(c.modules ?? []);
        setFormData({
          title: c.title, description: c.description, category: c.category,
          level: c.level, estimatedDuration: c.estimatedDuration,
          thumbnail: c.thumbnail ?? '', statut: (c as any).statut ?? 'brouillon',
        });
        setPrerequisites(c.prerequisites ?? []);
      })
      .catch(() => { toast.error('Formation introuvable'); navigate('/app/courses'); })
      .finally(() => setPageLoading(false));
  }, [courseId]);

  if (currentUser?.role !== 'instructor' && currentUser?.role !== 'admin') {
    navigate('/app'); return null;
  }
  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }
  if (!course) return null;

  const courseQuizzes = quizzes.filter(q => courseModules.some(m => m.id === q.moduleId));
  const handleChange  = (field: string, value: string | number) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await updateFormation(courseId!, {
        title: formData.title, description: formData.description, category: formData.category,
        level: formData.level, estimatedDuration: formData.estimatedDuration,
        thumbnail: formData.thumbnail, prerequisites, statut: formData.statut,
      });
      setCourse(updated);
      toast.success('✅ Formation mise à jour avec succès !');
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) toast.error(error.response?.data?.message || 'Erreur');
      else toast.error('Une erreur est survenue');
    } finally { setLoading(false); }
  };

  const handleModuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleForm.title) { toast.error('Le titre est obligatoire'); return; }
    setSavingModule(true);
    try {
      if (editingModule) {
        const updated = await updateModule(courseId!, editingModule.id, moduleForm);
        setCourseModules(prev => prev.map(m =>
          m.id === editingModule.id
            ? { ...m, title: updated.title, description: updated.description, duration: updated.duration }
            : m
        ));
        toast.success('Module mis à jour');
      } else {
        const created = await addModule(courseId!, moduleForm);
        setCourseModules(prev => [...prev, { ...created, contents: [] }]);
        toast.success('Module créé avec succès');
      }
      setIsModuleModalOpen(false);
      setModuleForm({ title: '', description: '', duration: 0 });
      setEditingModule(null);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) toast.error(error.response?.data?.message || 'Erreur');
      else toast.error('Une erreur est survenue');
    } finally { setSavingModule(false); }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Supprimer ce module ? Tous ses contenus seront supprimés.')) return;
    try {
      await apiDeleteModule(courseId!, moduleId);
      setCourseModules(prev => prev.filter(m => m.id !== moduleId));
      setQuizzes(quizzes.filter(q => q.moduleId !== moduleId));
      toast.success('Module supprimé');
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) toast.error(error.response?.data?.message || 'Erreur');
      else toast.error('Une erreur est survenue');
    }
  };

  const deleteQuiz = (id: string) => {
    if (confirm('Supprimer ce quiz ?')) {
      setQuizzes(quizzes.filter(q => q.id !== id));
      toast.success('Quiz supprimé');
    }
  };

  const updateModuleContents = (moduleId: string, updater: (c: Content[]) => Content[]) =>
    setCourseModules(prev => prev.map(m =>
      m.id === moduleId ? { ...m, contents: updater(m.contents) } : m
    ));

  const openAddContent    = (moduleId: string) => {
    setEditingContent(null); setContentForm(defaultContentForm); setContentModalModuleId(moduleId);
  };
  const openEditContent   = (moduleId: string, content: Content) => {
    setEditingContent(content);
    setContentForm({ title: content.title, type: content.type, url: content.url,
      duration: content.duration, summary: content.summary, thumbnail: content.thumbnail || '' });
    setContentModalModuleId(moduleId);
  };
  const closeContentModal = () => {
    setContentModalModuleId(null); setEditingContent(null); setContentForm(defaultContentForm);
  };
  const handleContentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentModalModuleId) return;
    if (!contentForm.title.trim() || !contentForm.url.trim()) {
      toast.error("Le titre et l'URL sont obligatoires"); return;
    }
    if (editingContent) {
      updateModuleContents(contentModalModuleId, contents =>
        contents.map(c => c.id === editingContent.id
          ? { ...c, ...contentForm, thumbnail: contentForm.thumbnail || undefined } : c
        )
      );
      toast.success('Contenu mis à jour');
    } else {
      updateModuleContents(contentModalModuleId, contents => [...contents, {
        id: `c-${Date.now()}`, moduleId: contentModalModuleId,
        ...contentForm, thumbnail: contentForm.thumbnail || undefined,
      }]);
      toast.success('Contenu ajouté');
    }
    closeContentModal();
  };
  const deleteContent = (moduleId: string, contentId: string) => {
    if (confirm('Supprimer ce contenu ?')) {
      updateModuleContents(moduleId, contents => contents.filter(c => c.id !== contentId));
      toast.success('Contenu supprimé');
    }
  };

  const urlPlaceholder: Record<ContentType, string> = {
    video: 'https://www.youtube.com/watch?v=...',
    pdf:   'https://example.com/document.pdf',
    audio: 'https://example.com/podcast.mp3',
    scorm: 'https://example.com/package.zip',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-slate-950 dark:to-purple-950/30">
      <div className="max-w-4xl mx-auto p-6 space-y-6">

        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Button variant="ghost" onClick={() => navigate('/app/courses')} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour aux formations
          </Button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Modifier la formation
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Mettez à jour les informations et le contenu de votre formation
          </p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Informations générales</TabsTrigger>
            <TabsTrigger value="content">Modules & Contenus</TabsTrigger>
          </TabsList>

          {/* ── Onglet Informations ── */}
          <TabsContent value="info">
            <Card>
              <CardHeader><CardTitle>Informations de la formation</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">

                  <div className="space-y-2">
                    <Label>Titre *</Label>
                    <Input value={formData.title} onChange={e => handleChange('title', e.target.value)} required />
                  </div>

                  <div className="space-y-2">
                    <Label>Description *</Label>
                    <Textarea value={formData.description} onChange={e => handleChange('description', e.target.value)} rows={4} required />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Catégorie *</Label>
                      <Input value={formData.category} onChange={e => handleChange('category', e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Niveau *</Label>
                      <Select value={formData.level} onValueChange={v => handleChange('level', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Débutant">Débutant</SelectItem>
                          <SelectItem value="Intermédiaire">Intermédiaire</SelectItem>
                          <SelectItem value="Avancé">Avancé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Durée estimée (heures) *</Label>
                      <Input type="number" min="1" value={formData.estimatedDuration || ''} onChange={e => handleChange('estimatedDuration', parseInt(e.target.value) || 0)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Statut</Label>
                      <Select value={formData.statut} onValueChange={v => handleChange('statut', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="brouillon">Brouillon (non visible)</SelectItem>
                          <SelectItem value="publie">Publié (visible)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Miniature — URL ou fichier local */}
                  <div className="space-y-2">
                    <Label>Miniature de la formation</Label>
                    <Input
                      value={formData.thumbnail}
                      onChange={e => handleChange('thumbnail', e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                    />
                    <p className="text-xs text-gray-400 text-center">— ou —</p>
                    <label className="block border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition-colors">
                      <Upload className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                      <p className="text-sm text-gray-600">Choisir une image depuis votre machine</p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG — max 5MB</p>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 5 * 1024 * 1024) { toast.error('Image trop grande — max 5MB'); return; }
                          handleChange('thumbnail', URL.createObjectURL(file));
                        }}
                      />
                    </label>
                    {formData.thumbnail && (
                      <div className="relative">
                        <img
                          src={formData.thumbnail}
                          alt="Aperçu"
                          className="w-full h-48 object-cover rounded-lg mt-2 border"
                          onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80'; }}
                        />
                        <button
                          type="button"
                          onClick={() => handleChange('thumbnail', '')}
                          className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Prérequis */}
                  <div className="space-y-2">
                    <Label>Prérequis</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newPrerequisite}
                        onChange={e => setNewPrerequisite(e.target.value)}
                        placeholder="Ajouter un prérequis..."
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newPrerequisite.trim()) { setPrerequisites(p => [...p, newPrerequisite.trim()]); setNewPrerequisite(''); }
                          }
                        }}
                      />
                      <Button type="button" variant="outline" className="gap-2"
                        onClick={() => { if (newPrerequisite.trim()) { setPrerequisites(p => [...p, newPrerequisite.trim()]); setNewPrerequisite(''); } }}>
                        <Plus className="w-4 h-4" /> Ajouter
                      </Button>
                    </div>
                    {prerequisites.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {prerequisites.map((p, i) => (
                          <Badge key={i} variant="secondary" className="gap-2">{p}
                            <button type="button" onClick={() => setPrerequisites(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-red-600">
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600" disabled={loading}>
                      {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enregistrement...</> : 'Enregistrer les modifications'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => navigate('/app/courses')}>Annuler</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Onglet Modules & Contenus ── */}
          <TabsContent value="content">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Modules de la formation</h2>
                  <p className="text-gray-500 text-sm">{courseModules.length} module(s)</p>
                </div>
                <Dialog open={isModuleModalOpen} onOpenChange={setIsModuleModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700"
                      onClick={() => { setEditingModule(null); setModuleForm({ title: '', description: '', duration: 0 }); }}>
                      <Plus className="w-4 h-4" /> Nouveau Module
                    </Button>
                  </DialogTrigger>
                  <DialogContent aria-describedby={undefined}>
                    <DialogHeader>
                      <DialogTitle>{editingModule ? 'Modifier le module' : 'Ajouter un module'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleModuleSubmit} className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Titre *</Label>
                        <Input value={moduleForm.title} onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })} required placeholder="Ex: Introduction" />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea value={moduleForm.description} onChange={e => setModuleForm({ ...moduleForm, description: e.target.value })} placeholder="Que vont apprendre les élèves ?" />
                      </div>
                      <div className="space-y-2">
                        <Label>Durée (minutes)</Label>
                        <Input type="number" min="0" value={moduleForm.duration || ''} onChange={e => setModuleForm({ ...moduleForm, duration: parseInt(e.target.value) || 0 })} />
                      </div>
                      <Button type="submit" className="w-full" disabled={savingModule}>
                        {savingModule ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enregistrement...</> : editingModule ? 'Mettre à jour' : 'Créer le module'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Modal Contenu */}
              <Dialog open={contentModalModuleId !== null} onOpenChange={open => { if (!open) closeContentModal(); }}>
                <DialogContent aria-describedby={undefined} className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{editingContent ? 'Modifier le contenu' : 'Ajouter un contenu'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleContentSubmit} className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label>Type *</Label>
                      <Select value={contentForm.type} onValueChange={(v: ContentType) => setContentForm({ ...contentForm, type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="video"><span className="flex items-center gap-2"><Video className="w-4 h-4 text-blue-500" /> Vidéo</span></SelectItem>
                          <SelectItem value="pdf"><span className="flex items-center gap-2"><FileText className="w-4 h-4 text-red-500" /> PDF</span></SelectItem>
                          <SelectItem value="audio"><span className="flex items-center gap-2"><Music className="w-4 h-4 text-green-500" /> Audio</span></SelectItem>
                          <SelectItem value="scorm"><span className="flex items-center gap-2"><Box className="w-4 h-4 text-purple-500" /> SCORM</span></SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Titre *</Label>
                      <Input value={contentForm.title} onChange={e => setContentForm({ ...contentForm, title: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>URL *</Label>
                      <Input value={contentForm.url} onChange={e => setContentForm({ ...contentForm, url: e.target.value })} placeholder={urlPlaceholder[contentForm.type]} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Durée (minutes)</Label>
                      <Input type="number" min="0" value={contentForm.duration || ''} onChange={e => setContentForm({ ...contentForm, duration: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Résumé</Label>
                      <Textarea value={contentForm.summary} onChange={e => setContentForm({ ...contentForm, summary: e.target.value })} rows={2} />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button type="button" variant="outline" className="flex-1" onClick={closeContentModal}>Annuler</Button>
                      <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                        {editingContent ? 'Enregistrer' : 'Ajouter'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Liste des modules */}
              {courseModules.length > 0 ? (
                <Accordion type="single" collapsible className="space-y-4">
                  {[...courseModules].sort((a, b) => a.order - b.order).map((module, index) => {
                    const quiz = courseQuizzes.find(q => q.moduleId === module.id);
                    return (
                      <AccordionItem key={module.id} value={module.id} className="bg-white dark:bg-slate-900 border rounded-lg px-4 shadow-sm">
                        <AccordionTrigger className="hover:no-underline py-4">
                          <div className="flex items-center gap-4 w-full text-left">
                            <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">{index + 1}</div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold">{module.title}</h3>
                              <p className="text-sm text-gray-500 line-clamp-1">{module.description}</p>
                            </div>
                            <div className="flex items-center gap-3 mr-4 shrink-0">
                              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{module.contents.length} contenu(s)</span>
                              <span className="text-sm text-gray-400">{module.duration} min</span>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-4 pt-2 border-t mt-2 space-y-5">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="gap-2 text-blue-600"
                              onClick={() => { setEditingModule(module); setModuleForm({ title: module.title, description: module.description, duration: module.duration }); setIsModuleModalOpen(true); }}>
                              <Edit className="w-4 h-4" /> Modifier
                            </Button>
                            <Button variant="outline" size="sm" className="gap-2 text-red-600 hover:bg-red-50" onClick={() => handleDeleteModule(module.id)}>
                              <Trash2 className="w-4 h-4" /> Supprimer
                            </Button>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-sm text-gray-700">Contenus du module</h4>
                              <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => openAddContent(module.id)}>
                                <Plus className="w-3.5 h-3.5" /> Ajouter un contenu
                              </Button>
                            </div>
                            {module.contents.length > 0 ? (
                              <div className="space-y-2">
                                {module.contents.map(c => (
                                  <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <ContentIcon type={c.type} />
                                      <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">{c.title}</p>
                                        {c.duration > 0 && <p className="text-xs text-gray-400">{c.duration} min</p>}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 ml-2">
                                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CONTENT_TYPE_COLORS[c.type]}`}>{CONTENT_TYPE_LABELS[c.type]}</span>
                                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEditContent(module.id, c)}><Edit className="w-3.5 h-3.5 text-blue-600" /></Button>
                                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => deleteContent(module.id, c.id)}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center py-6 border-2 border-dashed rounded-lg border-gray-200">
                                <Play className="w-8 h-8 text-gray-300 mb-2" />
                                <p className="text-sm text-gray-500 mb-3">Aucun contenu ajouté</p>
                                <Button size="sm" variant="outline" className="gap-2" onClick={() => openAddContent(module.id)}>
                                  <Plus className="w-4 h-4" /> Ajouter un contenu
                                </Button>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2 pt-2 border-t">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-sm text-gray-700">Évaluation (Quiz)</h4>
                              {!quiz && (
                                <Button size="sm" variant="secondary" className="gap-2"
                                  onClick={() => navigate(`/app/courses/${courseId}/modules/${module.id}/quiz/create`)}>
                                  <Plus className="w-4 h-4" /> Créer un quiz
                                </Button>
                              )}
                            </div>
                            {quiz ? (
                              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-100">
                                <div>
                                  <h5 className="font-medium text-purple-900">{quiz.title}</h5>
                                  <p className="text-sm text-purple-700">{quiz.questions.length} questions • Seuil : {quiz.passingScore}%</p>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" className="gap-2 text-purple-700"
                                    onClick={() => navigate(`/app/courses/${courseId}/modules/${module.id}/quiz/${quiz.id}/edit`)}>
                                    <Edit className="w-4 h-4" /> Modifier
                                  </Button>
                                  <Button size="sm" variant="ghost" className="text-red-600" onClick={() => deleteQuiz(quiz.id)}>
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 italic">Aucun quiz pour ce module.</p>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              ) : (
                <Card className="bg-gray-50 border-dashed">
                  <CardContent className="flex flex-col items-center py-12 text-center">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                      <BookOpen className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Aucun module pour le moment</h3>
                    <p className="text-gray-500 max-w-md mb-6">Créez des modules pour structurer votre formation.</p>
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700"
                      onClick={() => { setEditingModule(null); setModuleForm({ title: '', description: '', duration: 0 }); setIsModuleModalOpen(true); }}>
                      <Plus className="w-4 h-4" /> Créer le premier module
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
