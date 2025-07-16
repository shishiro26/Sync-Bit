import { Text, View, StyleSheet } from "react-native";

export default function RoomHeader({
  roomId,
  username,
  latency,
}: {
  roomId: string;
  username: string;
  latency: string;
}) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>Room #{roomId}</Text>
      <Text style={styles.subtitle}>You: {username}</Text>
      <Text style={styles.latency}>{latency}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 12, alignItems: "center" },
  title: { fontSize: 22, fontWeight: "bold" },
  subtitle: { fontSize: 16, marginVertical: 4 },
  latency: { fontSize: 14, color: "#555" },
});
