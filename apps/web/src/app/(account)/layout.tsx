import { AccountProvider } from '@/components/account/account-provider';
import { SidebarProvider } from '@/components/account/sidebar-context';
import { AccountSidebar, MobileSidebar } from '@/components/account/sidebar';
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
        <SidebarProvider>
          <div className="flex min-h-screen bg-page-bg min-w-[390px]">
            <AccountSidebar />
            <div className="relative flex-1 min-w-0 flex flex-col">
              <AccountHeader />
              <main className="flex-1 min-w-0 overflow-x-hidden flex flex-col">
                {children}
              </main>
            </div>
          </div>
          <MobileSidebar />
        </SidebarProvider>
      </AuthGuard>
    </AccountProvider>
  );
}
