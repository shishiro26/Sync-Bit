import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Text,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "@/themes/index";

type Props = {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  isSpatialMode: boolean;
  onToggleSpatial: () => void;
  loading: boolean;
};

function ControlBtn({
  icon,
  label,
  onPress,
  disabled,
  loading,
  color,
  active,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  onPress: () => void;
  disabled: boolean;
  loading: boolean;
  color: string;
  active?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.controlBtn,
        {
          backgroundColor: active ? COLORS.accent : COLORS.card,
          borderColor: active ? COLORS.accent : color,
          borderWidth: active
            ? 1
            : label === "Spatial Off" || label === "Spatial On"
            ? 1
            : 0,
          opacity: disabled ? 0.3 : 1,
        },
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.textPrimary} />
      ) : (
        <>
          <Feather name={icon} size={20} color={COLORS.textPrimary} />
          <Text style={styles.controlLabel}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export default function PlayerControls({
  isPlaying,
  onPlay,
  onPause,
  isSpatialMode,
  onToggleSpatial,
  loading,
}: Props) {
  return (
    <View style={styles.controlsRow}>
      <ControlBtn
        icon="play"
        label="Play"
        onPress={onPlay}
        disabled={isPlaying || loading}
        loading={loading}
        color={COLORS.play}
        active={false}
      />
      <ControlBtn
        icon="pause"
        label="Pause"
        onPress={onPause}
        disabled={!isPlaying || loading}
        loading={loading}
        color={COLORS.pause}
        active={false}
      />
      <ControlBtn
        icon="headphones"
        label={isSpatialMode ? "Spatial On" : "Spatial Off"}
        onPress={onToggleSpatial}
        disabled={loading}
        loading={false}
        color={COLORS.accent}
        active={isSpatialMode}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  controlsRow: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  controlBtn: {
    minWidth: 100,
    backgroundColor: COLORS.card,
    borderRadius: 100,
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.separator,
    opacity: 1,
  },
  controlLabel: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
});
