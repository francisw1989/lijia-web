import Image from 'next/image';

type LogoProps = {
  className?: string;
  /** @deprecated logo.png 为固定素材，保留参数以免调用处报错 */
  variant?: 'dark' | 'light';
};

export function Logo({ className }: LogoProps) {
  return (
    <span className={className} aria-label="LIJIA GAME PRODUCTION">
      <Image
        src="/images/logo.png"
        alt="LIJIA GAME PRODUCTION"
        width={180}
        height={48}
        priority
        className="logo-img"
      />
    </span>
  );
}
