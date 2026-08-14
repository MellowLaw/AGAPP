import React, { useMemo, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Image, ActivityIndicator, useWindowDimensions,
} from 'react-native';
import Svg, { Defs, Mask, Rect, Ellipse } from 'react-native-svg';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from './Toast';
import { CloseSquare, Camera as CameraIcon, TickCircle } from 'iconsax-react-native';

type GuideShape = 'card' | 'oval';

interface GuidedCaptureProps {
  /** 'card' = rounded-rect ~1.586:1 (ID-1 card ratio). 'oval' = tall oval for a face. */
  guideShape: GuideShape;
  instructionText: string;
  cameraFacing: 'back' | 'front';
  /** Called with the final CROPPED, user-confirmed photo URI. */
  onCapture: (uri: string) => void;
  onCancel: () => void;
}

// Geometry for the guide cutout, in screen (dp) coordinates. Kept as one
// function so both the SVG overlay and the post-capture crop math derive the
// exact same rectangle — the whole auto-crop trick depends on these agreeing.
function getGuideFrame(guideShape: GuideShape, screenW: number, screenH: number) {
  const centerY = screenH * 0.42;
  if (guideShape === 'card') {
    const width = screenW * 0.86;
    const height = width / 1.586; // ID-1 card ratio (PhilSys/UMID/driver's license)
    return { x: (screenW - width) / 2, y: centerY - height / 2, width, height };
  }
  // 'oval' — tall face guide.
  const width = screenW * 0.62;
  const height = width * 1.35;
  return { x: (screenW - width) / 2, y: centerY - height / 2, width, height };
}

export function GuidedCapture({ guideShape, instructionText, cameraFacing, onCapture, onCancel }: GuidedCaptureProps) {
  const { T } = useTheme();
  const { showToast } = useToast();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [busy, setBusy] = useState(false);
  const [reviewUri, setReviewUri] = useState<string | null>(null);
  // The native camera session isn't necessarily ready the instant this view
  // mounts — tapping the shutter before it fires onCameraReady can silently
  // fail. Gate the shutter on it instead of assuming readiness.
  const [cameraReady, setCameraReady] = useState(false);

  const frame = useMemo(() => getGuideFrame(guideShape, screenW, screenH), [guideShape, screenW, screenH]);

  const handleShutter = async () => {
    if (!cameraRef.current || busy || !cameraReady) return;
    setBusy(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      if (!photo?.uri || !photo.width || !photo.height) {
        throw new Error('No photo returned by camera');
      }

      // Map the on-screen guide rectangle to the captured photo's own pixel
      // space. The full-screen CameraView fills the device screen the same
      // way a "cover" background-image would: it's scaled up until it fully
      // covers the screen on both axes, then the overflow on the longer axis
      // is cropped off-center (equally both sides). To go from a screen-space
      // rectangle back to photo-space, invert that same cover transform.
      const displayScale = Math.max(screenW / photo.width, screenH / photo.height);
      const displayedW = photo.width * displayScale;
      const displayedH = photo.height * displayScale;
      const offsetX = (displayedW - screenW) / 2;
      const offsetY = (displayedH - screenH) / 2;

      const originX = Math.max(0, (frame.x + offsetX) / displayScale);
      const originY = Math.max(0, (frame.y + offsetY) / displayScale);
      const cropWidth = Math.min(photo.width - originX, frame.width / displayScale);
      const cropHeight = Math.min(photo.height - originY, frame.height / displayScale);

      const context = ImageManipulator.manipulate(photo.uri);
      context.crop({ originX, originY, width: cropWidth, height: cropHeight });
      const rendered = await context.renderAsync();
      const saved = await rendered.saveAsync({ compress: 0.9, format: SaveFormat.JPEG });

      setReviewUri(saved.uri);
    } catch (err) {
      console.warn('GuidedCapture: capture/crop failed', err);
      // A silent console.warn here previously left the citizen staring at an
      // unresponsive shutter with no explanation — surface it instead.
      showToast('Could not capture the photo. Please try again.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleRetake = () => {
    // The review branch unmounts <CameraView> entirely; returning here
    // remounts a fresh instance that hasn't fired onCameraReady yet — reset
    // so the shutter stays correctly gated instead of trusting stale state.
    setCameraReady(false);
    setReviewUri(null);
  };
  const handleUsePhoto = () => {
    if (reviewUri) onCapture(reviewUri);
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onCancel} statusBarTranslucent>
      <View style={styles.fill}>
        {reviewUri ? (
          <View style={[styles.fill, { backgroundColor: '#000' }]}>
            <Image source={{ uri: reviewUri }} style={styles.fill} resizeMode="contain" />
            <View style={styles.reviewFooter}>
              <TouchableOpacity
                style={[styles.reviewBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
                onPress={handleRetake}
                activeOpacity={0.8}
              >
                <CameraIcon size={20} color="#FFFFFF" variant="Bold" />
                <Text style={styles.reviewBtnText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reviewBtn, { backgroundColor: T.accent, flex: 1.4 }]}
                onPress={handleUsePhoto}
                activeOpacity={0.8}
              >
                <TickCircle size={20} color="#292929" variant="Bold" />
                <Text style={[styles.reviewBtnText, { color: '#292929' }]}>Use this photo</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : !permission ? (
          <View style={[styles.fill, styles.center, { backgroundColor: '#000' }]}>
            <ActivityIndicator color="#FFFFFF" />
          </View>
        ) : !permission.granted ? (
          <View style={[styles.fill, styles.center, { backgroundColor: '#000', padding: 24 }]}>
            <Text style={styles.permissionText}>We need camera access to capture this photo.</Text>
            {/* NOT styles.reviewBtn — that style has flex:1, meant for sharing
                a row with a sibling button in the review footer below. Reused
                here inside a plain centered column, flex:1 instead stretches
                it to fill all remaining vertical space, ballooning into a
                giant pill. Use a dedicated, non-flex style. */}
            <TouchableOpacity
              style={[styles.permissionBtn, { backgroundColor: T.accent, marginTop: 16 }]}
              onPress={requestPermission}
              activeOpacity={0.8}
            >
              <Text style={[styles.reviewBtnText, { color: '#292929' }]}>Grant camera access</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onCancel} style={{ marginTop: 16 }}>
              <Text style={{ color: '#FFFFFF', fontFamily: 'Inter-Medium' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.fill}>
            <CameraView
              ref={cameraRef}
              style={styles.fill}
              facing={cameraFacing}
              // Explicit, not left to the library default — a citizen's ID/
              // selfie must never end up mirrored (text/asymmetric features
              // reversed), so this is stated rather than assumed.
              mirror={false}
              onCameraReady={() => setCameraReady(true)}
            />

            {/* Dimmed mask with a true cutout (via SVG mask), sized/shaped from
                the exact same frame math used to crop the captured photo. */}
            <Svg width={screenW} height={screenH} style={StyleSheet.absoluteFillObject} pointerEvents="none">
              <Defs>
                <Mask id="guide-mask">
                  <Rect x={0} y={0} width={screenW} height={screenH} fill="white" />
                  {guideShape === 'card' ? (
                    <Rect x={frame.x} y={frame.y} width={frame.width} height={frame.height} rx={16} ry={16} fill="black" />
                  ) : (
                    <Ellipse
                      cx={frame.x + frame.width / 2}
                      cy={frame.y + frame.height / 2}
                      rx={frame.width / 2}
                      ry={frame.height / 2}
                      fill="black"
                    />
                  )}
                </Mask>
              </Defs>
              <Rect x={0} y={0} width={screenW} height={screenH} fill="rgba(0,0,0,0.55)" mask="url(#guide-mask)" />

              {/* Guide outline */}
              {guideShape === 'card' ? (
                <Rect
                  x={frame.x} y={frame.y} width={frame.width} height={frame.height}
                  rx={16} ry={16} fill="none" stroke="#FFFFFF" strokeWidth={2} strokeOpacity={0.9}
                />
              ) : (
                <Ellipse
                  cx={frame.x + frame.width / 2}
                  cy={frame.y + frame.height / 2}
                  rx={frame.width / 2}
                  ry={frame.height / 2}
                  fill="none" stroke="#FFFFFF" strokeWidth={2} strokeOpacity={0.9}
                />
              )}
            </Svg>

            {/* Corner brackets, card only — reinforces "align within the frame". */}
            {guideShape === 'card' && (
              <View pointerEvents="none" style={[StyleSheet.absoluteFillObject]}>
                {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => (
                  <CornerBracket key={corner} corner={corner} frame={frame} />
                ))}
              </View>
            )}

            <View style={styles.topBar}>
              <TouchableOpacity onPress={onCancel} style={styles.closeBtn} activeOpacity={0.8}>
                <CloseSquare size={26} color="#FFFFFF" variant="Bold" />
              </TouchableOpacity>
            </View>

            <View style={[styles.instructionWrap, { top: Math.max(24, frame.y - 64) }]} pointerEvents="none">
              <Text style={styles.instructionText}>{instructionText}</Text>
            </View>

            <View style={styles.bottomBar}>
              <TouchableOpacity
                style={[styles.shutter, (busy || !cameraReady) && { opacity: 0.6 }]}
                onPress={handleShutter}
                disabled={busy || !cameraReady}
                activeOpacity={0.8}
              >
                {busy ? <ActivityIndicator color="#292929" /> : <View style={styles.shutterInner} />}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

function CornerBracket({ corner, frame }: { corner: 'tl' | 'tr' | 'bl' | 'br'; frame: { x: number; y: number; width: number; height: number } }) {
  const size = 28;
  const thickness = 3;
  const isTop = corner === 'tl' || corner === 'tr';
  const isLeft = corner === 'tl' || corner === 'bl';
  return (
    <View
      style={{
        position: 'absolute',
        left: isLeft ? frame.x - 2 : frame.x + frame.width - size + 2,
        top: isTop ? frame.y - 2 : frame.y + frame.height - size + 2,
        width: size,
        height: size,
        borderColor: '#FFFFFF',
        borderTopWidth: isTop ? thickness : 0,
        borderBottomWidth: !isTop ? thickness : 0,
        borderLeftWidth: isLeft ? thickness : 0,
        borderRightWidth: !isLeft ? thickness : 0,
        borderTopLeftRadius: corner === 'tl' ? 12 : 0,
        borderTopRightRadius: corner === 'tr' ? 12 : 0,
        borderBottomLeftRadius: corner === 'bl' ? 12 : 0,
        borderBottomRightRadius: corner === 'br' ? 12 : 0,
      }}
    />
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  topBar: {
    position: 'absolute', top: 48, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20,
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center',
  },
  instructionWrap: { position: 'absolute', left: 24, right: 24, alignItems: 'center' },
  instructionText: {
    color: '#FFFFFF', fontFamily: 'Octarine-Bold', fontSize: 15, textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 },
  },
  bottomBar: {
    position: 'absolute', bottom: 48, left: 0, right: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  shutter: {
    width: 76, height: 76, borderRadius: 38, backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: 'rgba(255,255,255,0.4)',
  },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFFFFF' },
  reviewFooter: {
    position: 'absolute', bottom: 48, left: 24, right: 24,
    flexDirection: 'row', gap: 12,
  },
  reviewBtn: {
    flex: 1, height: 52, borderRadius: 999, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  reviewBtnText: { color: '#FFFFFF', fontFamily: 'Octarine-Bold', fontSize: 15 },
  permissionText: { color: '#FFFFFF', fontFamily: 'Inter-Medium', fontSize: 15, textAlign: 'center', lineHeight: 22 },
  permissionBtn: {
    height: 52, minWidth: 220, borderRadius: 999, paddingHorizontal: 24,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
});
