import React, { useCallback, useMemo } from "react";
import { StyleSheet, TouchableOpacity, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/themes/index";

interface Song {
  id: string;
  songUrl: string;
  hlsUrl: string;
  uploadedAt: number;
  duration: number;
}

interface SongListItemProps {
  song: Song;
  onPlay: (song: Song) => void;
  onRemove: (songId: string) => void;
  isPlaying?: boolean;
}

const SongListItem: React.FC<SongListItemProps> = ({
  song,
  onPlay,
  onRemove,
  isPlaying = false,
}) => {
  const getFileName = useCallback((): string => {
    try {
      const urlParts: string[] = song.songUrl.split("/");
      const filename: string = urlParts[urlParts.length - 1];
      const nameWithoutExt: string = filename.split(".")[0];
      return decodeURIComponent(nameWithoutExt) || "Audio File";
    } catch (error) {
      console.warn("Failed to parse filename from URL:", song.songUrl, error);
      return "Audio File";
    }
  }, [song.songUrl]);

  const fileName = useMemo(() => getFileName(), [getFileName]);

  const handlePlayPress = useCallback((): void => {
    onPlay(song);
  }, [onPlay, song]);

  const handleRemovePress = useCallback((): void => {
    onRemove(song.id);
  }, [onRemove, song.id]);

  const playButtonIcon: keyof typeof Ionicons.glyphMap = isPlaying
    ? "pause"
    : "play";
  const playButtonColor: string = isPlaying
    ? COLORS.background
    : COLORS.textPrimary;

  return (
    <View style={styles.songItem}>
      {/* Play/Pause Button */}
      <TouchableOpacity
        style={[styles.playButton, isPlaying && styles.playButtonActive]}
        onPress={handlePlayPress}
        activeOpacity={0.7}
        accessibilityLabel={isPlaying ? "Pause song" : "Play song"}
        accessibilityRole="button"
      >
        <Ionicons name={playButtonIcon} size={16} color={playButtonColor} />
      </TouchableOpacity>

      {/* Song Info */}
      <View style={styles.songInfo}>
        <Text
          style={[styles.songName, isPlaying && styles.songNameActive]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {fileName}
        </Text>
        {isPlaying && (
          <Text style={styles.playingIndicator}>● Now Playing</Text>
        )}
      </View>

      {/* Remove Button */}
      <TouchableOpacity
        style={styles.removeButton}
        onPress={handleRemovePress}
        activeOpacity={0.7}
        accessibilityLabel="Remove song"
        accessibilityRole="button"
      >
        <Ionicons name="close" size={16} color={COLORS.textDim} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  songItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.separator,
    minHeight: 56,
  },

  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.separator,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  playButtonActive: {
    backgroundColor: COLORS.accent,
  },

  songInfo: {
    flex: 1,
    justifyContent: "center",
  },

  songName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 18,
  },

  songNameActive: {
    color: COLORS.accent,
    fontWeight: "500",
  },

  playingIndicator: {
    color: COLORS.accent,
    fontSize: 11,
    marginTop: 2,
    fontWeight: "500",
  },

  removeButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export default SongListItem;
