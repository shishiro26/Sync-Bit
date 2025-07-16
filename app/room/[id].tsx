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

const assetId = require("@/assets/songs/Monica.mp3");
const NTP_SAMPLE_COUNT = 8;

export default function RoomScreen() {
  const { id: roomId, username } = useLocalSearchParams<{
    id: string;
    username: string;
  }>();

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

  useEffect(() => {
    const loadSound = async () => {
      try {
        const { sound: s } = await Audio.Sound.createAsync(assetId, {
          shouldPlay: false,
          isLooping: true,
        });
        sound.current = s;
      } catch (err) {
        console.error("Sound load error", err);
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
        socket.disconnect();
        console.log("Socket disconnected on screen unmount");
      }
    };
  }, []);
  useEffect(() => {
    const now = () => Date.now();

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
      if (roomId && username) {
        socket.emit("join-room", { roomId, username });
        setUsersLoading(true);
      }

      if (!synced.current) {
        synced.current = true;
        startSync();
      }
    };

    const onNtpResponse = ({
      t0,
      t1,
      t2,
    }: {
      t0: number;
      t1: number;
      t2: number;
    }) => {
      const t3 = now();
      // t3 --:> will be the time when server ninchi vachina request client ki reach aiyyindhi

      const rtt = t3 - t0 - (t2 - t1);
      // ikkada rtt em chestundhi ante very simple
      // refer to this https://en.wikipedia.org/wiki/Network_Time_Protocol
      // (t3-t0) will be the time gap in the client like t0 request sent time and t3 will be the time when the request reached back to it
      // (t2-t1) will be the time gap in teh server like how much while processing this request
      const offset = (t1 - t0 + t2 - t3) / 2;
      // offset --> this formula is just the average between the times of the elapsed time between the client and server and the server and the client;
      samples.current.push({ rtt, offset });

      if (samples.current.length === NTP_SAMPLE_COUNT) {
        const best = [...samples.current].sort((a, b) => a.rtt - b.rtt);

        // in this taking the sorting using the shortest rtt samples in this and taking the median of all this samples for round figure I took the number of samples to be 8;
        const median = best[Math.floor(NTP_SAMPLE_COUNT / 2)];
        setTimeOffset(median.offset);
        setLatency(
          `Offset: ${median.offset.toFixed(1)}ms, RTT: ${median.rtt.toFixed(
            1
          )}ms`
        );
        setLoading(false);
      }
    };

    const onRoomUpdate = ({
      clients,
      songStatus,
    }: {
      clients: ClientInfo[];
      songStatus: boolean;
    }) => {
      setClients(clients);
      setIsPlaying(songStatus);
      setUsersLoading(false);
    };

    const onSetClientId = ({ clientId: id }: { clientId: string }) => {
      clientId.current = id;
    };

    const onPlayAudio = async ({
      serverTimeToExecute,
    }: {
      serverTimeToExecute: number;
    }) => {
      const syncedNow = now() + timeOffset;
      const delay = serverTimeToExecute - syncedNow;

      if (!sound.current) return;

      if (delay <= 10) {
        await sound.current.replayAsync();
        setStatus("Playing");
      } else {
        setStatus(`Scheduled play in ${delay.toFixed(0)}ms`);
        setTimeout(() => sound.current?.replayAsync(), delay);
      }

      setIsPlaying(true);
    };

    const onPauseAudio = async ({
      serverTimeToExecute,
    }: {
      serverTimeToExecute: number;
    }) => {
      const syncedNow = now() + timeOffset;
      const delay = serverTimeToExecute - syncedNow;

      if (!sound.current) return;

      if (delay <= 10) {
        await sound.current.pauseAsync();
        setStatus("Paused");
      } else {
        setStatus(`Scheduled pause in ${delay.toFixed(0)}ms`);
        setTimeout(() => sound.current?.pauseAsync(), delay);
      }

      setIsPlaying(false);
    };

    const onSpatialUpdate = ({
      source,
      gains,
    }: {
      source: { x: number; y: number };
      gains: { [clientId: string]: number };
    }) => {
      setSourcePosition(source);

      const id = clientId.current;
      if (!id || !sound.current || !gains || !(id in gains)) return;

      const gain = gains[id];
      sound.current.setVolumeAsync(gain).catch(console.error);
    };

    if (!socket.connected) {
      socket.connect();
    } else {
      onConnect();
    }

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
  }, [roomId, timeOffset, username]);

  const getSyncedNow = () => Date.now() + timeOffset;

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
    const enabled = !isSpatialMode;
    setIsSpatialMode(enabled);
    socket.emit("toggle-spatial", { roomId, enable: enabled });
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
