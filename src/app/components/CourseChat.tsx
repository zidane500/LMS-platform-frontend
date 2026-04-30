// src/app/components/CourseChat.tsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Paperclip,
  Smile,
  CornerUpLeft,
  File,
  Trash2,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

// ─── Types ───────────────────────────────────────────────
interface Reaction {
  emoji: string;
  count: number;
  mine: boolean;
  users: string[];
}
interface ReplyInfo {
  id: number;
  contenu: string;
  type: string;
  media_url?: string;
  sender_nom: string;
}
interface Msg {
  id: number;
  is_retracted: boolean;
  contenu: string;
  type: string;
  media_url?: string;
  media_nom?: string;
  media_mime?: string;
  sender: { id: string; nom: string; avatar?: string; role: string };
  reply_to?: ReplyInfo | null;
  reactions: Reaction[];
  created_at: string;
}

interface Props {
  formationId: string;
  instructorName: string;
  instructorId: string;
}

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡", "🔥", "🎉", "👏", "✅"];

export const CourseChat: React.FC<Props> = ({
  formationId,
  instructorName,
  instructorId,
}) => {
  const { currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [replyTo, setReplyTo] = useState<Msg | null>(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [showReactFor, setShowReactFor] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const isMe = (id: string) => String(id) === String(currentUser?.id);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/formations/${formationId}/messages`);
      setMessages(res.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (file?: File) => {
    if ((!input.trim() && !file) || sending) return;
    setSending(true);
    try {
      const fd = new FormData();
      if (input.trim()) fd.append("contenu", input.trim());
      if (file) fd.append("media", file);
      if (replyTo) fd.append("reply_to_id", String(replyTo.id));
      // receiver_id = instructeur (backend le détermine auto pour les apprenants)

      const res = await api.post(`/formations/${formationId}/messages`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.blocked) {
        setIsBlocked(true);
        return;
      }
      setMessages((prev) => [...prev, res.data]);
      setInput("");
      setReplyTo(null);
    } catch (e: any) {
      if (e.response?.data?.blocked) setIsBlocked(true);
    } finally {
      setSending(false);
    }
  };

  const handleReact = async (msgId: number, emoji: string) => {
    try {
      await api.post(`/messages/${msgId}/react`, { emoji });
      const res = await api.get(`/formations/${formationId}/messages`);
      setMessages(res.data);
    } catch {}
    setShowReactFor(null);
  };

  const handleRetract = async (msgId: number) => {
    if (!window.confirm("Retirer ce message ?")) return;
    try {
      await api.delete(`/messages/${msgId}`);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? { ...m, is_retracted: true, contenu: "", type: "retracted" }
            : m,
        ),
      );
    } catch {}
  };

  const renderMedia = (msg: Msg) => {
    if (msg.type === "image")
      return (
        <img
          src={msg.media_url}
          alt={msg.media_nom}
          className="max-w-[220px] rounded-xl cursor-pointer"
          onClick={() => window.open(msg.media_url, "_blank")}
        />
      );
    if (msg.type === "video")
      return (
        <video
          src={msg.media_url}
          controls
          className="max-w-[220px] rounded-xl"
        />
      );
    if (msg.type === "audio")
      return <audio src={msg.media_url} controls className="max-w-[220px]" />;
    if (msg.type === "file")
      return (
        <a
          href={msg.media_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-xl text-sm hover:bg-white/20"
        >
          <File className="w-4 h-4 shrink-0" />
          <span className="truncate max-w-[160px]">{msg.media_nom}</span>
        </a>
      );
    return null;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-blue-500/30
                   bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 transition-colors text-sm"
      >
        <MessageCircle className="w-4 h-4" />
        <span>Discussion</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed bottom-24 right-6 z-50 w-[400px] max-w-[95vw] flex flex-col
                       bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
            style={{ height: "520px" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800/80">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600
                                flex items-center justify-center text-white font-semibold text-sm"
                >
                  {instructorName[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {instructorName}
                  </p>
                  <p className="text-xs text-slate-500">Formateur</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">
                    Posez votre première question !
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const me = isMe(msg.sender.id);
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 group ${me ? "flex-row-reverse" : ""}`}
                      onMouseEnter={() => setHoveredId(msg.id)}
                      onMouseLeave={() => {
                        setHoveredId(null);
                        setShowReactFor(null);
                      }}
                    >
                      {!me && (
                        <Avatar className="w-7 h-7 shrink-0 mb-1">
                          <AvatarImage src={msg.sender.avatar} />
                          <AvatarFallback className="bg-indigo-600 text-white text-[10px]">
                            {msg.sender.nom[0]}
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div
                        className={`max-w-[76%] flex flex-col gap-0.5 ${me ? "items-end" : "items-start"}`}
                      >
                        {!me && (
                          <p className="text-[11px] text-slate-500 ml-1">
                            {msg.sender.nom}
                          </p>
                        )}

                        {/* Preview réponse */}
                        {msg.reply_to && !msg.is_retracted && (
                          <div
                            className={`text-[11px] px-2.5 py-1.5 rounded-xl border-l-2 border-blue-400
                                        bg-slate-800/60 text-slate-400 max-w-[220px] truncate mb-0.5
                                        ${me ? "self-end" : "self-start"}`}
                          >
                            <span className="text-blue-400 font-medium">
                              {msg.reply_to.sender_nom}
                            </span>
                            <span className="ml-1">
                              {msg.reply_to.type !== "text"
                                ? "📎 Fichier"
                                : msg.reply_to.contenu}
                            </span>
                          </div>
                        )}

                        {/* Bulle */}
                        <div
                          className={`relative px-3 py-2 rounded-2xl text-sm leading-relaxed
                        ${
                          msg.is_retracted
                            ? "italic text-slate-500 bg-slate-800/50"
                            : me
                              ? "bg-blue-600 text-white rounded-br-sm"
                              : "bg-slate-800 text-slate-200 rounded-bl-sm"
                        }`}
                        >
                          {msg.is_retracted ? (
                            <span>🚫 Message supprimé</span>
                          ) : msg.type === "text" ? (
                            msg.contenu
                          ) : (
                            <>
                              {renderMedia(msg)}
                              {msg.contenu && (
                                <p className="mt-1 text-xs opacity-80">
                                  {msg.contenu}
                                </p>
                              )}
                            </>
                          )}
                        </div>

                        {/* Réactions */}
                        {!msg.is_retracted && msg.reactions.length > 0 && (
                          <div
                            className={`flex flex-wrap gap-1 ${me ? "justify-end" : "justify-start"}`}
                          >
                            {msg.reactions.map((r) => (
                              <button
                                key={r.emoji}
                                onClick={() => handleReact(msg.id, r.emoji)}
                                title={r.users.join(", ")}
                                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border
                                ${r.mine ? "bg-blue-500/20 border-blue-400/30" : "bg-slate-800 border-slate-700"}
                                hover:scale-110 transition-transform`}
                              >
                                <span>{r.emoji}</span>
                                <span className="text-slate-300">
                                  {r.count}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}

                        <p
                          className={`text-[10px] text-slate-600 mx-1 ${me ? "self-end" : "self-start"}`}
                        >
                          {msg.created_at}
                        </p>
                      </div>

                      {/* Actions hover */}
                      {hoveredId === msg.id && !msg.is_retracted && (
                        <div
                          className={`flex items-center gap-1 ${me ? "flex-row-reverse mr-1" : "ml-1"}`}
                        >
                          {/* Réagir */}
                          <div className="relative">
                            <button
                              onClick={() =>
                                setShowReactFor(
                                  showReactFor === msg.id ? null : msg.id,
                                )
                              }
                              className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                            >
                              <Smile className="w-3.5 h-3.5" />
                            </button>
                            {showReactFor === msg.id && (
                              <div
                                className={`absolute bottom-full mb-1 ${me ? "right-0" : "left-0"}
                                            flex gap-1 bg-slate-800 border border-slate-700 rounded-2xl px-2 py-1.5 shadow-xl z-10`}
                              >
                                {EMOJIS.map((e) => (
                                  <button
                                    key={e}
                                    onClick={() => handleReact(msg.id, e)}
                                    className="text-lg hover:scale-125 transition-transform"
                                  >
                                    {e}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          {/* Répondre */}
                          <button
                            onClick={() => setReplyTo(msg)}
                            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                          >
                            <CornerUpLeft className="w-3.5 h-3.5" />
                          </button>
                          {/* Retirer (seulement ses propres messages) */}
                          {me && (
                            <button
                              onClick={() => handleRetract(msg.id)}
                              className="p-1.5 rounded-full bg-slate-800 text-red-400 hover:text-red-300 hover:bg-slate-700"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Bloqué */}
            {isBlocked && (
              <div className="px-4 py-3 bg-red-900/20 border-t border-red-800/30 text-center">
                <p className="text-sm text-red-400">
                  🚫 Vous avez été bloqué dans cette discussion.
                </p>
              </div>
            )}

            {/* Reply preview */}
            {replyTo && !isBlocked && (
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 border-t border-slate-700">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-blue-400 font-medium">
                    {replyTo.sender.nom}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {replyTo.type !== "text" ? "📎 Fichier" : replyTo.contenu}
                  </p>
                </div>
                <button
                  onClick={() => setReplyTo(null)}
                  className="text-slate-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Input */}
            {!isBlocked && (
              <div className="border-t border-slate-700 p-3 space-y-2">
                {showEmojis && (
                  <div className="flex flex-wrap gap-1.5 p-2 bg-slate-800 rounded-xl border border-slate-700">
                    {EMOJIS.map((e) => (
                      <button
                        key={e}
                        onClick={() => {
                          setInput((p) => p + e);
                          setShowEmojis(false);
                        }}
                        className="text-xl hover:scale-125 transition-transform"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => mediaInputRef.current?.click()}
                    className="p-2 text-slate-500 hover:text-blue-400 transition-colors"
                    title="Image/Vidéo/Audio"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-slate-500 hover:text-blue-400 transition-colors"
                    title="Fichier"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowEmojis(!showEmojis)}
                    className="p-2 text-slate-500 hover:text-yellow-400 transition-colors"
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      !e.shiftKey &&
                      (e.preventDefault(), handleSend())
                    }
                    placeholder="Aa"
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-3 py-2
                               text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={sending || !input.trim()}
                    className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 transition-colors"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <input
                  ref={mediaInputRef}
                  type="file"
                  accept="image/*,video/*,audio/*"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files?.[0] && handleSend(e.target.files[0])
                  }
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files?.[0] && handleSend(e.target.files[0])
                  }
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
