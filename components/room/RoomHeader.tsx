import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/themes/index";

type Props = {
  roomId: string;
  username: string;
  onLeaveRoom: () => void;
};

export default function RoomHeader({ roomId, username, onLeaveRoom }: Props) {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.roomId}>Room #{roomId}</Text>
        <Text style={styles.username}>@{username}</Text>
      </View>
      <TouchableOpacity style={styles.leaveButton} onPress={onLeaveRoom}>
        <Ionicons name="exit-outline" size={18} color="#fff" />
        <Text style={styles.leaveText}>Leave</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.card,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: COLORS.separator,
  },
  roomId: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  username: {
    fontSize: 13,
    color: COLORS.textDim,
    marginTop: 2,
  },
  leaveButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.pause,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  leaveText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
});
