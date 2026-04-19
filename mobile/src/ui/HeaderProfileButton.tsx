import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/tokens';

type Props = {
  onPress: () => void;
};

const SIZE = 32;

/**
 * Header right-slot pressable that opens the Settings/Profile modal.
 *
 * Renders the signed-in user's avatar when available, falling back to a
 * neutral `person-circle` glyph. Mirrors the avatar logic in
 * `screens/SettingsScreen.tsx` so the header doubles as a "who am I logged
 * in as" affordance — useful when staff swap devices at a venue.
 */
export function HeaderProfileButton({ onPress }: Props) {
  const { user } = useAuth();
  const avatarUrl = user?.profilePhotoUrl?.trim() || null;
  const accessibilityLabel = user?.fullName?.trim()
    ? `Open profile for ${user.fullName.trim()}`
    : 'Open profile';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={10}
      onPress={onPress}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
    >
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} accessibilityIgnoresInvertColors />
      ) : (
        <View style={[styles.avatar, styles.fallback]}>
          <Ionicons name="person" size={18} color={colors.primary} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.75 },
  avatar: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: colors.secondaryContainer,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
