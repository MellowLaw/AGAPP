import React from 'react';
import { View, Animated, Dimensions } from 'react-native';
import Svg, { Path, Polygon } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SPARKLE_BAND_HEIGHT = SCREEN_HEIGHT * 0.22; // sparkles only live in the top ~22%

type SparkleShape = 'dot' | 'star' | 'diamond' | 'ring';

// Fixed positions/timings/shapes (not randomized per render) so the layout is
// stable across re-renders — only the float/opacity animation loops.
const SPARKLES: { top: number; left: string; size: number; delay: number; shape: SparkleShape }[] = [
  { top: 26, left: '16%', size: 14, delay: 0, shape: 'star' },
  { top: 66, left: '72%', size: 8, delay: 500, shape: 'dot' },
  { top: 100, left: '42%', size: 12, delay: 250, shape: 'diamond' },
  { top: 44, left: '88%', size: 10, delay: 850, shape: 'ring' },
  { top: 128, left: '10%', size: 16, delay: 1100, shape: 'star' },
  { top: 10, left: '55%', size: 7, delay: 650, shape: 'dot' },
];

// The brand kit's own sparkle glyph (seen on the Pagbati splash) — a simple
// 4-point star, drawn in a 24x24 box.
const STAR_PATH = 'M12 0 L14.2 9.8 L24 12 L14.2 14.2 L12 24 L9.8 14.2 L0 12 L9.8 9.8 Z';

function SparkleGlyph({ shape, size, color }: { shape: SparkleShape; size: number; color: string }) {
  if (shape === 'dot') {
    return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />;
  }
  if (shape === 'ring') {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1.5,
          borderColor: color,
        }}
      />
    );
  }
  if (shape === 'diamond') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Polygon points="12,1 23,12 12,23 1,12" fill={color} />
      </Svg>
    );
  }
  // 'star'
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={STAR_PATH} fill={color} />
    </Svg>
  );
}

// One tiny drifting/pulsing shape. Native-driver-only transforms (opacity,
// translateY) keep this cheap enough to run several of continuously. Color is
// a concentrated (full-opacity) version of the same accent tinting the wash
// behind it — plain white was tried first but was nearly invisible against
// the pale pastel wash it sits on, since white-on-near-white has almost no
// contrast at low opacity.
function FloatingSparkle({ top, left, size, delay, shape, color }: { top: number; left: string; size: number; delay: number; shape: SparkleShape; color: string }) {
  const anim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 2400, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 2400, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, delay]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -12] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.85] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top,
        left: left as any,
        opacity,
        transform: [{ translateY }],
      }}
    >
      <SparkleGlyph shape={shape} size={size} color={color} />
    </Animated.View>
  );
}

// Wraps a tab screen with a soft diagonal wash: LGU accent colour (heavily
// diluted) glowing from the top-right corner, melting into the base bg
// within the upper half — plus a few lightweight sparkle dots confined to
// that same top band. Uses alpha-hex stops (never 'transparent') — RN
// renders a dark halo with the 'transparent' keyword on Android.
export function ScreenBackground({ children }: { children: React.ReactNode }) {
  const { T, isDarkMode } = useTheme();

  // Much more diluted than a flat accent fill — this should read as a
  // gentle tint, not a block of color.
  const topColor    = isDarkMode ? `${T.accent}33` : `${T.accent}4D`; // ~20% / ~30%
  const midColor    = isDarkMode ? `${T.accent}12` : `${T.accent}1F`; // ~7% / ~12%
  const bottomColor = T.bg;

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      {/* Decorative wash + sparkles — no touch events */}
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: SCREEN_HEIGHT }}>
        <LinearGradient
          colors={[topColor, midColor, bottomColor]}
          locations={[0, 0.35, 0.62]}
          style={{ flex: 1 }}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: SPARKLE_BAND_HEIGHT }}>
          {SPARKLES.map((s, i) => (
            <FloatingSparkle key={i} {...s} color={T.accent} />
          ))}
        </View>
      </View>

      {/* Screen content */}
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}
