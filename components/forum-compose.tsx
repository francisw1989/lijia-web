'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthModal } from '@/components/auth-modal';
import {
  COMMUNITY_MUTED_MESSAGE,
  createForumPost,
  getCommunityToken,
  getCommunityUser,
  isCommunityMuted,
  refreshCommunityMe,
  subscribeAuth,
  type CommunityUser,
} from '@/lib/community-auth';
import { clearNativeValidity, englishNativeInvalid } from '@/lib/native-validity';

export function ForumCompose() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState<CommunityUser | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setUser(getCommunityUser());
    refreshCommunityMe().then(setUser).catch(() => setUser(null));
    return subscribeAuth(() => setUser(getCommunityUser()));
  }, []);

  const startCompose = async () => {
    if (!getCommunityToken()) {
      setAuthOpen(true);
      return;
    }
    setNotice('');
    const latest = (await refreshCommunityMe().catch(() => getCommunityUser())) || getCommunityUser();
    setUser(latest);
    if (isCommunityMuted(latest)) {
      setNotice(COMMUNITY_MUTED_MESSAGE);
      return;
    }
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (isCommunityMuted(getCommunityUser())) {
      setError(COMMUNITY_MUTED_MESSAGE);
      return;
    }
    setLoading(true);
    try {
      const post = await createForumPost({ title: title.trim(), content: content.trim() });
      setOpen(false);
      setTitle('');
      setContent('');
      if (post.pending) {
        setNotice(
          post.message || 'Your content was submitted and will appear after review.',
        );
        router.refresh();
        return;
      }
      router.push(`/forum/${post.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="forum-composer-card">
        <div className="forum-composer-row">
          <span className="forum-composer-avatar" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8.5" r="3.5" stroke="currentColor" strokeWidth="1.6" />
              <path
                d="M5 18.5c1.6-3 4-4.5 7-4.5s5.4 1.5 7 4.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <button type="button" className="forum-composer-input" onClick={startCompose}>
            Ask a production question…
          </button>
        </div>
        <div className="forum-composer-actions">
          <button type="button" className="forum-ask-btn" onClick={startCompose}>
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
              <path
                d="M4 17.5 5.2 12 16.8 4.8a1.2 1.2 0 0 1 1.7 1.5L12.2 18.2 4 17.5Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path d="M12.5 8.5 15.5 11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            ASK
          </button>
        </div>
        {notice ? (
          <p className="forum-composer-muted-notice" role="status">
            {notice}
          </p>
        ) : null}
      </section>

      {open ? (
        <div className="auth-modal-backdrop" role="presentation" onClick={() => setOpen(false)}>
          <div
            className="auth-modal forum-compose-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="auth-modal-close"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="auth-modal-title">Ask the community</h2>
            <p className="forum-compose-hint">
              Title is your question; details help others answer.
              {user ? ` Posting as ${user.username}.` : null}
            </p>
            <form className="auth-modal-form" onSubmit={submit}>
              <label className="auth-field">
                <span>Question</span>
                <input
                  value={title}
                  onChange={(e) => {
                    clearNativeValidity(e);
                    setTitle(e.target.value);
                  }}
                  onInvalid={englishNativeInvalid}
                  placeholder="Ask a production question…"
                  required
                />
              </label>
              <label className="auth-field">
                <span>Details</span>
                <textarea
                  value={content}
                  onChange={(e) => {
                    clearNativeValidity(e);
                    setContent(e.target.value);
                  }}
                  onInvalid={englishNativeInvalid}
                  rows={8}
                  placeholder="Add context, specs, or what you already tried…"
                  required
                />
              </label>
              {error ? <p className="auth-modal-error">{error}</p> : null}
              <button type="submit" className="forum-ask-btn forum-ask-btn-solid" disabled={loading}>
                {loading ? 'Publishing…' : 'ASK'}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => {
          setUser(getCommunityUser());
          setOpen(true);
        }}
      />
    </>
  );
}
