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

/// Username-only signup, mirroring the web app's RegisterPage.jsx: pick a
/// handle, agree to guidelines, done — no password, name, email or phone.
/// The account stays signed in via the stored refresh token on this device.
class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _username = TextEditingController();

  Timer? _usernameDebounce;
  _UsernameStatus _usernameStatus = _UsernameStatus.idle;
  bool _agreed = false;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _usernameDebounce?.cancel();
    _username.dispose();
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

  bool get _canSubmit =>
      _agreed &&
      _username.text.trim().isNotEmpty &&
      _usernameStatus != _UsernameStatus.taken &&
      !_loading;

  Future<void> _submit() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await ref
          .read(authActionsProvider)
          .register(username: _username.text.trim());
    } catch (err) {
      setState(() => _error = errorMessage(err));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
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
              const SizedBox(height: 6),
              const Text(
                "No password needed — you'll stay signed in on this device.",
                style: TextStyle(fontSize: 13, color: AppColors.inkSoft),
              ),
              const SizedBox(height: 24),
              AppInput(
                label: 'Username',
                controller: _username,
                onChanged: _onUsernameChanged,
                autofocus: true,
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
