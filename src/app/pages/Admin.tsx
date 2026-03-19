// src/app/pages/Admin.tsx — demandes formateur connectées au vrai backend
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { motion } from 'motion/react';
import { Users, BookOpen, FileCheck, CheckCircle, XCircle, Eye, UserCog, FileText, ExternalLink, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAllRequests, processRequest, getFileUrl } from '../services/demandeService';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import type { InstructorRequest } from '../types';
import axios from 'axios';

export const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [requests, setRequests]         = useState<InstructorRequest[]>([]);
  const [loading, setLoading]           = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<InstructorRequest | null>(null);
  const [processing, setProcessing]     = useState(false);

  if (!currentUser || currentUser.role !== 'admin') { navigate('/app'); return null; }

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await getAllRequests();
      setRequests(data);
    } catch {
      toast.error('Impossible de charger les demandes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRequests(); }, []);

  const pending  = requests.filter(r => r.status === 'pending');
  const accepted = requests.filter(r => r.status === 'accepted');
  const rejected = requests.filter(r => r.status === 'rejected');

  const handleProcess = async (request: InstructorRequest, action: 'accepter' | 'refuser') => {
    setProcessing(true);
    try {
      const updated = await processRequest(request.id, action);
      setRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
      setSelectedRequest(null);
      toast.success(action === 'accepter'
        ? '✅ Demande acceptée ! L\'utilisateur est maintenant formateur.'
        : '✅ Demande refusée. L\'utilisateur a été notifié.');
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) toast.error(error.response?.data?.message || 'Erreur');
      else toast.error('Une erreur est survenue');
    } finally {
      setProcessing(false);
    }
  };

  const handleViewFile = async (id: string, type: 'cv' | 'attestation') => {
    try {
      const url = await getFileUrl(id, type);
      window.open(url, '_blank');
    } catch {
      toast.error('Impossible d\'ouvrir le fichier');
    }
  };

  const StatusBadge = ({ status }: { status: string }) => (
    <Badge className={
      status === 'pending'  ? 'bg-yellow-100 text-yellow-800' :
      status === 'accepted' ? 'bg-green-100 text-green-800'   :
                              'bg-red-100 text-red-800'
    }>
      {status === 'pending' ? 'En attente' : status === 'accepted' ? 'Acceptée' : 'Refusée'}
    </Badge>
  );

  const RequestCard = ({ request }: { request: InstructorRequest }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-semibold">{request.user?.firstName} {request.user?.lastName}</p>
            <p className="text-sm text-gray-500">{request.user?.email}</p>
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-medium">Spécialité :</span> {request.specialty} —
              <span className="font-medium"> Expérience :</span> {request.experience} ans
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge status={request.status} />
            <Button variant="outline" size="sm" onClick={() => setSelectedRequest(request)} className="gap-1">
              <Eye className="w-3 h-3" /> Voir
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="max-w-6xl mx-auto p-6 space-y-6">

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <UserCog className="w-8 h-8 text-blue-600" /> Tableau de bord Admin
          </h1>
          <div className="flex gap-3">
            <Button variant="outline" onClick={loadRequests} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </Button>
            <Link to="/app/admin/user-management">
              <Button variant="outline" className="gap-2">
                <Users className="w-4 h-4" /> Gérer les utilisateurs
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-xl"><FileCheck className="w-6 h-6 text-yellow-600" /></div>
              <div><p className="text-2xl font-bold">{pending.length}</p><p className="text-sm text-gray-500">En attente</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl"><CheckCircle className="w-6 h-6 text-green-600" /></div>
              <div><p className="text-2xl font-bold">{accepted.length}</p><p className="text-sm text-gray-500">Acceptées</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-xl"><XCircle className="w-6 h-6 text-red-600" /></div>
              <div><p className="text-2xl font-bold">{rejected.length}</p><p className="text-sm text-gray-500">Refusées</p></div>
            </CardContent>
          </Card>
        </div>

        {/* Demandes formateur */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-blue-600" /> Demandes formateur
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <Tabs defaultValue="pending">
                <TabsList className="mb-4">
                  <TabsTrigger value="pending">En attente ({pending.length})</TabsTrigger>
                  <TabsTrigger value="accepted">Acceptées ({accepted.length})</TabsTrigger>
                  <TabsTrigger value="rejected">Refusées ({rejected.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="pending" className="space-y-3">
                  {pending.length === 0 ? <p className="text-gray-500 text-center py-4">Aucune demande en attente</p>
                    : pending.map(r => <RequestCard key={r.id} request={r} />)}
                </TabsContent>
                <TabsContent value="accepted" className="space-y-3">
                  {accepted.length === 0 ? <p className="text-gray-500 text-center py-4">Aucune demande acceptée</p>
                    : accepted.map(r => <RequestCard key={r.id} request={r} />)}
                </TabsContent>
                <TabsContent value="rejected" className="space-y-3">
                  {rejected.length === 0 ? <p className="text-gray-500 text-center py-4">Aucune demande refusée</p>
                    : rejected.map(r => <RequestCard key={r.id} request={r} />)}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Modale détail de la demande ── */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Demande de {selectedRequest?.user?.firstName} {selectedRequest?.user?.lastName}</DialogTitle>
            <DialogDescription>{selectedRequest?.user?.email}</DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium text-gray-600">Spécialité :</span><p>{selectedRequest.specialty}</p></div>
                <div><span className="font-medium text-gray-600">Expérience :</span><p>{selectedRequest.experience} ans</p></div>
                <div><span className="font-medium text-gray-600">Langues :</span><p>{selectedRequest.languages?.join(', ')}</p></div>
                <div><span className="font-medium text-gray-600">Statut :</span><p><StatusBadge status={selectedRequest.status} /></p></div>
              </div>
              <div>
                <span className="font-medium text-gray-600 text-sm">Motivation :</span>
                <p className="mt-1 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedRequest.motivation}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" className="gap-2"
                  onClick={() => handleViewFile(selectedRequest.id, 'cv')}>
                  <FileText className="w-4 h-4" /> CV <ExternalLink className="w-3 h-3" />
                </Button>
                <Button variant="outline" size="sm" className="gap-2"
                  onClick={() => handleViewFile(selectedRequest.id, 'attestation')}>
                  <FileText className="w-4 h-4" /> Attestation <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>Fermer</Button>
            {selectedRequest?.status === 'pending' && (
              <>
                <Button variant="destructive" onClick={() => handleProcess(selectedRequest, 'refuser')} disabled={processing}>
                  {processing ? '...' : <><XCircle className="w-4 h-4 mr-1" /> Refuser</>}
                </Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleProcess(selectedRequest, 'accepter')} disabled={processing}>
                  {processing ? '...' : <><CheckCircle className="w-4 h-4 mr-1" /> Accepter</>}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
