'use client';

import { useEffect, useState } from 'react';
import {
  getCommunityToken,
  getCommunityUser,
  refreshCommunityMe,
  subscribeAuth,
  type CommunityUser,
} from '@/lib/community-auth';

export function useInquiryAuth() {
  const [user, setUser] = useState<CommunityUser | null>(null);

  useEffect(() => {
    setUser(getCommunityUser());
    refreshCommunityMe()
      .then(setUser)
      .catch(() => setUser(null));
    return subscribeAuth(() => setUser(getCommunityUser()));
  }, []);

  return {
    user,
    isLoggedIn: Boolean(user && getCommunityToken()),
  };
}

export async function sendInquiryCode(email: string) {
  const res = await fetch('/api/messages/send-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    message?: string;
    cooldown?: number;
  };
  if (!res.ok) {
    const err = new Error(data.message || 'Failed to send verification code') as Error & {
      cooldown?: number;
    };
    if (typeof data.cooldown === 'number') err.cooldown = data.cooldown;
    throw err;
  }
  return data;
}
