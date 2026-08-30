'use client';

import React from 'react';
import AppShell from '@/components/layout/AppShell';
import ProfileForm from '@/components/profiles/ProfileForm';

export default function NewProfilePage() {
  return (
    <AppShell>
      <div className="animate-in fade-in duration-300">
        <ProfileForm isEditing={false} />
      </div>
    </AppShell>
  );
}
