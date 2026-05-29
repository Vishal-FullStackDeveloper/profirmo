'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Button from '@/components/common/Button';
import BlogPostForm from '@/components/admin/BlogPostForm';
import { ROLES } from '@/utils/constants';

export default function NewBlogPostPage() {
  const router = useRouter();
  return (
    <DashboardLayout
      role={ROLES.PLATFORM_ADMIN}
      title="New post"
      subtitle="Write a story for the journal"
    >
      <div className="space-y-4">
        <Button href="/admin/blog" variant="outline" size="sm">
          <ArrowLeft size={15} />
          Back to posts
        </Button>
        <BlogPostForm
          post={null}
          onSaved={(saved) => {
            if (saved && saved.id) {
              router.push(`/admin/blog/posts/${saved.id}/edit`);
            } else {
              router.push('/admin/blog');
            }
          }}
        />
      </div>
    </DashboardLayout>
  );
}
