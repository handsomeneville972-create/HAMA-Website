import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS, SPACING, FONTS } from '../constants/theme';

interface PaystackWebViewProps {
  visible: boolean;
  authorizationUrl: string;
  reference: string;
  onSuccess: (reference: string) => void;
  onCancel: () => void;
  onError: (error: string) => void;
  onClose: () => void;
}

/**
 * Paystack WebView Checkout Modal
 *
 * Loads the Paystack standard checkout URL in a WebView
 * and monitors navigation to detect:
 *   - Success: redirect to callback URL with reference
 *   - Cancel: redirect to close URL
 *   - Error: any navigation error
 */
export const PaystackWebView: React.FC<PaystackWebViewProps> = ({
  visible,
  authorizationUrl,
  reference,
  onSuccess,
  onCancel,
  onError,
  onClose,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleNavigationStateChange = (navState: { url: string }) => {
    const { url } = navState;

    // Success: callback URL includes reference or trxref
    if (
      url.includes('paystack/callback') ||
      url.includes('trxref=') ||
      url.includes('reference=')
    ) {
      setLoading(false);
      onSuccess(reference);
      return;
    }

    // Cancelled: Paystack close URL
    if (url.includes('standard.paystack.co/close')) {
      setLoading(false);
      onCancel();
      return;
    }
  };

  const handleError = () => {
    setError('Failed to load payment page. Please check your connection and try again.');
    onError('WebView failed to load');
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={['rgba(10,10,15,0.98)', 'rgba(26,26,46,0.99)']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Pay with Paystack</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerSubtitle}>
            Secure payment via card or M-Pesa
          </Text>
        </LinearGradient>

        {/* WebView */}
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="cloud-offline-outline" size={48} color={COLORS.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={onClose}>
              <Text style={styles.retryButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <WebView
              ref={webViewRef}
              source={{ uri: authorizationUrl }}
              style={styles.webview}
              onNavigationStateChange={handleNavigationStateChange}
              onError={handleError}
              onLoadEnd={() => setLoading(false)}
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState
              renderLoading={() => (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={styles.loadingText}>
                    Loading secure payment page...
                  </Text>
                </View>
              )}
            />

            {/* Loading overlay (shown until page loads) */}
            {loading && (
              <View style={styles.initialLoading}>
                <LinearGradient
                  colors={['rgba(10,10,15,0.95)', 'rgba(26,26,46,0.98)']}
                  style={styles.initialLoadingContent}
                >
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={styles.initialLoadingTitle}>
                    Connecting to Paystack...
                  </Text>
                  <Text style={styles.initialLoadingSubtitle}>
                    Secure payment gateway
                  </Text>
                </LinearGradient>
              </View>
            )}
          </>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop: 50, // Status bar offset
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    ...FONTS.h3,
    color: COLORS.text,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  webview: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    gap: 12,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  initialLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  initialLoadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  initialLoadingTitle: {
    ...FONTS.h3,
    color: COLORS.text,
  },
  initialLoadingSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    gap: 16,
  },
  errorText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
