import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "@/themes/index";

type Props = { status: string };

export default function StatusBar({ status }: Props) {
  const getStatusUI = () => {
    if (status.includes("Synced"))
      return {
        bgColor: "#1c2d22",
        borderColor: COLORS.play,
        textColor: COLORS.play,
        icon: <Feather name="check-circle" size={18} color={COLORS.play} />,
      };

    if (status.includes("Playing"))
      return {
        bgColor: "#1b2f26",
        borderColor: COLORS.play,
        textColor: COLORS.play,
        icon: <Feather name="play-circle" size={18} color={COLORS.play} />,
      };

    if (status.includes("Paused"))
      return {
        bgColor: "#2b1a1a",
        borderColor: COLORS.pause,
        textColor: COLORS.pause,
        icon: <Feather name="pause-circle" size={18} color={COLORS.pause} />,
      };

    if (status.includes("Scheduled"))
      return {
        bgColor: "#1a1f2d",
        borderColor: COLORS.accent,
        textColor: COLORS.accent,
        icon: <Ionicons name="time-outline" size={18} color={COLORS.accent} />,
      };

    return {
      bgColor: COLORS.card,
      borderColor: COLORS.separator,
      textColor: COLORS.textDim,
      icon: (
        <MaterialIcons name="info-outline" size={18} color={COLORS.textDim} />
      ),
    };
  };

  const { bgColor, borderColor, textColor, icon } = getStatusUI();

  return (
    <View style={[styles.container, { backgroundColor: bgColor, borderColor }]}>
      {icon}
      <Text style={[styles.text, { color: textColor }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: "center",
    minWidth: "auto",
    marginVertical: 14,
    borderWidth: 1.2,
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
  },
});
