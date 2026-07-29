import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { AppTabScreenProps } from "../../navigation/AppTabNavigator";
import { propertyApi } from "../../api/propertyApi";
import type { Property } from "../../types/property";

type Props = AppTabScreenProps<"PropertyList">;

export default function PropertyListScreen({ navigation }: Props) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      setIsLoading(true);
      propertyApi
        .getAll()
        .then((data) => {
          if (isActive) setProperties(data);
        })
        .finally(() => {
          if (isActive) setIsLoading(false);
        });
      return () => {
        isActive = false;
      };
    }, []),
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={properties}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={properties.length === 0 && styles.center}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nema dodanih nekretnina.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() =>
              navigation.navigate("PropertyForm", { propertyId: item.id })
            }
          >
            <Text style={styles.cardTitle}>{item.name}</Text>
            {item.address && (
              <Text style={styles.cardSubtitle}>{item.address}</Text>
            )}
          </Pressable>
        )}
      />
      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate("PropertyForm", undefined)}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#666", fontSize: 16 },
  card: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "600" },
  cardSubtitle: { fontSize: 14, color: "#666", marginTop: 4 },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  fabText: { color: "#fff", fontSize: 28, lineHeight: 30 },
});
