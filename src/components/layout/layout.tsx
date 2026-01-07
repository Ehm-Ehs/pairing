import Header from "./header";
import { ReactNode } from "react";
import { GroupingsPageProps } from "../../types";

interface LayoutProps {
  children: ReactNode;
  user?: GroupingsPageProps | null;
}

function Layout({ children, user }: LayoutProps) {
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
