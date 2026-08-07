import { useCallback, useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { dashboardApi } from "../../api/dashboardApi";
import { propertyApi } from "../../api/propertyApi";
import { colors } from "../../theme/colors";
import StatTile from "../../components/StatTile";
import type { AppTabScreenProps } from "../../navigation/AppTabNavigator";

type Props = AppTabScreenProps<"Profile">;

const formatEur = (value: number) => `${value.toFixed(2)} €`;

function initials(firstName?: string, lastName?: string) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
}

export default function ProfileScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  const [isLoading, setIsLoading] = useState(true);
  const [totalSlips, setTotalSlips] = useState(0);
  const [unpaidCount, setUnpaidCount] = useState(0);
  const [propertyCount, setPropertyCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      setIsLoading(true);
      Promise.all([dashboardApi.getSummary(), propertyApi.getAll()])
        .then(([summary, properties]) => {
          if (!isActive) return;
          setTotalSlips(summary.paidCount + summary.unpaidCount);
          setUnpaidCount(summary.unpaidCount);
          setPropertyCount(properties.length);
        })
        .finally(() => {
          if (isActive) setIsLoading(false);
        });
      return () => {
        isActive = false;
      };
    }, []),
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(user?.firstName, user?.lastName)}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.subtitle}>{user?.email}</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.statsLoading}>
          <ActivityIndicator />
        </View>
      ) : (
        <View style={styles.statRow}>
          <StatTile
            label="Uplatnice"
            value={String(totalSlips)}
            subtitle={`${unpaidCount} neplaćeno`}
            accentColor={colors.primary}
          />
          <StatTile
            label="Nekretnine"
            value={String(propertyCount)}
            accentColor={colors.primary}
          />
        </View>
      )}

      <View style={styles.menu}>
        <Pressable
          style={[styles.menuRow, styles.menuRowBorder]}
          onPress={() => navigation.navigate("Notifications")}
        >
          <Text style={styles.menuRowText}>Obavijesti</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </Pressable>
        <Pressable style={styles.menuRow} onPress={() => logout()}>
          <Text style={[styles.menuRowText, styles.logoutText]}>Odjava</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.page },
  content: { padding: 16, paddingBottom: 32 },
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gridline,
    padding: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  headerText: { flex: 1 },
  title: { fontSize: 18, fontWeight: "700", color: colors.textPrimary },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  statsLoading: { height: 80, justifyContent: "center", alignItems: "center" },
  statRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gridline,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gridline,
  },
  menuRowText: { fontSize: 16, fontWeight: "600", color: colors.textPrimary },
  logoutText: { color: colors.critical },
  badge: {
    backgroundColor: colors.critical,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
});
