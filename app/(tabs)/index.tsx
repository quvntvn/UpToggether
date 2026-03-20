import { useRouter } from "expo-router";

import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>⏰</Text>
        <Text style={styles.title}>UpTogether</Text>
        <Text style={styles.subtitle}>Don’t wake up alone.</Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Next wake-up</Text>
          <Text style={styles.cardTime}>07:00</Text>
          <Text style={styles.cardInfo}>No alarm configured yet</Text>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("./set-alarm")}
        >
          <Text style={styles.primaryButtonText}>Set Alarm</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Friends</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    justifyContent: "center",
  },
  logo: {
    fontSize: 52,
    textAlign: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#CBD5E1",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 40,
  },
  card: {
    backgroundColor: "#1E293B",
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  cardLabel: {
    fontSize: 14,
    color: "#94A3B8",
    marginBottom: 8,
  },
  cardTime: {
    fontSize: 48,
    fontWeight: "800",
    color: "#FFD54A",
  },
  cardInfo: {
    fontSize: 14,
    color: "#CBD5E1",
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: "#FFD54A",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  secondaryButton: {
    backgroundColor: "#1E293B",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
