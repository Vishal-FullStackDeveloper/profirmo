// Slug-suffixed variant: /professionals/:id/:slug
// The slug is for SEO + sharable URLs only — the page resolves the
// professional purely by `id` via useParams() in ProfessionalProfilePage.
// Re-exports the same component so both /professionals/prof-1 and
// /professionals/prof-1/rohan-sharma render the same page.
export { default } from '../page';
