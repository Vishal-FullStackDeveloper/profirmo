const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const FALLBACK_TITLE = 'Professional profile';
const FALLBACK_DESCRIPTION =
  'View this verified legal or tax professional on Pro Firmo — read about their experience, services, availability and client reviews.';

function trimText(text, max = 160) {
  if (!text) return '';
  const clean = String(text).replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

async function fetchProfessional(id) {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/professionals/${encodeURIComponent(id)}`,
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
  const pro = await fetchProfessional(id);

  if (!pro || !pro.id) {
    return {
      title: FALLBACK_TITLE,
      description: FALLBACK_DESCRIPTION,
      alternates: { canonical: `/professionals/${id}` },
      robots: { index: false, follow: true },
    };
  }

  const name = pro.name || pro.fullName || FALLBACK_TITLE;
  const profession =
    pro.professionalType || pro.profession || pro.specialization || 'Professional';
  const title = `${name} - ${profession} - Profirmo`;
  const aboutText = pro.about || pro.bio || '';
  const description = aboutText
    ? trimText(aboutText, 160)
    : trimText(
        `${name} is a verified ${profession}${
          pro.city ? ` based in ${pro.city}` : ''
        } on Pro Firmo${
          pro.experience ? ` with ${pro.experience}+ years of experience` : ''
        }.`,
        160
      );

  const keywords = [
    name,
    profession,
    pro.city,
    pro.firm && pro.firm.firmName,
    ...(Array.isArray(pro.expertise) ? pro.expertise : []),
    ...(Array.isArray(pro.specializations) ? pro.specializations : []),
    ...(Array.isArray(pro.skills) ? pro.skills : []),
    ...(Array.isArray(pro.languages) ? pro.languages : []),
    'Pro Firmo',
  ].filter(Boolean);

  const canonical = `/professionals/${pro.id}`;
  const ogImages = pro.profilePhoto ? [{ url: pro.profilePhoto }] : undefined;

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    openGraph: {
      type: 'profile',
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

export default function ProfessionalProfileLayout({ children }) {
  return children;
}
