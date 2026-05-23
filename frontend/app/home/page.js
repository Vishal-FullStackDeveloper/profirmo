import { redirect } from 'next/navigation';

// `/home` always lands on the real homepage at `/`.
export default function Home() {
  redirect('/');
}
