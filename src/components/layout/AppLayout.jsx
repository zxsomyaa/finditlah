import { Outlet } from "react-router-dom";
import MobileNav from "./MobileNav";
import { ScrollPreservationProvider } from "@/lib/ScrollPreservationContext";
import { TabNavigationProvider } from "@/lib/TabNavigationContext";

export default function AppLayout() {
  return (
    <TabNavigationProvider>
      <ScrollPreservationProvider>
        <div className="min-h-screen bg-background flex flex-col">
          {/* Main content — bottom padding accounts for nav height + safe area */}
          <main
            className="flex-1"
            style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom, 0px))" }}
          >
            <Outlet />
          </main>
          <MobileNav />
        </div>
      </ScrollPreservationProvider>
    </TabNavigationProvider>
  );
}