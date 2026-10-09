import Link from 'next/link';
import type { ManufacturingMenuItem } from '@/lib/manufacturing';

export function ManufacturingCategoryMenu({
  items,
  activeId,
}: {
  items: ManufacturingMenuItem[];
  activeId: string;
}) {
  if (!items.length) return null;

  return (
    <nav className="mfg-cat-menu" aria-label="Manufacturing categories">
      <ul className="mfg-cat-menu-grid">
        {items.map((item) => {
          const active =
            item.id === activeId ||
            (item.id === 'mahjong' && activeId === 'mahjong');
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className={`mfg-cat-menu-item${active ? ' is-active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <span className="mfg-cat-menu-icon" aria-hidden="true">
                  {item.icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className="mfg-cat-menu-icon-default"
                      src={item.icon}
                      alt=""
                      width={64}
                      height={64}
                    />
                  ) : null}
                  {item.iconActive ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className="mfg-cat-menu-icon-active"
                      src={item.iconActive}
                      alt=""
                      width={64}
                      height={64}
                    />
                  ) : null}
                </span>
                <span className="mfg-cat-menu-label">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
