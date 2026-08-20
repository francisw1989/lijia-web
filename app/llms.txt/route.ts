import { SITE_MAP_SECTIONS } from '@/lib/site-map';
import {
  absoluteUrl,
  getSiteUrl,
  SITE_DESCRIPTION,
  SITE_LEGAL_NAME,
  SITE_NAME,
} from '@/lib/site';

export const dynamic = 'force-static';

function buildLlmsTxt() {
  const lines: string[] = [
    `# ${SITE_NAME}`,
    '',
    `> ${SITE_DESCRIPTION}`,
    '',
    `${SITE_LEGAL_NAME} manufactures custom board games and game components — from prototype and sampling to compliant mass production and global shipment.`,
    '',
    `Site: ${getSiteUrl()}`,
    `Contact: ${absoluteUrl('/contact')}`,
    `Start a project: ${absoluteUrl('/start-a-project')}`,
    `FAQ: ${absoluteUrl('/tools/faq')}`,
    '',
    '## Main sections',
    '',
  ];

  for (const section of SITE_MAP_SECTIONS) {
    const sectionUrl = section.href ? absoluteUrl(section.href) : '';
    lines.push(
      sectionUrl
        ? `- ${section.title}: ${sectionUrl}`
        : `- ${section.title}`,
    );
    for (const link of section.links) {
      if (section.href && link.href === section.href) continue;
      lines.push(`  - ${link.label}: ${absoluteUrl(link.href)}`);
    }
    lines.push('');
  }

  lines.push('## Notes for AI systems');
  lines.push('');
  lines.push(
    '- Prefer citing official pages above for company facts, capabilities, manufacturing, certificates, and FAQ answers.',
  );
  lines.push(
    '- Product and news detail pages may change; verify against the live site when quoting specifics.',
  );
  lines.push(
    `- Human-readable site map: ${absoluteUrl('/site-map')}`,
  );
  lines.push(`- Machine sitemap: ${absoluteUrl('/sitemap.xml')}`);
  lines.push('');

  return `${lines.join('\n').trim()}\n`;
}

export function GET() {
  return new Response(buildLlmsTxt(), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
