import { View, Text, StyleSheet } from "react-native";

export default function UserCircle({
  clients,
  sourcePosition,
}: {
  clients: {
    clientId: string;
    username: string;
    position: { x: number; y: number };
  }[];
  sourcePosition: { x: number; y: number };
}) {
  return (
    <View style={styles.circleContainer}>
      <View style={styles.circle} />

      <View
        style={[
          styles.sourcePointer,
          {
            transform: [
              { translateX: sourcePosition?.x || 0 },
              { translateY: sourcePosition?.y || 0 },
            ],
          },
        ]}
      />

      {clients.map((client) => (
        <View
          key={client.clientId}
          style={[
            styles.clientPoint,
            {
              transform: [
                { translateX: client.position?.x || 0 },
                { translateY: client.position?.y || 0 },
              ],
            },
          ]}
        >
          <Text style={styles.clientName}>{client.username}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  circleContainer: {
    position: "relative",
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  circle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#000",
    position: "absolute",
  },
  clientPoint: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "red",
    position: "absolute",
    top: 95,
    left: 95,
  },
  clientName: {
    position: "absolute",
    top: 12,
    width: 80,
    textAlign: "center",
    fontSize: 10,
    left: -35,
  },
  sourcePointer: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "blue",
    position: "absolute",
    top: 94,
    left: 94,
    zIndex: 2,
  },
});
