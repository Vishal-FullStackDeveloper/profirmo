const title = 'About Us';
const description =
  'Learn how Pro Firmo combines AI with a verified network of lawyers, advocates and tax consultants to make expert legal and tax help accessible to everyone.';

export const metadata = {
  title,
  description,
  keywords: [
    'About Pro Firmo',
    'Pro Firmo company',
    'legal consultation platform',
    'tax consultation platform',
    'AI legal matching',
    'verified lawyers',
    'verified tax consultants',
  ],
  alternates: { canonical: '/about' },
  openGraph: { title: `${title} | Pro Firmo`, description, url: '/about' },
  twitter: { title: `${title} | Pro Firmo`, description },
};

export default function AboutLayout({ children }) {
  return children;
}
