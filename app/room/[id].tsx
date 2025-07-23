import React, { useEffect, useState, useCallback, JSX } from "react";
import { Alert, BackHandler, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import axios, { AxiosResponse } from "axios";
import RoomHeader from "@/components/room/RoomHeader";
import UploadButton from "@/components/room/UploadButton";
import PlayerControls from "@/components/room/PlayerControls";
import UserCircle from "@/components/room/UserCircle";
import UsersPanel from "@/components/room/UserPanel";
import StatusBar from "@/components/room/StatusBar";
import { COLORS } from "@/themes/index";
import { socket } from "@/utils/socket";
import { useRoomLogic } from "@/hooks/useRoomLogic";

interface Song {
  id: string;
  songUrl: string;
  hlsUrl: string;
  uploadedAt: number;
  duration: number;
}

interface UploadResponse {
  url: string;
}

interface SocketSongUploaded {
  song: Song;
}

interface SocketSongRemoved {
  songId: string;
}

interface SocketSongStarted {
  songId: string;
  hlsUrl: string;
  isPlaying: boolean;
  elapsedTime: number;
  playbackStartTime: number;
  serverTime: number;
}

interface SocketSongResumed {
  songId: string;
  hlsUrl: string;
  isPlaying: boolean;
  elapsedTime: number;
  playbackStartTime: number;
  serverTime: number;
}

interface SocketRoomJoined {
  roomId: string;
  songs: Song[];
  currentSong?: string;
  isPlaying: boolean;
  songElapsedTime: number;
  hlsUrl?: string;
}

interface SocketError {
  message: string;
}

export default function RoomScreen(): JSX.Element {
  const {
    roomId,
    username,
    status,
    users,
    usersLoading,
    sourcePosition,
    isSpatialMode,
    isPlaying,
    onLeaveRoom,
    handlePlay,
    handlePause,
    handleSpatialToggle,
    audioLoading,
  } = useRoomLogic();

  const [uploadLoading, setUploadLoading] = useState<boolean>(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentPlayingSong, setCurrentPlayingSong] = useState<string>("");

  useEffect(() => {
    const sub = BackHandler.addEventListener(
      "hardwareBackPress",
      (): boolean => {
        onLeaveRoom();
        return true;
      }
    );
    return () => sub.remove();
  }, [onLeaveRoom]);

  useEffect(() => {
    const handleSongUploaded = ({ song }: SocketSongUploaded): void => {
      setSongs((prev) => [...prev, song]);
    };

    const handleSongRemoved = ({ songId }: SocketSongRemoved): void => {
      setSongs((prev) => prev.filter((s) => s.id !== songId));
      if (songId === currentPlayingSong) {
        setCurrentPlayingSong("");
      }
    };

    const handleSongStarted = ({ songId }: SocketSongStarted): void => {
      setCurrentPlayingSong(songId);
    };

    const handleSongPaused = (): void => {
      // Handled by useRoomLogic
    };

    const handleSongResumed = ({ songId }: SocketSongResumed): void => {
      setCurrentPlayingSong(songId);
    };

    const handleSongStopped = (): void => {
      setCurrentPlayingSong("");
    };

    const handleRoomJoined = ({
      songs: roomSongs,
      currentSong,
    }: SocketRoomJoined): void => {
      if (roomSongs && Array.isArray(roomSongs)) {
        setSongs(roomSongs);
      }
      if (currentSong) {
        setCurrentPlayingSong(currentSong);
      }
    };

    const handleError = ({ message }: SocketError): void => {
      Alert.alert("Error", message);
    };

    socket.on("song-uploaded", handleSongUploaded);
    socket.on("song-removed", handleSongRemoved);
    socket.on("song-started", handleSongStarted);
    socket.on("song-paused", handleSongPaused);
    socket.on("song-resumed", handleSongResumed);
    socket.on("song-stopped", handleSongStopped);
    socket.on("room-joined", handleRoomJoined);
    socket.on("error", handleError);

    return () => {
      socket.off("song-uploaded", handleSongUploaded);
      socket.off("song-removed", handleSongRemoved);
      socket.off("song-started", handleSongStarted);
      socket.off("song-paused", handleSongPaused);
      socket.off("song-resumed", handleSongResumed);
      socket.off("song-stopped", handleSongStopped);
      socket.off("room-joined", handleRoomJoined);
      socket.off("error", handleError);
    };
  }, [currentPlayingSong]);

  const handleUpload = async (): Promise<void> => {
    if (!roomId) {
      Alert.alert("Error", "Room ID is required");
      return;
    }

    try {
      setUploadLoading(true);
      const response: AxiosResponse<UploadResponse> = await axios.post(
        "http://192.168.1.14:3000/api/v1/upload"
      );

      if (response.status === 200 && response.data.url) {
        socket.emit("song-upload", {
          roomId,
          audioUrl: response.data.url,
        });
      } else {
        throw new Error("Invalid response from upload service");
      }
    } catch (error) {
      console.error("error", error);
    } finally {
      setUploadLoading(false);
    }
  };

  const handlePlaySong = (song: Song): void => {
    if (!roomId) {
      Alert.alert("Error", "Room ID is required");
      return;
    }
    socket.emit("song-play", { roomId, songId: song.id });
  };

  const handleRemoveSong = (songId: string): void => {
    if (!roomId) {
      Alert.alert("Error", "Room ID is required");
      return;
    }
    socket.emit("song-remove", { roomId, songId });
  };

  const getCurrentSongName = useCallback((): string | undefined => {
    if (!currentPlayingSong) return undefined;

    const song = songs.find((s) => s.id === currentPlayingSong);
    if (!song) return undefined;

    try {
      return decodeURIComponent(
        song.songUrl.split("/").pop()?.split(".")[0] || "Unknown Song"
      );
    } catch {
      return "Unknown Song";
    }
  }, [currentPlayingSong, songs]);

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      <RoomHeader
        roomId={roomId}
        username={username}
        onLeaveRoom={onLeaveRoom}
      />
      <ScrollView contentContainerStyle={styles.scrollCont}>
        <UploadButton
          handleUpload={handleUpload}
          loading={uploadLoading}
          songs={songs}
          onPlaySong={handlePlaySong}
          onRemoveSong={handleRemoveSong}
          currentPlayingSong={currentPlayingSong}
        />
        <PlayerControls
          isPlaying={isPlaying}
          onPlay={handlePlay}
          onPause={handlePause}
          isSpatialMode={isSpatialMode}
          onToggleSpatial={handleSpatialToggle}
          loading={audioLoading}
          hasCurrentSong={currentPlayingSong !== ""}
          currentSongName={getCurrentSongName()}
        />
        <UserCircle
          clients={users.map((u) => ({
            clientId: u.id,
            username: u.username,
            position: u.position,
          }))}
          sourcePosition={sourcePosition}
        />
        <UsersPanel
          users={users.map((u) => ({ username: u.username, clientId: u.id }))}
          loading={usersLoading}
          currentUsername={username}
        />
        <StatusBar status={status} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollCont: {
    alignItems: "center",
    justifyContent: "flex-start",
    paddingBottom: 60,
  },
});
