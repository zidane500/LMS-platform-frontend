import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  motion,
  AnimatePresence,
  useDragControls,
  useMotionValue,
} from "motion/react";
import {
  Phone,
  Video,
  PhoneOff,
  Mic,
  MicOff,
  VideoOff,
  ScreenShare,
  ScreenShareOff,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useAuth } from "./AuthContext";
import echo from "../services/echo";
import api from "../services/api";

// ─── Types ───────────────────────────────────────────────
interface CallInfo {
  callId: string;
  callerId: string;
  callerNom: string;
  formationId: string;
  type: "voice" | "video";
  offer: RTCSessionDescriptionInit;
}

interface ActiveCall {
  nom: string;
  type: "voice" | "video";
  formationId: string;
  recipientId: string;
  callId: string;
}
interface InitiateCallParams {
  formationId: string;
  recipientId: string;
  recipientNom: string;
  type: "voice" | "video";
}

interface CallContextType {
  initiateCall: (params: InitiateCallParams) => Promise<void>;
  callState: "idle" | "incoming" | "outgoing" | "active";
}

const ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const CallContext = createContext<CallContextType>({
  initiateCall: async () => {},
  callState: "idle",
});

export const useCall = () => useContext(CallContext);

// ─── Provider ────────────────────────────────────────────
export const CallProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { currentUser } = useAuth();
  const callDragControls = useDragControls();

  const callX = useMotionValue(0);
  const callY = useMotionValue(0);

  const [callState, setCallState] = useState<
    "idle" | "incoming" | "outgoing" | "active"
  >("idle");
  const [incomingCall, setIncomingCall] = useState<CallInfo | null>(null);
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isCallFullscreen, setIsCallFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Refs pour éviter les closures périmées
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const originalVideoTrackRef = useRef<MediaStreamTrack | null>(null);
  const activeCallRef = useRef<ActiveCall | null>(null);

  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const callStateRef = useRef<string>("idle");
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync callState → ref
  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  // Sync activeCall → ref
  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  useEffect(() => {
    if (isCallFullscreen) {
      callX.set(0);
      callY.set(0);
    }
  }, [isCallFullscreen, callX, callY]);

  useEffect(() => {
    if (
      localVideoRef.current &&
      localStreamRef.current &&
      activeCall?.type === "video"
    ) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }

    if (remoteVideoRef.current && remoteStreamRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
    }
  }, [callState, activeCall]);

  // ── endCall ─────────────────────────────────────────────
  const endCall = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());

    localStreamRef.current = null;
    remoteStreamRef.current = null;
    screenStreamRef.current = null;
    originalVideoTrackRef.current = null;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    pcRef.current?.close();
    pcRef.current = null;
    activeCallRef.current = null;

    pendingCandidatesRef.current = [];

    if (durationRef.current) {
      clearInterval(durationRef.current);
      durationRef.current = null;
    }

    setCallState("idle");
    setIncomingCall(null);
    setActiveCall(null);
    setCallDuration(0);
    setIsMuted(false);
    setIsCameraOff(false);
    setIsScreenSharing(false);
    setIsCallFullscreen(false);
  }, []);

  // ── Helpers ──────────────────────────────────────────────
  const getMedia = async (type: "voice" | "video") => {
    console.log("[Call] getMedia demandé:", type);
    console.log("[Call] origin:", window.location.origin);
    console.log("[Call] isSecureContext:", window.isSecureContext);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert(
        "Micro/caméra indisponible. Utilisez localhost sur PC, ou HTTPS pour tester avec l'adresse IP.",
      );

      throw new Error("getUserMedia indisponible : origine non sécurisée");
    }

    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === "video",
      });
    } catch (error: any) {
      console.error("[Call] getUserMedia error:", error);

      // Cas fréquent en test local : la caméra est déjà utilisée
      // par l'autre navigateur ou une autre application.
      if (
        type === "video" &&
        (error?.name === "NotReadableError" ||
          error?.name === "TrackStartError" ||
          String(error?.message || "")
            .toLowerCase()
            .includes("device in use"))
      ) {
        alert(
          "La caméra est déjà utilisée. L'appel vidéo va continuer en audio seulement pour ce test.",
        );

        return await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
      }

      alert("Le navigateur a bloqué le micro ou la caméra.");
      throw error;
    }
  };

  const normalizeSdp = (sdp: string) => {
    const normalized = sdp
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join("\r\n");

    return `${normalized}\r\n`;
  };

  const toSessionDescription = (
    description: any,
    expectedType: "offer" | "answer",
  ): RTCSessionDescriptionInit => {
    const type = description?.type ?? expectedType;
    const sdp = description?.sdp;

    if ((type !== "offer" && type !== "answer") || typeof sdp !== "string") {
      console.error("[Call] Description SDP invalide:", description);
      throw new Error("Description SDP invalide");
    }

    return {
      type,
      sdp: normalizeSdp(sdp),
    };
  };

  const localDescriptionPayload = (
    pc: RTCPeerConnection,
    expectedType: "offer" | "answer",
  ): RTCSessionDescriptionInit => {
    const description =
      typeof pc.localDescription?.toJSON === "function"
        ? pc.localDescription.toJSON()
        : pc.localDescription;

    return toSessionDescription(description, expectedType);
  };

  const buildPC = (onIce: (c: RTCIceCandidate) => void) => {
    const pc = new RTCPeerConnection(ICE_CONFIG);

    pc.ontrack = (e) => {
      console.log("[Call] Remote stream received:", e.streams[0]);

      const stream = e.streams[0];
      remoteStreamRef.current = stream;

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        console.log("[Call] ICE candidate generated");
        onIce(e.candidate);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("[Call] connectionState:", pc.connectionState);

      if (pc.connectionState === "connected") {
        setCallState("active");

        if (!durationRef.current) {
          durationRef.current = setInterval(
            () => setCallDuration((d) => d + 1),
            1000,
          );
        }
      }

      if (["failed", "closed"].includes(pc.connectionState)) {
        endCall();
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("[Call] iceConnectionState:", pc.iceConnectionState);
    };

    return pc;
  };

  // ── WebSocket — écoute canal personnel ──────────────────
  useEffect(() => {
    if (!currentUser) return;

    const channel = echo.private(`user.${currentUser.id}`);

    channel.listen(".call.voice-offer", (data: any) => {
      if (callStateRef.current !== "idle") return;
      setIncomingCall({
        callId: data.call_id,
        callerId: String(data.caller_id),
        callerNom: data.caller_nom,
        formationId: String(data.formation_id),
        type: "voice",
        offer: data.offer,
      });
      setCallState("incoming");
    });

    channel.listen(".call.video-offer", (data: any) => {
      if (callStateRef.current !== "idle") return;
      setIncomingCall({
        callId: data.call_id,
        callerId: String(data.caller_id),
        callerNom: data.caller_nom,
        formationId: String(data.formation_id),
        type: "video",
        offer: data.offer,
      });
      setCallState("incoming");
    });

    channel.listen(".call.answer", async (data: any) => {
      console.log("[Call] Answer received:", data);

      if (!pcRef.current) {
        console.warn("[Call] Answer received but pcRef is null");
        return;
      }

      if (
        activeCallRef.current?.callId &&
        data.call_id &&
        activeCallRef.current.callId !== data.call_id
      ) {
        console.warn("[Call] Ignored answer for another call:", data.call_id);
        return;
      }

      try {
        await pcRef.current.setRemoteDescription(
          toSessionDescription(data.answer, "answer"),
        );

        for (const c of pendingCandidatesRef.current) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(c));
        }

        pendingCandidatesRef.current = [];

        setCallState("active");

        if (!durationRef.current) {
          durationRef.current = setInterval(
            () => setCallDuration((d) => d + 1),
            1000,
          );
        }
      } catch (error) {
        console.error("[Call] setRemoteDescription answer error:", error);
      }
    });

    channel.listen(".call.ice-candidate", async (data: any) => {
      console.log("[Call] ICE candidate received:", data);

      try {
        if (!pcRef.current) {
          pendingCandidatesRef.current.push(data.candidate);
          return;
        }

        if (pcRef.current.remoteDescription) {
          await pcRef.current.addIceCandidate(
            new RTCIceCandidate(data.candidate),
          );
        } else {
          pendingCandidatesRef.current.push(data.candidate);
        }
      } catch (error) {
        console.error("[Call] addIceCandidate error:", error);
      }
    });

    channel.listen(".call.ended", () => endCall());
    channel.listen(".call.rejected", () => endCall());

    return () => {
      echo.leave(`user.${currentUser.id}`);
    };
  }, [currentUser?.id, endCall]);

  // ── initiateCall ────────────────────────────────────────
  const initiateCall = useCallback(
    async ({
      formationId,
      recipientId,
      recipientNom,
      type,
    }: InitiateCallParams) => {
      if (callStateRef.current !== "idle") return;

      const callId = `call-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const info: ActiveCall = {
        nom: recipientNom,
        type,
        formationId,
        recipientId,
        callId,
      };

      activeCallRef.current = info;

      try {
        const stream = await getMedia(type);
        localStreamRef.current = stream;

        const hasVideoTrack = stream.getVideoTracks().length > 0;
        originalVideoTrackRef.current = stream.getVideoTracks()[0] ?? null;

        if (localVideoRef.current && type === "video" && hasVideoTrack) {
          localVideoRef.current.srcObject = stream;
        }

        setIsCameraOff(type === "video" && !hasVideoTrack);

        const pc = buildPC((candidate) => {
          api
            .post("/calls/ice-candidate", {
              formation_id: info.formationId,
              recipient_id: info.recipientId,
              call_id: info.callId,
              candidate: candidate.toJSON(),
            })
            .catch((error) => {
              console.error(
                "[Call] ICE candidate send error:",
                error.response?.data || error,
              );
            });
        });
        pcRef.current = pc;
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        setActiveCall(info);
        setCallState("outgoing");

        const endpoint =
          type === "voice" ? "/calls/voice-offer" : "/calls/video-offer";
        await api.post(endpoint, {
          formation_id: formationId,
          recipient_id: recipientId,
          offer: localDescriptionPayload(pc, "offer"),
          call_id: callId,
          caller_nom:
            `${(currentUser as any)?.prenom ?? (currentUser as any)?.firstName ?? ""} ${
              (currentUser as any)?.nom ?? (currentUser as any)?.lastName ?? ""
            }`.trim() || "Utilisateur",
        });
      } catch (error: any) {
        console.error(
          "[Call] initiateCall error:",
          error.response?.data || error,
        );
        alert(
          "Impossible de démarrer l'appel. Vérifiez micro/caméra, HTTPS ou localhost.",
        );
        endCall();
      }
    },
    [currentUser, endCall],
  );

  // ── acceptCall ──────────────────────────────────────────
  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;

    const info: ActiveCall = {
      nom: incomingCall.callerNom,
      type: incomingCall.type,
      formationId: incomingCall.formationId,
      recipientId: incomingCall.callerId,
      callId: incomingCall.callId,
    };

    activeCallRef.current = info;

    try {
      const stream = await getMedia(incomingCall.type);
      localStreamRef.current = stream;

      const hasVideoTrack = stream.getVideoTracks().length > 0;
      originalVideoTrackRef.current = stream.getVideoTracks()[0] ?? null;

      if (
        localVideoRef.current &&
        incomingCall.type === "video" &&
        hasVideoTrack
      ) {
        localVideoRef.current.srcObject = stream;
      }

      setIsCameraOff(incomingCall.type === "video" && !hasVideoTrack);

      const pc = buildPC((candidate) => {
        api
          .post("/calls/ice-candidate", {
            formation_id: info.formationId,
            recipient_id: info.recipientId,
            call_id: info.callId,
            candidate: candidate.toJSON(),
          })
          .catch((error) => {
            console.error(
              "[Call] ICE candidate send error:",
              error.response?.data || error,
            );
          });
      });
      pcRef.current = pc;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      await pc.setRemoteDescription(
        toSessionDescription(incomingCall.offer, "offer"),
      );
      for (const c of pendingCandidatesRef.current) {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      }
      pendingCandidatesRef.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      setActiveCall(info);
      setIncomingCall(null);
      setCallState("active");

      await api.post("/calls/answer", {
        formation_id: incomingCall.formationId,
        caller_id: incomingCall.callerId,
        answer: localDescriptionPayload(pc, "answer"),
        call_id: incomingCall.callId,
      });
    } catch (error: any) {
      console.error("[Call] acceptCall error:", error.response?.data || error);

      try {
        await api.post("/calls/reject", {
          formation_id: incomingCall.formationId,
          caller_id: incomingCall.callerId,
          call_id: incomingCall.callId,
        });
      } catch {}

      alert(
        "Impossible d'accepter l'appel. Vérifiez le micro, la caméra ou les permissions du navigateur.",
      );

      endCall();
    }
  }, [incomingCall, endCall]);

  // ── rejectCall ──────────────────────────────────────────
  const rejectCall = useCallback(async () => {
    if (!incomingCall) return;
    try {
      await api.post("/calls/reject", {
        formation_id: incomingCall.formationId,
        caller_id: incomingCall.callerId,
        call_id: incomingCall.callId,
      });
    } catch {}
    endCall();
  }, [incomingCall, endCall]);

  // ── hangUp ───────────────────────────────────────────────
  const hangUp = useCallback(async () => {
    const ac = activeCallRef.current;
    if (!ac) return;
    try {
      await api.post("/calls/end", {
        formation_id: ac.formationId,
        recipient_id: ac.recipientId,
        call_id: ac.callId,
      });
    } catch {}
    endCall();
  }, [endCall]);

  // ── Controls ─────────────────────────────────────────────
  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsMuted((m) => !m);
  };

  const toggleCamera = () => {
    localStreamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsCameraOff((c) => !c);
  };

  const replaceOutgoingVideoTrack = useCallback(
    async (track: MediaStreamTrack | null) => {
      const sender = pcRef.current
        ?.getSenders()
        .find((s) => s.track?.kind === "video");

      if (!sender) {
        throw new Error(
          "Aucune piste vidéo sortante disponible pour remplacer la caméra.",
        );
      }

      await sender.replaceTrack(track);
    },
    [],
  );

  const stopScreenShare = useCallback(async () => {
    try {
      const originalTrack = originalVideoTrackRef.current;

      if (originalTrack) {
        await replaceOutgoingVideoTrack(originalTrack);
      }

      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    } catch (error) {
      console.error("[Call] stopScreenShare error:", error);
    }

    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    setIsScreenSharing(false);
  }, [replaceOutgoingVideoTrack]);

  const startScreenShare = useCallback(async () => {
    if (activeCallRef.current?.type !== "video") {
      alert(
        "Le partage d'écran est disponible seulement pendant un appel vidéo.",
      );
      return;
    }

    if (!navigator.mediaDevices?.getDisplayMedia) {
      alert("Le partage d'écran n'est pas supporté par ce navigateur.");
      return;
    }

    const hasVideoSender = pcRef.current
      ?.getSenders()
      .some((s) => s.track?.kind === "video");

    if (!hasVideoSender) {
      alert(
        "Le partage d'écran n'est pas disponible car cet appel vidéo a démarré sans piste caméra. Relancez un appel vidéo avec la caméra disponible.",
      );
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      const screenTrack = screenStream.getVideoTracks()[0];

      if (!screenTrack) {
        alert("Aucune piste écran n'a été sélectionnée.");
        return;
      }

      screenStreamRef.current = screenStream;

      screenTrack.onended = () => {
        void stopScreenShare();
      };

      await replaceOutgoingVideoTrack(screenTrack);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }

      setIsScreenSharing(true);
    } catch (error) {
      console.error("[Call] startScreenShare error:", error);
    }
  }, [replaceOutgoingVideoTrack, stopScreenShare]);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      await stopScreenShare();
    } else {
      await startScreenShare();
    }
  }, [isScreenSharing, startScreenShare, stopScreenShare]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    return `${m}:${(s % 60).toString().padStart(2, "0")}`;
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <CallContext.Provider value={{ initiateCall, callState }}>
      {children}

      {/* ── Modal appel entrant ── */}
      <AnimatePresence>
        {callState === "incoming" && incomingCall && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            drag
            dragControls={callDragControls}
            dragListener={false}
            dragMomentum={false}
            dragElastic={0}
            className="fixed top-6 right-6 z-[200] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 w-72"
          >
            <div
              onPointerDown={(event) => callDragControls.start(event)}
              className="flex items-center gap-3 mb-5 cursor-move select-none"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl animate-pulse shrink-0">
                {incomingCall.callerNom[0]}
              </div>
              <div>
                <p className="font-semibold text-white">
                  {incomingCall.callerNom}
                </p>
                <p className="text-sm text-slate-400">
                  {incomingCall.type === "video"
                    ? "📹 Appel vidéo entrant"
                    : "📞 Appel vocal entrant"}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={rejectCall}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition font-medium text-sm"
              >
                <PhoneOff className="w-4 h-4" /> Refuser
              </button>
              <button
                onClick={acceptCall}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition font-medium text-sm"
              >
                <Phone className="w-4 h-4" /> Accepter
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Appel en cours (sortant, en attente) ── */}
      <AnimatePresence>
        {callState === "outgoing" && activeCall && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            drag
            dragControls={callDragControls}
            dragListener={false}
            dragMomentum={false}
            dragElastic={0}
            className="fixed top-6 right-6 z-[200] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 w-72"
          >
            <div
              onPointerDown={(event) => callDragControls.start(event)}
              className="flex items-center gap-3 mb-4 cursor-move select-none"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shrink-0">
                {activeCall.nom[0]}
              </div>
              <div>
                <p className="font-semibold text-white">{activeCall.nom}</p>
                <p className="text-sm text-slate-400 animate-pulse">
                  Appel en cours...
                </p>
              </div>
            </div>
            <button
              onClick={hangUp}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition"
            >
              <PhoneOff className="w-4 h-4" /> Raccrocher
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Appel actif ── */}
      <AnimatePresence>
        {callState === "active" && activeCall && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            drag={!isCallFullscreen}
            dragControls={callDragControls}
            dragListener={false}
            dragMomentum={false}
            dragElastic={0}
            className={`fixed z-[300] bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden
    ${
      isCallFullscreen && activeCall.type === "video"
        ? "top-0 left-0 right-0 bottom-0 rounded-none flex flex-col"
        : "bottom-6 right-6 rounded-2xl"
    }`}
            style={
              isCallFullscreen && activeCall.type === "video"
                ? {
                    x: 0,
                    y: 0,
                    width: "100vw",
                    height: "100vh",
                  }
                : {
                    x: callX,
                    y: callY,
                    width: activeCall.type === "video" ? 320 : 260,
                  }
            }
          >
            {/* Vidéo distante */}
            {activeCall.type === "video" ? (
              <div
                onPointerDown={(event) => {
                  if (!isCallFullscreen) {
                    callDragControls.start(event);
                  }
                }}
                className={`relative bg-black select-none ${
                  isCallFullscreen ? "flex-1 min-h-0" : "cursor-move"
                }`}
                style={{ height: isCallFullscreen ? undefined : 200 }}
              >
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className={`w-full h-full ${
                    isCallFullscreen ? "object-contain" : "object-cover"
                  }`}
                />
                {/* Preview locale */}
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`absolute object-cover rounded-xl border border-white/20 ${
                    isCallFullscreen
                      ? "bottom-4 right-4 w-40 h-28"
                      : "bottom-2 right-2 w-20 h-16"
                  }`}
                />
              </div>
            ) : (
              /* Appel vocal — avatar + audio caché */
              <div
                onPointerDown={(event) => callDragControls.start(event)}
                className="flex flex-col items-center justify-center py-6 bg-slate-800 gap-3 cursor-move select-none"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                  {activeCall.nom[0]}
                </div>
                <p className="text-slate-400 text-sm animate-pulse">
                  Appel vocal en cours
                </p>
                {/* audio remote */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="hidden"
                />
              </div>
            )}

            {/* Contrôles */}
            <div className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-white text-sm">
                  {activeCall.nom}
                </p>
                <p className="text-xs text-slate-400">
                  {formatDuration(callDuration)}
                </p>
              </div>
              <div
                className="flex items-center gap-2"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <button
                  onClick={toggleMute}
                  className={`p-2 rounded-full transition ${isMuted ? "bg-red-500/20 text-red-400" : "bg-white/10 text-white hover:bg-white/20"}`}
                  title={isMuted ? "Activer le micro" : "Couper le micro"}
                >
                  {isMuted ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>
                {activeCall.type === "video" && (
                  <button
                    onClick={toggleCamera}
                    className={`p-2 rounded-full transition ${isCameraOff ? "bg-red-500/20 text-red-400" : "bg-white/10 text-white hover:bg-white/20"}`}
                    title={
                      isCameraOff ? "Activer la caméra" : "Couper la caméra"
                    }
                  >
                    {isCameraOff ? (
                      <VideoOff className="w-4 h-4" />
                    ) : (
                      <Video className="w-4 h-4" />
                    )}
                  </button>
                )}
                {activeCall.type === "video" && (
                  <button
                    onClick={toggleScreenShare}
                    className={`p-2 rounded-full transition ${
                      isScreenSharing
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                    title={
                      isScreenSharing
                        ? "Arrêter le partage d'écran"
                        : "Partager l'écran"
                    }
                  >
                    {isScreenSharing ? (
                      <ScreenShareOff className="w-4 h-4" />
                    ) : (
                      <ScreenShare className="w-4 h-4" />
                    )}
                  </button>
                )}
                {activeCall.type === "video" && (
                  <button
                    onClick={() => {
                      callX.set(0);
                      callY.set(0);
                      setIsCallFullscreen((v) => !v);
                    }}
                    className={`p-2 rounded-full transition ${
                      isCallFullscreen
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                    title={
                      isCallFullscreen ? "Réduire l'appel" : "Agrandir l'appel"
                    }
                  >
                    {isCallFullscreen ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </button>
                )}
                <button
                  onClick={hangUp}
                  className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white transition"
                  title="Raccrocher"
                >
                  <PhoneOff className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </CallContext.Provider>
  );
};
