import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  FlatList,
  Text,
  ListRenderItem,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/themes/index";
import SongListItem from "./SongListItem";

interface Song {
  id: string;
  songUrl: string;
  hlsUrl: string;
  uploadedAt: number;
  duration: number;
}

interface UploadButtonProps {
  handleUpload: () => void;
  loading: boolean;
  songs: Song[];
  onPlaySong: (song: Song) => void;
  onRemoveSong: (songId: string) => void;
  currentPlayingSong?: string;
}

const UploadButton: React.FC<UploadButtonProps> = ({
  handleUpload,
  loading,
  songs,
  onPlaySong,
  onRemoveSong,
  currentPlayingSong,
}) => {
  const renderSongItem: ListRenderItem<Song> = ({ item }) => (
    <SongListItem
      song={item}
      onPlay={onPlaySong}
      onRemove={onRemoveSong}
      isPlaying={currentPlayingSong === item.id}
    />
  );

  const EmptyState: React.FC = () => (
    <View style={styles.emptyState}>
      <Ionicons name="musical-notes-outline" size={48} color={COLORS.textDim} />
      <Text style={styles.emptyText}>No songs uploaded yet</Text>
      <Text style={styles.emptySubtext}>
        Upload your first song to get started
      </Text>
      <Text style={styles.supportedFormats}>Supported: MP3, WAV, M4A, AAC</Text>
    </View>
  );

  const handleUploadPress = (): void => {
    if (!loading) {
      handleUpload();
    }
  };

  const keyExtractor = (item: Song): string => item.id;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.uploadBtn, loading && styles.uploadBtnLoading]}
        onPress={handleUploadPress}
        disabled={loading}
        activeOpacity={0.7}
      >
        <Ionicons
          name="cloud-upload-outline"
          size={20}
          color={loading ? COLORS.textDim : COLORS.accent}
        />
        <Text style={[styles.uploadText, loading && styles.uploadTextLoading]}>
          {loading ? "Uploading..." : "Upload Song"}
        </Text>
      </TouchableOpacity>

      <View style={styles.libraryContainer}>
        <View style={styles.libraryHeader}>
          <Ionicons name="folder-outline" size={16} color={COLORS.textDim} />
          <Text style={styles.libraryTitle}>
            Audio Library ({songs.length}/50)
          </Text>
        </View>

        {songs.length > 0 ? (
          <FlatList<Song>
            data={songs}
            renderItem={renderSongItem}
            keyExtractor={keyExtractor}
            style={styles.songList}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
          />
        ) : (
          <EmptyState />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    width: "100%",
  },

  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: 8,
    padding: 12,
    marginVertical: 16,
  },

  uploadBtnLoading: {
    borderColor: COLORS.textDim,
    opacity: 0.6,
  },

  uploadText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },

  uploadTextLoading: {
    color: COLORS.textDim,
  },

  libraryContainer: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    overflow: "hidden",
  },

  libraryHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.separator,
  },

  libraryTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },

  songList: {
    flex: 1,
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    paddingVertical: 60,
  },

  emptyText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "500",
    marginTop: 16,
    textAlign: "center",
  },

  emptySubtext: {
    color: COLORS.textDim,
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
  },

  supportedFormats: {
    color: COLORS.textDim,
    fontSize: 12,
    marginTop: 16,
    fontStyle: "italic",
    textAlign: "center",
  },
});

export default UploadButton;
