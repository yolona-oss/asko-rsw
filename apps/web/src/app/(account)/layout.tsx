import { AccountProvider } from '@/components/account/account-provider';
import { AccountSidebar } from '@/components/account/sidebar';
import { AccountHeader } from '@/components/account/account-header';
import { AuthGuard } from '@/components/account/auth-guard';
import { DevAccountSwitcher } from '@/components/dev/dev-account-switcher';

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AccountProvider>
      <AuthGuard>
        <div className="flex min-h-screen bg-page-bg lg:max-w-7xl lg:mx-auto min-w-[390px]">
          <AccountSidebar />
          <div className="relative flex-1 min-w-0 flex flex-col">
            <AccountHeader />
            <main className="flex-1 min-w-0">
              {children}
            </main>
          </div>
        </div>
        <DevAccountSwitcher />
      </AuthGuard>
    </AccountProvider>
  );
}
