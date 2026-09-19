import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Screen from '../../components/common/Screen';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { checkUsername } from '../../api/auth.api';
import { colors, radius } from '../../config/theme';

function strengthScore(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}
const STRENGTH_COLOR = [colors.line, '#f87171', '#fbbf24', '#a3e635', colors.success];

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', username: '', email: '', phone: '', password: '', confirm: '' });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [handleStatus, setHandleStatus] = useState('idle');
  const debounceRef = useRef(null);

  const update = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    clearTimeout(debounceRef.current);
    const username = form.username.trim();
    if (!username) {
      setHandleStatus('idle');
      return;
    }
    setHandleStatus('checking');
    debounceRef.current = setTimeout(async () => {
      try {
        const { available } = await checkUsername(username);
        setHandleStatus(available ? 'available' : 'taken');
      } catch {
        setHandleStatus('idle');
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [form.username]);

  const passwordsMatch = form.confirm.length === 0 || form.password === form.confirm;
  const canSubmit = agreed && handleStatus !== 'taken' && form.password === form.confirm && form.password.length >= 8;
  const score = strengthScore(form.password);

  const submit = async () => {
    if (!canSubmit) return;
    setError('');
    setLoading(true);
    try {
      await register({
        name: form.name,
        username: form.username,
        email: form.email || undefined,
        phone: form.phone || undefined,
        password: form.password,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.eyebrow}>✦ BECOME A SCRIBE</Text>
          <Text style={styles.headline}>Begin Your Quiet Digital Chronicle</Text>
          <Text style={styles.subtext}>
            Join an unhurried social network for real conversations, photo-sharing, and small circles — without
            algorithmic noise.
          </Text>

          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Create Your Account</Text>
              <View style={styles.pill}>
                <Text style={styles.pillText}>&lt; 1 min</Text>
              </View>
            </View>

            <Input label="Full Name" placeholder="e.g. Ananya Sharma" value={form.name} onChangeText={update('name')} style={styles.field} />
            <Input
              label="Email Address"
              placeholder="name@domain.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={update('email')}
              style={styles.field}
            />

            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Choose Username</Text>
                {handleStatus === 'checking' && <Text style={styles.hintMuted}>Checking...</Text>}
                {handleStatus === 'available' && <Text style={styles.hintGood}>Available ✓</Text>}
                {handleStatus === 'taken' && <Text style={styles.hintBad}>Already taken</Text>}
              </View>
              <Input placeholder="ananya_crafts" autoCapitalize="none" value={form.username} onChangeText={update('username')} />
            </View>

            <View style={styles.field}>
              <Input
                label="Password"
                placeholder="At least 8 characters"
                secureTextEntry
                value={form.password}
                onChangeText={update('password')}
              />
              {form.password.length > 0 && (
                <View style={styles.strengthRow}>
                  {[1, 2, 3, 4].map((i) => (
                    <View
                      key={i}
                      style={[styles.strengthBar, { backgroundColor: i <= score ? STRENGTH_COLOR[score] : colors.line }]}
                    />
                  ))}
                </View>
              )}
            </View>

            <View style={styles.field}>
              <Input
                label="Confirm Password"
                placeholder="Re-enter your password"
                secureTextEntry
                value={form.confirm}
                onChangeText={update('confirm')}
              />
              {!passwordsMatch && <Text style={styles.hintBad}>Passwords don&apos;t match.</Text>}
            </View>

            <Input
              label="Phone (optional, for phone sign-in)"
              placeholder="+91 98765 43210"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={update('phone')}
              style={styles.field}
            />

            <Pressable style={styles.checkboxRow} onPress={() => setAgreed((v) => !v)}>
              <View style={[styles.checkbox, agreed && styles.checkboxChecked]} />
              <Text style={styles.checkboxLabel}>I agree to VartaKaro&apos;s Community Guidelines.</Text>
            </Pressable>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Button title={loading ? 'Creating account...' : 'Create Account'} onPress={submit} loading={loading} disabled={!canSubmit} style={{ marginTop: 4 }} />
          </View>

          <Pressable style={styles.footerLink} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerText}>
              Already have an account? <Text style={styles.footerAccent}>Sign In</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingTop: 40, paddingBottom: 60 },
  eyebrow: { color: colors.accent, fontWeight: '700', fontSize: 12, marginBottom: 8, letterSpacing: 0.5 },
  headline: { fontSize: 26, fontWeight: '800', color: colors.ink, marginBottom: 10 },
  subtext: { color: colors.inkSoft, marginBottom: 20, lineHeight: 20 },
  card: { backgroundColor: colors.paper, borderRadius: radius.xl, padding: 20 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 20, fontWeight: '800', color: colors.ink },
  pill: { backgroundColor: colors.paperSoft, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontSize: 11, color: colors.inkSoft },
  field: { marginBottom: 14 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 13, fontWeight: '600', color: colors.ink },
  hintMuted: { fontSize: 12, color: colors.inkSoft },
  hintGood: { fontSize: 12, color: colors.success, fontWeight: '600' },
  hintBad: { fontSize: 12, color: colors.danger, fontWeight: '600', marginTop: 4 },
  strengthRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  strengthBar: { flex: 1, height: 5, borderRadius: 3 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: colors.line },
  checkboxChecked: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkboxLabel: { flex: 1, fontSize: 13, color: colors.ink },
  errorText: { color: colors.danger, fontSize: 13, marginBottom: 8 },
  footerLink: { alignItems: 'center', marginTop: 20 },
  footerText: { color: colors.inkSoft, fontSize: 14 },
  footerAccent: { color: colors.accent, fontWeight: '700' },
});
