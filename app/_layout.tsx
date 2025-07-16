import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "SyncBit Home" }} />
      <Stack.Screen name="room/[id]" options={{ title: "Room" }} />
    </Stack>
  );
}
