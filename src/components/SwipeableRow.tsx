import React, { useRef } from 'react';
import { Animated, PanResponder, View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  children: React.ReactNode;
  deleteLabel?: string;
  deleteAccessibilityLabel: string;
  onDelete: () => void;
  rowBackground?: string;
  containerStyle?: object;
}

const DELETE_WIDTH = 90;

export default function SwipeableRow({
  children,
  deleteLabel = 'Ta bort',
  deleteAccessibilityLabel,
  onDelete,
  rowBackground = '#fff',
  containerStyle,
}: Props) {
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, g) =>
        Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        const x = isOpen.current ? g.dx - DELETE_WIDTH : g.dx;
        translateX.setValue(Math.min(0, Math.max(x, -DELETE_WIDTH)));
      },
      onPanResponderRelease: (_, g) => {
        const shouldOpen = isOpen.current
          ? g.dx > -20 ? false : true
          : g.dx < -40;
        isOpen.current = shouldOpen;
        Animated.spring(translateX, {
          toValue: shouldOpen ? -DELETE_WIDTH : 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  function handleDelete() {
    Animated.timing(translateX, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      isOpen.current = false;
      onDelete();
    });
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Delete-knapp alltid bakom innehållet */}
      <TouchableOpacity
        accessibilityLabel={deleteAccessibilityLabel}
        style={styles.deleteBtn}
        onPress={handleDelete}>
        <Text style={styles.deleteText}>{deleteLabel}</Text>
      </TouchableOpacity>

      {/* Innehåll täcker delete-knappen, glider åt vänster vid svep */}
      <Animated.View
        style={{ backgroundColor: rowBackground, transform: [{ translateX }] }}
        {...panResponder.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative' },
  deleteBtn: {
    position: 'absolute',
    right: 0, top: 0, bottom: 0,
    width: DELETE_WIDTH,
    backgroundColor: '#e53935',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});
