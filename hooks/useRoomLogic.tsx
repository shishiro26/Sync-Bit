import { socket } from "@/utils/socket";
import { Audio } from "expo-av";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

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
  const offsetRef = useRef(0);
  const [rtt, setRtt] = useState(0);

  const [loading, setLoading] = useState(true);

  const sound = useRef<Audio.Sound | null>(null);
  const clientId = useRef<string>("");

  const samples = useRef<{ rtt: number; offset: number }[]>([]);
  const synced = useRef(false);
  const joined = useRef(false);

  useEffect(() => {
    let unload: (() => void) | null = null;

    (async () => {
      try {
        setAudioLoading(true);
        const { sound: s } = await Audio.Sound.createAsync(
          require("@/assets/songs/Monica.mp3"),
          { shouldPlay: false, isLooping: true }
        );
        sound.current = s;
        unload = () => s.unloadAsync().catch(console.error);
      } finally {
        setAudioLoading(false);
      }
    })();

    return () => unload?.();
  }, []);

  const now = useCallback(() => Date.now(), []);
  const getSyncedNow = useCallback(() => now() + offsetRef.current, [now]);

  useEffect(() => {
    if (!roomId || !username) return;
    const requestNtp = () => {
      const t0 = now();
      socket.emit("ntp-request", { t0 });
    };

    const startNtpSync = () => {
      samples.current = [];
      for (let i = 0; i < 8; i++) setTimeout(requestNtp, i * 80);
    };

    const onConnect = () => {
      socket.emit("join-room", { roomId, username });
      setUsersLoading(true);
      startNtpSync();
    };

    const onJoinFailed = ({ reason }: { reason: string }) => {
      console.warn("join-failed:", reason);
      router.replace("/");
    };

    const onRoomJoined = () => {
      joined.current = true;
      if (synced.current) socket.emit("get-room-state");
    };

    const onSetClientId = ({ clientId: cid }: { clientId: string }) => {
      clientId.current = cid;
    };

    const onRoomUpdate = ({ clients }: { clients: ClientInfo[] }) => {
      setUsers(clients);
      setUsersLoading(false);
    };

    const onRoomState = async (state: {
      roomId: string;
      clients: ClientInfo[];
      spatialEnabled: boolean;
      songEnabled: boolean;
      songDuration: number;
      elapsedTime: number;
      serverTime: number;
    }) => {
      setUsers(state.clients);
      setUsersLoading(false);
      setIsSpatialMode(state.spatialEnabled);

      if (!sound.current) return;

      const nowSynced = getSyncedNow();
      const targetPos = state.elapsedTime + (nowSynced - state.serverTime);

      await sound.current.setPositionAsync(Math.max(0, targetPos));
      if (state.songEnabled) {
        await sound.current.playAsync();
        setIsPlaying(true);
        setStatus("Playing");
      } else {
        await sound.current.pauseAsync();
        setIsPlaying(false);
        setStatus("Paused");
      }
    };

    const onAudioCommand = (cmd: {
      action: "play" | "pause" | "seek";
      serverTime: number;
      elapsedTime?: number;
      position?: number;
      songEnabled?: boolean;
    }) => {
      if (!sound.current) return;
      const delay = cmd.serverTime - getSyncedNow();

      const exec = async () => {
        switch (cmd.action) {
          case "play":
            if (cmd.elapsedTime != null) {
              await sound.current!.setPositionAsync(cmd.elapsedTime);
            }
            await sound.current!.playAsync();
            setIsPlaying(true);
            setStatus("Playing");
            break;

          case "pause":
            await sound.current!.pauseAsync();
            setIsPlaying(false);
            setStatus("Paused");
            break;

          case "seek":
            if (cmd.position != null) {
              await sound.current!.setPositionAsync(cmd.position);
              setStatus(`Seek to ${cmd.position.toFixed(0)}ms`);
            }
            if (cmd.songEnabled) {
              await sound.current!.playAsync();
              setIsPlaying(true);
            } else {
              setIsPlaying(false);
            }
            break;
        }
      };

      if (delay <= 10) exec();
      else {
        setStatus(`Scheduled ${cmd.action} in ${delay.toFixed(0)}ms`);
        setTimeout(exec, delay);
      }
    };

    const onNtpResponse = (msg: { t0: number; t1: number; t2: number }) => {
      const t3 = now();
      const rttSample = t3 - msg.t0 - (msg.t2 - msg.t1);
      const offsetSample = (msg.t1 - msg.t0 + msg.t2 - t3) / 2;

      samples.current.push({ rtt: rttSample, offset: offsetSample });

      if (samples.current.length === 8) {
        const sorted = samples.current.sort((a, b) => a.rtt - b.rtt);
        const median = sorted[Math.floor(sorted.length / 2)];

        console.log(
          `NTP median: rtt=${median.rtt.toFixed(
            2
          )}ms, offset=${median.offset.toFixed(2)}ms`
        );

        offsetRef.current = median.offset;
        setOffset(median.offset);
        setRtt(median.rtt);
        setLoading(false);
        setStatus("Synced");
        synced.current = true;

        if (joined.current) socket.emit("get-room-state");
      }
    };

    const onSpatialToggled = ({ enabled }: { enabled: boolean }) => {
      setIsSpatialMode(enabled);
      if (!sound.current) return;
      if (!enabled) sound.current.setVolumeAsync(1).catch(console.error);
    };

    const onSpatialUpdate = (data: {
      source: { x: number; y: number };
      gains: Record<string, number>;
      enabled: boolean;
    }) => {
      setSourcePosition(data.source);
      setIsSpatialMode(data.enabled);
      const id = clientId.current;
      if (!id || !sound.current || !(id in data.gains)) return;
      sound.current.setVolumeAsync(data.gains[id]).catch(console.error);
    };

    const onError = ({ message }: { message: string }) => {
      console.error("socket error:", message);
    };

    socket.on("connect", onConnect);
    socket.on("join-failed", onJoinFailed);
    socket.on("room-joined", onRoomJoined);
    socket.on("set-client-id", onSetClientId);
    socket.on("room-update", onRoomUpdate);
    socket.on("room-state", onRoomState);
    socket.on("audio-command", onAudioCommand);
    socket.on("ntp-response", onNtpResponse);
    socket.on("spatial-toggled", onSpatialToggled);
    socket.on("spatial-update", onSpatialUpdate);
    socket.on("error", onError);

    if (socket.connected) {
      onConnect();
    } else {
      socket.connect();
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("join-failed", onJoinFailed);
      socket.off("room-joined", onRoomJoined);
      socket.off("set-client-id", onSetClientId);
      socket.off("room-update", onRoomUpdate);
      socket.off("room-state", onRoomState);
      socket.off("audio-command", onAudioCommand);
      socket.off("ntp-response", onNtpResponse);
      socket.off("spatial-toggled", onSpatialToggled);
      socket.off("spatial-update", onSpatialUpdate);
      socket.off("error", onError);
    };
  }, [roomId, username, getSyncedNow, now]);

  const onLeaveRoom = useCallback(() => {
    socket.emit("leave-room");
    sound.current?.pauseAsync().catch(console.error);
    router.replace("/");
  }, []);

  const handlePlay = useCallback(() => {
    const songDuration = 240_000;
    socket.emit("play-audio", {
      serverTimeToExecute: Date.now() + offsetRef.current + 100,
      songDuration,
      songUrl: "",
    });
    setStatus("Sent play");
  }, []);

  const handlePause = useCallback(() => {
    socket.emit("pause-audio", {
      serverTimeToExecute: Date.now() + offsetRef.current + 100,
    });
    setStatus("Sent pause");
  }, []);

  const handleSpatialToggle = useCallback(() => {
    socket.emit("toggle-spatial", { roomId, enable: !isSpatialMode });
  }, [roomId, isSpatialMode]);

  return {
    roomId: roomId ?? "n/a",
    username: username ?? "n/a",
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
