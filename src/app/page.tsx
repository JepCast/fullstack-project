import { redirect } from 'next/navigation';

// La página raíz solo redirige al login
export default function Home() {
  redirect('/login');
}