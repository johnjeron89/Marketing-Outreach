import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/shared/sidebar';
import { Header } from '@/components/shared/header';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  
  if (!userId) redirect('/login');
  
  // Try to get workspace, redirect to onboarding if not found
  let workspace = null;
  try {
    const { db } = await import('@/lib/db');
    workspace = await db.workspace.findUnique({
      where: { supabaseUserId: userId },
      include: { companyProfile: true, settings: true }
    });
  } catch (e) {
    // DB not available - render layout anyway for development
    console.error("Database connection failed, using fallback layout mode", e);
  }
  
  // If DB works but workspace not found, redirect to onboarding
  // Note: this assumes onboarding creates the workspace
  // Uncomment when DB is ready:
  // if (!workspace && process.env.NODE_ENV !== 'development') {
  //   redirect('/onboarding/company');
  // }
  
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="transition-all duration-300 ml-[72px] lg:ml-[280px]">
        <Header />
        <main className="min-h-[calc(100vh-4rem)] p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </main>
      </div>
    </div>
  );
}
