// Generate editorial cover images for the seeded blog posts.
//
// Renders an SVG per post (brand-dark base, per-topic accent, large headline,
// faint topic glyph), rasterises to a 1200x630 PNG via sharp, writes it to
// frontend/public/blog-images/, and updates the BlogPost row's
// featuredImage + ogImage to point at it.
//
// Idempotent: re-running overwrites the PNG and re-saves the DB pointers,
// but skips posts that have no matching slug.
//
// Usage (from backend/):  node src/scripts/generateBlogCovers.js

require('dotenv').config();

const fs = require('fs');
const path = require('path');

// sharp lives in the frontend's node_modules (Next.js ships it for image
// optimisation). Resolve it explicitly so the backend doesn't need its own
// copy.
const sharp = require(
  path.resolve(__dirname, '../../../frontend/node_modules/sharp')
);

const { BlogPost, sequelize } = require('../models');

const OUT_DIR = path.resolve(
  __dirname,
  '../../../frontend/public/blog-images'
);

// --- Per-post art direction --------------------------------------------------
// `accent` is the splash colour. `headline` is split into 1-3 lines because
// hand-breaking reads cleaner than auto-wrap at this point size.
const COVERS = [
  {
    slug: 'income-tax-act-2025-salaried-checklist-june-2026',
    file: 'income-tax-act-2025.png',
    accent: '#f59e0b', // amber
    category: 'INCOME TAX',
    headline: ['The Income-tax', 'Act, 2025', 'is live.'],
    kicker: 'A JUNE FILING CHECKLIST',
    glyph: '§', // section sign §
  },
  {
    slug: 'gst-2-rate-rationalisation-msme-pricing',
    file: 'gst-2-eight-months.png',
    accent: '#14b8a6', // teal
    category: 'GST',
    headline: ['GST 2.0:', 'eight months', 'in.'],
    kicker: 'WHAT IT DID TO MSME PRICING',
    glyph: '%',
  },
  {
    slug: 'dpdp-act-rules-saas-compliance-checklist-2026',
    file: 'dpdp-rules-saas.png',
    accent: '#8b5cf6', // violet
    category: 'COMPLIANCE & DATA',
    headline: ['DPDP rules', 'are live.', 'Now what?'],
    kicker: 'A SAAS COMPLIANCE NOTE',
    glyph: '{ }',
  },
  {
    slug: 'faceless-assessment-procedural-gaps-2026',
    file: 'faceless-assessment-2026.png',
    accent: '#f43f5e', // rose
    category: 'LITIGATION & PROCEDURE',
    headline: ['Faceless', 'assessment', 'in 2026.'],
    kicker: 'THREE PROCEDURAL GAPS',
    glyph: '¶', // pilcrow ¶
  },
  {
    slug: 'section-43b-h-msme-payment-audit-2026',
    file: 'section-43bh-msme.png',
    accent: '#3b82f6', // blue
    category: 'INCOME TAX · MSME',
    headline: ['Section 43B(h)', 'two years', 'later.'],
    kicker: 'AUDIT-SEASON LESSONS',
    glyph: '₹', // rupee ₹
  },
];

// --- SVG template ------------------------------------------------------------
// 1200x630 = the OG-recommended cover size. Wrapped in <![CDATA] is not
// needed because we own every interpolation point.
const xmlEscape = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const buildSvg = ({ accent, category, headline, kicker, glyph }) => {
  const [h1, h2, h3] = headline;
  const safeCat = xmlEscape(category);
  const safeKicker = xmlEscape(kicker);
  const safeGlyph = xmlEscape(glyph);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b1220"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.82" cy="0.18" r="0.55">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.42"/>
      <stop offset="60%" stop-color="${accent}" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#ffffff" stroke-opacity="0.045" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>

  <!-- Faint topic glyph, sits behind the type -->
  <text x="1140" y="540" text-anchor="end"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="360" font-weight="700"
        fill="${accent}" fill-opacity="0.12">${safeGlyph}</text>

  <!-- Left accent stripe -->
  <rect x="0" y="0" width="6" height="630" fill="${accent}"/>

  <!-- Category chip -->
  <g transform="translate(72,76)">
    <rect width="${Math.max(150, safeCat.length * 10 + 40)}" height="36" rx="18"
          fill="#ffffff" fill-opacity="0.08"
          stroke="#ffffff" stroke-opacity="0.18" stroke-width="1"/>
    <text x="${Math.max(150, safeCat.length * 10 + 40) / 2}" y="24"
          text-anchor="middle"
          font-family="'Helvetica Neue', Arial, sans-serif"
          font-size="13" font-weight="700" letter-spacing="2.2"
          fill="#e2e8f0">${safeCat}</text>
  </g>

  <!-- Headline -->
  <g font-family="Georgia, 'Times New Roman', serif" font-weight="700">
    <text x="72" y="280" font-size="72" fill="#f8fafc">${xmlEscape(h1 || '')}</text>
    <text x="72" y="364" font-size="72" fill="#f8fafc">${xmlEscape(h2 || '')}</text>
    <text x="72" y="448" font-size="72" fill="${accent}">${xmlEscape(h3 || '')}</text>
  </g>

  <!-- Bottom rule + wordmark + kicker -->
  <line x1="72" y1="538" x2="172" y2="538" stroke="${accent}" stroke-width="3"/>
  <text x="72" y="572"
        font-family="'Helvetica Neue', Arial, sans-serif"
        font-size="13" font-weight="700" letter-spacing="2.4"
        fill="#94a3b8">PROFIRMO &#183; THE JOURNAL</text>
  <text x="1128" y="572" text-anchor="end"
        font-family="'Helvetica Neue', Arial, sans-serif"
        font-size="13" font-weight="600" letter-spacing="2"
        fill="#94a3b8">${safeKicker}</text>
</svg>`;
};

// --- Runner ------------------------------------------------------------------
async function run() {
  await sequelize.authenticate();
  console.log('[covers] DB connected.');

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    console.log('[covers] created', OUT_DIR);
  }

  for (const c of COVERS) {
    const post = await BlogPost.findOne({ where: { slug: c.slug } });
    if (!post) {
      console.warn('[covers] no post for slug:', c.slug, '— skipping');
      continue;
    }

    const svg = buildSvg(c);
    const outPath = path.join(OUT_DIR, c.file);
    await sharp(Buffer.from(svg)).png({ quality: 92 }).toFile(outPath);

    const publicUrl = `/blog-images/${c.file}`;
    await post.update({ featuredImage: publicUrl, ogImage: publicUrl });

    console.log('[covers] wrote', outPath, '→', publicUrl);
  }

  console.log('[covers] done.');
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[covers] failed:', err);
    process.exit(1);
  });
