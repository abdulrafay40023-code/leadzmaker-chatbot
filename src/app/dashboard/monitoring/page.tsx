'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MonitoringPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/chats');
  }, [router]);

  return null;
}
