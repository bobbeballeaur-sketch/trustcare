"use client";
// Video consultation using WebRTC: the two browsers connect directly to each
// other; our server only passes the connection details ("signalling").
// The doctor's browser starts the call; the patient's browser answers.
import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";

type Signal = { type: string; payload: string; at: number };
const ICE = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }];

export function VideoCall({ appointmentId, isDoctor, otherName }: { appointmentId: string; isDoctor: boolean; otherName: string }) {
  const local = useRef<HTMLVideoElement>(null);
  const remote = useRef<HTMLVideoElement>(null);
  const pc = useRef<RTCPeerConnection | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const pendingIce = useRef<RTCIceCandidateInit[]>([]);
  const [status, setStatus] = useState("Press “Join call” to start your camera.");
  const [joined, setJoined] = useState(false);
  const [connected, setConnected] = useState(false);
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);

  const send = (type: string, payload = "") =>
    fetch(`/api/call/${appointmentId}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type, payload }) });

  const newPeer = () => {
    pc.current?.close();
    const p = new RTCPeerConnection({ iceServers: ICE });
    stream.current?.getTracks().forEach((t) => p.addTrack(t, stream.current!));
    p.onicecandidate = (e) => { if (e.candidate) send("ice", JSON.stringify(e.candidate)); };
    p.ontrack = (e) => { if (remote.current) remote.current.srcObject = e.streams[0]; };
    p.onconnectionstatechange = () => {
      const s = p.connectionState;
      setConnected(s === "connected");
      setStatus(s === "connected" ? `Connected with ${otherName}` : s === "failed" ? "Connection failed. Try the backup room below." : s === "disconnected" ? `${otherName} left the call.` : "Connecting…");
    };
    pc.current = p;
    return p;
  };

  const makeOffer = async () => {
    pendingIce.current = []; // details from an older attempt are no longer valid
    const p = newPeer();
    const offer = await p.createOffer();
    await p.setLocalDescription(offer);
    await send("offer", JSON.stringify(offer));
    setStatus(`Calling ${otherName}…`);
  };

  const join = async () => {
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch {
      setStatus("Camera or microphone not allowed. Please allow them in your browser and try again.");
      return;
    }
    if (local.current) local.current.srcObject = stream.current;
    setJoined(true);
    setStatus(`Waiting for ${otherName} to join…`);
    const res = await send("join");
    const since = res.ok ? ((await res.json()) as { at: number }).at - 1000 : 0;
    if (isDoctor) await makeOffer();
    poll(since);
  };

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const poll = (since: number) => {
    let after = since;
    pollRef.current = setInterval(async () => {
      const r = await fetch(`/api/call/${appointmentId}?after=${after}`, { cache: "no-store" }).catch(() => null);
      if (!r?.ok) return;
      const { signals } = (await r.json()) as { signals: Signal[] };
      for (const s of signals) {
        after = Math.max(after, s.at);
        if (s.type === "join" && isDoctor) await makeOffer();
        if (s.type === "offer" && !isDoctor) {
          const p = newPeer();
          await p.setRemoteDescription(JSON.parse(s.payload));
          const answer = await p.createAnswer();
          await p.setLocalDescription(answer);
          await send("answer", JSON.stringify(answer));
          for (const c of pendingIce.current) await p.addIceCandidate(c).catch(() => {});
          pendingIce.current = [];
        }
        if (s.type === "answer" && isDoctor && pc.current && !pc.current.currentRemoteDescription) {
          await pc.current.setRemoteDescription(JSON.parse(s.payload));
          for (const c of pendingIce.current) await pc.current.addIceCandidate(c).catch(() => {});
          pendingIce.current = [];
        }
        if (s.type === "ice") {
          const c = JSON.parse(s.payload) as RTCIceCandidateInit;
          if (pc.current?.remoteDescription) await pc.current.addIceCandidate(c).catch(() => {});
          else pendingIce.current.push(c);
        }
        if (s.type === "hangup") { setConnected(false); setStatus(`${otherName} ended the call.`); if (remote.current) remote.current.srcObject = null; }
      }
    }, 1000);
  };

  const leave = async () => {
    await send("hangup").catch(() => {});
    if (pollRef.current) clearInterval(pollRef.current);
    pc.current?.close();
    stream.current?.getTracks().forEach((t) => t.stop());
    setJoined(false); setConnected(false);
    setStatus("You left the call.");
  };

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pc.current?.close();
    stream.current?.getTracks().forEach((t) => t.stop());
  }, []);

  const toggle = (kind: "audio" | "video") => {
    const tracks = kind === "audio" ? stream.current?.getAudioTracks() : stream.current?.getVideoTracks();
    tracks?.forEach((t) => (t.enabled = !t.enabled));
    if (kind === "audio") setMic((m) => !m); else setCam((c) => !c);
  };
  const ctl = "flex h-12 w-12 items-center justify-center rounded-full";

  return (
    <div className="overflow-hidden rounded-3xl bg-night text-white">
      <div className="relative aspect-video w-full bg-black">
        <video ref={remote} autoPlay playsInline className="h-full w-full object-cover" aria-label={`Video of ${otherName}`} />
        {!connected && <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-white/80">{status}</p>}
        <video ref={local} autoPlay playsInline muted className={`absolute bottom-3 right-3 w-36 rounded-xl border-2 border-white/60 object-cover sm:w-48 ${joined ? "" : "hidden"}`} aria-label="Your camera" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <p role="status" className="text-sm text-white/85">{status}</p>
        {joined ? (
          <div className="flex gap-2">
            <button type="button" onClick={() => toggle("audio")} aria-pressed={!mic} aria-label={mic ? "Mute microphone" : "Unmute microphone"} className={`${ctl} ${mic ? "bg-white/15" : "bg-white text-ink"}`}>{mic ? <Mic size={20} aria-hidden="true" /> : <MicOff size={20} aria-hidden="true" />}</button>
            <button type="button" onClick={() => toggle("video")} aria-pressed={!cam} aria-label={cam ? "Turn camera off" : "Turn camera on"} className={`${ctl} ${cam ? "bg-white/15" : "bg-white text-ink"}`}>{cam ? <Video size={20} aria-hidden="true" /> : <VideoOff size={20} aria-hidden="true" />}</button>
            <button type="button" onClick={leave} aria-label="Leave call" className={`${ctl} bg-danger`}><PhoneOff size={20} aria-hidden="true" /></button>
          </div>
        ) : (
          <button type="button" onClick={join} className="h-12 rounded-full bg-white px-6 font-medium text-ink">Join call</button>
        )}
      </div>
    </div>
  );
}
