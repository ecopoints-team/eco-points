'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  // Redirect to landing page with login modal open
  useEffect(() => {
    router.replace('/?login=true');
  }, [router]);

  return null;
}
