import Link from "next/link";
import { useContext, Fragment, useState } from "react";
import { MenuStore } from "../store/Menu";
import { Transition } from "@headlessui/react";
import Image from "next/image";
import useUser from "../hooks/useUser";
import LoginModal, { Action } from "../components/LoginModal";
import useSiteContext from "../hooks/useSiteContext";

const Menu = () => {
  const { menuOpen } = useContext(MenuStore);
  const { isLoggedIn, user, logout, token } = useUser();
  const site = useSiteContext();
  const [loginVisibile, setLoginVisible] = useState(false);
  const linkItemStyle = "flex gap-3 py-4 px-3 select-none cursor-pointer items-center";
  return (
    <>
      <Transition
        as={Fragment}
        show={menuOpen}
        enter="transition-all ease-linear duration-400"
        enterFrom="-ml-[100%]"
        enterTo="w-80 lg:w-96 ml-0"
        leave="transition-all duration-400 ease-linear"
        leaveFrom="ml-0 opacity-100"
        leaveTo="-ml-[100%] opacity-0"
      >
        <div className="sticky top-0 min-h-screen h-full overflow-auto overflow-y-scroll scrollbar-hide w-64 lg:w-80 z-40 bg-white bg-gradient-to-l from-accent/10 to-secondary/10 lg:from-accent/20 lg:to-secondary/20 text-black shadow-2xl font-semibold">
          <div className="px-2 pb-32 overflow-y-scroll scrollbar-hide absolute inset-0 bg-opacity-40">
            <ul className="mt-4 px-2 py-6 lg:p-4">
              <li>
                <Link href="/sportsbook?group=Cricket" className={linkItemStyle}>
                  <Image src="/img/cricket.png" width={30} height={30} alt={""} />
                  Cricket
                </Link>
              </li>
              <li>
                <Link href="/sportsbook?group=Soccer" className={linkItemStyle}>
                  <Image src="/img/football.png" width={30} height={30} alt={""} />
                  Football
                </Link>
              </li>
              <li>
                <Link href="/sportsbook?group=Tennis" className={linkItemStyle}>
                  <Image src="/img/tennis.png" width={30} height={30} alt={""} />
                  Tennis
                </Link>
              </li>
              <li>
                <Link href="/indian-card-games" className={linkItemStyle}>
                  <Image src="/img/indian-card-games.png" width={30} height={30} alt={""} />
                  Indian Card Games
                </Link>
              </li>
              <li>
                <Link href="/sportsbook/" className={linkItemStyle}>
                  <Image src="/img/sportsbook.png" width={30} height={30} alt={""} />
                  Sportsbook
                </Link>
              </li>
              <li>
                <Link href="/live-casino" className={linkItemStyle}>
                  <Image src="/img/live-casino.png" width={30} height={30} alt={""} />
                  Live Casino
                </Link>
              </li>
              {/* <li>
                <Link href="/slots-games" className={linkItemStyle}>
                  <Image src="/img/slot-games.png" width={30} height={30} alt={""} />
                  Slots Games
                </Link>
              </li> */}
            </ul>
            {!isLoggedIn && (
              <h2 className="text-center text-xl">Get Instant ID on WhatsApp</h2>
            )}
            <ul className="px-2 py-4 lg:p-4 border-opacity-20 border-accent/20">
              <li className="border border-black/40 rounded-md bg-white my-2 max-w-xs">
                <Link
                  href={`https://wa.me/${site.whatsapp_number}?text=Hi%20I%20want%20to%20get%20new%20ID`}
                  target={"_blank"}
                  rel="noreferrer"
                  title="WhatsApp Now"
                  className={`flex gap-3 py-2 px-2 select-none cursor-pointer items-center`}>
                  <Image src="/img/whatsapp.png" width={30} height={30} alt={""} />
                  WhatsApp Now
                </Link>
              </li>
              <li className="border border-black/40 rounded-md bg-white my-2 max-w-xs">
                <Link
                  href={`https://instagram.com/spade365official`}
                  target={"_blank"}
                  rel="noreferrer"
                  title="Follow on Instagram"
                  className={`flex gap-3 py-2 px-2 select-none cursor-pointer items-center`}>
                  <Image src="/img/instagram.png" width={30} height={30} alt={""} />
                  Follow on Instagram
                </Link>
              </li>
              {!isLoggedIn && (
                <>
                  <li className="border border-black/40 rounded-md bg-white my-2 max-w-xs">
                    <button className={`flex gap-3 py-2 px-2 select-none cursor-pointer items-center`} onClick={() => setLoginVisible(true)}>
                      <Image src="/img/user.png" width={30} height={30} alt={""} />
                      Login/Signup
                    </button>
                  </li>
                  <LoginModal
                    isOpen={loginVisibile}
                    closeModal={() => setLoginVisible(false)}
                    active={"login" as Action}
                  />
                </>
              )}
            </ul>

          </div>
        </div>
      </Transition>
    </>
  );
};

export default Menu;
