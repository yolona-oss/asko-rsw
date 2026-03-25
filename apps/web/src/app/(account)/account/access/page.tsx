'use client';

import { redirect } from 'next/navigation';

export default function AccessPage() {
  redirect('/account/users');
}
