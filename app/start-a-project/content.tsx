'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { SuccessDialog } from '@/components/success-dialog';
import { InquiryCodeField } from '@/components/inquiry-code-field';
import { TurnstileField } from '@/components/turnstile-field';
import { PROJECT_SERVICE_LINKS } from '@/lib/project';
import { clearNativeValidity, englishNativeInvalid } from '@/lib/native-validity';
import { submitProjectMessage } from '@/lib/submit-message';
import { useCommunityFormPrefill } from '@/lib/use-community-form-prefill';
import { useInquiryAuth } from '@/lib/use-inquiry-code';

export function ProjectContent() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [code, setCode] = useState('');
  const { name, setName, email, setEmail, resetToUser } =
    useCommunityFormPrefill();
  const { isLoggedIn } = useInquiryAuth();
  const needsTurnstile = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    if (needsTurnstile && !turnstileToken) {
      setError('Please complete the security check.');
      return;
    }
    if (!isLoggedIn && code.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    setSubmitting(true);
    const form = e.currentTarget;
    const data = new FormData(form);
    const result = await submitProjectMessage({
      name: String(data.get('name') || ''),
      jobTitle: String(data.get('jobTitle') || ''),
      company: String(data.get('company') || ''),
      email: String(data.get('email') || ''),
      projectName: String(data.get('projectName') || ''),
      components: String(data.get('components') || ''),
      notes: String(data.get('notes') || ''),
      turnstileToken,
      ...(isLoggedIn ? {} : { code: code.trim() }),
    });
    setSubmitting(false);
    setCode('');
    if (!result.ok) {
      setTurnstileToken('');
      setTurnstileReset((n) => n + 1);
      setError(result.message);
      return;
    }
    setTurnstileToken('');
    setSent(true);
    form.reset();
    resetToUser();
  };

  const onSuccessClose = () => {
    setSent(false);
    setTurnstileReset((n) => n + 1);
  };

  return (
    <section className="section-pad">
      <div className="container project-layout">
        <aside className="project-sidebar">
          <h2 className="project-sidebar-title">Service center</h2>
          <nav className="project-sidebar-nav" aria-label="Service center">
            {PROJECT_SERVICE_LINKS.map((item) => (
              <Link key={item.label} href={item.href} className="project-sidebar-link">
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <form className="project-form" onSubmit={onSubmit}>
          <label className="project-field project-field-full">
            <span>Name</span>
            <input
              name="name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => {
                clearNativeValidity(e);
                setName(e.target.value);
              }}
              onInvalid={englishNativeInvalid}
            />
          </label>

          <div className="project-form-row">
            <label className="project-field">
              <span>Job Title</span>
              <input name="jobTitle" type="text" autoComplete="organization-title" />
            </label>
            <label className="project-field">
              <span>Company</span>
              <input name="company" type="text" autoComplete="organization" />
            </label>
          </div>

          <div className="project-form-row">
            <label className="project-field">
              <span>Email</span>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  clearNativeValidity(e);
                  setEmail(e.target.value);
                }}
                onInvalid={englishNativeInvalid}
              />
            </label>
            <label className="project-field">
              <span>Game/Project Name</span>
              <input name="projectName" type="text" />
            </label>
          </div>

          {!isLoggedIn ? (
            <InquiryCodeField
              className="project-field project-field-full"
              email={email}
              code={code}
              onCodeChange={setCode}
            />
          ) : null}

          <label className="project-field project-field-full">
            <span>Component List</span>
            <textarea name="components" rows={5} />
          </label>

          <label className="project-field project-field-full">
            <span>Notes</span>
            <textarea name="notes" rows={5} />
          </label>

          {!sent ? (
            <TurnstileField
              onToken={setTurnstileToken}
              resetSignal={turnstileReset}
            />
          ) : null}

          <button
            type="submit"
            className="btn btn-primary project-submit"
            disabled={submitting}
          >
            {submitting ? 'Sending…' : 'Send Message'}
          </button>
          {error ? <p className="project-form-error">{error}</p> : null}
        </form>
      </div>
      <SuccessDialog open={sent} onClose={onSuccessClose} />
    </section>
  );
}
