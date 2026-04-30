// src/app/pages/InboxPage.tsx — version complète corrigée
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  Inbox,
  MessageCircle,
  ArrowLeft,
  Loader2,
  Ban,
  CheckCircle,
  Send,
  Smile,
  Paperclip,
  File,
  CornerUpLeft,
  Trash2,
  X,
  ChevronLeft,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡", "🔥", "🎉", "👏", "✅"];

interface SenderItem {
  user_id: string;
  nom: string;
  avatar?: string;
  dernier_message: { contenu: string; created_at: string };
  nb_non_lus: number;
  is_blocked: boolean;
}
interface InboxItem {
  formation_id: string;
  formation_titre: string;
  miniature?: string;
  senders: SenderItem[];
  nb_non_lus_total: number;
}
interface Reaction {
  emoji: string;
  count: number;
  mine: boolean;
  users: string[];
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
  reply_to?: {
    id: number;
    contenu: string;
    type: string;
    sender_nom: string;
  } | null;
  reactions: Reaction[];
  created_at: string;
}

export const InboxPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [view, setView] = useState<"list" | "conversation">("list");
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFormation, setActiveFormation] = useState<InboxItem | null>(
    null,
  );
  const [activeSender, setActiveSender] = useState<SenderItem | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<Msg | null>(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [showReactFor, setShowReactFor] = useState<number | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [searchFormation, setSearchFormation] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api
      .get("/messages/inbox")
      .then((res) => setItems(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (
    !currentUser ||
    (currentUser.role !== "instructor" && currentUser.role !== "admin")
  ) {
    navigate("/app");
    return null;
  }

  const isMe = (id: string) => String(id) === String(currentUser?.id);
  const filteredItems = items.filter((item) =>
    item.formation_titre.toLowerCase().includes(searchFormation.toLowerCase()),
  );
  const openConversation = async (formation: InboxItem, sender: SenderItem) => {
    setActiveFormation(formation);
    setActiveSender(sender);
    setView("conversation");
    setMsgLoading(true);
    try {
      const res = await api.get(
        `/formations/${formation.formation_id}/messages?user_id=${sender.user_id}`,
      );
      setMessages(res.data);
      setItems((prev) =>
        prev.map((f) =>
          f.formation_id !== formation.formation_id
            ? f
            : {
                ...f,
                senders: f.senders.map((s) =>
                  s.user_id !== sender.user_id ? s : { ...s, nb_non_lus: 0 },
                ),
                nb_non_lus_total: f.senders
                  .filter((s) => s.user_id !== sender.user_id)
                  .reduce((a, s) => a + s.nb_non_lus, 0),
              },
        ),
      );
    } catch {
    } finally {
      setMsgLoading(false);
    }
  };

  const handleSend = async (file?: File) => {
    if (
      (!input.trim() && !file) ||
      sending ||
      !activeFormation ||
      !activeSender
    )
      return;
    setSending(true);
    try {
      const fd = new FormData();
      if (input.trim()) fd.append("contenu", input.trim());
      if (file) fd.append("media", file);
      fd.append("receiver_id", activeSender.user_id);
      if (replyTo) fd.append("reply_to_id", String(replyTo.id));

      const res = await api.post(
        `/formations/${activeFormation.formation_id}/messages`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      setMessages((prev) => [...prev, res.data]);
      setInput("");
      setReplyTo(null);
    } catch {
    } finally {
      setSending(false);
    }
  };

  const handleReact = async (msgId: number, emoji: string) => {
    if (!activeFormation || !activeSender) return;
    try {
      await api.post(`/messages/${msgId}/react`, { emoji });
      const res = await api.get(
        `/formations/${activeFormation.formation_id}/messages?user_id=${activeSender.user_id}`,
      );
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

  const handleToggleBlock = async (
    formationId: string,
    userId: string,
    isBlocked: boolean,
  ) => {
    const key = `${formationId}-${userId}`;
    setToggling(key);
    try {
      if (isBlocked) {
        await api.delete(`/formations/${formationId}/messages/unblock`, {
          data: { user_id: userId },
        });
      } else {
        await api.post(`/formations/${formationId}/messages/block`, {
          user_id: userId,
        });
      }
      const newBlocked = !isBlocked;
      setItems((prev) =>
        prev.map((f) =>
          f.formation_id !== formationId
            ? f
            : {
                ...f,
                senders: f.senders.map((s) =>
                  s.user_id !== userId ? s : { ...s, is_blocked: newBlocked },
                ),
              },
        ),
      );
      if (activeSender?.user_id === userId) {
        setActiveSender((prev) =>
          prev ? { ...prev, is_blocked: newBlocked } : null,
        );
      }
    } catch {
    } finally {
      setToggling(null);
    }
  };

  const renderMedia = (msg: Msg) => {
    if (msg.type === "image")
      return (
        <img
          src={msg.media_url}
          alt={msg.media_nom}
          className="max-w-[240px] rounded-xl cursor-pointer"
          onClick={() => window.open(msg.media_url, "_blank")}
        />
      );
    if (msg.type === "video")
      return (
        <video
          src={msg.media_url}
          controls
          className="max-w-[240px] rounded-xl"
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
    <div
      className="bg-white dark:bg-slate-900"
      style={{ height: "calc(100vh - 64px)" }}
    >
      <div className="max-w-5xl mx-auto h-full flex overflow-hidden border-x border-gray-200 dark:border-slate-800">
        {/* ── PANNEAU GAUCHE ── */}
        <div
          className={`
          ${view === "conversation" ? "hidden md:flex" : "flex"}
          flex-col flex-none w-full md:w-[340px] h-full
          border-r border-gray-200 dark:border-slate-800
          bg-white dark:bg-slate-900 overflow-hidden
        `}
        >
          {/* ✅ Header fixe */}
          <div className="flex-none border-b border-gray-200 dark:border-slate-800">
            <div className="flex items-center gap-3 px-5 py-4">
              <button
                onClick={() => navigate("/app")}
                className="text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div>
                <h1 className="text-xl font-bold dark:text-white">
                  Discussions
                </h1>
                <p className="text-xs text-gray-400 dark:text-slate-500">
                  Vos conversations
                </p>
              </div>
            </div>

            {/* Barre recherche */}
            <div className="px-4 pb-3">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>

                <input
                  value={searchFormation}
                  onChange={(e) => setSearchFormation(e.target.value)}
                  placeholder="Rechercher une formation..."
                  className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-slate-800 border-0 rounded-xl
                   text-sm text-gray-800 dark:text-white placeholder-gray-400
                   focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />

                {searchFormation && (
                  <button
                    onClick={() => setSearchFormation("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {searchFormation && (
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1.5 px-1">
                  {filteredItems.length} formation
                  {filteredItems.length !== 1 ? "s" : ""} trouvée
                  {filteredItems.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>

          {/* ✅ Liste scrollable */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-16 px-6">
                <MessageCircle className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-slate-400 font-medium">
                  Aucune conversation
                </p>
                <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
                  Les apprenants vous contacteront ici
                </p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.formation_id}
                  className="border-b border-gray-100 dark:border-slate-800"
                >
                  {/* ✅ Fix 2 — Formation name au lieu de miniature */}
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-slate-800/60">
                    <Inbox className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 truncate flex-1">
                      Formation : {item.formation_titre}
                    </p>
                    {item.nb_non_lus_total > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-500 text-white shrink-0">
                        {item.nb_non_lus_total}
                      </span>
                    )}
                  </div>

                  {item.senders.map((sender) => {
                    const isActive =
                      activeFormation?.formation_id === item.formation_id &&
                      activeSender?.user_id === sender.user_id;
                    return (
                      <motion.div
                        key={sender.user_id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => openConversation(item, sender)}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors
                        ${isActive ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-gray-50 dark:hover:bg-slate-800/50"}
                        ${sender.is_blocked ? "opacity-60" : ""}`}
                      >
                        <div className="relative shrink-0">
                          <div
                            className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600
                                        flex items-center justify-center text-white font-semibold overflow-hidden text-sm"
                          >
                            {sender.avatar ? (
                              <img
                                src={sender.avatar}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              sender.nom[0]
                            )}
                          </div>
                          {sender.nb_non_lus > 0 && (
                            <span
                              className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white
                                           text-[9px] font-bold rounded-full flex items-center justify-center"
                            >
                              {sender.nb_non_lus > 9 ? "9+" : sender.nb_non_lus}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p
                              className={`text-sm truncate ${sender.nb_non_lus > 0 ? "font-bold text-gray-900 dark:text-white" : "font-medium text-gray-700 dark:text-slate-300"}`}
                            >
                              {sender.nom}
                            </p>
                            {sender.is_blocked && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 shrink-0">
                                Bloqué
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 dark:text-slate-500 truncate">
                            {sender.dernier_message.contenu}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className="text-[10px] text-gray-400 dark:text-slate-600">
                            {sender.dernier_message.created_at}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleBlock(
                                item.formation_id,
                                sender.user_id,
                                sender.is_blocked,
                              );
                            }}
                            disabled={
                              toggling ===
                              `${item.formation_id}-${sender.user_id}`
                            }
                            className={`p-1 rounded-full transition-colors ${sender.is_blocked ? "text-green-500 hover:bg-green-100 dark:hover:bg-green-900/20" : "text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20"}`}
                          >
                            {toggling ===
                            `${item.formation_id}-${sender.user_id}` ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : sender.is_blocked ? (
                              <CheckCircle className="w-3.5 h-3.5" />
                            ) : (
                              <Ban className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── PANNEAU DROIT — Conversation ── */}
        <div
          className={`
          ${view === "list" ? "hidden md:flex" : "flex"}
          flex-col flex-1 h-full overflow-hidden bg-white dark:bg-slate-900
        `}
        >
          {!activeSender ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                <MessageCircle className="w-10 h-10 text-blue-500" />
              </div>
              <h2 className="text-xl font-bold dark:text-white mb-2">
                Vos discussions
              </h2>
              <p className="text-gray-400 dark:text-slate-500 text-sm">
                Sélectionnez une conversation
              </p>
            </div>
          ) : (
            <>
              {/* ✅ Header fixe — flex-none */}
              <div
                className="flex items-center gap-3 px-4 py-3 border-b border-gray-200
                              dark:border-slate-800 bg-white dark:bg-slate-900 flex-none"
              >
                <button
                  onClick={() => setView("list")}
                  className="md:hidden text-gray-500 hover:text-gray-900 dark:text-slate-400"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600
                                flex items-center justify-center text-white font-semibold overflow-hidden shrink-0"
                >
                  {activeSender.avatar ? (
                    <img
                      src={activeSender.avatar}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    activeSender.nom[0]
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm dark:text-white">
                    {activeSender.nom}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-500 truncate">
                    Formation : {activeFormation?.formation_titre}
                  </p>
                </div>
                {activeSender.is_blocked ? (
                  <button
                    onClick={() =>
                      handleToggleBlock(
                        activeFormation!.formation_id,
                        activeSender.user_id,
                        true,
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                               bg-green-50 border border-green-200 text-green-700
                               dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Débloquer
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      handleToggleBlock(
                        activeFormation!.formation_id,
                        activeSender.user_id,
                        false,
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                               bg-red-50 border border-red-200 text-red-600
                               dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
                  >
                    <Ban className="w-3.5 h-3.5" /> Bloquer
                  </button>
                )}
              </div>

              {/* ✅ Messages — flex-1 overflow-y-auto — SEULE ZONE SCROLLABLE */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
                {msgLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-slate-400 text-sm">
                      Début de la conversation
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
                          <div
                            className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600
                                        flex items-center justify-center text-white text-xs font-semibold shrink-0 mb-1 overflow-hidden"
                          >
                            {activeSender?.avatar ? (
                              <img
                                src={activeSender.avatar}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              msg.sender.nom[0]
                            )}
                          </div>
                        )}

                        <div
                          className={`max-w-[70%] flex flex-col gap-0.5 ${me ? "items-end" : "items-start"}`}
                        >
                          {msg.reply_to && !msg.is_retracted && (
                            <div
                              className={`text-[11px] px-2.5 py-1.5 rounded-xl border-l-2 border-blue-400
                                          bg-gray-100 dark:bg-slate-800/60 text-gray-500 dark:text-slate-400
                                          max-w-[200px] truncate mb-0.5 ${me ? "self-end" : "self-start"}`}
                            >
                              <span className="font-medium text-blue-500">
                                {msg.reply_to.sender_nom}
                              </span>
                              <span className="ml-1">
                                {msg.reply_to.type !== "text"
                                  ? "📎 Fichier"
                                  : msg.reply_to.contenu}
                              </span>
                            </div>
                          )}

                          <div
                            className={`relative px-3 py-2 rounded-2xl text-sm leading-relaxed
                          ${
                            msg.is_retracted
                              ? "italic text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800/50"
                              : me
                                ? "bg-blue-500 text-white rounded-br-sm"
                                : "bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-bl-sm"
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
                                  ${r.mine ? "bg-blue-100 border-blue-300 dark:bg-blue-500/20 dark:border-blue-400/30" : "bg-gray-100 border-gray-200 dark:bg-slate-800 dark:border-slate-700"}
                                  hover:scale-110 transition-transform`}
                                >
                                  <span>{r.emoji}</span>
                                  <span className="text-gray-500 dark:text-slate-400">
                                    {r.count}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}

                          <p
                            className={`text-[10px] text-gray-400 dark:text-slate-600 mx-1 ${me ? "self-end" : "self-start"}`}
                          >
                            {msg.created_at}
                          </p>
                        </div>

                        {hoveredId === msg.id && !msg.is_retracted && (
                          <div
                            className={`flex items-center gap-1 ${me ? "flex-row-reverse mr-1" : "ml-1"}`}
                          >
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setShowReactFor(
                                    showReactFor === msg.id ? null : msg.id,
                                  )
                                }
                                className="p-1.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-400 hover:text-gray-700 dark:hover:text-white"
                              >
                                <Smile className="w-3.5 h-3.5" />
                              </button>
                              {showReactFor === msg.id && (
                                <div
                                  className={`absolute bottom-full mb-1 ${me ? "right-0" : "left-0"}
                                              flex gap-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700
                                              rounded-2xl px-2 py-1.5 shadow-xl z-10`}
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
                            <button
                              onClick={() => setReplyTo(msg)}
                              className="p-1.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-400 hover:text-gray-700 dark:hover:text-white"
                            >
                              <CornerUpLeft className="w-3.5 h-3.5" />
                            </button>
                            {me && (
                              <button
                                onClick={() => handleRetract(msg.id)}
                                className="p-1.5 rounded-full bg-gray-100 dark:bg-slate-800 text-red-400 hover:text-red-600"
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

              {/* ✅ Reply preview — flex-none */}
              {replyTo && (
                <div
                  className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-slate-800/80
                                border-t border-gray-200 dark:border-slate-700 flex-none"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-blue-500 font-medium">
                      {replyTo.sender.nom}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                      {replyTo.type !== "text" ? "📎 Fichier" : replyTo.contenu}
                    </p>
                  </div>
                  <button
                    onClick={() => setReplyTo(null)}
                    className="text-gray-400 hover:text-gray-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* ✅ Input — flex-none (toujours visible en bas) */}
              <div
                className="border-t border-gray-200 dark:border-slate-700 p-3 space-y-2
                              bg-white dark:bg-slate-900 flex-none"
              >
                {showEmojis && (
                  <div className="flex flex-wrap gap-1.5 p-2 bg-gray-100 dark:bg-slate-800 rounded-xl">
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
                    className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
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
                    className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowEmojis(!showEmojis)}
                    className="p-2 text-gray-400 hover:text-yellow-500 transition-colors"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      !e.shiftKey &&
                      (e.preventDefault(), handleSend())
                    }
                    placeholder="Écrire un message..."
                    className="flex-1 bg-gray-100 dark:bg-slate-800 border-0 rounded-2xl px-4 py-2.5
                               text-sm text-gray-800 dark:text-white placeholder-gray-400
                               focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={sending || !input.trim()}
                    className="p-2.5 rounded-full bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-40 transition-colors"
                  >
                    {sending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};
