import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { motion } from 'motion/react';
import { Users, BookOpen, FileCheck, CheckCircle, XCircle, Eye, Award, UserCheck, UserCog, FileText, Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { mockInstructorRequests, mockUsers } from '../data/mockData';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import type { InstructorRequest } from '../types';
import { toast } from 'sonner';

export const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, courses, instructorRequests, setInstructorRequests, setCurrentUser } = useApp();
  const [selectedRequest, setSelectedRequest] = React.useState<InstructorRequest | null>(null);

  useEffect(() => {
    if (instructorRequests.length === 0) {
      setInstructorRequests(mockInstructorRequests);
    }
  }, []);

  if (!currentUser || currentUser.role !== 'admin') {
    navigate('/app');
    return null;
  }

  const pendingRequests = instructorRequests.filter(r => r.status === 'pending');
  const acceptedRequests = instructorRequests.filter(r => r.status === 'accepted');
  const rejectedRequests = instructorRequests.filter(r => r.status === 'rejected');

  // Calcul des statistiques utilisateurs
  const totalUsers = mockUsers.length;
  const totalLearners = mockUsers.filter(u => u.role === 'learner').length;
  const totalInstructors = mockUsers.filter(u => u.role === 'instructor').length;
  const totalCertificates = 42; // Mock data - à remplacer par la vraie donnée

  const handleApprove = (request: InstructorRequest) => {
    const updated = instructorRequests.map(r =>
      r.id === request.id ? { ...r, status: 'accepted' as const } : r
    );
    setInstructorRequests(updated);
    
    // Mettre à jour le rôle de l'utilisateur si c'est l'utilisateur connecté
    if (currentUser && request.userId === currentUser.id) {
      setCurrentUser({ ...currentUser, role: 'instructor' });
    }
    
    setSelectedRequest(null);
    toast.success('✅ Demande approuvée ! L\'utilisateur a été notifié et son rôle a été mis à jour en formateur.');
  };

  const handleReject = (request: InstructorRequest) => {
    const updated = instructorRequests.map(r =>
      r.id === request.id ? { ...r, status: 'rejected' as const } : r
    );
    setInstructorRequests(updated);
    setSelectedRequest(null);
    toast.info('❌ Demande refusée. L\'utilisateur a été notifié.');
  };

  const RequestCard: React.FC<{ request: InstructorRequest }> = ({ request }) => (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="font-semibold text-lg mb-1">{request.specialty}</p>
              <p className="text-sm text-gray-600">
                Candidat ID: {request.userId}
              </p>
            </div>
            <Badge
              variant={
                request.status === 'accepted'
                  ? 'default'
                  : request.status === 'rejected'
                  ? 'destructive'
                  : 'secondary'
              }
            >
              {request.status === 'pending' && 'En attente'}
              {request.status === 'accepted' && 'Acceptée'}
              {request.status === 'rejected' && 'Refusée'}
            </Badge>
          </div>

          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Expérience:</span>
              <span className="font-medium">{request.experience} ans</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Langues:</span>
              <span className="font-medium">{request.languages.join(', ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium">
                {new Date(request.createdAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => setSelectedRequest(request)}
            >
              <Eye className="w-4 h-4" />
              Détails
            </Button>
            {request.status === 'pending' && (
              <>
                <Button
                  size="sm"
                  variant="default"
                  className="gap-2 bg-green-600 hover:bg-green-700"
                  onClick={() => handleApprove(request)}
                >
                  <CheckCircle className="w-4 h-4" />
                  Accepter
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-2"
                  onClick={() => handleReject(request)}
                >
                  <XCircle className="w-4 h-4" />
                  Refuser
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/30">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Panneau d'administration
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gérez les utilisateurs, formations et demandes
          </p>
        </motion.div>

        {/* Stats Utilisateurs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Statistiques des utilisateurs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalUsers}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Utilisateurs totaux</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                    <UserCheck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalLearners}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Apprenants</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                    <UserCog className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalInstructors}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Formateurs</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalCertificates}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Certificats émis</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Stats Demandes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Demandes de formateurs</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <FileCheck className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingRequests.length}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">En attente</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{instructorRequests.length}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Demandes totales</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{courses.length}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Formations actives</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Actions rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link to="/app/admin/user-management">
              <Card className="hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                      <Settings className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Gestion des utilisateurs</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Modifier, supprimer ou gérer les comptes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/app/reports">
              <Card className="hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Exporter les rapports</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Télécharger les données en CSV ou PDF</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList>
              <TabsTrigger value="pending">
                En attente ({pendingRequests.length})
              </TabsTrigger>
              <TabsTrigger value="accepted">
                Acceptées ({acceptedRequests.length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Refusées ({rejectedRequests.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {pendingRequests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingRequests.map(request => (
                    <RequestCard key={request.id} request={request} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center text-gray-500">
                    Aucune demande en attente
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="accepted" className="space-y-4">
              {acceptedRequests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {acceptedRequests.map(request => (
                    <RequestCard key={request.id} request={request} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center text-gray-500">
                    Aucune demande acceptée
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="rejected" className="space-y-4">
              {rejectedRequests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rejectedRequests.map(request => (
                    <RequestCard key={request.id} request={request} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center text-gray-500">
                    Aucune demande refusée
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Request Detail Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la candidature</DialogTitle>
            <DialogDescription>
              Candidature pour devenir formateur
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-gray-600">Spécialité</Label>
                <p className="font-medium">{selectedRequest.specialty}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Expérience</Label>
                  <p className="font-medium">{selectedRequest.experience} ans</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Langues</Label>
                  <p className="font-medium">{selectedRequest.languages.join(', ')}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm text-gray-600">Motivation</Label>
                <p className="text-sm mt-1 p-4 bg-gray-50 rounded-lg">
                  {selectedRequest.motivation}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">CV</Label>
                  <Button variant="outline" size="sm" className="w-full mt-1">
                    Télécharger le CV
                  </Button>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Attestation</Label>
                  <Button variant="outline" size="sm" className="w-full mt-1">
                    Télécharger l'attestation
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm text-gray-600">Statut</Label>
                <div className="mt-1">
                  <Badge
                    variant={
                      selectedRequest.status === 'accepted'
                        ? 'default'
                        : selectedRequest.status === 'rejected'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {selectedRequest.status === 'pending' && 'En attente'}
                    {selectedRequest.status === 'accepted' && 'Acceptée'}
                    {selectedRequest.status === 'rejected' && 'Refusée'}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {selectedRequest?.status === 'pending' && (
              <>
                <Button
                  variant="default"
                  className="gap-2 bg-green-600 hover:bg-green-700"
                  onClick={() => selectedRequest && handleApprove(selectedRequest)}
                >
                  <CheckCircle className="w-4 h-4" />
                  Accepter
                </Button>
                <Button
                  variant="destructive"
                  className="gap-2"
                  onClick={() => selectedRequest && handleReject(selectedRequest)}
                >
                  <XCircle className="w-4 h-4" />
                  Refuser
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}