const title = 'Pricing';
const description =
  'Simple, transparent per-minute consultation pricing on Pro Firmo. No subscriptions — pay only for the expert legal and tax advice you use.';

export const metadata = {
  title,
  description,
  keywords: [
    'Pro Firmo pricing',
    'legal consultation pricing',
    'tax consultation pricing',
    'per minute lawyer rates',
    'online consultation cost',
    'no subscription legal advice',
  ],
  alternates: { canonical: '/pricing' },
  openGraph: { title: `${title} | Pro Firmo`, description, url: '/pricing' },
  twitter: { title: `${title} | Pro Firmo`, description },
};

export default function PricingLayout({ children }) {
  return children;
}
