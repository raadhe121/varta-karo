import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Screen from '../../components/common/Screen';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { colors, radius } from '../../config/theme';

function PasswordLogin() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      await login({ identifier, password });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.form}>
      <Input placeholder="you@example.com" autoCapitalize="none" value={identifier} onChangeText={setIdentifier} label="Email or Username" />
      <Input placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} label="Passphrase" />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <Button title={loading ? 'Signing in...' : 'Sign In to VartaKaro'} onPress={submit} loading={loading} />
    </View>
  );
}

function OtpLogin() {
  const { requestOtp, verifyOtp } = useAuth();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    setError('');
    setLoading(true);
    try {
      await requestOtp(phone);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send code');
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    setError('');
    setLoading(true);
    try {
      await verifyOtp(phone, code);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  if (!sent) {
    return (
      <View style={styles.form}>
        <Input placeholder="+91 98765 43210" keyboardType="phone-pad" value={phone} onChangeText={setPhone} label="Phone number" />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Button title={loading ? 'Sending...' : 'Send code'} onPress={send} loading={loading} />
        <Text style={styles.hint}>Dev mode: the code is printed in the server console.</Text>
      </View>
    );
  }

  return (
    <View style={styles.form}>
      <Input placeholder="123456" keyboardType="number-pad" value={code} onChangeText={setCode} label="6-digit code" />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <Button title={loading ? 'Verifying...' : 'Verify & continue'} onPress={verify} loading={loading} />
    </View>
  );
}

export default function LoginScreen({ navigation }) {
  const [tab, setTab] = useState('password');

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brandRow}>
            <View style={styles.brandBadge} />
            <View>
              <Text style={styles.brandName}>VartaKaro</Text>
              <Text style={styles.brandTagline}>Stories &amp; Conversations</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.eyebrow}>✦ WELCOME BACK</Text>
            <Text style={styles.headline}>Welcome Back to the Sanctuary</Text>
            <Text style={styles.subtext}>Enter your email or username and passphrase to access your chats and circles.</Text>

            <View style={styles.tabRow}>
              <Pressable style={[styles.tab, tab === 'password' && styles.tabActive]} onPress={() => setTab('password')}>
                <Text style={[styles.tabText, tab === 'password' && styles.tabTextActive]}>Password</Text>
              </Pressable>
              <Pressable style={[styles.tab, tab === 'otp' && styles.tabActive]} onPress={() => setTab('otp')}>
                <Text style={[styles.tabText, tab === 'otp' && styles.tabTextActive]}>Phone code</Text>
              </Pressable>
            </View>

            {tab === 'password' ? <PasswordLogin /> : <OtpLogin />}
          </View>

          <Pressable style={styles.footerLink} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.footerText}>
              Don&apos;t have an account? <Text style={styles.footerAccent}>Create Account</Text>
            </Text>
          </Pressable>

          <View style={styles.privacyBox}>
            <Text style={styles.privacyTitle}>Privacy, simply done</Text>
            <Text style={styles.privacyBody}>No behavioral trackers, third-party analytics, or ad surveillance anywhere in VartaKaro.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingTop: 40 },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 10 },
  brandBadge: { width: 32, height: 32, borderRadius: radius.sm, backgroundColor: colors.accent },
  brandName: { fontWeight: '800', color: colors.accent, fontSize: 16 },
  brandTagline: { fontSize: 11, color: colors.inkSoft },
  card: { backgroundColor: colors.paper, borderRadius: radius.xl, padding: 20 },
  eyebrow: { color: colors.accent, fontWeight: '700', fontSize: 12, marginBottom: 8, letterSpacing: 0.5 },
  headline: { fontSize: 24, fontWeight: '800', color: colors.ink, marginBottom: 8 },
  subtext: { color: colors.inkSoft, marginBottom: 20, lineHeight: 20 },
  tabRow: { flexDirection: 'row', backgroundColor: colors.paperSoft, borderRadius: radius.full, padding: 4, marginBottom: 18, gap: 4 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: radius.full, alignItems: 'center' },
  tabActive: { backgroundColor: colors.paper },
  tabText: { color: colors.inkSoft, fontWeight: '600', fontSize: 13 },
  tabTextActive: { color: colors.accent },
  form: { gap: 14 },
  errorText: { color: colors.danger, fontSize: 13 },
  hint: { fontSize: 12, color: colors.inkSoft },
  footerLink: { alignItems: 'center', marginTop: 18 },
  footerText: { color: colors.inkSoft, fontSize: 14 },
  footerAccent: { color: colors.accent, fontWeight: '700' },
  privacyBox: { backgroundColor: colors.paper, borderRadius: radius.lg, padding: 16, marginTop: 16 },
  privacyTitle: { fontWeight: '700', marginBottom: 4 },
  privacyBody: { color: colors.inkSoft, fontSize: 13, lineHeight: 18 },
});
