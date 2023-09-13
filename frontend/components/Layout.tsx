import { useContext, useEffect, useState } from "react";
import { MenuStore } from "../store/Menu";
import Footer from "./Footer";
import Header from "./Header";
import Loader from "./Loader";
import Menu from "./Menu";
import SideMenu from "./SideMenu";
import { useRouter } from "next/router";
import { ToastContainer } from 'react-toastify';
import useUser from "../hooks/useUser";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import WhatsAppFloating from "./WhatsAppFloating";

export default function Layout({ children }: React.PropsWithChildren<{}>) {
  const router = useRouter();
  const { sideMenuOpen, menuOpen, toggleMenuOpen, toggleSideMenuOpen } =
    useContext(MenuStore);
  const { isLoggedIn, user, logout } = useUser();
  const [isHome, setIsHome] = useState(false);

  // if user is not logged in, and route starts with /user, redirect to login page
  useEffect(() => {
    if (!isLoggedIn && (router.pathname.startsWith("/user") || router.pathname.startsWith("/team"))) {
      router.push("/");
      // TODO: show login popup here. Create a login popup context?
    }
  }, [isLoggedIn, router.pathname, user]);

  // check if homepage
  useEffect(() => {
    router.pathname === "/" ? setIsHome(true) : setIsHome(false);
  }, [router.pathname]);

  useEffect(() => {
    // on route change: close menus if open
    if (sideMenuOpen) toggleSideMenuOpen();
    if (menuOpen) toggleMenuOpen();
    window.scrollTo(0, 0);
  }, [router.pathname]);

  return (
    <>
      <div>
        <Loader />
        <div>
          <>
            <div className="relative">
              <div className="fixed top-0 z-40">
                <Menu />
              </div>
              <div className="bg-gradient-to-r from-accent/20 to-secondary/20 lg:from-accent/20 lg:to-secondary/20">
                <div className="sticky top-0 z-20">
                  <Header />
                </div>
                {/* Main Content */}
                <div className="min-h-[400px] flex flex-col lg:justify-center items-center">
                  {/* <div className={`w-full mx-auto grid gap-4 lg:grid-cols-[1fr]`}> */}
                  <div className={`w-full mx-auto grid gap-4 ${isHome ? 'lg:grid-cols-[max-content,1fr]' : 'lg:grid-cols-[1fr]'}`}>
                    {isHome && <LeftSidebar />}
                    <div>
                      {children}
                    </div>
                    {/* <RightSidebar /> */}
                  </div>
                </div>
              </div>
              <div className="fixed top-0 right-0 z-40">
                {/* User/Side Menu */}
                <SideMenu />
              </div>
            </div>

            {/* backdrop */}
            {(menuOpen || sideMenuOpen) && (
              <div
                className="fixed bg-black inset-0 opacity-50 z-30"
                onClick={
                  sideMenuOpen
                    ? toggleSideMenuOpen
                    : menuOpen
                      ? toggleMenuOpen
                      : undefined
                }
              ></div>
            )}
            {!isLoggedIn && <WhatsAppFloating />}
            <Footer />
          </>
        </div>
        <ToastContainer
          position="bottom-center"
          autoClose={5000}
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
