import Image from 'next/image';
import Link from 'next/link';

export function ConnectCta() {
  return (
    <section className="reveal relative min-h-cta place-center colfff text-center overflow-hidden rounded container">
      <Image
        className="object-cover"
        src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=2000&q=80"
        alt=""
        fill
        sizes="100vw"
      />
      <div className="mask mask-dark" />
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
