'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { SuccessDialog } from '@/components/success-dialog';
import { ToolsVideoSection } from '@/components/tools-video-section';
import {
  SAMPLE_BOX,
  TOOLS_INTRO,
  TOOL_GENERATOR,
  type ToolsResourceCard,
  type ToolsVideoItem,
} from '@/lib/tools-static';
import { submitToolsMessage } from '@/lib/submit-message';

export function ToolsContent({
  resources,
  videoHeading,
  videos,
}: {
  resources: ToolsResourceCard[];
  videoHeading: string;
  videos: ToolsVideoItem[];
}) {
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
    const result = await submitToolsMessage({
      name: String(data.get('name') || ''),
      email: String(data.get('email') || ''),
      message: String(data.get('message') || ''),
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
    <>
      <section className="tools-intro container">
        <p>{TOOLS_INTRO}</p>
      </section>

      <section className="container tools-resources">
        <div className="tools-resource-grid">
          {resources.map((item) =>
            item.href.startsWith('/') && !item.href.includes('#') ? (
              <Link
                key={item.id}
                id={item.id}
                href={item.href}
                className="tools-resource-card"
              >
                <span className="tools-resource-icon">
                  <Image src={item.icon} alt="" width={120} height={120} />
                </span>
                <strong>{item.title}</strong>
              </Link>
            ) : (
              <a
                key={item.id}
                id={item.id}
                href={item.href}
                className="tools-resource-card"
              >
                <span className="tools-resource-icon">
                  <Image src={item.icon} alt="" width={120} height={120} />
                </span>
                <strong>{item.title}</strong>
              </a>
            ),
          )}
        </div>

        <Link href={TOOL_GENERATOR.href} id="templates" className="tools-generator">
          <span className="tools-generator-icon">
            <Image src={TOOL_GENERATOR.icon} alt="" width={220} height={160} />
          </span>
          <span className="tools-generator-label">
            {TOOL_GENERATOR.title}
            <span className="tools-generator-arrow" aria-hidden="true" />
          </span>
        </Link>
      </section>

      <ToolsVideoSection heading={videoHeading} videos={videos} />

      <section className="container tools-sample">
        <div className="tools-sample-copy">
          <h2>{SAMPLE_BOX.title}</h2>
          <p>{SAMPLE_BOX.desc}</p>
        </div>
        <div className="tools-sample-media">
          <Image
            src={SAMPLE_BOX.image}
            alt="LIJIA basic sample box"
            width={279}
            height={223}
            className="tools-sample-img"
          />
        </div>
      </section>

      <section className="tools-cta">
        <div className="container tools-cta-inner">
          <h2 className="tools-cta-title">
            You must be quite familiar with us by now. <br /> Let&apos;s start
            working on the project.
          </h2>
          <form className="tools-cta-form" onSubmit={onSubmit}>
            <div className="tools-cta-fields">
              <label className="tools-cta-field tools-cta-name">
                <span>Your Name*</span>
                <input name="name" type="text" required autoComplete="name" />
              </label>
              <label className="tools-cta-field tools-cta-email">
                <span>Your Email*</span>
                <input name="email" type="email" required autoComplete="email" />
              </label>
              <label className="tools-cta-field tools-cta-message">
                <span>Your Message</span>
                <textarea name="message" rows={3} />
              </label>
            </div>
            <button
              type="submit"
              className="btn btn-light tools-cta-submit"
              disabled={submitting}
            >
              {submitting ? 'Sending…' : 'Send Message'}
            </button>
            {error ? <p className="tools-cta-error">{error}</p> : null}
          </form>
        </div>
      </section>
      <SuccessDialog open={sent} onClose={() => setSent(false)} />
    </>
  );
}
