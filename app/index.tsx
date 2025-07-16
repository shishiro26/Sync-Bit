import React, { useEffect, useState } from "react";
import {
  TextInput,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { socket } from "@/utils/socket";
import { generateUsername } from "@/utils/username";

export default function HomeScreen() {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState(generateUsername());
  const [isLoading, setIsLoading] = useState(false);
  const isRoomIdValid = roomId.length === 6;

  useEffect(() => {
    socket.connect();

    const handleConnect = () => {
      console.log("Socket connected:", socket.id);
    };

    const handleDisconnect = () => {
      console.warn("Socket disconnected");
    };

    const handleRoomCreated = ({ roomId }: { roomId: string }) => {
      setIsLoading(false);
      router.push({
        pathname: "/room/[id]",
        params: { id: roomId, username },
      });
    };

    const handleJoinFailed = ({ reason }: { reason: string }) => {
      setIsLoading(false);
      Alert.alert("Failed to join", reason);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("room-created", handleRoomCreated);
    socket.on("join-failed", handleJoinFailed);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("room-created", handleRoomCreated);
      socket.off("join-failed", handleJoinFailed);
    };
  }, [username]);

  const handleInputChange = (text: string) => {
    const sanitized = text.replace(/[^0-9]/g, "").slice(0, 6);
    setRoomId(sanitized);
  };

  const handleGenerateUsername = () => {
    setUsername(generateUsername());
  };

  const handleCreateRoom = () => {
    if (isLoading) return;
    setIsLoading(true);
    socket.emit("create-room", { username });
  };

  const handleJoinRoom = () => {
    if (!isRoomIdValid || isLoading) return;
    setIsLoading(true);
    socket.emit("join-room", { roomId, username });

    router.push({
      pathname: "/room/[id]",
      params: { id: roomId, username },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>🎶 SyncBit</Text>

      <TextInput
        placeholder="Enter 6-digit Room ID"
        keyboardType="number-pad"
        onChangeText={handleInputChange}
        value={roomId}
        maxLength={6}
        style={styles.input}
      />

      <Text style={styles.username}>{username}</Text>

      <TouchableOpacity
        onPress={handleGenerateUsername}
        style={styles.generateButton}
      >
        <Text style={styles.generateText}>Generate New Username</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleJoinRoom}
        disabled={!isRoomIdValid || isLoading}
        style={[
          styles.button,
          (!isRoomIdValid || isLoading) && styles.buttonDisabled,
        ]}
      >
        <Text style={styles.buttonText}>Join Room</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleCreateRoom}
        disabled={isLoading}
        style={[styles.button, isLoading && styles.buttonDisabled]}
      >
        <Text style={styles.buttonText}>Create New Room</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 32,
  },
  input: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
  },
  username: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  generateButton: {
    padding: 8,
    marginBottom: 24,
  },
  generateText: {
    textDecorationLine: "underline",
    color: "#007AFF",
  },
  button: {
    width: "100%",
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 6,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
});
