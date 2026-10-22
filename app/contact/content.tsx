'use client';

import Image from 'next/image';
import { FormEvent, useState } from 'react';
import { HeroBannerCopy } from '@/components/hero-banner-copy';
import { HeroMedia } from '@/components/hero-media';
import { SuccessDialog } from '@/components/success-dialog';
import { InquiryCodeField } from '@/components/inquiry-code-field';
import { TurnstileField } from '@/components/turnstile-field';
import { CONTACT_JIANGSU } from '@/lib/contact';
import { clearNativeValidity, englishNativeInvalid } from '@/lib/native-validity';
import { submitContactMessage } from '@/lib/submit-message';
import { useCommunityFormPrefill } from '@/lib/use-community-form-prefill';
import { useInquiryAuth } from '@/lib/use-inquiry-code';

const INFO_ICONS = {
  phone: '/images/15.png',
  email: '/images/16.png',
  app: '/images/17.png',
  address: '/images/18.png',
} as const;

type BannerCopy = {
  image: string;
  poster?: string;
  alt: string;
  title?: string;
  subtitle?: string;
};

export function ContactContent({ banner }: { banner: BannerCopy }) {
  const location = CONTACT_JIANGSU;
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
    const result = await submitContactMessage({
      name: String(data.get('name') || ''),
      email: String(data.get('email') || ''),
      country: String(data.get('country') || ''),
      phone: String(data.get('phone') || ''),
      company: String(data.get('company') || ''),
      subject: String(data.get('subject') || ''),
      message: String(data.get('message') || ''),
      turnstileToken,
      ...(isLoggedIn ? {} : { code: code.trim() }),
    });
    setSubmitting(false);
    setCode('');
    if (!result.ok) {
      // token 已消耗，失败后立刻换新的；成功则等关闭弹窗再重置，避免马上又转圈
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
    <>
      <section className="reveal about-hero container">
        <HeroMedia src={banner.image} poster={banner.poster} alt={banner.alt} priority />
        <HeroBannerCopy title={banner.title} subtitle={banner.subtitle} />
      </section>

      <section className="section-pad">
        <div className="container">
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
                    <p key={`${app.label}-${app.value}`} className="contact-info-line">
                      {app.label}: {app.value}
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
                  <label className="contact-field">
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
                  {!isLoggedIn ? (
                    <InquiryCodeField
                      className="contact-field contact-field-span"
                      email={email}
                      code={code}
                      onCodeChange={setCode}
                    />
                  ) : null}
                  <label className="contact-field">
                    <span>Country/Region</span>
                    <input
                      name="country"
                      type="text"
                      required
                      autoComplete="country-name"
                      onInput={clearNativeValidity}
                      onInvalid={englishNativeInvalid}
                    />
                  </label>
                  <label className="contact-field">
                    <span>Phone Number</span>
                    <input
                      name="phone"
                      type="tel"
                      required
                      autoComplete="tel"
                      onInput={clearNativeValidity}
                      onInvalid={englishNativeInvalid}
                    />
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
                {!sent ? (
                  <TurnstileField
                    onToken={setTurnstileToken}
                    resetSignal={turnstileReset}
                  />
                ) : null}
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
        <SuccessDialog open={sent} onClose={onSuccessClose} />
      </section>
    </>
  );
}
