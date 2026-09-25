import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../hooks/useAuth';

export default function GoogleSignInButton({ remember = true, onSuccess, onError }) {
  const { googleLogin } = useAuth();

  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) return null;

  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={(credentialResponse) => {
          googleLogin(credentialResponse.credential, remember)
            .then(onSuccess)
            .catch((err) => onError?.(err));
        }}
        onError={() => onError?.(new Error('Google sign-in failed'))}
        theme="outline"
        shape="pill"
        text="continue_with"
        width="336"
      />
    </div>
  );
}
