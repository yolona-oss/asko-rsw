import { AccountProvider } from '@/components/account/account-provider';
import { AccountSidebar } from '@/components/account/sidebar';
import { AccountHeader } from '@/components/account/account-header';
import { AuthGuard } from '@/components/account/auth-guard';

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AccountProvider>
      <AuthGuard>
        <div className="flex min-h-screen bg-page-bg max-w-7xl lg:w-7xl mx-auto">
          <AccountSidebar />
          <div className="relative flex-1 flex flex-col">
            <AccountHeader />
            <main className="flex-1">
              {children}
            </main>
          </div>
        </div>
      </AuthGuard>
    </AccountProvider>
  );
}
