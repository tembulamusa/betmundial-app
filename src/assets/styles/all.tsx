import React from "react";
import { TouchableOpacity, Text } from "react-native";

interface DropdownItemProps {
  item: { label: string; value: any; disabled?: boolean };
  onPress: (item: any) => void;
}

export const renderDropdownItem = (props: DropdownItemProps) => {
  const { item, onPress } = props;

  return (
    <TouchableOpacity
      style={{
        padding: 12,
        backgroundColor: "white",
        opacity: item.disabled ? 0.4 : 1,
      }}
      onPress={() => onPress(item)} // 🔑 required
    >
      <Text style={{ color: item.disabled ? "#888" : "#000" }}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );
};

export const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  depositButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },

  depositText: {
    color: "#fff",
    fontWeight: "700",
  },

  loginButton: {
    marginRight: 16,
  },

  loginText: {
    color: "#fff",
    fontWeight: "700",
    textTransform: "uppercase",
  },

  registerButton: {
    backgroundColor: "#E53935",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },

  registerText: {
    color: "#fff",
    fontWeight: "700",
    textTransform: "uppercase",
  },
});

// export default renderDropdownItem;
