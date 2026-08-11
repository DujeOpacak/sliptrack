import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

export interface SelectOption<T> {
  label: string;
  value: T;
}

interface Props<T> {
  label: string;
  placeholder: string;
  value: T | undefined;
  options: SelectOption<T>[];
  onChange: (value: T | undefined) => void;
}

export default function SelectField<T extends string | number>({
  label,
  placeholder,
  value,
  options,
  onChange,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <View style={[styles.container, open && styles.containerOpen]}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.field} onPress={() => setOpen((prev) => !prev)}>
        <Text
          style={[styles.fieldText, !selectedLabel && styles.fieldPlaceholder]}
        >
          {selectedLabel ?? placeholder}
        </Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.textSecondary}
        />
      </Pressable>

      {open && (
        <View style={styles.optionsList}>
          <Pressable
            style={styles.option}
            onPress={() => {
              onChange(undefined);
              setOpen(false);
            }}
          >
            <Text style={styles.optionText}>{placeholder}</Text>
          </Pressable>
          {options.map((option) => (
            <Pressable
              key={option.value}
              style={styles.option}
              onPress={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              <Text
                style={[
                  styles.optionText,
                  option.value === value && styles.optionTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 12 },
  containerOpen: { zIndex: 20, elevation: 20 },
  label: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  field: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  fieldText: { fontSize: 15, color: colors.textPrimary },
  fieldPlaceholder: { color: colors.textMuted },
  optionsList: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: "hidden",
    zIndex: 20,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gridline,
    backgroundColor: colors.surface,
  },
  optionText: { fontSize: 15, color: colors.textPrimary },
  optionTextSelected: { color: colors.primary, fontWeight: "600" },
});
