import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, space, type } from '../theme/tokens';
import { StitchHeader } from '../ui/StitchHeader';

type Props = NativeStackScreenProps<RootStackParamList, 'Terms'>;

/**
 * Template Terms of Service for the McCheck mobile app.
 *
 * ⚠️  This text is a starting template. Before public release, replace with a
 *     version reviewed by qualified legal counsel. The structure (numbered
 *     sections, definitions, contact, changes clause) is intentionally
 *     conservative — swap the copy, keep the skeleton.
 */
export function TermsOfServiceScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <StitchHeader
        title="Terms of Service"
        onBackPress={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.draftBanner}>
          <Text style={styles.draftBannerText}>
            Draft — pending legal review before public release.
          </Text>
        </View>

        <Text style={styles.effective}>Effective date: 19 April 2026</Text>

        <Section title="1. Acceptance">
          By downloading, installing, or using the McCheck mobile app
          (&quot;McCheck&quot; or the &quot;App&quot;) you agree to these Terms of Service
          (&quot;Terms&quot;). If you do not agree, do not use the App.
        </Section>

        <Section title="2. Who can use McCheck">
          McCheck is a tool for event organizers and their authorized staff
          to manage registrations and perform door check-ins for events
          hosted on MoveConcept. You may use the App only if you are at
          least 16 years old and have been granted an organizer or staff
          role on a MoveConcept event by its owner.
        </Section>

        <Section title="3. Your account">
          <Bullet>
            You authenticate with your MoveConcept credentials or a linked
            Google account. Keep your credentials secure and do not share
            your device session.
          </Bullet>
          <Bullet>
            You are responsible for activity performed under your account,
            including check-ins made from your device. Sign out when you
            finish using a shared device.
          </Bullet>
          <Bullet>
            If you believe your account has been compromised, sign out and
            contact support immediately.
          </Bullet>
        </Section>

        <Section title="4. Acceptable use">
          You agree not to:
          <View style={{ height: 4 }} />
          <Bullet>
            Use McCheck to check in attendees for events where you are not
            an authorized organizer or staff member.
          </Bullet>
          <Bullet>
            Attempt to access, read, or modify data belonging to events you
            do not manage.
          </Bullet>
          <Bullet>
            Reverse engineer, decompile, or attempt to extract the source
            code of the App, except to the extent permitted by applicable
            law.
          </Bullet>
          <Bullet>
            Use the App to harass attendees, to discriminate, or to violate
            any applicable law.
          </Bullet>
          <Bullet>
            Interfere with the integrity, performance, or security of the
            App or MoveConcept's backend.
          </Bullet>
        </Section>

        <Section title="5. License">
          Subject to these Terms, MoveConcept grants you a personal,
          revocable, non-exclusive, non-transferable license to install and
          use the App on devices you own or control, for your use as an
          organizer or staff member of events hosted on MoveConcept.
        </Section>

        <Section title="6. Intellectual property">
          The App, including its design, code, and trademarks, belongs to
          MoveConcept or its licensors. Event and attendee data belongs to
          the organizers who created it and the attendees who registered —
          you receive only the access necessary to perform your role.
        </Section>

        <Section title="7. Changes to the App">
          We may update the App to add, modify, or remove features. We may
          also discontinue the App with reasonable notice. We are not
          liable for any inability to use the App caused by a device or
          operating-system version we no longer support.
        </Section>

        <Section title="8. Disclaimer">
          The App is provided &quot;as is&quot; and &quot;as available&quot; without
          warranties of any kind, express or implied, to the fullest extent
          permitted by law. We do not guarantee that the App will always be
          available, error-free, or suitable for any particular event
          workflow.
        </Section>

        <Section title="9. Limitation of liability">
          To the fullest extent permitted by law, MoveConcept and its
          affiliates are not liable for any indirect, incidental,
          consequential, or punitive damages arising from your use of the
          App, including lost revenue from missed check-ins or attendance
          disputes. Nothing in these Terms limits liability that cannot
          lawfully be excluded.
        </Section>

        <Section title="10. Termination">
          We may suspend or terminate your access to the App at any time if
          you breach these Terms or if your MoveConcept organizer/staff
          role ends. You may stop using the App at any time by signing out
          and uninstalling it.
        </Section>

        <Section title="11. Governing law">
          These Terms are governed by the laws of the jurisdiction in which
          MoveConcept is established, without regard to conflict-of-laws
          rules. Mandatory consumer-protection laws of your country of
          residence still apply.
        </Section>

        <Section title="12. Changes to these Terms">
          We may update these Terms. Material changes will be highlighted
          in the App and take effect on the date shown at the top.
          Continued use after the effective date means you accept the
          updated Terms.
        </Section>

        <Section title="13. Contact">
          Questions about these Terms? Contact MoveConcept at
          support@moveconcept.com.
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
