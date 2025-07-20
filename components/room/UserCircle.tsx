import { COLORS } from "@/themes/index";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Client = {
  clientId: string;
  username: string;
  position: { x: number; y: number };
};

export default function UserCircle({
  clients,
  sourcePosition,
}: {
  clients: Client[];
  sourcePosition: { x: number; y: number };
}) {
  const getCircularPosition = (
    pos: { x: number; y: number },
    radius: number
  ) => {
    const distance = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
    const scale = distance > 100 ? 100 / distance : 1;

    return {
      x: pos.x * scale * (radius / 100),
      y: pos.y * scale * (radius / 100),
    };
  };

  const circleRadius = 100;
  const sourcePos = getCircularPosition(
    sourcePosition || { x: 0, y: 0 },
    circleRadius
  );

  return (
    <View style={styles.circleArea}>
      <View style={styles.circleOutline} />
      <View style={styles.circleBackground} />

      <View
        style={[
          styles.sourceIcon,
          {
            transform: [
              { translateX: sourcePos.x },
              { translateY: sourcePos.y },
            ],
          },
        ]}
      >
        <MaterialCommunityIcons
          name="volume-high"
          size={18}
          color={COLORS.accent}
        />
      </View>

      {clients.map((c) => {
        const userPos = getCircularPosition(
          c.position || { x: 0, y: 0 },
          circleRadius
        );
        const firstLetter = c.username
          ? c.username.charAt(0).toUpperCase()
          : "?";
        return (
          <View
            key={c.clientId}
            style={[
              styles.userDot,
              {
                transform: [
                  { translateX: userPos.x },
                  { translateY: userPos.y },
                ],
              },
            ]}
          >
            <Text style={styles.userInitial}>{firstLetter}</Text>
          </View>
        );
      })}

      <Text style={styles.usersLabel}>Users: {clients.length}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circleArea: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 24,
    backgroundColor: COLORS.background,
  },
  circleOutline: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: COLORS.separator,
    position: "absolute",
  },
  circleBackground: {
    width: 196,
    height: 196,
    borderRadius: 98,
    backgroundColor: COLORS.card,
    opacity: 0.3,
    position: "absolute",
  },
  sourceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    position: "absolute",
    zIndex: 3,
    borderWidth: 2,
    borderColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  userDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.textPrimary,
    position: "absolute",
    zIndex: 2,
    borderWidth: 1,
    borderColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  userInitial: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.background,
    textAlign: "center",
  },
  usersLabel: {
    position: "absolute",
    bottom: -40,
    color: COLORS.textDim,
    fontSize: 14,
    fontWeight: "600",
  },
});
