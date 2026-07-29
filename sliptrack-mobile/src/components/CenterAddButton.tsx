import { Pressable, StyleSheet, GestureResponderEvent } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

interface Props {
  onPress?: (event: GestureResponderEvent) => void;
}

export default function CenterAddButton({ onPress }: Props) {
  return (
    <Pressable style={styles.wrapper} onPress={onPress}>
      <Ionicons name="add" size={30} color="#fff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    top: -18,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});
