const title = 'Search Professionals';
const description =
  'Search verified legal and tax professionals by keyword, profession and city, and book an online consultation with Pro Firmo.';

export const metadata = {
  title,
  description,
  keywords: [
    'search lawyers',
    'search tax consultants',
    'find legal professionals',
    'find tax professionals',
    'lawyer search by city',
    'GST consultant search',
    'income tax consultant search',
    'advocate search',
  ],
  alternates: { canonical: '/search' },
  openGraph: { title: `${title} | Pro Firmo`, description, url: '/search' },
  twitter: { title: `${title} | Pro Firmo`, description },
};

export default function SearchLayout({ children }) {
  return children;
}
