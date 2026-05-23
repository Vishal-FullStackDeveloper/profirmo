import { redirect } from 'next/navigation';

// Legacy route — the login page now lives at `/login`.
export default function LegacyLoginRedirect() {
  redirect('/login');
}
