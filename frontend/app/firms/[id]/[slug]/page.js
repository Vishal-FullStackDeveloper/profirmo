// Slug-suffixed variant: /firms/:id/:slug
// The slug is for SEO + sharable URLs only — the page resolves the firm
// purely by `id` via useParams() in FirmProfilePage. Re-exports the same
// component so both /firms/firm-1 and /firms/firm-1/sharma-legal-llp render
// the same page.
export { default } from '../page';
