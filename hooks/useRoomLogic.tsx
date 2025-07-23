import { socket } from "@/utils/socket";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

interface ClientInfo {
  id: string;
  username: string;
  position: { x: number; y: number };
}

interface Song {
  id: string;
  songUrl: string;
  hlsUrl: string;
  uploadedAt: number;
  duration: number;
}

interface SpatialData {
  source: { x: number; y: number };
  gains: Record<string, number>;
  enabled: boolean;
  positions: Record<string, { x: number; y: number }>;
}

interface PlaybackSyncData {
  songId: string;
  isPlaying: boolean;
  playbackStartTime: number;
  currentTime: number;
  serverTime: number;
  hlsUrl: string;
}

export function useRoomLogic() {
  const { id: roomId, username } = useLocalSearchParams<{
    id: string;
    username: string;
  }>();

  // Room state
  const [users, setUsers] = useState<ClientInfo[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Connecting...");

  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [currentSong, setCurrentSong] = useState<string | null>(null);
  const [currentHlsUrl, setCurrentHlsUrl] = useState<string | null>(null);

  // Spatial audio
  const [isSpatialMode, setIsSpatialMode] = useState(false);
  const [sourcePosition, setSourcePosition] = useState({ x: 0, y: 0 });

  // Sync metrics
  const [rtt, setRtt] = useState(0);
  const [offset, setOffset] = useState(0);

  // Refs
  const clientId = useRef<string>("");
  const hlsPlayerRef = useRef<any>(null);
  const syncSamples = useRef<{ rtt: number; offset: number }[]>([]);
  const offsetRef = useRef(0);
  const isSynced = useRef(false);
  const hasJoined = useRef(false);

  const now = useCallback(() => Date.now(), []);
  const getSyncedTime = useCallback(() => now() + offsetRef.current, [now]);

  const performTimeSync = useCallback(() => {
    syncSamples.current = [];
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        socket.emit("ping", { timestamp: now() });
      }, i * 50);
    }
  }, [now]);

  const syncHLSPlayback = useCallback(
    async (data: PlaybackSyncData) => {
      if (!hlsPlayerRef.current) return;

      try {
        setAudioLoading(true);

        if (currentHlsUrl !== data.hlsUrl) {
          setCurrentHlsUrl(data.hlsUrl);
          await hlsPlayerRef.current.loadSource(data.hlsUrl);
        }

        const syncedNow = getSyncedTime();
        let seekTime = 0;

        if (data.isPlaying && data.playbackStartTime > 0) {
          if (syncedNow >= data.playbackStartTime) {
            seekTime = data.currentTime + (syncedNow - data.serverTime);
          } else {
            seekTime = data.currentTime;
          }
        } else {
          seekTime = data.currentTime;
        }

        await hlsPlayerRef.current.seekTo(Math.max(0, seekTime / 1000));

        if (data.isPlaying) {
          if (syncedNow >= data.playbackStartTime) {
            await hlsPlayerRef.current.play();
            setIsPlaying(true);
            setStatus("Playing");
          } else {
            const delay = data.playbackStartTime - syncedNow;
            setStatus(`Starting in ${Math.ceil(delay / 1000)}s`);
            setTimeout(async () => {
              await hlsPlayerRef.current.play();
              setIsPlaying(true);
              setStatus("Playing");
            }, delay);
          }
        } else {
          await hlsPlayerRef.current.pause();
          setIsPlaying(false);
          setStatus("Paused");
        }
      } catch (error) {
        console.error("HLS sync error:", error);
        setStatus("Sync error");
      } finally {
        setAudioLoading(false);
      }
    },
    [currentHlsUrl, getSyncedTime]
  );

  useEffect(() => {
    if (!roomId || !username) return;

    const handleConnect = () => {
      setStatus("Joining room...");
      socket.emit("join-room", { roomId, username });
      performTimeSync();
    };

    const handleRoomJoined = (data: {
      roomId: string;
      currentSong?: string;
      isPlaying: boolean;
      songElapsedTime: number;
      playbackStartTime?: number;
      serverTime: number;
      hlsUrl?: string;
      songs: Song[];
    }) => {
      hasJoined.current = true;
      setLoading(false);
      setStatus("Connected");

      if (data.currentSong && data.hlsUrl) {
        setCurrentSong(data.currentSong);
        if (isSynced.current) {
          syncHLSPlayback({
            songId: data.currentSong,
            isPlaying: data.isPlaying,
            playbackStartTime: data.playbackStartTime || 0,
            currentTime: data.songElapsedTime,
            serverTime: data.serverTime,
            hlsUrl: data.hlsUrl,
          });
        }
      }
    };

    const handleSetClientId = ({ clientId: id }: { clientId: string }) => {
      clientId.current = id;
    };

    const handleRoomUpdate = ({ clients }: { clients: ClientInfo[] }) => {
      setUsers(clients);
      setUsersLoading(false);
    };

    const handlePong = ({
      timestamp,
      serverTime,
    }: {
      timestamp: number;
      serverTime: number;
    }) => {
      const clientTime = now();
      const rttSample = clientTime - timestamp;
      const offsetSample = serverTime - (timestamp + rttSample / 2);

      syncSamples.current.push({ rtt: rttSample, offset: offsetSample });

      if (syncSamples.current.length >= 10) {
        const sorted = syncSamples.current.sort((a, b) => a.rtt - b.rtt);
        const best = sorted.slice(0, 5);
        const avgOffset =
          best.reduce((sum, s) => sum + s.offset, 0) / best.length;
        const avgRtt = best.reduce((sum, s) => sum + s.rtt, 0) / best.length;

        offsetRef.current = avgOffset;
        setOffset(avgOffset);
        setRtt(avgRtt);
        isSynced.current = true;
        setStatus("Synced");

        if (hasJoined.current) {
          socket.emit("sync-request", { roomId });
        }
      }
    };

    const handlePlaybackSync = (data: PlaybackSyncData) => {
      if (isSynced.current) {
        syncHLSPlayback(data);
      }
    };

    const handleSongStarted = (data: {
      songId: string;
      hlsUrl: string;
      isPlaying: boolean;
      elapsedTime: number;
      playbackStartTime: number;
      serverTime: number;
    }) => {
      setCurrentSong(data.songId);
      if (isSynced.current) {
        syncHLSPlayback({
          songId: data.songId,
          isPlaying: data.isPlaying,
          playbackStartTime: data.playbackStartTime,
          currentTime: data.elapsedTime,
          serverTime: data.serverTime,
          hlsUrl: data.hlsUrl,
        });
      }
    };

    const handleSongPaused = (data: {
      songId: string;
      isPlaying: boolean;
      elapsedTime: number;
      serverTime: number;
    }) => {
      setIsPlaying(false);
      if (hlsPlayerRef.current) {
        hlsPlayerRef.current.pause();
      }
      setStatus("Paused");
    };

    const handleSongResumed = (data: {
      songId: string;
      hlsUrl: string;
      isPlaying: boolean;
      elapsedTime: number;
      playbackStartTime: number;
      serverTime: number;
    }) => {
      if (isSynced.current) {
        syncHLSPlayback({
          songId: data.songId,
          isPlaying: data.isPlaying,
          playbackStartTime: data.playbackStartTime,
          currentTime: data.elapsedTime,
          serverTime: data.serverTime,
          hlsUrl: data.hlsUrl,
        });
      }
    };

    const handleSongStopped = () => {
      setCurrentSong(null);
      setCurrentHlsUrl(null);
      setIsPlaying(false);
      setStatus("Stopped");
      if (hlsPlayerRef.current) {
        hlsPlayerRef.current.pause();
        hlsPlayerRef.current.seekTo(0);
      }
    };

    const handleSpatialToggled = ({
      spatialEnabled,
    }: {
      spatialEnabled: boolean;
    }) => {
      setIsSpatialMode(spatialEnabled);
    };

    const handleSpatialUpdate = (data: SpatialData) => {
      setSourcePosition(data.source);
      setIsSpatialMode(data.enabled);

      const myId = clientId.current;
      if (myId && data.gains[myId] !== undefined && hlsPlayerRef.current) {
        hlsPlayerRef.current.setVolume(data.gains[myId]);
      }
    };

    const handleError = ({ message }: { message: string }) => {
      setStatus(`Error: ${message}`);
    };

    const handleDisconnect = () => {
      setStatus("Disconnected");
      setLoading(true);
      isSynced.current = false;
      hasJoined.current = false;
    };

    socket.on("connect", handleConnect);
    socket.on("room-joined", handleRoomJoined);
    socket.on("set-client-id", handleSetClientId);
    socket.on("room-update", handleRoomUpdate);
    socket.on("pong", handlePong);
    socket.on("playback-sync", handlePlaybackSync);
    socket.on("song-started", handleSongStarted);
    socket.on("song-paused", handleSongPaused);
    socket.on("song-resumed", handleSongResumed);
    socket.on("song-stopped", handleSongStopped);
    socket.on("spatial-toggled", handleSpatialToggled);
    socket.on("spatial-update", handleSpatialUpdate);
    socket.on("error", handleError);
    socket.on("disconnect", handleDisconnect);

    if (socket.connected) {
      handleConnect();
    } else {
      socket.connect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("room-joined", handleRoomJoined);
      socket.off("set-client-id", handleSetClientId);
      socket.off("room-update", handleRoomUpdate);
      socket.off("pong", handlePong);
      socket.off("playback-sync", handlePlaybackSync);
      socket.off("song-started", handleSongStarted);
      socket.off("song-paused", handleSongPaused);
      socket.off("song-resumed", handleSongResumed);
      socket.off("song-stopped", handleSongStopped);
      socket.off("spatial-toggled", handleSpatialToggled);
      socket.off("spatial-update", handleSpatialUpdate);
      socket.off("error", handleError);
      socket.off("disconnect", handleDisconnect);

      if (hlsPlayerRef.current) {
        hlsPlayerRef.current.destroy();
      }
    };
  }, [roomId, username, now, performTimeSync, syncHLSPlayback]);

  const handlePlay = useCallback(() => {
    if (!roomId || !currentSong) return;
    socket.emit("song-resume", { roomId });
  }, [roomId, currentSong]);

  const handlePause = useCallback(() => {
    if (!roomId) return;
    socket.emit("song-pause", { roomId });
  }, [roomId]);

  const handleSpatialToggle = useCallback(() => {
    if (!roomId) return;
    socket.emit("spatial-toggle", { roomId, spatialEnabled: !isSpatialMode });
  }, [roomId, isSpatialMode]);

  const onLeaveRoom = useCallback(() => {
    if (roomId) {
      socket.emit("leave-room", { roomId });
    }
    if (hlsPlayerRef.current) {
      hlsPlayerRef.current.destroy();
    }
    router.replace("/");
  }, [roomId]);

  return {
    roomId: roomId || "",
    username: username || "",
    users,
    usersLoading,
    sourcePosition,
    isPlaying,
    isSpatialMode,
    currentSong,
    currentHlsUrl,
    status,
    audioLoading,
    offset,
    rtt,
    loading,
    hlsPlayerRef,
    onLeaveRoom,
    handlePlay,
    handlePause,
    handleSpatialToggle,
  };
}
