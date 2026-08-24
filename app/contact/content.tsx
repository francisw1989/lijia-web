'use client';

import Image from 'next/image';
import { FormEvent, useState } from 'react';
import { HeroBannerCopy } from '@/components/hero-banner-copy';
import { HeroMedia } from '@/components/hero-media';
import { SuccessDialog } from '@/components/success-dialog';
import { CONTACT_LOCATIONS } from '@/lib/contact';
import { submitContactMessage } from '@/lib/submit-message';

const INFO_ICONS = {
  phone: '/images/15.png',
  email: '/images/16.png',
  app: '/images/17.png',
  address: '/images/18.png',
} as const;

type BannerCopy = {
  alt: string;
  title?: string;
  subtitle?: string;
};

export function ContactContent({ banner }: { banner: BannerCopy }) {
  const [locId, setLocId] = useState(CONTACT_LOCATIONS[0].id);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const location =
    CONTACT_LOCATIONS.find((l) => l.id === locId) ?? CONTACT_LOCATIONS[0];

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);
    const form = e.currentTarget;
    const data = new FormData(form);
    const result = await submitContactMessage({
      name: String(data.get('name') || ''),
      email: String(data.get('email') || ''),
      country: String(data.get('country') || ''),
      phone: String(data.get('phone') || ''),
      company: String(data.get('company') || ''),
      subject: String(data.get('subject') || ''),
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
      <section className="reveal about-hero container">
        <HeroMedia src={location.banner} alt={banner.alt} priority />
        <HeroBannerCopy title={banner.title} subtitle={banner.subtitle} />
      </section>

      <section className="section-pad">
        <div className="container">
          <div className="page-tabs contact-tabs" role="tablist" aria-label="Office locations">
            {CONTACT_LOCATIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={locId === item.id}
                className={`about-tab${locId === item.id ? ' is-active' : ''}`}
                onClick={() => setLocId(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <h2 className="contact-heading">CONTACT INFORMATION FIND US</h2>

          <div className="contact-layout">
            <div className="contact-info">
              <div className="contact-info-row">
                <span className="contact-info-icon">
                  <Image src={INFO_ICONS.phone} alt="" width={28} height={28} />
                </span>
                <div>
                  <strong>Telephone</strong>
                  {location.phones.map((phone, i) => (
                    <a
                      key={`${phone}-${i}`}
                      href={`tel:${phone.replace(/\s/g, '')}`}
                      className="contact-info-line"
                    >
                      {phone}
                    </a>
                  ))}
                </div>
              </div>

              <div className="contact-info-row">
                <span className="contact-info-icon">
                  <Image src={INFO_ICONS.email} alt="" width={28} height={28} />
                </span>
                <div>
                  <strong>Email</strong>
                  {location.emails.map((email) => (
                    <a key={email} href={`mailto:${email}`} className="contact-info-line">
                      {email}
                    </a>
                  ))}
                </div>
              </div>

              <div className="contact-info-row">
                <span className="contact-info-icon">
                  <Image src={INFO_ICONS.app} alt="" width={28} height={28} />
                </span>
                <div>
                  <strong>APP</strong>
                  {location.apps.map((app) => (
                    <p key={app.label} className="contact-info-line">
                      {app.label}:{app.value}
                    </p>
                  ))}
                </div>
              </div>

              <div className="contact-info-row">
                <span className="contact-info-icon">
                  <Image src={INFO_ICONS.address} alt="" width={28} height={28} />
                </span>
                <div>
                  <strong>Address</strong>
                  {location.address.map((line) => (
                    <p key={line} className="contact-info-line">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            <div className="contact-form-wrap">
              <h3 className="contact-form-title">Get in touch. We&apos;re here to help!</h3>
              <form className="contact-form" onSubmit={onSubmit}>
                <div className="contact-form-grid">
                  <label className="contact-field">
                    <span>Name</span>
                    <input name="name" type="text" required autoComplete="name" />
                  </label>
                  <label className="contact-field">
                    <span>Email</span>
                    <input name="email" type="email" required autoComplete="email" />
                  </label>
                  <label className="contact-field">
                    <span>Country/Region</span>
                    <input name="country" type="text" required autoComplete="country-name" />
                  </label>
                  <label className="contact-field">
                    <span>Phone Number</span>
                    <input name="phone" type="tel" required autoComplete="tel" />
                  </label>
                  <label className="contact-field">
                    <span>Company</span>
                    <input name="company" type="text" autoComplete="organization" />
                  </label>
                  <label className="contact-field">
                    <span>Subject</span>
                    <input name="subject" type="text" />
                  </label>
                </div>
                <label className="contact-field contact-field-full">
                  <span>Message (Optional)</span>
                  <textarea name="message" rows={5} />
                </label>
                <button
                  type="submit"
                  className="btn btn-primary contact-submit"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting…' : 'Submit'}
                </button>
                {error ? <p className="contact-form-error">{error}</p> : null}
              </form>
            </div>
          </div>
        </div>
        <SuccessDialog open={sent} onClose={() => setSent(false)} />
      </section>
    </>
  );
}
