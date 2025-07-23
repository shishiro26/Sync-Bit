import React from "react";
import { View, TouchableOpacity, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/themes/index";

interface PlayerControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  isSpatialMode: boolean;
  onToggleSpatial: () => void;
  loading: boolean;
  hasCurrentSong: boolean; // New prop to check if there's a song to play
  currentSongName?: string; // Optional current song name
}

interface ControlButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled: boolean;
  active?: boolean;
  style?: "primary" | "secondary" | "spatial";
}

const ControlButton: React.FC<ControlButtonProps> = ({
  icon,
  onPress,
  disabled,
  active = false,
  style = "secondary",
}) => {
  const getButtonStyle = () => {
    if (disabled) return styles.buttonDisabled;

    switch (style) {
      case "primary":
        return active ? styles.buttonPrimaryActive : styles.buttonPrimary;
      case "spatial":
        return active ? styles.buttonSpatialActive : styles.buttonSpatial;
      default:
        return styles.buttonSecondary;
    }
  };

  const getIconColor = () => {
    if (disabled) return COLORS.textDim;

    switch (style) {
      case "primary":
        return active ? COLORS.background : COLORS.accent;
      case "spatial":
        return active ? COLORS.background : COLORS.accent;
      default:
        return COLORS.textPrimary;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, getButtonStyle()]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={20} color={getIconColor()} />
    </TouchableOpacity>
  );
};

const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  onPlay,
  onPause,
  isSpatialMode,
  onToggleSpatial,
  loading,
  hasCurrentSong,
  currentSongName,
}) => {
  const handlePlayPause = (): void => {
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
  };

  return (
    <View style={styles.container}>
      {/* Current Song Info */}
      {hasCurrentSong && currentSongName && (
        <View style={styles.songInfo}>
          <Text style={styles.nowPlayingLabel}>Now Playing</Text>
          <Text style={styles.songName} numberOfLines={1}>
            {currentSongName}
          </Text>
        </View>
      )}

      <View style={styles.controlsRow}>
        <ControlButton
          icon={isPlaying ? "pause" : "play"}
          onPress={handlePlayPause}
          disabled={!hasCurrentSong || loading}
          active={isPlaying}
          style="primary"
        />

        <ControlButton
          icon="headset"
          onPress={onToggleSpatial}
          disabled={loading}
          active={isSpatialMode}
          style="spatial"
        />
      </View>

      {/* Status Text */}
      <View style={styles.statusContainer}>
        {!hasCurrentSong && (
          <Text style={styles.statusText}>Upload a song to start playing</Text>
        )}
        {hasCurrentSong && !isPlaying && (
          <Text style={styles.statusText}>Ready to play</Text>
        )}
        {isPlaying && (
          <View style={styles.playingStatus}>
            <View style={styles.playingDot} />
            <Text style={styles.statusTextActive}>Playing</Text>
          </View>
        )}
      </View>

      {/* Spatial Audio Status */}
      <View style={styles.spatialStatus}>
        <Ionicons
          name="radio"
          size={12}
          color={isSpatialMode ? COLORS.accent : COLORS.textDim}
        />
        <Text
          style={[
            styles.spatialText,
            isSpatialMode && styles.spatialTextActive,
          ]}
        >
          Spatial Audio {isSpatialMode ? "On" : "Off"}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: "center",
  },

  songInfo: {
    alignItems: "center",
    marginBottom: 16,
    maxWidth: "80%",
  },

  nowPlayingLabel: {
    color: COLORS.textDim,
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },

  songName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },

  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 12,
  },

  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  buttonPrimary: {
    backgroundColor: "transparent",
    borderColor: COLORS.accent,
  },

  buttonPrimaryActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },

  buttonSecondary: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.separator,
  },

  buttonSpatial: {
    backgroundColor: "transparent",
    borderColor: COLORS.accent,
  },

  buttonSpatialActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },

  buttonDisabled: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.separator,
    opacity: 0.5,
  },

  statusContainer: {
    alignItems: "center",
    marginBottom: 8,
    minHeight: 20,
  },

  statusText: {
    color: COLORS.textDim,
    fontSize: 13,
    fontWeight: "400",
  },

  statusTextActive: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: "500",
  },

  playingStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  playingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
  },

  spatialStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  spatialText: {
    color: COLORS.textDim,
    fontSize: 11,
    fontWeight: "500",
  },

  spatialTextActive: {
    color: COLORS.accent,
  },
});

export default PlayerControls;
