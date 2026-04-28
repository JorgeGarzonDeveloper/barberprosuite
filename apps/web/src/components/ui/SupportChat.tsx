"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, ChevronDown } from "lucide-react";
import { useAuthStore } from "@/lib/auth.store";
import { api } from "@/lib/api";

interface Message {
  id: string;
  sender: "user" | "support";
  text: string;
  time: Date;
}

const WELCOME_MSG: Message = {
  id: "welcome",
  sender: "support",
  text: "¡Hola! 👋 Soy el soporte de BarberProSuite. ¿En qué te puedo ayudar hoy?",
  time: new Date(),
};

export function SupportChat() {
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, [open, messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text,
      time: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      // Enviar al backend
      await api.post("/support/tickets", {
        message: text,
        subject: "Consulta de soporte",
      });

      // Auto-respuesta
      const replies = [
        "Recibimos tu mensaje. Un agente te responderá en breve 🙌",
        "¡Gracias por escribir! Nuestro equipo revisará tu caso pronto.",
        "Anotado. Te contactaremos en menos de 24 horas.",
      ];
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        sender: "support",
        text: replies[Math.floor(Math.random() * replies.length)],
        time: new Date(),
      };
      setTimeout(() => {
        setMessages((prev) => [...prev, reply]);
        if (!open) setUnread((n) => n + 1);
        setSending(false);
      }, 800);
    } catch {
      // Incluso si falla la API, mostrar respuesta
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        sender: "support",
        text: "Recibimos tu mensaje. Te contactaremos pronto.",
        time: new Date(),
      };
      setTimeout(() => {
        setMessages((prev) => [...prev, reply]);
        setSending(false);
      }, 600);
    }
  }

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-6 right-6 z-50">
        {open ? (
          /* Chat window */
          <div className="flex flex-col bg-barber-secondary border border-gold-500/20 rounded-2xl shadow-2xl shadow-black/60 w-80 h-96 overflow-hidden mb-2">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-gold-500/10 to-transparent">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-white text-sm font-semibold">Soporte BarberProSuite</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-white/40 hover:text-white transition-colors p-1"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-gold-500 text-black rounded-br-sm"
                      : "bg-white/10 text-white/80 rounded-bl-sm"
                  }`}>
                    {msg.text}
                    <p className={`text-xs mt-1 ${msg.sender === "user" ? "text-black/40" : "text-white/30"}`}>
                      {msg.time.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-white/10 px-3 py-2 rounded-xl rounded-bl-sm">
                    <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="flex items-center gap-2 p-3 border-t border-white/10">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={user ? "Escribe tu mensaje..." : "Escribe tu consulta..."}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-gold-500/40 transition-colors"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="w-9 h-9 bg-gold-500 hover:bg-gold-400 disabled:opacity-40 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
              >
                <Send className="w-4 h-4 text-black" />
              </button>
            </form>
          </div>
        ) : null}

        {/* Toggle button */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="relative w-14 h-14 bg-gold-500 hover:bg-gold-400 rounded-full shadow-lg shadow-gold-500/30 flex items-center justify-center transition-all duration-200 hover:scale-105"
        >
          {open ? (
            <X className="w-6 h-6 text-black" />
          ) : (
            <MessageCircle className="w-6 h-6 text-black" />
          )}
          {!open && unread > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unread}
            </span>
          )}
        </button>
      </div>
    </>
  );
}
