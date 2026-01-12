import Header from "./header";
import Sidebar from "./sidebar";
import { ReactNode, useState } from "react";
import { GroupingsPageProps } from "../../types";

interface LayoutProps {
  children: ReactNode;
  user?: GroupingsPageProps | null;
}

import MobileHeader from "./MobileHeader";

function Layout({ children, user }: LayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (user) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-gray-50/50">
        <MobileHeader user={user} />
        <Sidebar
          user={user}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />
        <main
          className={`flex-1 h-screen overflow-y-auto transition-all duration-300 ${
            isCollapsed ? "p-0" : "p-4 md:p-8"
          }`}
        >
          <div className={`${isCollapsed ? "" : "max-w-7xl mx-auto"}`}>
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <div className="">
        <Header user={user} />
        <main>{children}</main>
      </div>
    </>
  );
}

export default Layout;
