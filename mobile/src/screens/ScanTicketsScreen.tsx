import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { TicketResolveOk } from '../api/checkInTypes';
import { useAuth } from '../context/AuthContext';
import { extractTicketPayload } from '../lib/extractTicketPayload';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, space, type } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'ScanTickets'>;

const BARCODE_DEBOUNCE_MS = 1400;

export function ScanTicketsScreen({ route, navigation }: Props) {
  const { activityId, activityName } = route.params;
  const { activitiesApi } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [torchOn, setTorchOn] = useState(false);
  const [manual, setManual] = useState('');
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [resolved, setResolved] = useState<TicketResolveOk | null>(null);
  const lastBarcodeAt = useRef(0);

  useEffect(() => {
    navigation.setOptions({ title: activityName });
  }, [activityName, navigation]);

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
          if (r.code === 'wrong_activity') {
            setBanner('This ticket is for a different event.');
          } else if (r.code === 'cancelled') {
            setBanner('This registration is cancelled.');
          } else {
            setBanner('Unknown ticket. Check the code or try manual entry.');
          }
          return;
        }
        setResolved(r);
        if (r.alreadyCheckedIn) {
          setBanner(`${r.displayName} is already checked in.`);
        } else {
          setBanner(null);
        }
      } catch {
        setBanner("Can't reach the server. Check your connection (check-in requires internet).");
      } finally {
        setBusy(false);
      }
    },
    [activitiesApi, activityId]
  );

  const onBarcodeScanned = useCallback(
    (e: { data: string }) => {
      const now = Date.now();
      if (now - lastBarcodeAt.current < BARCODE_DEBOUNCE_MS) return;
      lastBarcodeAt.current = now;
      void runResolve(e.data);
    },
    [runResolve]
  );

  const onManualLookup = useCallback(() => {
    void runResolve(manual);
  }, [manual, runResolve]);

  const onConfirmCheckIn = useCallback(async () => {
    if (!resolved) return;
    setBusy(true);
    setBanner(null);
    try {
      const r = await activitiesApi.checkInTicket(activityId, resolved.ticketPublicId);
      if (r.status === 'already_checked_in') {
        setBanner(`${resolved.displayName} is already checked in.`);
        return;
      }
      if (r.status === 'error') {
        setBanner('Could not complete check-in. Try again.');
        return;
      }
      setBanner(`${resolved.displayName} checked in.`);
      setResolved(null);
    } catch {
      setBanner("Can't reach the server. Check your connection.");
    } finally {
      setBusy(false);
    }
  }, [activitiesApi, activityId, resolved]);

  const granted = permission?.granted === true;

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>
        Point the camera at a McCheck mock QR, or enter the ticket id (format{' '}
        <Text style={styles.codeInline}>mct-{'{activity}'}-{'{id}'}</Text>) when using mock API.
      </Text>

      {!granted ? (
        <View style={styles.permBox}>
          <Text style={styles.permText}>Camera access is needed to scan QR codes at the door.</Text>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
            onPress={() => void requestPermission()}
          >
            <Text style={styles.primaryBtnText}>Allow camera</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.cameraWrap}>
          <CameraView
            style={styles.camera}
            facing="back"
            enableTorch={torchOn}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={onBarcodeScanned}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={torchOn ? 'Turn torch off' : 'Turn torch on'}
            style={({ pressed }) => [styles.torchBtn, pressed && { opacity: 0.9 }]}
            onPress={() => setTorchOn((v) => !v)}
          >
            <Text style={styles.torchBtnText}>{torchOn ? 'Torch on' : 'Torch'}</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.manualRow}>
        <TextInput
          accessibilityLabel="Ticket id"
          style={styles.input}
          placeholder="Ticket id (e.g. mct-102-10000)"
          placeholderTextColor={colors.onSurfaceVariant}
          autoCapitalize="none"
          autoCorrect={false}
          value={manual}
          onChangeText={setManual}
        />
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.lookupBtn, pressed && { opacity: 0.9 }]}
          onPress={onManualLookup}
          disabled={busy || !manual.trim()}
        >
          <Text style={styles.lookupBtnText}>Lookup</Text>
        </Pressable>
      </View>

      {busy ? (
        <ActivityIndicator style={styles.spinner} color={colors.primaryContainer} />
      ) : null}

      {banner ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{banner}</Text>
        </View>
      ) : null}

      {resolved && !resolved.alreadyCheckedIn ? (
        <View style={styles.confirmBox}>
          <Text style={styles.confirmName}>{resolved.displayName}</Text>
          <Text style={styles.confirmSub}>Ready to check in?</Text>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
            onPress={() => void onConfirmCheckIn()}
            disabled={busy}
          >
            <Text style={styles.primaryBtnText}>Confirm check-in</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, paddingHorizontal: space.lg },
  hint: {
    marginTop: space.sm,
    color: colors.onSurfaceVariant,
    fontSize: type.bodyMd,
    lineHeight: 22,
  },
  codeInline: { fontSize: type.labelSm, fontWeight: '600', color: colors.onSurface },
  permBox: { marginTop: space.lg, padding: space.md, borderRadius: radius.md, backgroundColor: colors.surfaceContainerLow },
  permText: { color: colors.onSurface, marginBottom: space.md },
  cameraWrap: {
    marginTop: space.md,
    borderRadius: radius.md,
    overflow: 'hidden',
    height: 260,
    backgroundColor: colors.surfaceContainerLow,
  },
  camera: { flex: 1 },
  torchBtn: {
    position: 'absolute',
    right: space.sm,
    bottom: space.sm,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.md,
  },
  torchBtnText: { color: colors.onSurface, fontWeight: '600', fontSize: type.labelSm },
  manualRow: { flexDirection: 'row', gap: space.sm, marginTop: space.md, alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: 12,
    fontSize: type.bodyMd,
    color: colors.onSurface,
  },
  lookupBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: 12,
  },
  lookupBtnText: { color: colors.onPrimary, fontWeight: '700', fontSize: type.bodyMd },
  spinner: { marginTop: space.md },
  banner: {
    marginTop: space.md,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLow,
  },
  bannerText: { color: colors.onSurface, fontSize: type.bodyMd },
  confirmBox: {
    marginTop: space.lg,
    padding: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineSoft,
    gap: space.sm,
  },
  confirmName: { fontSize: type.titleMd, fontWeight: '700', color: colors.onSurface },
  confirmSub: { color: colors.onSurfaceVariant, fontSize: type.bodyMd },
  primaryBtn: {
    marginTop: space.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: space.sm,
    alignItems: 'center',
  },
  primaryBtnText: { color: colors.onPrimary, fontWeight: '700', fontSize: type.bodyMd },
});
