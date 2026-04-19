import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, space, type } from '../theme/tokens';
import { StitchHeader } from '../ui/StitchHeader';

type Props = NativeStackScreenProps<RootStackParamList, 'PrivacyPolicy'>;

/**
 * Template Privacy Policy for the McCheck mobile app.
 *
 * ⚠️  This text is a starting template. Before public release, replace with a
 *     version reviewed by qualified legal counsel for the jurisdictions where
 *     MoveConcept operates (EU/GDPR at minimum). Keep the structure — just
 *     swap the copy.
 */
export function PrivacyPolicyScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <StitchHeader
        title="Privacy Policy"
        onBackPress={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.draftBanner}>
          <Text style={styles.draftBannerText}>
            Draft — pending legal review before public release.
          </Text>
        </View>

        <Text style={styles.effective}>Effective date: 19 April 2026</Text>

        <Section title="1. Who we are">
          McCheck is a mobile application operated by MoveConcept that lets
          authorized event organizers and their staff manage registrations
          and perform door check-ins for their own events. This Privacy
          Policy explains what personal data we process when you use McCheck,
          why we process it, and the rights you have over that data.
        </Section>

        <Section title="2. Data we collect">
          <Bullet>
            <Text style={styles.bold}>Account identifiers</Text> — your email
            address, display name, and profile photo URL, as provided by
            MoveConcept or Google Sign-In when you authenticate.
          </Bullet>
          <Bullet>
            <Text style={styles.bold}>Event and attendee data</Text> — the
            events you own or are invited to manage, the attendees registered
            to those events, and their check-in status. McCheck fetches this
            data from MoveConcept's API each time you open a relevant screen;
            we do not store it persistently on the device beyond short-lived
            caching.
          </Bullet>
          <Bullet>
            <Text style={styles.bold}>Authentication tokens</Text> — an
            access token issued by MoveConcept. It is stored in the device's
            secure keystore (iOS Keychain / Android Keystore) and removed on
            sign-out.
          </Bullet>
          <Bullet>
            <Text style={styles.bold}>Diagnostic information</Text> — when
            enabled, aggregated crash reports and non-identifying device
            metadata (OS version, device model, app version). You can opt
            out of diagnostics in the Profile screen.
          </Bullet>
        </Section>

        <Section title="3. How we use your data">
          <Bullet>To authenticate you and keep you signed in.</Bullet>
          <Bullet>
            To let you view and manage the events and attendees that belong
            to your organizer account.
          </Bullet>
          <Bullet>
            To record attendee check-ins and keep the event dashboard up to
            date for you and your co-organizers.
          </Bullet>
          <Bullet>
            To detect and fix crashes, and to improve app reliability
            (aggregated and non-identifying).
          </Bullet>
        </Section>

        <Section title="4. Legal basis">
          We process your data under the following bases: (a) performance of
          a contract with you or with the organization you represent, (b) our
          legitimate interest in providing a functional and secure product,
          and (c) your explicit consent for optional features such as
          diagnostics.
        </Section>

        <Section title="5. Who we share data with">
          <Bullet>
            <Text style={styles.bold}>MoveConcept</Text> — the backend that
            owns the event and attendee records; all reads and writes go
            through its API.
          </Bullet>
          <Bullet>
            <Text style={styles.bold}>Google</Text> — only if you choose
            Google Sign-In. Google receives the sign-in request and returns a
            token; we do not share your event or attendee data with Google.
          </Bullet>
          <Bullet>
            <Text style={styles.bold}>Diagnostics providers</Text> — when
            enabled, crash reports are sent to our diagnostics provider
            (currently Sentry). Reports are scrubbed of personal identifiers
            before transmission.
          </Bullet>
          <Bullet>
            <Text style={styles.bold}>Apple / Google app stores</Text> — for
            distributing and updating the app. They may collect standard
            installation telemetry under their own policies.
          </Bullet>
        </Section>

        <Section title="6. How long we keep data">
          Your authentication token is stored on device until you sign out or
          it expires. Event and attendee data are not retained locally once
          you leave the relevant screen. Server-side retention is governed
          by MoveConcept's data policy.
        </Section>

        <Section title="7. Your rights">
          Subject to the laws that apply to you, you have the right to
          access, correct, export, or delete the personal data we process,
          to object to or restrict processing, and to withdraw consent where
          consent is the basis. To exercise any of these rights, contact us
          at the address in Section 10.
        </Section>

        <Section title="8. Security">
          We protect your data with industry-standard measures: TLS for
          network traffic, device-secure-storage for tokens, and
          access-control on the backend. No method is perfectly secure — if
          you believe your account has been compromised, sign out and
          contact support immediately.
        </Section>

        <Section title="9. Children">
          McCheck is intended for event-organizer staff aged 16 and over. We
          do not knowingly collect data from children below that age.
        </Section>

        <Section title="10. Contact">
          For privacy questions or to exercise your rights, contact
          MoveConcept at privacy@moveconcept.com.
        </Section>

        <Section title="11. Changes">
          We may update this Policy. Material changes will be highlighted in
          the app and take effect on the date shown at the top.
        </Section>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </Text>
      {typeof children === 'string' ? (
        <Text style={styles.body}>{children}</Text>
      ) : (
        <View style={styles.sectionBody}>
          {React.Children.map(children, (child) =>
            typeof child === 'string' ? <Text style={styles.body}>{child}</Text> : child
          )}
        </View>
      )}
    </View>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bullet}>
      <View style={styles.bulletDot} />
      <Text style={[styles.body, styles.bulletText]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scroll: {
    paddingHorizontal: space.lg,
    paddingVertical: space.lg,
    paddingBottom: space.xxl,
  },
  draftBanner: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.outlineSoft,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    marginBottom: space.md,
  },
  draftBannerText: {
    color: colors.slate500,
    fontSize: type.labelSm,
    fontWeight: '600',
  },
  effective: {
    color: colors.slate400,
    fontSize: type.labelSm,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: space.md,
  },
  section: { marginBottom: space.lg },
  sectionTitle: {
    color: colors.onSurface,
    fontSize: type.titleSm,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: space.xs,
  },
  sectionBody: { gap: space.xs },
  body: {
    color: colors.slate700,
    fontSize: type.bodyMd,
    lineHeight: 22,
  },
  bold: { fontWeight: '700', color: colors.onSurface },
  bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 9,
    flexShrink: 0,
  },
  bulletText: { flex: 1 },
});
