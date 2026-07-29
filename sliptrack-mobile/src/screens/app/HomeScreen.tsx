import { View, Text, Pressable, StyleSheet } from "react-native";
import { useAuth } from "../../context/AuthContext";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AppStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bok, {user?.firstName}!</Text>
      <Text style={styles.subtitle}>{user?.email}</Text>
      <Pressable
        style={styles.linkButton}
        onPress={() => navigation.navigate("PaymentSlipList")}
      >
        <Text style={styles.linkButtonText}>Moje uplatnice</Text>
      </Pressable>
      <Pressable
        style={styles.linkButton}
        onPress={() => navigation.navigate("PropertyList")}
      >
        <Text style={styles.linkButtonText}>Moje nekretnine</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={() => logout()}>
        <Text style={styles.buttonText}>Odjava</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#666", marginBottom: 32 },
  button: {
    backgroundColor: "#dc2626",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  linkButton: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  linkButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
