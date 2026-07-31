import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../../navigation/types";
import { propertyApi } from "../../api/propertyApi";

type Props = NativeStackScreenProps<AppStackParamList, "PropertyForm">;

export default function PropertyFormScreen({ navigation, route }: Props) {
  const propertyId = route.params?.propertyId;
  const isEditing = propertyId !== undefined;

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditing) return;
    propertyApi.getById(propertyId).then((property) => {
      setName(property.name);
      setAddress(property.address ?? "");
      setIsLoading(false);
    });
  }, [propertyId]);

  const handleSave = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const request = { name, address: address || undefined };
      if (isEditing) {
        await propertyApi.update(propertyId, request);
      } else {
        await propertyApi.create(request);
      }
      navigation.goBack();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Spremanje nije uspjelo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!isEditing) return;
    Alert.alert(
      "Brisanje nekretnine",
      `Sigurno želiš obrisati "${name}"?`,
      [
        { text: "Odustani", style: "cancel" },
        {
          text: "Obriši",
          style: "destructive",
          onPress: async () => {
            try {
              await propertyApi.delete(propertyId!);
              navigation.goBack();
            } catch (err: any) {
              Alert.alert(
                "Brisanje nije moguće",
                err?.response?.data?.message ??
                  "Nekretninu nije moguće obrisati.",
              );
            }
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Naziv</Text>
      <TextInput
        style={styles.input}
        placeholder="npr. Stan Zagreb"
        value={name}
        onChangeText={setName}
      />
      <Text style={styles.label}>Adresa</Text>
      <TextInput
        style={styles.input}
        placeholder="npr. Ilica 1, Zagreb"
        value={address}
        onChangeText={setAddress}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable
        style={styles.button}
        onPress={handleSave}
        disabled={isSubmitting || name.trim().length === 0}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Spremi</Text>
        )}
      </Pressable>
      {isEditing && (
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Obriši nekretninu</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  label: { fontSize: 14, color: "#666", marginBottom: 4, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  error: { color: "#dc2626", marginBottom: 12, textAlign: "center" },
  deleteButton: { alignItems: "center", marginTop: 24 },
  deleteButtonText: { color: "#dc2626", fontSize: 15, fontWeight: "600" },
});
