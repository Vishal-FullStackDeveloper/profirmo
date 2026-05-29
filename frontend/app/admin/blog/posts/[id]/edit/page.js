'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, AlertTriangle, ExternalLink } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import BlogPostForm from '@/components/admin/BlogPostForm';
import { adminGetPost } from '@/services/blogService';
import { ROLES } from '@/utils/constants';

export default function EditBlogPostPage() {
  const params = useParams();
  const id = params && params.id;
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const p = await adminGetPost(id);
      setPost(p);
    } catch (err) {
      setError(err.message || 'Could not load this post.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <DashboardLayout
      role={ROLES.PLATFORM_ADMIN}
      title={post ? `Edit · ${post.title}` : 'Edit post'}
      subtitle="Live changes save server-side. Use Draft to hide while editing."
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button href="/admin/blog" variant="outline" size="sm">
            <ArrowLeft size={15} />
            Back to posts
          </Button>
          {post && post.status === 'published' && (
            <Button
              href={`/blog/${post.slug}`}
              variant="outline"
              size="sm"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={15} />
              View public page
            </Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-64 w-full animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : error ? (
          <Card>
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertTriangle size={22} />
              </span>
              <p className="text-sm font-medium text-slate-700">{error}</p>
              <Button size="sm" onClick={load}>
                Try again
              </Button>
            </div>
          </Card>
        ) : post ? (
          <BlogPostForm post={post} onSaved={load} />
        ) : null}
      </div>
    </DashboardLayout>
  );
}
