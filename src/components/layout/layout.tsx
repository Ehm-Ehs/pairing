import Header from "./header";
import { Outlet } from "react-router-dom";

function Layout() {
  return (
    <>
      <div className="">
        <Header user />
        <main>
          <Outlet />
        </main>
      </div>
    </>
  );
}

export default Layout;
