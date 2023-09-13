import { Router } from "next/router";
import { useContext, useEffect, useState } from "react";
import Marquee from "react-fast-marquee";
import { MenuStore } from "../store/Menu";
import Footer from "./Footer";
import Header from "./Header";
import Loader from "./Loader";
import Menu from "./Menu";
import SideMenu from "./SideMenu";
import { useRouter } from "next/router";
import { ToastContainer } from 'react-toastify';
import useUser from "../hooks/useUser";
import LoginBox from "./LoginBox";
import { User } from "../pages/users";

export default function Layout({ children }: React.PropsWithChildren<{}>) {
  const router = useRouter();
  const { sideMenuOpen, menuOpen, toggleMenuOpen, toggleSideMenuOpen } = useContext(MenuStore);
  const [isAdminPanel, setIsAdminPanel] = useState(false);
  const { isLoggedIn, user, logout } = useUser();

  // on route change, if access isnt true in user.access, redirect to home
  useEffect(() => {
    if (isLoggedIn && user && !canUserAccess(user)) {
      router.push("/no-access");
    }
  }, [router.pathname, user]);


  const canUserAccess = (user: User) => {
    // check if pagepath is in user's access
    if (user?.access) {
      const access = user?.access;
      if (!access) return false;
      let pagePath = router.pathname.split("/")[1];
      // if pagePath is empty, set it to dashboard
      if (pagePath === "") {
        pagePath = "dashboard";
      }
      // Check if pagePath key is true in access
      if (access[pagePath as keyof typeof access]) {
        return true;
      }
    }
    return false;
  };

  useEffect(() => {
    // on route change: close menus if open
    if (sideMenuOpen) {
      toggleSideMenuOpen();
    }
    if (menuOpen) {
      toggleMenuOpen();
    }
    window.scrollTo(0, 0);
  }, [router.pathname]);

  return (
    <>
      <div>
        <Loader />
        <div>

          <>
            {(isLoggedIn && (user?.role === "admin" || user?.role === "subadmin")) ? (
              <>
                <div className="relative bg-slate-900 text-white">
                  <div>
                    <Header />
                    <div className="container mx-auto px-4 md:px-0 pt-4 pb-20">
                      <div className="lg:grid grid-cols-6">
                        {/* <div className="hidden lg:flex col-span-1">
                          <Menu />
                        </div> */}
                        <div className="min-h-[100vh] col-span-6 h-full flex flex-col justify-start items-start">
                          {/* Body */}
                          {children}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="fixed top-0 right-0 z-10">
                    {/* User/Side Menu */}
                    <SideMenu />
                  </div>
                </div>
                {/* backdrop */}
                {(menuOpen || sideMenuOpen) && (
                  <div
                    className="fixed bg-black inset-0 opacity-50"
                    onClick={
                      sideMenuOpen
                        ? toggleSideMenuOpen
                        : menuOpen
                          ? toggleMenuOpen
                          : undefined
                    }
                  ></div>
                )}
              </>
            ) : (
              // if not logged in, show login box
              <>
                <LoginBox />
              </>
            )
            }
          </>
        </div>
        <ToastContainer
          position="bottom-center"
          autoClose={1500}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </>
  );
}
