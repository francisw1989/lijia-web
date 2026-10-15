'use client';

import { useEffect, useState } from 'react';
import {
  getCommunityUser,
  refreshCommunityMe,
  subscribeAuth,
  type CommunityUser,
} from '@/lib/community-auth';

/** 已登录时用社区账号预填 Name / Email（仅填空字段，不覆盖用户已输入内容） */
export function useCommunityFormPrefill() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const apply = (user: CommunityUser | null) => {
      if (!user) return;
      setName((prev) => prev || user.username || '');
      setEmail((prev) => prev || user.email || '');
    };

    apply(getCommunityUser());
    refreshCommunityMe()
      .then(apply)
      .catch(() => {});
    return subscribeAuth(() => apply(getCommunityUser()));
  }, []);

  /** 提交成功 reset 后，若仍登录则重新预填 */
  const resetToUser = () => {
    const user = getCommunityUser();
    setName(user?.username || '');
    setEmail(user?.email || '');
  };

  return { name, setName, email, setEmail, resetToUser };
}
