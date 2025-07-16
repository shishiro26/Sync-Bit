import { View, Text, StyleSheet, ActivityIndicator } from "react-native";

export default function UserList({
  clients,
  loading,
}: {
  clients: { clientId: string; username: string }[];
  loading: boolean;
}) {
  return (
    <View style={styles.userList}>
      <Text style={styles.title}>Users:</Text>
      {loading ? (
        <>
          <Text style={styles.loading}>Loading users...</Text>
          <ActivityIndicator size="small" color="blue" />
        </>
      ) : clients.length ? (
        clients.map((c) => (
          <Text key={c.clientId} style={styles.userItem}>
            • {c.username}
          </Text>
        ))
      ) : (
        <Text style={styles.userItem}>No users</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  userList: { marginVertical: 16, width: "100%", paddingHorizontal: 20 },
  title: { fontSize: 16, fontWeight: "600", marginBottom: 6 },
  userItem: { fontSize: 14, color: "#333" },
  loading: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
    marginVertical: 4,
  },
});
