import { AccountSidebar } from '@/components/layout/account-sidebar';

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex min-h-screen">
      <AccountSidebar />
      <main className="flex-1 bg-gray-50">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
