import { redirect } from 'next/navigation';

// Legacy route — registration is now unified at `/signup`.
export default function LegacyRegisterFirmRedirect() {
  redirect('/signup');
}
