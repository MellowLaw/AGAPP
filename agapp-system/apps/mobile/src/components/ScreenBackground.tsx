import React from 'react';
import { View, Animated, Dimensions } from 'react-native';
import Svg, { Path, Polygon } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
// Brand mockup (HOME PAGE V3.png / HOME PAGE DARKMODE.png) tints nearly the
// whole screen, with sparkles scattered from the header down past the quick
// action grid — not confined to a thin sliver under the status bar.
const SPARKLE_BAND_HEIGHT = SCREEN_HEIGHT * 0.6;

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
  { top: 210, left: '80%', size: 10, delay: 300, shape: 'star' },
  { top: 260, left: '20%', size: 8, delay: 950, shape: 'dot' },
  { top: 320, left: '60%', size: 11, delay: 550, shape: 'ring' },
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
// diluted) glowing from the top-right corner, carrying nearly the full
// screen height before settling into the base bg near the bottom edge —
// plus lightweight sparkle dots scattered through that same span. Uses
// alpha-hex stops (never 'transparent') — RN renders a dark halo with the
// 'transparent' keyword on Android.
export function ScreenBackground({ children }: { children: React.ReactNode }) {
  const { T, isDarkMode } = useTheme();

  // Diluted accent tint — reads as a gentle wash, not a block of color. The
  // brand mockup (HOME PAGE V3.png / HOME PAGE DARKMODE.png) carries this
  // tint almost the full height of the screen, only settling to the flat
  // base bg right near the bottom edge — a small corner glow that flattens
  // out by ~60% down (the previous formula) reads as much weaker/plainer
  // than the reference.
  const topColor    = isDarkMode ? `${T.accent}33` : `${T.accent}4D`; // ~20% / ~30%
  const midColor    = isDarkMode ? `${T.accent}21` : `${T.accent}29`; // ~13% / ~16%
  const lowColor    = isDarkMode ? `${T.accent}12` : `${T.accent}14`; // ~7% / ~8%
  const bottomColor = T.bg;

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      {/* Decorative wash + sparkles — no touch events */}
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <LinearGradient
          colors={[topColor, midColor, lowColor, bottomColor]}
          locations={[0, 0.4, 0.75, 1]}
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
