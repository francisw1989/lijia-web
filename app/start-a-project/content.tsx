'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { SuccessDialog } from '@/components/success-dialog';
import { PROJECT_SERVICE_LINKS } from '@/lib/project';
import { submitProjectMessage } from '@/lib/submit-message';

export function ProjectContent() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
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
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setSent(true);
    form.reset();
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
            <input name="name" type="text" required autoComplete="name" />
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
              <input name="email" type="email" required autoComplete="email" />
            </label>
            <label className="project-field">
              <span>Game/Project Name</span>
              <input name="projectName" type="text" />
            </label>
          </div>

          <label className="project-field project-field-full">
            <span>Component List</span>
            <textarea name="components" rows={5} />
          </label>

          <label className="project-field project-field-full">
            <span>Notes</span>
            <textarea name="notes" rows={5} />
          </label>

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
      <SuccessDialog open={sent} onClose={() => setSent(false)} />
    </section>
  );
}
