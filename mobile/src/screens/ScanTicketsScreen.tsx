import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { TicketResolveOk } from '../api/checkInTypes';
import { useAuth } from '../context/AuthContext';
import { extractTicketPayload } from '../lib/extractTicketPayload';
import type { MainStackParamList } from '../navigation/types';
import { colors, radius, space, type as typeScale } from '../theme/tokens';

type Props = NativeStackScreenProps<MainStackParamList, 'ScanTickets'>;

type Banner =
  | { kind: 'success'; caption: string; title: string }
  | { kind: 'error'; caption: string; title: string }
  | null;

const BARCODE_DEBOUNCE_MS = 1400;
const SUCCESS_AUTO_DISMISS_MS = 2800;
const VIEWFINDER_SIZE = 280;

/**
 * Full-screen scanner.
 * Stitch refs: `docs/stitch-ref/scanner-success.html`, `scanner-failure.html`.
 *
 * The camera fills the screen and all UI (top back button, result banner,
 * viewfinder decor, bottom controls, manual-entry drawer) is rendered as
 * overlay chrome on top of the live feed. Camera permission is requested
 * automatically on mount so the scanner opens directly into the viewfinder
 * without a second "Allow camera" tap.
 */
export function ScanTicketsScreen({ route, navigation }: Props) {
  const { activityId, activityName } = route.params;
  const { activitiesApi } = useAuth();
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const [permission, requestPermission] = useCameraPermissions();
  const [torchOn, setTorchOn] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manual, setManual] = useState('');
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<Banner>(null);
  const [resolved, setResolved] = useState<TicketResolveOk | null>(null);

  const lastBarcodeAt = useRef(0);
  const scanLine = useRef(new Animated.Value(0)).current;
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLine, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scanLine, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scanLine]);

  const scheduleSuccessDismiss = useCallback(() => {
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      setBanner(null);
      lastBarcodeAt.current = 0;
    }, SUCCESS_AUTO_DISMISS_MS);
  }, []);

  const clearAll = useCallback(() => {
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    setBanner(null);
    setResolved(null);
    lastBarcodeAt.current = 0;
  }, []);

  const runResolve = useCallback(
    async (rawPayload: string) => {
      const payload = extractTicketPayload(rawPayload);
      if (!payload) return;
      setBanner(null);
      setResolved(null);
      setBusy(true);
      try {
        const r = await activitiesApi.resolveTicket(activityId, payload);
        if (r.status === 'error') {
          const title =
            r.code === 'wrong_activity'
              ? 'Wrong event'
              : r.code === 'cancelled'
                ? 'Registration cancelled'
                : 'Ticket not recognized';
          setBanner({ kind: 'error', caption: 'Invalid ticket', title });
          return;
        }
        if (r.alreadyCheckedIn) {
          setBanner({
            kind: 'error',
            caption: 'Already scanned',
            title: r.displayName,
          });
          return;
        }
        setResolved(r);
      } catch {
        setBanner({
          kind: 'error',
          caption: 'Connection lost',
          title: 'Check your network and try again',
        });
      } finally {
        setBusy(false);
      }
    },
    [activitiesApi, activityId]
  );

  const onBarcodeScanned = useCallback(
    (e: { data: string }) => {
      if (busy || resolved || banner?.kind === 'success') return;
      const now = Date.now();
      if (now - lastBarcodeAt.current < BARCODE_DEBOUNCE_MS) return;
      lastBarcodeAt.current = now;
      void runResolve(e.data);
    },
    [banner?.kind, busy, resolved, runResolve]
  );

  const onManualLookup = useCallback(() => {
    const payload = manual.trim();
    if (!payload) return;
    setManualOpen(false);
    setManual('');
    void runResolve(payload);
  }, [manual, runResolve]);

  const onConfirmCheckIn = useCallback(async () => {
    if (!resolved) return;
    setBusy(true);
    try {
      const r = await activitiesApi.checkInTicket(activityId, resolved.ticketPublicId);
      if (!mountedRef.current) return;
      if (r.status === 'already_checked_in') {
        setBanner({ kind: 'error', caption: 'Already scanned', title: resolved.displayName });
        setResolved(null);
        return;
      }
      if (r.status === 'error') {
        setBanner({ kind: 'error', caption: 'Check-in failed', title: 'Please try again' });
        setResolved(null);
        return;
      }
      setBanner({ kind: 'success', caption: 'Check-in successful', title: resolved.displayName });
      setResolved(null);
      scheduleSuccessDismiss();
    } catch {
      if (!mountedRef.current) return;
      setBanner({ kind: 'error', caption: 'Connection lost', title: 'Try again when back online' });
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  }, [activitiesApi, activityId, resolved, scheduleSuccessDismiss]);

  const granted = permission?.granted === true;
  const cameraReady = permission?.granted === true;
  const canAskAgain = permission?.canAskAgain !== false;

  const vfTop = useMemo(
    () => Math.max(insets.top + 112, (window.height - VIEWFINDER_SIZE) / 2 - 40),
    [insets.top, window.height]
  );
  const vfLeft = useMemo(() => (window.width - VIEWFINDER_SIZE) / 2, [window.width]);

  const scanLineTranslate = scanLine.interpolate({
    inputRange: [0, 1],
    outputRange: [0, VIEWFINDER_SIZE - 3],
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {cameraReady ? (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          enableTorch={torchOn}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={onBarcodeScanned}
        />
      ) : null}

      {granted ? (
        <>
          <View style={[styles.dim, { top: 0, left: 0, right: 0, height: vfTop }]} />
          <View style={[styles.dim, { top: vfTop + VIEWFINDER_SIZE, left: 0, right: 0, bottom: 0 }]} />
          <View style={[styles.dim, { top: vfTop, left: 0, width: vfLeft, height: VIEWFINDER_SIZE }]} />
          <View style={[styles.dim, { top: vfTop, right: 0, width: vfLeft, height: VIEWFINDER_SIZE }]} />

          <View
            pointerEvents="none"
            style={[styles.viewfinder, { top: vfTop, left: vfLeft }]}
          >
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            <Animated.View
              style={[styles.scanLine, { transform: [{ translateY: scanLineTranslate }] }]}
            />
          </View>
        </>
      ) : (
        <View style={styles.permFallback}>
          <View style={styles.permIconWrap}>
            <Ionicons name="camera-outline" size={44} color="#fff" />
          </View>
          <Text style={styles.permTitle}>Camera access needed</Text>
          <Text style={styles.permBody}>
            {canAskAgain
              ? 'Allow camera access to scan tickets at the door.'
              : 'Camera permission is blocked. Enable it in iOS Settings to scan tickets.'}
          </Text>
          {canAskAgain ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => void requestPermission()}
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.primaryBtnText}>Allow camera</Text>
            </Pressable>
          ) : null}
        </View>
      )}

      <View
        pointerEvents="box-none"
        style={[styles.overlay, { paddingTop: insets.top + space.sm }]}
      >
        <View style={styles.topRow} pointerEvents="box-none">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={12}
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.glassRound, pressed && { opacity: 0.75 }]}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <View style={styles.topTitleWrap} pointerEvents="none">
            <Text style={styles.topEyebrow}>SCANNING</Text>
            <Text style={styles.topTitle} numberOfLines={1}>
              {activityName}
            </Text>
          </View>
          <View style={styles.glassRoundGhost} pointerEvents="none" />
        </View>

        {banner ? (
          <View style={styles.bannerWrap} pointerEvents="box-none">
            <View
              style={[
                styles.banner,
                banner.kind === 'success' ? styles.bannerSuccess : styles.bannerError,
              ]}
            >
              <View style={styles.bannerIconBubble}>
                <Ionicons
                  name={banner.kind === 'success' ? 'checkmark' : 'close'}
                  size={20}
                  color="#fff"
                />
              </View>
              <View style={styles.bannerText}>
                <Text style={styles.bannerCaption}>{banner.caption.toUpperCase()}</Text>
                <Text style={styles.bannerTitle} numberOfLines={2}>
                  {banner.title}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Dismiss"
                hitSlop={12}
                onPress={clearAll}
                style={({ pressed }) => [styles.bannerClose, pressed && { opacity: 0.7 }]}
              >
                <Ionicons name="close" size={20} color="rgba(255,255,255,0.9)" />
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={{ flex: 1 }} />

        {granted && !banner && !resolved ? (
          <View style={styles.instructionWrap} pointerEvents="none">
            <Text style={styles.instruction}>Align QR code within the frame</Text>
            {busy ? (
              <ActivityIndicator color="#fff" style={{ marginTop: 10 }} />
            ) : (
              <Text style={styles.instructionSub}>Scanning automatically…</Text>
            )}
          </View>
        ) : null}

        {resolved ? (
          <View style={styles.confirmWrap} pointerEvents="box-none">
            <View style={styles.confirmCard}>
              <Text style={styles.confirmEyebrow}>TICKET RESOLVED</Text>
              <Text style={styles.confirmName} numberOfLines={2}>
                {resolved.displayName}
              </Text>
              <Text style={styles.confirmSub}>Confirm to check this guest in.</Text>
              <View style={styles.confirmRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={clearAll}
                  disabled={busy}
                  style={({ pressed }) => [
                    styles.ghostBtn,
                    (busy || pressed) && { opacity: 0.7 },
                  ]}
                >
                  <Text style={styles.ghostBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void onConfirmCheckIn()}
                  disabled={busy}
                  style={({ pressed }) => [
                    styles.confirmCta,
                    (busy || pressed) && { opacity: 0.85 },
                  ]}
                >
                  {busy ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.confirmCtaText}>Confirm check-in</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}

        <View
          style={[styles.bottomControls, { paddingBottom: insets.bottom + space.lg }]}
          pointerEvents="box-none"
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={torchOn ? 'Turn flashlight off' : 'Turn flashlight on'}
            onPress={() => setTorchOn((v) => !v)}
            style={({ pressed }) => [
              styles.glassRound,
              torchOn && styles.glassRoundActive,
              pressed && { opacity: 0.8 },
            ]}
          >
            <Ionicons
              name={torchOn ? 'flashlight' : 'flashlight-outline'}
              size={22}
              color={torchOn ? colors.primary : '#fff'}
            />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Manual ticket entry"
            onPress={() => setManualOpen(true)}
            style={({ pressed }) => [styles.manualBtn, pressed && { opacity: 0.85 }]}
          >
            <Ionicons name="keypad-outline" size={18} color={colors.primary} />
            <Text style={styles.manualBtnText}>Manual entry</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close scanner"
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.glassRound, pressed && { opacity: 0.8 }]}
          >
            <Ionicons name="close" size={22} color="#fff" />
          </Pressable>
        </View>
      </View>

      <Modal
        visible={manualOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setManualOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setManualOpen(false)}>
          <Pressable
            style={[styles.manualSheet, { paddingBottom: insets.bottom + space.lg }]}
            onPress={() => undefined}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Enter ticket ID</Text>
            <Text style={styles.sheetHint}>
              Format: <Text style={styles.sheetHintMono}>mct-{'<event>'}-{'<id>'}</Text>
            </Text>
            <TextInput
              accessibilityLabel="Ticket ID"
              style={styles.sheetInput}
              placeholder="mct-102-10000"
              placeholderTextColor={colors.onSurfaceVariant}
              autoCapitalize="none"
              autoCorrect={false}
              value={manual}
              onChangeText={setManual}
              autoFocus
              returnKeyType="go"
              onSubmitEditing={onManualLookup}
            />
            <Pressable
              accessibilityRole="button"
              onPress={onManualLookup}
              disabled={!manual.trim()}
              style={({ pressed }) => [
                styles.primaryBtn,
                (!manual.trim() || pressed) && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.primaryBtnText}>Look up ticket</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const BANNER_SUCCESS = 'rgba(0, 122, 94, 0.92)';
const BANNER_ERROR = 'rgba(186, 26, 26, 0.92)';
const GLASS_BG = 'rgba(0, 0, 0, 0.45)';
const GLASS_BORDER = 'rgba(255, 255, 255, 0.12)';
const DIM_BG = 'rgba(0, 0, 0, 0.45)';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  dim: { position: 'absolute', backgroundColor: DIM_BG },

  viewfinder: {
    position: 'absolute',
    width: VIEWFINDER_SIZE,
    height: VIEWFINDER_SIZE,
  },
  corner: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderColor: '#95F5D2',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 24,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 24,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 24,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 24,
  },
  scanLine: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#95F5D2',
    shadowColor: '#95F5D2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'column',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    gap: space.md,
  },
  topTitleWrap: { flex: 1, alignItems: 'center' },
  topEyebrow: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: typeScale.labelXxs,
    fontWeight: '800',
    letterSpacing: 2,
  },
  topTitle: {
    color: '#fff',
    fontSize: typeScale.bodyLg,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginTop: 2,
  },

  bannerWrap: {
    paddingHorizontal: space.lg,
    marginTop: space.md,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: space.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  bannerSuccess: { backgroundColor: BANNER_SUCCESS },
  bannerError: { backgroundColor: BANNER_ERROR },
  bannerIconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: { flex: 1 },
  bannerCaption: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: typeScale.labelXxs,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: typeScale.bodyLg,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginTop: 2,
  },
  bannerClose: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  instructionWrap: {
    alignItems: 'center',
    paddingHorizontal: space.lg,
    marginBottom: space.lg,
  },
  instruction: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: typeScale.bodyLg,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowRadius: 4,
  },
  instructionSub: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.6)',
    fontSize: typeScale.bodyMd,
    textAlign: 'center',
  },

  confirmWrap: {
    paddingHorizontal: space.lg,
    marginBottom: space.md,
  },
  confirmCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 24,
    padding: space.lg,
    gap: 4,
  },
  confirmEyebrow: {
    color: colors.primary,
    fontSize: typeScale.labelXxs,
    fontWeight: '800',
    letterSpacing: 2,
  },
  confirmName: {
    marginTop: 6,
    color: colors.onSurface,
    fontSize: typeScale.titleMd,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  confirmSub: {
    marginTop: 4,
    color: colors.slate500,
    fontSize: typeScale.bodyMd,
  },
  confirmRow: {
    marginTop: space.md,
    flexDirection: 'row',
    gap: space.sm,
  },
  ghostBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerLow,
  },
  ghostBtnText: {
    color: colors.onSurface,
    fontSize: typeScale.bodyMd,
    fontWeight: '700',
  },
  confirmCta: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  confirmCtaText: {
    color: colors.onPrimary,
    fontSize: typeScale.bodyMd,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    gap: space.md,
  },
  glassRound: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GLASS_BG,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
  },
  glassRoundActive: {
    backgroundColor: '#fff',
    borderColor: 'transparent',
  },
  glassRoundGhost: { width: 52, height: 52 },
  manualBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fff',
    paddingHorizontal: space.md,
  },
  manualBtnText: {
    color: colors.primary,
    fontSize: typeScale.bodyMd,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  permFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
    gap: space.md,
    backgroundColor: '#000',
  },
  permIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    marginBottom: space.sm,
  },
  permTitle: {
    color: '#fff',
    fontSize: typeScale.titleSm,
    fontWeight: '800',
    textAlign: 'center',
  },
  permBody: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: typeScale.bodyMd,
    textAlign: 'center',
    lineHeight: 22,
  },
  primaryBtn: {
    marginTop: space.md,
    paddingVertical: 14,
    paddingHorizontal: space.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: colors.onPrimary,
    fontSize: typeScale.bodyMd,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  manualSheet: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    gap: space.sm,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.slate200,
    marginBottom: space.sm,
  },
  sheetTitle: {
    color: colors.onSurface,
    fontSize: typeScale.titleSm,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sheetHint: {
    color: colors.slate500,
    fontSize: typeScale.bodyMd,
  },
  sheetHintMono: {
    color: colors.onSurface,
    fontWeight: '700',
  },
  sheetInput: {
    marginTop: space.sm,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.lg,
    paddingHorizontal: space.md,
    paddingVertical: 14,
    fontSize: typeScale.bodyLg,
    color: colors.onSurface,
  },
});
