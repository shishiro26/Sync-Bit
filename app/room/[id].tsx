import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { Audio } from "expo-av";
import { socket } from "@/utils/socket";

import RoomHeader from "./components/room/RoomHeader";
import PlayerControls from "./components/room/PlayerControls";
import UserCircle from "./components/room/UserCircle";
import UserList from "./components/room/UserList";

type ClientInfo = {
  clientId: string;
  username: string;
  position: { x: number; y: number };
};

type RoomParams = {
  id: string;
  username: string;
};

const assetId = require("@/assets/songs/Monica.mp3");
const NTP_SAMPLE_COUNT = 8;
const EXECUTION_THRESHOLD_MS = 10;

export default function RoomScreen() {
  const { id: roomId, username } = useLocalSearchParams<RoomParams>();

  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [sourcePosition, setSourcePosition] = useState({ x: 0, y: 0 });
  const [timeOffset, setTimeOffset] = useState(0);
  const [latency, setLatency] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpatialMode, setIsSpatialMode] = useState(false);
  const [status, setStatus] = useState("Idle");
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);

  const sound = useRef<Audio.Sound | null>(null);
  const clientId = useRef("");
  const synced = useRef(false);
  const samples = useRef<{ rtt: number; offset: number }[]>([]);

  const now = () => Date.now();

  const getSyncedNow = () => now() + timeOffset;

  useEffect(() => {
    const loadSound = async () => {
      try {
        const { sound: s } = await Audio.Sound.createAsync(assetId, {
          shouldPlay: false,
          isLooping: true,
        });
        sound.current = s;
      } catch (err) {
        console.error("Error loading audio", err);
      }
    };

    loadSound();

    return () => {
      sound.current?.unloadAsync().catch(console.error);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (socket.connected) {
        socket.emit("leave-room", { roomId });
        socket.disconnect();
        console.log("[socket] Disconnected on unmount");
      }
    };
  }, [roomId]);

  useEffect(() => {
    if (!roomId || !username) return;

    const requestNTP = () => {
      const t0 = now();
      socket.emit("ntp-request", { t0 });
    };

    const startSync = () => {
      samples.current = [];
      for (let i = 0; i < NTP_SAMPLE_COUNT; i++) {
        setTimeout(requestNTP, i * 80);
      }
    };

    const onConnect = () => {
      console.log("[socket] Connected");
      socket.emit("join-room", { roomId, username });
      setUsersLoading(true);

      if (!synced.current) {
        synced.current = true;
        startSync();
      }
    };

    const onNtpResponse = (data: { t0: number; t1: number; t2: number }) => {
      const t3 = now();
      const rtt = t3 - data.t0 - (data.t2 - data.t1);
      const offset = (data.t1 - data.t0 + data.t2 - t3) / 2;

      samples.current.push({ rtt, offset });

      if (samples.current.length === NTP_SAMPLE_COUNT) {
        const bestSamples = [...samples.current].sort((a, b) => a.rtt - b.rtt);
        const median = bestSamples[Math.floor(NTP_SAMPLE_COUNT / 2)];

        setTimeOffset(median.offset);
        setLatency(
          `Offset: ${median.offset.toFixed(1)}ms, RTT: ${median.rtt.toFixed(
            1
          )}ms`
        );
        setLoading(false);
      }
    };

    const onRoomUpdate = (data: {
      clients: ClientInfo[];
      songStatus: boolean;
    }) => {
      setClients(data.clients);
      setIsPlaying(data.songStatus);
      setUsersLoading(false);
    };

    const onSetClientId = (data: { clientId: string }) => {
      clientId.current = data.clientId;
    };

    const onPlayAudio = async (data: { serverTimeToExecute: number }) => {
      const delay = data.serverTimeToExecute - getSyncedNow();
      if (!sound.current) return;

      if (delay <= EXECUTION_THRESHOLD_MS) {
        await sound.current.replayAsync();
        setStatus("Playing");
      } else {
        setStatus(`Scheduled play in ${delay.toFixed(0)}ms`);
        setTimeout(() => sound.current?.replayAsync(), delay);
      }

      setIsPlaying(true);
    };

    const onPauseAudio = async (data: { serverTimeToExecute: number }) => {
      const delay = data.serverTimeToExecute - getSyncedNow();
      if (!sound.current) return;

      if (delay <= EXECUTION_THRESHOLD_MS) {
        await sound.current.pauseAsync();
        setStatus("Paused");
      } else {
        setStatus(`Scheduled pause in ${delay.toFixed(0)}ms`);
        setTimeout(() => sound.current?.pauseAsync(), delay);
      }

      setIsPlaying(false);
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
  }, [roomId, username, timeOffset]);

  const handlePlay = () => {
    const executeAt = getSyncedNow() + 10;
    socket.emit("play-audio", { roomId, serverTimeToExecute: executeAt });
    setStatus("Sent play");
  };

  const handlePause = () => {
    const executeAt = getSyncedNow() + 10;
    socket.emit("pause-audio", { roomId, serverTimeToExecute: executeAt });
    setStatus("Sent pause");
  };

  const handleSpatialToggle = () => {
    socket.emit("toggle-spatial", { roomId, enable: !isSpatialMode });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <RoomHeader roomId={roomId} username={username} latency={latency} />

      {loading ? (
        <View style={{ alignItems: "center" }}>
          <Text>Syncing time...</Text>
          <ActivityIndicator size="small" color="blue" />
        </View>
      ) : (
        <>
          <PlayerControls
            isPlaying={isPlaying}
            onPlay={handlePlay}
            onPause={handlePause}
            isSpatialMode={isSpatialMode}
            onToggleSpatial={handleSpatialToggle}
            coverImage={require("@/assets/images/MonicaCover.png")}
          />

          <UserList clients={clients} loading={usersLoading} />

          <UserCircle clients={clients} sourcePosition={sourcePosition} />

          <Text style={styles.status}>{status}</Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: "center",
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  status: {
    marginTop: 20,
    fontSize: 16,
    color: "#555",
  },
});
