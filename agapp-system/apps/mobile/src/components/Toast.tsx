import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

export type ToastVariant = 'success' | 'error' | 'info';

type ToastState = {
  id: number;
  message: string;
  variant: ToastVariant;
};

type ToastContextType = {
  showToast: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const VARIANT_META: Record<ToastVariant, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  success: { icon: 'checkmark-circle', color: '#22C55E' },
  error:   { icon: 'alert-circle',     color: '#EF4444' },
  info:    { icon: 'information-circle', color: '#3B82F6' },
};

const AUTO_DISMISS_MS = 3000;
const ANIM_MS = 220;

/**
 * App-wide toast/notification overlay. Mount <ToastProvider> once near the
 * app root (see App.tsx) — screens then call useToast().showToast(...)
 * instead of Alert.alert() for single-button informational/success/error
 * messages. Multi-button confirmation flows (Cancel/OK, "Open Settings",
 * "Sign In", etc.) still need Alert.alert — a toast can't carry a choice.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(0);

  const dismiss = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    Animated.timing(anim, {
      toValue: 0,
      duration: ANIM_MS,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setToast(null));
  }, [anim]);

  const showToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    nextId.current += 1;
    const id = nextId.current;
    if (hideTimer.current) clearTimeout(hideTimer.current);

    setToast({ id, message, variant });
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: ANIM_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    hideTimer.current = setTimeout(() => {
      dismiss();
    }, AUTO_DISMISS_MS);
  }, [anim, dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && <ToastOverlay toast={toast} anim={anim} onDismiss={dismiss} />}
    </ToastContext.Provider>
  );
}

function ToastOverlay({
  toast,
  anim,
  onDismiss,
}: {
  toast: ToastState;
  anim: Animated.Value;
  onDismiss: () => void;
}) {
  const { T } = useTheme();
  const insets = useSafeAreaInsets();
  const meta = VARIANT_META[toast.variant];

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] });

  return (
    <View pointerEvents="box-none" style={[styles.overlayContainer, { top: insets.top + 8 }]}>
      <Animated.View
        style={[
          styles.toast,
          {
            backgroundColor: T.card,
            borderColor: T.border,
            opacity: anim,
            transform: [{ translateY }],
          },
        ]}
      >
        <TouchableWithoutFeedback onPress={onDismiss}>
          <View style={styles.toastInner}>
            <View style={[styles.accentBar, { backgroundColor: meta.color }]} />
            <Ionicons name={meta.icon} size={22} color={meta.color} style={styles.icon} />
            <Text style={[styles.message, { color: T.text }]} numberOfLines={3}>
              {toast.message}
            </Text>
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </View>
  );
}

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (ctx === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 999,
    alignItems: 'center',
  },
  toast: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  toastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingRight: 16,
  },
  accentBar: {
    width: 4,
    alignSelf: 'stretch',
    marginRight: 12,
  },
  icon: {
    marginRight: 10,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },
});
