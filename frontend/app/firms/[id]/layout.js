const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const FALLBACK_TITLE = 'Firm profile';
const FALLBACK_DESCRIPTION =
  'View this legal or tax advisory firm on Pro Firmo — explore its team, practice areas, and client reviews.';

function trimText(text, max = 160) {
  if (!text) return '';
  const clean = String(text).replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

async function fetchFirm(id) {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/firms/${encodeURIComponent(id)}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return (json && (json.data || json)) || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const firm = await fetchFirm(id);

  if (!firm || !firm.id) {
    return {
      title: FALLBACK_TITLE,
      description: FALLBACK_DESCRIPTION,
      alternates: { canonical: `/firms/${id}` },
      robots: { index: false, follow: true },
    };
  }

  const firmName = firm.firmName || FALLBACK_TITLE;
  const firmType = firm.firmType || 'Firm';
  const title = `${firmName} - ${firmType} - Profirmo`;
  const aboutText = firm.about || firm.description || '';
  const description = aboutText
    ? trimText(aboutText, 160)
    : trimText(
        `${firmName} is a verified ${firmType}${
          firm.city ? ` based in ${firm.city}` : ''
        } on Pro Firmo${
          firm.establishedYear ? `, established in ${firm.establishedYear}` : ''
        }.`,
        160
      );

  const keywords = [
    firmName,
    firmType,
    firm.city,
    firm.establishedYear && `Established ${firm.establishedYear}`,
    ...(Array.isArray(firm.practiceAreas) ? firm.practiceAreas : []),
    ...(Array.isArray(firm.services) ? firm.services : []),
    ...(Array.isArray(firm.specializations) ? firm.specializations : []),
    'Pro Firmo',
  ].filter(Boolean);

  const canonical = `/firms/${firm.id}`;
  const ogImages = firm.logo ? [{ url: firm.logo }] : undefined;

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      title,
      description,
      url: canonical,
      images: ogImages,
    },
    twitter: {
      card: ogImages ? 'summary_large_image' : 'summary',
      title,
      description,
      images: ogImages,
    },
  };
}

export default function FirmProfileLayout({ children }) {
  return children;
}
