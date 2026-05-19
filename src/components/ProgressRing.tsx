import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  progress: number;
  color: string;
  tint: string;
  emoji: string;
  size?: number;
  pulseEmoji?: boolean;
  centerNode?: React.ReactNode;
}

const STROKE = 9;

export default function ProgressRing({
  progress,
  color,
  tint,
  emoji,
  size = 250,
  pulseEmoji = false,
  centerNode,
}: Props) {
  const radius = (size - STROKE * 2) / 2;
  const circumference = 2 * Math.PI * radius;

  const animatedOffset = useRef(new Animated.Value(circumference * (1 - progress))).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    Animated.timing(animatedOffset, {
      toValue: circumference * (1 - Math.max(0, Math.min(1, progress))),
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  useEffect(() => {
    pulseLoop.current?.stop();
    if (pulseEmoji) {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.18, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.0,  duration: 500, useNativeDriver: true }),
        ])
      );
      pulseLoop.current.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => pulseLoop.current?.stop();
  }, [pulseEmoji]);

  const cx = size / 2;
  const cy = size / 2;

  return (
    <View style={{ alignItems: 'center' }}>
      {/* Ring */}
      <View style={{ width: size, height: size }}>
        <Svg
          width={size}
          height={size}
          style={{ transform: [{ rotate: '-90deg' }] }}>
          {/* Bakgrundscirkel */}
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            fill={tint}
            stroke={tint}
            strokeWidth={STROKE}
          />
          {/* Progress-ring */}
          <AnimatedCircle
            cx={cx}
            cy={cy}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={animatedOffset}
          />
        </Svg>

        {/* Center: Lottie-animation eller pulsande emoji-badge */}
        {centerNode
          ? <View style={[styles.centerAbsolute, { top: cy - 70, left: cx - 70 }]}>{centerNode}</View>
          : (
            <Animated.View style={[styles.emojiBadge, { top: cy - 39, left: cx - 39 }, { transform: [{ scale: pulseAnim }] }]}>
              <Text style={styles.emoji}>{emoji}</Text>
            </Animated.View>
          )
        }
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  emojiBadge: {
    position: 'absolute',
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  emoji: { fontSize: 36 },
  centerAbsolute: {
    position: 'absolute',
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
