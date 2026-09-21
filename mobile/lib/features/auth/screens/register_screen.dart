import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../common/widgets/app_button.dart';
import '../../../common/widgets/app_input.dart';
import '../../../common/widgets/screen.dart';
import '../../../config/theme.dart';
import '../providers/auth_provider.dart';
import 'login_screen.dart' show errorMessage;

enum _UsernameStatus { idle, checking, available, taken }

const _strengthColors = [
  AppColors.line,
  Color(0xFFF87171),
  Color(0xFFFBBF24),
  Color(0xFFA3E635),
  AppColors.success,
];

int _passwordStrength(String password) {
  var score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  final hasLower = password.contains(RegExp(r'[a-z]'));
  final hasUpper = password.contains(RegExp(r'[A-Z]'));
  if (hasLower && hasUpper) score++;
  final hasDigit = password.contains(RegExp(r'[0-9]'));
  final hasSpecial = password.contains(RegExp(r'[^a-zA-Z0-9]'));
  if (hasDigit && hasSpecial) score++;
  return score;
}

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _name = TextEditingController();
  final _username = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();

  Timer? _usernameDebounce;
  _UsernameStatus _usernameStatus = _UsernameStatus.idle;
  bool _agreed = false;
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _password.addListener(() => setState(() {}));
    _confirm.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _usernameDebounce?.cancel();
    _name.dispose();
    _username.dispose();
    _email.dispose();
    _phone.dispose();
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  void _onUsernameChanged(String value) {
    _usernameDebounce?.cancel();
    final username = value.trim();
    if (username.isEmpty) {
      setState(() => _usernameStatus = _UsernameStatus.idle);
      return;
    }
    setState(() => _usernameStatus = _UsernameStatus.checking);
    _usernameDebounce = Timer(const Duration(milliseconds: 400), () async {
      try {
        final available = await ref
            .read(authActionsProvider)
            .checkUsername(username);
        if (!mounted || _username.text.trim() != username) return;
        setState(
          () => _usernameStatus = available
              ? _UsernameStatus.available
              : _UsernameStatus.taken,
        );
      } catch (_) {
        if (mounted) setState(() => _usernameStatus = _UsernameStatus.idle);
      }
    });
  }

  bool get _passwordsMatch =>
      _confirm.text.isEmpty || _password.text == _confirm.text;

  bool get _canSubmit =>
      _agreed &&
      _usernameStatus != _UsernameStatus.taken &&
      _password.text == _confirm.text &&
      _password.text.length >= 8 &&
      !_loading;

  Future<void> _submit() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await ref
          .read(authActionsProvider)
          .register(
            name: _name.text.trim(),
            username: _username.text.trim(),
            password: _password.text,
            email: _email.text.trim().isEmpty ? null : _email.text.trim(),
            phone: _phone.text.trim().isEmpty ? null : _phone.text.trim(),
          );
    } catch (err) {
      setState(() => _error = errorMessage(err));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final strength = _passwordStrength(_password.text);

    return Screen(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 12),
              const Text(
                'Create your account',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w700,
                  color: AppColors.ink,
                ),
              ),
              const SizedBox(height: 24),
              AppInput(label: 'Name', controller: _name),
              const SizedBox(height: 16),
              AppInput(
                label: 'Username',
                controller: _username,
                onChanged: _onUsernameChanged,
                suffixIcon: switch (_usernameStatus) {
                  _UsernameStatus.checking => const Padding(
                    padding: EdgeInsets.all(12),
                    child: SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ),
                  _UsernameStatus.available => const Icon(
                    Icons.check_circle,
                    color: AppColors.success,
                  ),
                  _UsernameStatus.taken => const Icon(
                    Icons.cancel,
                    color: AppColors.danger,
                  ),
                  _UsernameStatus.idle => null,
                },
                error: _usernameStatus == _UsernameStatus.taken
                    ? 'That username is already taken'
                    : null,
              ),
              const SizedBox(height: 16),
              AppInput(
                label: 'Email (optional)',
                controller: _email,
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 16),
              AppInput(
                label: 'Phone (optional)',
                controller: _phone,
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 16),
              AppInput(
                label: 'Password',
                controller: _password,
                obscureText: true,
              ),
              const SizedBox(height: 8),
              Row(
                children: List.generate(4, (i) {
                  final active = i < strength;
                  return Expanded(
                    child: Container(
                      margin: EdgeInsets.only(right: i < 3 ? 6 : 0),
                      height: 4,
                      decoration: BoxDecoration(
                        color: active
                            ? _strengthColors[strength]
                            : AppColors.line,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  );
                }),
              ),
              const SizedBox(height: 16),
              AppInput(
                label: 'Confirm password',
                controller: _confirm,
                obscureText: true,
                error: !_passwordsMatch ? 'Passwords do not match' : null,
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Checkbox(
                    value: _agreed,
                    onChanged: (v) => setState(() => _agreed = v ?? false),
                  ),
                  const Expanded(
                    child: Text(
                      'I agree to the community guidelines',
                      style: TextStyle(fontSize: 13),
                    ),
                  ),
                ],
              ),
              if (_error != null) ...[
                const SizedBox(height: 8),
                Text(
                  _error!,
                  style: const TextStyle(color: AppColors.danger, fontSize: 13),
                ),
              ],
              const SizedBox(height: 12),
              AppButton(
                label: 'Create account',
                onPressed: _canSubmit ? _submit : null,
                loading: _loading,
              ),
              const SizedBox(height: 16),
              TextButton(
                onPressed: () => context.go('/login'),
                child: const Text(
                  'Already have an account? Log in',
                  style: TextStyle(color: AppColors.accent),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
