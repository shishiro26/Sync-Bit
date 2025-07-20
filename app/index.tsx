import React, { useState, useEffect } from "react";
import {
  TextInput,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { socket } from "@/utils/socket";
import { generateUsername } from "@/utils/username";
import { COLORS } from "@/constants";

type LoadingAction = "create" | "join" | null;

export default function HomeScreen() {
  const [roomId, setRoomId] = useState<string>("");
  const [username, setUsername] = useState<string>(generateUsername());
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);

  const isRoomIdValid = roomId.length === 6;

  useEffect(() => {
    socket.connect();

    const handleConnect = () => console.log("Socket connected:", socket.id);
    const handleDisconnect = () => console.warn("Socket disconnected");
    const handleRoomCreated = ({ roomId }: { roomId: string }) => {
      setIsLoading(false);
      setLoadingAction(null);
      router.push({
        pathname: "/room/[id]",
        params: { id: roomId, username },
      });
    };
    const handleJoinFailed = ({ reason }: { reason: string }) => {
      setIsLoading(false);
      setLoadingAction(null);
      Alert.alert("Failed to join room", reason);
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
    setLoadingAction("create");
    socket.emit("create-room", { username });
  };

  const handleJoinRoom = () => {
    if (!isRoomIdValid || isLoading) return;
    setIsLoading(true);
    setLoadingAction("join");
    socket.emit("join-room", { roomId, username });
    router.push({
      pathname: "/room/[id]",
      params: { id: roomId, username },
    });
  };
  return (
    <SafeAreaProvider>
      <View style={[styles.gradient, { backgroundColor: COLORS.bgMain }]}>
        <SafeAreaView style={styles.container}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1, width: "100%" }}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContainer}
              keyboardShouldPersistTaps="handled"
            >
              {/* HEADER */}
              <View style={styles.header}>
                <View style={styles.iconWrap}>
                  <MaterialCommunityIcons
                    name="waveform"
                    size={40}
                    color={COLORS.iconPrimary}
                  />
                </View>
                <Text style={styles.title}>SyncBit</Text>
              </View>
              <Text style={styles.subtitle}>
                Join a room or create a new one to sync audio with friends.
              </Text>

              <View style={styles.usernameSection}>
                <View style={styles.usernameBox}>
                  <Feather name="user" size={20} color={COLORS.iconAccent} />
                  <Text style={styles.username}>{username}</Text>
                  <TouchableOpacity
                    onPress={handleGenerateUsername}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name="reload"
                      size={22}
                      color={COLORS.iconAccent}
                      style={{ marginLeft: 8 }}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.usernameHint}>Tap to refresh username</Text>
              </View>

              <View style={[styles.card, { backgroundColor: COLORS.bgCard }]}>
                <Text style={styles.cardLabel}>JOIN ROOM</Text>
                <View style={styles.inputRow}>
                  <MaterialCommunityIcons
                    name="numeric"
                    size={20}
                    color={COLORS.iconAccent}
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    placeholder="6-digit room ID"
                    placeholderTextColor={COLORS.textAccent}
                    keyboardType="number-pad"
                    style={styles.input}
                    value={roomId}
                    onChangeText={handleInputChange}
                    maxLength={6}
                  />
                </View>
                <TouchableOpacity
                  onPress={handleJoinRoom}
                  disabled={!isRoomIdValid || isLoading}
                  style={[
                    styles.btn,
                    !isRoomIdValid || isLoading
                      ? styles.btnDisabled
                      : styles.btnPrimary,
                  ]}
                >
                  {isLoading && loadingAction === "join" ? (
                    <ActivityIndicator color={COLORS.iconPrimary} />
                  ) : (
                    <Text style={styles.btnText}>JOIN</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.dividerRow}>
                <View
                  style={[styles.divider, { backgroundColor: COLORS.border }]}
                />
                <Text style={[styles.dividerText, { color: COLORS.textDim }]}>
                  or
                </Text>
                <View
                  style={[styles.divider, { backgroundColor: COLORS.border }]}
                />
              </View>

              <TouchableOpacity
                onPress={handleCreateRoom}
                disabled={isLoading}
                style={[
                  styles.btn,
                  styles.btnAccent,
                  isLoading && styles.btnDisabled,
                  { marginBottom: 18 },
                ]}
              >
                {isLoading && loadingAction === "create" ? (
                  <ActivityIndicator color={COLORS.iconPrimary} />
                ) : (
                  <Text style={styles.btnText}>CREATE ROOM</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    paddingHorizontal: 24,
  },
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  scrollContainer: {
    width: "100%",
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    alignSelf: "center",
  },
  iconWrap: {
    backgroundColor: COLORS.btnPrimary,
    borderRadius: 28,
    padding: 8,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 36,
    fontWeight: "900",
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textDim,
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 20,
    maxWidth: 280,
  },
  usernameSection: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  usernameBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginBottom: 8,
    width: "auto",
    justifyContent: "center",
  },
  username: {
    fontWeight: "600",
    color: COLORS.textPrimary,
    fontSize: 18,
    marginHorizontal: 8,
  },
  usernameHint: {
    fontSize: 12,
    color: COLORS.textDim,
    marginBottom: 12,
  },
  card: {
    width: "100%",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 1.2,
    borderColor: COLORS.border,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 18,
    alignSelf: "center",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 12,
    marginBottom: 18,
    width: "100%",
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    color: COLORS.textPrimary,
    fontSize: 18,
    letterSpacing: 4,
    fontWeight: "600",
    textAlign: "center",
  },
  btn: {
    width: "100%",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 5,
  },
  btnPrimary: {
    backgroundColor: COLORS.btnPrimary,
  },
  btnAccent: {
    backgroundColor: COLORS.btnAccent,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnDisabled: {
    backgroundColor: COLORS.border,
    opacity: 0.7,
    shadowOpacity: 0.05,
    elevation: 2,
  },
  btnText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: 18,
  },
  divider: {
    flex: 1,
    height: 1,
    borderRadius: 2,
  },
  dividerText: {
    fontWeight: "bold",
    fontSize: 13,
    marginHorizontal: 12,
    opacity: 0.7,
    textTransform: "uppercase",
  },
  footnote: {
    fontSize: 13,
    alignSelf: "center",
    marginTop: 20,
    marginBottom: 12,
  },
});
