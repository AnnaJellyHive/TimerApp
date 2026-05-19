import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import Svg, { Ellipse, Line, Path, Rect, Circle } from 'react-native-svg';

const STEM = '#1f6b3a';
const LEAF = '#2d8a50';
const LEAF_HL = '#3da35d';
const POT = '#c9805a';
const POT_DEEP = '#9c5e3f';
const SOIL = '#3a2a1a';

interface LeafDef {
  cx: number; cy: number;
  rx: number; ry: number;
  rotate: number;
  vx1: number; vy1: number;
  vx2: number; vy2: number;
}

const LEAVES: LeafDef[] = [
  { cx: 76,  cy: 128, rx: 16, ry: 8,   rotate: -22, vx1: 84,  vy1: 124, vx2: 70,  vy2: 132 },
  { cx: 104, cy: 118, rx: 15, ry: 7.5, rotate:  22, vx1: 96,  vy1: 114, vx2: 110, vy2: 122 },
  { cx: 74,  cy: 103, rx: 15, ry: 7.5, rotate: -28, vx1: 82,  vy1: 99,  vx2: 68,  vy2: 107 },
  { cx: 106, cy: 94,  rx: 14, ry: 7,   rotate:  28, vx1: 98,  vy1: 90,  vx2: 112, vy2: 98  },
  { cx: 75,  cy: 78,  rx: 14, ry: 7,   rotate: -32, vx1: 83,  vy1: 74,  vx2: 69,  vy2: 82  },
];

function stemTopY(stage: number) {
  if (stage >= 5) return 70;
  if (stage >= 4) return 86;
  if (stage >= 3) return 95;
  if (stage >= 2) return 110;
  if (stage >= 1) return 122;
  return 148;
}

interface Props {
  stage: number;
  size?: number;
}

export default function Plant({ stage: rawStage, size = 196 }: Props) {
  const stage = Math.max(0, Math.min(5, rawStage));
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const prevStage = useRef(stage);

  useEffect(() => {
    if (stage === prevStage.current) return;
    prevStage.current = stage;
    scaleAnim.setValue(0.85);
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 200,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [stage]);

  const topY = stemTopY(stage);

  return (
    <Animated.View style={{ width: size, height: size, transform: [{ scale: scaleAnim }] }}>
      <Svg width={size} height={size} viewBox="0 0 180 190">

        {/* Stam */}
        <Path
          d={`M90 152 Q87 130 90 ${topY}`}
          stroke={STEM} strokeWidth={4} fill="none" strokeLinecap="round"
        />

        {/* Löv */}
        {LEAVES.slice(0, stage).map((lf, i) => {
          const isNewest = i === stage - 1;
          return (
            <React.Fragment key={i}>
              <Ellipse
                cx={lf.cx} cy={lf.cy} rx={lf.rx} ry={lf.ry}
                fill={isNewest ? LEAF_HL : LEAF}
                transform={`rotate(${lf.rotate}, ${lf.cx}, ${lf.cy})`}
              />
              <Line
                x1={lf.vx1} y1={lf.vy1} x2={lf.vx2} y2={lf.vy2}
                stroke="#fff" strokeWidth={0.8} opacity={0.15}
              />
            </React.Fragment>
          );
        })}

        {/* Knopp vid stadie 5 */}
        {stage >= 5 && (
          <>
            <Circle cx={90} cy={68} r={5.5} fill={LEAF_HL} />
            <Circle cx={90} cy={63} r={3.5} fill="#7fc28f" />
          </>
        )}

        {/* Krukkant */}
        <Rect x={68} y={148} width={44} height={7} rx={3.5} fill={POT} />

        {/* Kruka */}
        <Path d="M73 155 L76 176 Q90 181 104 176 L107 155 Z" fill={POT} />
        <Path d="M76 176 Q90 181 104 176 L104 172 Q90 177 76 172 Z" fill={POT_DEEP} />

        {/* Jord */}
        <Ellipse cx={90} cy={155} rx={17} ry={3.5} fill={SOIL} />

      </Svg>
    </Animated.View>
  );
}
