import { AccountProvider } from '@/components/account/layout/provider';
import { SidebarProvider } from '@/components/account/layout/sidebar-context';
import { FormGuardProvider } from '@/components/account/layout/form-guard-context';
import { AccountSidebar, MobileSidebar } from '@/components/account/layout/sidebar';
import { AccountHeader } from '@/components/account/layout/header';
import { AuthGuard } from '@/components/account/layout/auth-guard';
import { NotificationDockPanel } from '@/components/account/notifications';

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AccountProvider>
      <AuthGuard>
        <SidebarProvider>
          <FormGuardProvider>
            <div className="flex min-h-screen bg-page-bg min-w-[390px]">
              <AccountSidebar />
              <div className="relative flex-1 min-w-0 flex flex-col">
                <AccountHeader />
                <main className="flex-1 min-w-0 overflow-x-hidden flex flex-col">
                  {children}
                </main>
              </div>
              <NotificationDockPanel />
            </div>
            <MobileSidebar />
          </FormGuardProvider>
        </SidebarProvider>
      </AuthGuard>
    </AccountProvider>
  );
}
