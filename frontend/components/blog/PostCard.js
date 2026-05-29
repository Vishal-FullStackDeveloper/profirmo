'use client';

// PostCard — listing card for /blog. Designed to feel editorial: large
// rounded image, tight typography, hover lift. Image is optional — falls
// back to a gradient placeholder so the grid stays even.

import Link from 'next/link';
import { Calendar, Clock, Tag } from 'lucide-react';

function fmtDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function PostCard({ post, featured = false }) {
  if (!post) return null;
  const href = `/blog/${post.slug}`;
  const category = post.category;
  const date = fmtDate(post.publishedAt || post.createdAt);

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-lg ${
        featured ? 'lg:flex-row' : ''
      }`}
    >
      <Link
        href={href}
        // 1200/630 matches the OG-spec cover PNGs, so object-cover does not
        // crop the left accent stripe or the right kicker on the editorial
        // covers we ship.
        className={`relative block aspect-[1200/630] overflow-hidden bg-slate-100 ${
          featured ? 'lg:aspect-auto lg:w-1/2 lg:self-stretch' : ''
        }`}
        aria-label={post.title}
      >
        {post.featuredImage ? (
          <img
            src={post.featuredImage}
            alt={post.title}
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-400 via-rose-500 to-violet-600 text-3xl font-bold text-white/80">
            {post.title?.[0] || 'P'}
          </div>
        )}
      </Link>
      <div
        className={`flex flex-1 flex-col gap-3 p-5 sm:p-6 ${
          featured ? 'lg:p-8' : ''
        }`}
      >
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {category && (
            <Link
              href={`/blog?categorySlug=${category.slug}`}
              className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 font-semibold text-amber-800 transition hover:bg-amber-200"
            >
              {category.name}
            </Link>
          )}
          {date && (
            <span className="inline-flex items-center gap-1 text-slate-500">
              <Calendar size={12} />
              {date}
            </span>
          )}
          {post.readingMinutes && (
            <span className="inline-flex items-center gap-1 text-slate-500">
              <Clock size={12} />
              {post.readingMinutes} min read
            </span>
          )}
        </div>
        <Link href={href} className="group/title">
          <h2
            className={`font-bold text-slate-900 transition group-hover/title:text-amber-700 ${
              featured ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl'
            }`}
          >
            {post.title}
          </h2>
        </Link>
        {post.excerpt && (
          <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">
            {post.excerpt}
          </p>
        )}
        {Array.isArray(post.tags) && post.tags.length > 0 && (
          <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
            <Tag size={12} className="text-slate-400" />
            {post.tags.slice(0, 4).map((t) => (
              <Link
                key={t.id}
                href={`/blog?tagSlug=${t.slug}`}
                className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-200"
              >
                #{t.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
