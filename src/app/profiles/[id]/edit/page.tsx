'use client';

import React, { useState, useEffect, use } from 'react';
import AppShell from '@/components/layout/AppShell';
import ProfileForm from '@/components/profiles/ProfileForm';
import { Profile } from '@/types';
import { Loader2 } from 'lucide-react';

export default function EditProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/profiles/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Profile not found');
        return res.json();
      })
      .then(data => setProfile(data.profile))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          <p className="text-xs font-mono text-cyan-300">
            Loading Profile Parameters...
          </p>
        </div>
      </AppShell>
    );
  }

  if (error || !profile) {
    return (
      <AppShell>
        <div className="p-8 text-center text-rose-400 font-mono text-sm">
          {error || 'Unable to load profile for editing.'}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="animate-in fade-in duration-300">
        <ProfileForm initialData={profile} isEditing={true} />
      </div>
    </AppShell>
  );
}
