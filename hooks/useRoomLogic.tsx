import { useCallback, useEffect, useRef, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Audio } from "expo-av";
import { socket } from "@/utils/socket";

type ClientInfo = {
  clientId: string;
  username: string;
  position: { x: number; y: number };
};

export function useRoomLogic() {
  const { id: roomId, username } = useLocalSearchParams<{
    id: string;
    username: string;
  }>();
  const [users, setUsers] = useState<ClientInfo[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [sourcePosition, setSourcePosition] = useState({ x: 0, y: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpatialMode, setIsSpatialMode] = useState(false);
  const [status, setStatus] = useState("⏸");
  const [audioLoading, setAudioLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [rtt, setRtt] = useState(0);
  const [loading, setLoading] = useState(true);

  const sound = useRef<Audio.Sound | null>(null);
  const clientId = useRef("");
  const samples = useRef<{ rtt: number; offset: number }[]>([]);
  const synced = useRef(false);

  useEffect(() => {
    let unload: (() => void) | undefined;
    async function loadAudio() {
      try {
        setAudioLoading(true);
        const { sound: s } = await Audio.Sound.createAsync(
          require("@/assets/songs/Monica.mp3"),
          { shouldPlay: false, isLooping: true }
        );
        sound.current = s;
        setAudioLoading(false);
        unload = () => s.unloadAsync().catch(console.error);
      } catch (err) {
        setAudioLoading(false);
      }
    }
    loadAudio();
    return () => unload?.();
  }, []);

  useEffect(() => {
    if (!roomId || !username) return;

    const now = () => Date.now();
    const getSyncedNow = () => now() + offset;

    const requestNTP = () => {
      const t0 = now();
      socket.emit("ntp-request", { t0 });
    };

    const startSync = () => {
      samples.current = [];
      for (let i = 0; i < 8; i++) setTimeout(requestNTP, i * 80);
    };

    function onConnect() {
      socket.emit("join-room", { roomId, username });
      setUsersLoading(true);
      if (!synced.current) {
        synced.current = true;
        startSync();
      }
    }

    function onNtpResponse(data: { t0: number; t1: number; t2: number }) {
      const t3 = now();
      const rtt = t3 - data.t0 - (data.t2 - data.t1);
      const offset = (data.t1 - data.t0 + data.t2 - t3) / 2;
      samples.current.push({ rtt, offset });
      if (samples.current.length === 8) {
        const best = samples.current.sort((a, b) => a.rtt - b.rtt);
        const med = best[Math.floor(8 / 2)];
        setOffset(med.offset);
        setRtt(med.rtt);
        setLoading(false);
        setStatus("Synced");
      }
    }

    function onRoomUpdate(data: {
      clients: ClientInfo[];
      songStatus: boolean;
    }) {
      setUsers(data.clients);
      setIsPlaying(data.songStatus);
      setUsersLoading(false);
    }

    function onSetClientId(data: { clientId: string }) {
      clientId.current = data.clientId;
    }

    async function onPlayAudio(data: { serverTimeToExecute: number }) {
      const delay = data.serverTimeToExecute - getSyncedNow();
      if (!sound.current) return;
      if (delay <= 10) {
        await sound.current.playAsync();
        setStatus("Playing");
      } else {
        setStatus(`Scheduled ${delay.toFixed(0)}ms`);
        setTimeout(() => sound.current?.playAsync(), delay);
      }
      setIsPlaying(true);
    }

    async function onPauseAudio(data: { serverTimeToExecute: number }) {
      if (!sound.current) return;
      const delay = data.serverTimeToExecute - getSyncedNow();
      if (delay <= 10) {
        await sound.current.pauseAsync();
        setStatus("Paused");
      } else {
        setStatus(`Scheduled ${delay.toFixed(0)}ms`);
        setTimeout(() => sound.current?.pauseAsync(), delay);
      }
      setIsPlaying(false);
    }

    function onSpatialUpdate(data: {
      source: { x: number; y: number };
      gains: Record<string, number>;
      enabled: boolean;
    }) {
      setSourcePosition(data.source);
      setIsSpatialMode(data.enabled);
      const id = clientId.current;
      if (!id || !sound.current || !(id in data.gains)) return;
      sound.current?.setVolumeAsync(data.gains[id]).catch(console.error);
    }

    if (!socket.connected) socket.connect();
    else onConnect();

    socket.on("connect", onConnect);
    socket.on("ntp-response", onNtpResponse);
    socket.on("room-update", onRoomUpdate);
    socket.on("play-audio", onPlayAudio);
    socket.on("pause-audio", onPauseAudio);
    socket.on("set-client-id", onSetClientId);
    socket.on("spatial-update", onSpatialUpdate);

    return () => {
      socket.off("connect", onConnect);
      socket.off("ntp-response", onNtpResponse);
      socket.off("room-update", onRoomUpdate);
      socket.off("play-audio", onPlayAudio);
      socket.off("pause-audio", onPauseAudio);
      socket.off("set-client-id", onSetClientId);
      socket.off("spatial-update", onSpatialUpdate);
    };
  }, [roomId, username, offset]);

  const onLeaveRoom = useCallback(() => {
    socket.emit("leave-room", { roomId });
    sound.current?.pauseAsync().catch(console.error);
    if (router) router.replace("/");
  }, [roomId]);

  const handlePlay = useCallback(() => {
    const executeAt = Date.now() + offset + 10;
    socket.emit("play-audio", { roomId, serverTimeToExecute: executeAt });
    setStatus("Sent");
  }, [roomId, offset]);

  const handlePause = useCallback(() => {
    const executeAt = Date.now() + offset + 10;
    socket.emit("pause-audio", { roomId, serverTimeToExecute: executeAt });
    setStatus("Sent");
  }, [roomId, offset]);

  const handleSpatialToggle = useCallback(() => {
    socket.emit("toggle-spatial", { roomId, enable: !isSpatialMode });
  }, [roomId, isSpatialMode]);

  return {
    roomId: roomId || "null",
    username: username || "null",
    users,
    usersLoading,
    sourcePosition,
    isPlaying,
    isSpatialMode,
    status,
    audioLoading,
    offset,
    rtt,
    loading,
    onLeaveRoom,
    handlePlay,
    handlePause,
    handleSpatialToggle,
  };
}
