import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardThemeProvider } from "@/components/dashboard/theme-provider";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import * as React from "react";

export type DashboardLayoutProps = React.PropsWithChildren;

const DashboardLayout: React.FC<DashboardLayoutProps> = async (props) => {
  const { children } = props;

  //* Variables
  const user = await requireUser();

  if (!user.onboardingComplete) {
    redirect("/onboarding");
  }

  return (
    <DashboardThemeProvider>
      <div className="bg-background text-foreground flex min-h-dvh flex-col lg:flex-row">
        <DashboardSidebar user={user} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </DashboardThemeProvider>
  );
};

export default DashboardLayout;
