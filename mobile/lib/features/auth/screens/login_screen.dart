import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../common/widgets/app_button.dart';
import '../../../common/widgets/app_input.dart';
import '../../../common/widgets/screen.dart';
import '../../../config/theme.dart';
import '../providers/auth_provider.dart';

String errorMessage(Object err) {
  if (err is DioException) {
    final data = err.response?.data;
    if (data is Map && data['message'] is String) {
      return data['message'] as String;
    }
  }
  return 'Something went wrong. Please try again.';
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController = TabController(
    length: 2,
    vsync: this,
  );

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Screen(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        body: Column(
          children: [
            const SizedBox(height: 32),
            const Text(
              'Vartakaro',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.w700,
                color: AppColors.ink,
              ),
            ),
            const SizedBox(height: 24),
            TabBar(
              controller: _tabController,
              labelColor: AppColors.accent,
              unselectedLabelColor: AppColors.inkSoft,
              indicatorColor: AppColors.accent,
              tabs: const [
                Tab(text: 'Password'),
                Tab(text: 'Phone code'),
              ],
            ),
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: const [_PasswordLogin(), _OtpLogin()],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 4),
              child: TextButton(
                onPressed: () => context.go('/register'),
                child: const Text(
                  "Don't have an account? Register",
                  style: TextStyle(color: AppColors.accent),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
              child: TextButton(
                onPressed: () => context.push('/random-chat'),
                child: const Text(
                  'Talk to a stranger — no account needed',
                  style: TextStyle(color: AppColors.inkSoft),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PasswordLogin extends ConsumerStatefulWidget {
  const _PasswordLogin();

  @override
  ConsumerState<_PasswordLogin> createState() => _PasswordLoginState();
}

class _PasswordLoginState extends ConsumerState<_PasswordLogin> {
  final _identifier = TextEditingController();
  final _password = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _identifier.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await ref
          .read(authActionsProvider)
          .login(identifier: _identifier.text.trim(), password: _password.text);
    } catch (err) {
      setState(() => _error = errorMessage(err));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          AppInput(
            label: 'Username or email',
            controller: _identifier,
            hintText: 'you@example.com',
          ),
          const SizedBox(height: 16),
          AppInput(
            label: 'Password',
            controller: _password,
            obscureText: true,
            hintText: '••••••••',
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(
              _error!,
              style: const TextStyle(color: AppColors.danger, fontSize: 13),
            ),
          ],
          const SizedBox(height: 20),
          AppButton(
            label: 'Log in',
            onPressed: _loading ? null : _submit,
            loading: _loading,
          ),
        ],
      ),
    );
  }
}

class _OtpLogin extends ConsumerStatefulWidget {
  const _OtpLogin();

  @override
  ConsumerState<_OtpLogin> createState() => _OtpLoginState();
}

class _OtpLoginState extends ConsumerState<_OtpLogin> {
  final _phone = TextEditingController();
  final _code = TextEditingController();
  bool _sent = false;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _phone.dispose();
    _code.dispose();
    super.dispose();
  }

  Future<void> _requestCode() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await ref.read(authActionsProvider).requestOtp(_phone.text.trim());
      setState(() => _sent = true);
    } catch (err) {
      setState(() => _error = errorMessage(err));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _verify() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await ref
          .read(authActionsProvider)
          .verifyOtp(phone: _phone.text.trim(), code: _code.text.trim());
    } catch (err) {
      setState(() => _error = errorMessage(err));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          AppInput(
            label: 'Phone number',
            controller: _phone,
            hintText: '+1 555 0100',
            keyboardType: TextInputType.phone,
          ),
          if (_sent) ...[
            const SizedBox(height: 8),
            const Text(
              'Dev mode: the code is printed in the server console.',
              style: TextStyle(color: AppColors.inkSoft, fontSize: 12),
            ),
            const SizedBox(height: 16),
            AppInput(
              label: '6-digit code',
              controller: _code,
              keyboardType: TextInputType.number,
            ),
          ],
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(
              _error!,
              style: const TextStyle(color: AppColors.danger, fontSize: 13),
            ),
          ],
          const SizedBox(height: 20),
          AppButton(
            label: _sent ? 'Verify code' : 'Send code',
            onPressed: _loading ? null : (_sent ? _verify : _requestCode),
            loading: _loading,
          ),
        ],
      ),
    );
  }
}
