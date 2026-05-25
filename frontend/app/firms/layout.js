const title = 'Legal & Tax Firms';
const description =
  'Explore trusted legal and tax advisory firms on Pro Firmo and connect with their teams of verified professionals.';

export const metadata = {
  title,
  description,
  keywords: [
    'legal firms',
    'tax firms',
    'law firms in India',
    'tax advisory firms',
    'verified legal firms',
    'CA firms',
    'GST consultancy firms',
    'company registration firms',
    'firm directory',
    'Pro Firmo firms',
  ],
  alternates: { canonical: '/firms' },
  openGraph: { title: `${title} | Pro Firmo`, description, url: '/firms' },
  twitter: { title: `${title} | Pro Firmo`, description },
};

export default function FirmsLayout({ children }) {
  return children;
}
