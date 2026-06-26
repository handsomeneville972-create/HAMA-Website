/**
 * HAMA™ Legal Pages
 *
 * Displays Terms of Service, Privacy Policy, Cookie Policy, and
 * Acceptable Use Policy in a scrollable screen.
 *
 * In production, these would be loaded from a CMS or markdown files.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SPACING, FONTS } from '../constants/theme';

type LegalPage = 'terms' | 'privacy' | 'cookies' | 'acceptable-use';

interface LegalScreenProps {
  navigation?: any;
  initialPage?: LegalPage;
}

const LEGAL_TABS: { key: LegalPage; label: string }[] = [
  { key: 'terms', label: 'Terms of Service' },
  { key: 'privacy', label: 'Privacy Policy' },
  { key: 'cookies', label: 'Cookie Policy' },
  { key: 'acceptable-use', label: 'Acceptable Use' },
];

const LEGAL_CONTENT: Record<LegalPage, { title: string; sections: { heading: string; body: string }[] }> = {
  terms: {
    title: 'Terms of Service',
    sections: [
      {
        heading: '1. Acceptance of Terms',
        body: 'By accessing or using HAMA™ ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Platform. These terms apply to all visitors, users, and others who access or use the Platform.',
      },
      {
        heading: '2. Early Access Program',
        body: 'HAMA™ is currently operating in an Early Access phase. During this period, premium features are provided complimentary to Founding Members. This access is limited in time and may be modified or terminated at our discretion. We reserve the right to transition to a paid subscription model at any time with reasonable notice to users.',
      },
      {
        heading: '3. User Accounts',
        body: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account. You must provide accurate and complete information when creating an account.',
      },
      {
        heading: '4. User Conduct',
        body: 'You agree not to use the Platform for any unlawful purpose or in violation of these terms. Prohibited activities include: impersonating others, posting false or misleading information, engaging in harassment or abuse, attempting to breach platform security, and using automated tools to scrape or manipulate data.',
      },
      {
        heading: '5. Intellectual Property',
        body: 'The Platform and its original content, features, and functionality are owned by HAMA™ and are protected by international copyright, trademark, and other intellectual property laws. You may not modify, reproduce, distribute, or create derivative works without our explicit written consent.',
      },
      {
        heading: '6. Limitation of Liability',
        body: 'HAMA™ shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform. The Platform is provided "as is" without warranty of any kind, either express or implied.',
      },
      {
        heading: '7. Changes to Terms',
        body: 'We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting to the Platform. Your continued use of the Platform after changes constitutes acceptance of the new terms.',
      },
      {
        heading: '8. Contact',
        body: 'For questions about these terms, please contact us through the Platform support channels or email support@hama.app.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    sections: [
      {
        heading: '1. Information We Collect',
        body: 'We collect information you provide directly: name, email address, phone number, profile information, and any content you post on the Platform. We also automatically collect usage data, device information, and analytics to improve our services.',
      },
      {
        heading: '2. How We Use Your Information',
        body: 'We use your information to: provide and maintain the Platform, personalize your experience, communicate with you about updates and features, analyze usage patterns to improve our services, and comply with legal obligations.',
      },
      {
        heading: '3. Data Sharing',
        body: 'We do not sell your personal information. We may share data with service providers who assist in operating the Platform, when required by law, or with your explicit consent. All third-party providers are bound by confidentiality agreements.',
      },
      {
        heading: '4. Data Security',
        body: 'We implement industry-standard security measures to protect your data, including encryption in transit and at rest, regular security audits, and access controls. However, no method of electronic storage is 100% secure.',
      },
      {
        heading: '5. Your Rights',
        body: 'You have the right to access, correct, or delete your personal data. You can manage your data through your account settings or by contacting us. You may also request a copy of your data or withdraw consent for processing.',
      },
      {
        heading: '6. Data Retention',
        body: 'We retain your data for as long as your account is active or as needed to provide services. You can request deletion of your account and associated data at any time. Certain data may be retained for legal compliance.',
      },
      {
        heading: '7. Third-Party Services',
        body: 'The Platform may integrate with third-party services (e.g., payment processors, analytics providers). These services have their own privacy policies, and we encourage you to review them.',
      },
    ],
  },
  cookies: {
    title: 'Cookie Policy',
    sections: [
      {
        heading: '1. What Are Cookies',
        body: 'Cookies are small text files stored on your device when you visit a website or application. They help us remember your preferences, understand how you use the Platform, and improve your experience.',
      },
      {
        heading: '2. Types of Cookies We Use',
        body: 'Essential cookies: required for the Platform to function (e.g., authentication, session management). Analytics cookies: help us understand how users interact with the Platform. Preference cookies: remember your settings and preferences.',
      },
      {
        heading: '3. Managing Cookies',
        body: 'You can control cookies through your browser or device settings. However, disabling certain cookies may affect Platform functionality. Most browsers provide options to block or delete cookies.',
      },
      {
        heading: '4. Third-Party Cookies',
        body: 'We may use third-party analytics services (e.g., Amplitude, PostHog) that set their own cookies. These services help us understand usage patterns and improve the Platform. We do not control these third-party cookies.',
      },
      {
        heading: '5. Updates to This Policy',
        body: 'We may update this Cookie Policy from time to time. Changes will be posted on this page with an updated date. Continued use of the Platform constitutes acceptance of any changes.',
      },
    ],
  },
  'acceptable-use': {
    title: 'Acceptable Use Policy',
    sections: [
      {
        heading: '1. Purpose',
        body: 'This Acceptable Use Policy outlines the rules and guidelines for using HAMA™. Our goal is to maintain a safe, respectful, and productive community for all users.',
      },
      {
        heading: '2. Prohibited Activities',
        body: 'You may not use the Platform to: engage in illegal activities, post harmful or offensive content, harass or intimidate others, impersonate individuals or entities, spam or solicit inappropriately, manipulate listings or reviews, attempt to breach security measures, or violate others\' intellectual property rights.',
      },
      {
        heading: '3. Content Standards',
        body: 'All content you post must be accurate, truthful, and respectful. You retain ownership of your content but grant HAMA™ a license to display it on the Platform. We reserve the right to remove content that violates this policy.',
      },
      {
        heading: '4. Enforcement',
        body: 'Violations of this policy may result in: content removal, account suspension, permanent account termination, or legal action where appropriate. We reserve the right to take any action we deem necessary to protect our community.',
      },
      {
        heading: '5. Reporting Violations',
        body: 'If you encounter content or behavior that violates this policy, please report it through the Platform\'s reporting tools or contact support@hama.app. We review all reports and take appropriate action.',
      },
    ],
  },
};

export const LegalScreen: React.FC<LegalScreenProps> = ({ navigation, initialPage = 'terms' }) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<LegalPage>(initialPage);
  const content = LEGAL_CONTENT[activeTab];

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#000000', '#0A0A0A']} style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Legal</Text>
        <Text style={styles.headerSubtitle}>Policies and terms governing your use of HAMA™</Text>
      </LinearGradient>

      {/* Tab Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabContent}>
        {LEGAL_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>{content.title}</Text>
        {content.sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionHeading}>{section.heading}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerTitle: {
    ...FONTS.h1,
    color: COLORS.text,
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  tabBar: {
    maxHeight: 50,
    marginBottom: SPACING.sm,
  },
  tabContent: {
    paddingHorizontal: SPACING.md,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabLabel: {
    color: COLORS.textTertiary,
    fontSize: 13,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#fff',
    fontWeight: '600',
  },
  scrollContent: {
    padding: SPACING.md,
    gap: SPACING.lg,
  },
  pageTitle: {
    ...FONTS.h2,
    color: COLORS.text,
  },
  section: {
    gap: 8,
  },
  sectionHeading: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  sectionBody: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
});
