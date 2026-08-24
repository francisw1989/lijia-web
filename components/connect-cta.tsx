import Image from 'next/image';
import Link from 'next/link';

export function ConnectCta() {
  return (
    <section className="reveal relative min-h-cta place-center colfff text-center overflow-hidden rounded container">
      <Image
        className="object-cover"
        src="https://images.wangsanshui.com/images/1787540462773-25bic8.png"
        unoptimized
        alt=""
        fill
        sizes="100vw"
      />
      <div className="relative z-1 max-w-720 mx-auto cta-inner">
        <h2 className="title colfff">Let's Connect On Lijia Company</h2>
        <p className="font20 font-medium cta-lead">
        Join us to download more template resources.
        </p>
        <Link href="/tools" className="btn btn-light">
          Access LIJIAGAME
        </Link>
      </div>
    </section>
  );
}
