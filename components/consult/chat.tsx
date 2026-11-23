"use client";
// Patient–doctor chat for one appointment. New messages arrive by checking
// the server every 2.5 seconds, and are announced to screen readers.
import { useEffect, useRef, useState, useTransition } from "react";
import { Send } from "lucide-react";
import { sendMessageAction } from "@/lib/actions/consult";
import { useApp } from "../providers";

type Msg = { id: string; text: string; mine: boolean; name: string; at: string };

export function Chat({ appointmentId, closed = false }: { appointmentId: string; closed?: boolean }) {
  const { announce, toast } = useApp();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const list = useRef<HTMLOListElement>(null);
  const count = useRef(0);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch(`/api/messages/${appointmentId}`, { cache: "no-store" });
        if (!r.ok || !alive) return;
        const data = (await r.json()) as { messages: Msg[] };
        if (data.messages.length !== count.current) {
          const fresh = data.messages.slice(count.current).filter((m) => !m.mine);
          if (count.current > 0 && fresh.length) announce(`New message from ${fresh[fresh.length - 1].name}: ${fresh[fresh.length - 1].text}`);
          count.current = data.messages.length;
          setMsgs(data.messages);
          requestAnimationFrame(() => list.current?.scrollTo({ top: list.current.scrollHeight }));
        }
      } catch {}
    };
    load();
    const id = setInterval(load, 2500);
    return () => { alive = false; clearInterval(id); };
  }, [appointmentId, announce]);

  const send = () =>
    start(async () => {
      const r = await sendMessageAction(appointmentId, text);
      if (!r.ok) { toast(r.message ?? "Couldn't send.", "error"); return; }
      const mine: Msg = { id: `tmp-${Date.now()}`, text: text.trim(), mine: true, name: "You", at: new Date().toISOString() };
      setMsgs((m) => [...m, mine]);
      count.current += 1;
      setText("");
      requestAnimationFrame(() => list.current?.scrollTo({ top: list.current.scrollHeight }));
    });

  return (
    <div className="flex h-full min-h-[420px] flex-col rounded-3xl border border-line bg-white">
      <h2 className="border-b border-line px-5 py-4 font-medium">Chat</h2>
      <ol ref={list} aria-label="Messages" className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
        {msgs.length === 0 && <li className="m-auto text-sm text-ink-2">No messages yet. Say hello 👋</li>}
        {msgs.map((m) => (
          <li key={m.id} className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${m.mine ? "self-end bg-ink text-white" : "self-start bg-soft"}`}>
            <span className="sr-only">{m.mine ? "You" : m.name} said: </span>
            <p className="whitespace-pre-wrap text-[0.95rem]">{m.text}</p>
            <p className={`mt-1 text-[11px] ${m.mine ? "text-white/70" : "text-ink-2"}`}>{m.mine ? "You" : m.name} · {new Date(m.at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })}</p>
          </li>
        ))}
      </ol>
      {closed ? (
        <p className="border-t border-line p-4 text-sm text-ink-2">This appointment was cancelled, so the chat is closed.</p>
      ) : (
        <form className="flex gap-2 border-t border-line p-3" onSubmit={(e) => { e.preventDefault(); if (text.trim()) send(); }}>
          <label htmlFor="chat-input" className="sr-only">Type a message</label>
          <input id="chat-input" value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} placeholder="Type a message…" className="h-12 min-w-0 flex-1 rounded-full border border-[#cfc9bf] px-4" />
          <button type="submit" disabled={pending || !text.trim()} aria-label="Send message" className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-white disabled:bg-[#8a857e]"><Send size={18} aria-hidden="true" /></button>
        </form>
      )}
    </div>
  );
}
