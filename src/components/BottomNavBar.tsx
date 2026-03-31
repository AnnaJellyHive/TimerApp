import React, { useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type TabName = 'Uppgifter' | 'Historik';

interface Props {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
}

const TABS: { name: TabName; icon: string }[] = [
  { name: 'Uppgifter', icon: '✓' },
  { name: 'Historik', icon: '↺' },
];

export default function BottomNavBar({ activeTab, onTabPress }: Props) {
  const insets = useSafeAreaInsets();
  const scales = useRef(TABS.map(() => new Animated.Value(1))).current;

  function handlePressIn(index: number) {
    Animated.spring(scales[index], { toValue: 0.9, useNativeDriver: true, speed: 30 }).start();
  }

  function handlePressOut(index: number) {
    Animated.spring(scales[index], { toValue: 1, useNativeDriver: true, speed: 20 }).start();
  }

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.row}>
        {TABS.map((tab, i) => {
          const active = tab.name === activeTab;
          return (
            <Animated.View key={tab.name} style={{ transform: [{ scale: scales[i] }] }}>
              <TouchableOpacity
                accessibilityLabel={tab.name === 'Uppgifter' ? 'uppgifterTab' : 'historikTab'}
                accessibilityRole="tab"
                onPress={() => onTabPress(tab.name)}
                onPressIn={() => handlePressIn(i)}
                onPressOut={() => handlePressOut(i)}
                style={[styles.tab, active && styles.tabActive]}
                activeOpacity={1}>
                <Text style={[styles.icon, active ? styles.iconActive : styles.iconInactive]}>
                  {tab.icon}
                </Text>
                <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>
                  {tab.name}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: 'rgba(248, 250, 248, 0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 32,
    ...Platform.select({
      ios: {
        shadowColor: '#2d3432',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tab: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  tabActive: {
    backgroundColor: '#a4f6a3',
  },
  icon: {
    fontSize: 20,
    marginBottom: 2,
  },
  iconActive: {
    color: '#1d6d2b',
  },
  iconInactive: {
    color: '#536350',
    opacity: 0.6,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
  labelActive: {
    color: '#1d6d2b',
  },
  labelInactive: {
    color: '#536350',
    opacity: 0.6,
  },
});
