// Pluggable OTP delivery. Swap `devConsoleProvider` for a real SMS vendor
// (Twilio, MSG91, etc.) later without touching the auth routes/controllers.

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function devConsoleProvider(phone, code) {
  // eslint-disable-next-line no-console
  console.log(`[OTP] ${phone} -> ${code} (dev mode: not actually sent)`);
}

const activeProvider = devConsoleProvider;

export async function sendOtpCode(phone) {
  const code = generateCode();
  await activeProvider(phone, code);
  return code;
}
