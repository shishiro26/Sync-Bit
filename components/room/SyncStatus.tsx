import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { COLORS } from "@/themes/index";

type Props = { offset: number; rtt: number; loading: boolean };

export default function SyncStatus({ offset, rtt, loading }: Props) {
  return (
    <View style={styles.syncCard}>
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.accent} />
      ) : (
        <Text style={styles.syncText}>
          Offset:{" "}
          <Text style={{ color: COLORS.accent }}>{offset?.toFixed(1)}ms</Text> •
          RTT: <Text style={{ color: COLORS.accent }}>{rtt?.toFixed(1)}ms</Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  syncCard: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 12,
    margin: 16,
    marginTop: 12,
    minWidth: 220,
    alignItems: "center",
  },
  syncText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
});
