import { View, Button, StyleSheet, Image } from "react-native";

export default function PlayerControls({
  isPlaying,
  onPlay,
  onPause,
  isSpatialMode,
  onToggleSpatial,
  coverImage,
}: {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  isSpatialMode: boolean;
  onToggleSpatial: () => void;
  coverImage: number;
}) {
  return (
    <View style={styles.container}>
      <Image source={coverImage} style={styles.coverImage} resizeMode="cover" />
      <View style={styles.buttonSpacing}>
        <Button title="Play Synced" onPress={onPlay} disabled={isPlaying} />
      </View>
      <View style={styles.buttonSpacing}>
        <Button title="Pause Synced" onPress={onPause} disabled={!isPlaying} />
      </View>
      <View style={styles.buttonSpacing}>
        <Button
          title={isSpatialMode ? "Disable Spatial Mode" : "Enable Spatial Mode"}
          color={isSpatialMode ? "tomato" : "green"}
          onPress={onToggleSpatial}
          disabled={!isPlaying}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    width: "100%",
    alignItems: "center",
  },
  buttonSpacing: {
    marginVertical: 6,
    width: "100%",
  },
  coverImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
  },
});
