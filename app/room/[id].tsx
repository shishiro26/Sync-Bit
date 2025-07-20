import React, { useEffect } from "react";
import { ScrollView, BackHandler, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import RoomHeader from "@/components/room/RoomHeader";
import SyncStatus from "@/components/room/SyncStatus";
import PlayerControls from "@/components/room/PlayerControls";
import UserCircle from "@/components/room/UserCircle";
import UsersPanel from "@/components/room/UserPanel";
import StatusBar from "@/components/room/StatusBar";
import { useRoomLogic } from "@/hooks/useRoomLogic";
import { COLORS } from "@/themes/index";

export default function RoomScreen() {
  const {
    roomId,
    username,
    offset,
    rtt,
    status,
    isPlaying,
    isSpatialMode,
    users,
    usersLoading,
    sourcePosition,
    onLeaveRoom,
    handlePlay,
    handlePause,
    handleSpatialToggle,
    audioLoading,
    loading,
  } = useRoomLogic();

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onLeaveRoom();
      return true;
    });
    return () => sub.remove();
  }, [onLeaveRoom]);

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      <RoomHeader
        roomId={roomId}
        username={username}
        onLeaveRoom={onLeaveRoom}
      />
      <ScrollView contentContainerStyle={styles.scrollCont}>
        <SyncStatus offset={offset} rtt={rtt} loading={loading} />
        <PlayerControls
          isPlaying={isPlaying}
          onPlay={handlePlay}
          onPause={handlePause}
          isSpatialMode={isSpatialMode}
          onToggleSpatial={handleSpatialToggle}
          loading={audioLoading}
        />
        <UserCircle clients={users} sourcePosition={sourcePosition} />
        <UsersPanel
          users={users}
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
