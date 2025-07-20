import React from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Image,
  StyleSheet,
  ScrollView,
} from "react-native";
import { COLORS } from "@/themes/index";

type Props = {
  users: { username: string; clientId: string }[];
  loading: boolean;
  currentUsername: string;
};

export default function UsersPanel({ users, loading, currentUsername }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Users in Room</Text>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={COLORS.accent} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : users.length ? (
        <View style={styles.scrollWrapper}>
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            {users.map((user) => {
              const isCurrentUser = user.username === currentUsername;
              const avatarUrl = `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent(
                user.username
              )}&size=48`;
              return (
                <View key={user.clientId} style={styles.userRow}>
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                  <Text style={styles.username}>{user.username}</Text>
                  {isCurrentUser && (
                    <View style={styles.youPill}>
                      <Text style={styles.youText}>you</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>
      ) : (
        <Text style={styles.empty}>No users in room</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginBottom: 20,
    maxHeight: 340,
    shadowColor: "#00000015",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textDim,
    marginBottom: 10,
  },
  scrollWrapper: {
    height: 120,
  },
  scrollArea: {},
  scrollContent: {
    paddingBottom: 8,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textDim,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: "#bbb",
  },
  username: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  youPill: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  youText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#000",
    textTransform: "uppercase",
  },
  empty: {
    color: COLORS.textDim,
    fontSize: 14,
    paddingVertical: 8,
  },
});
