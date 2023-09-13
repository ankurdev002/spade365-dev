import Link from "next/link";
import Image from "next/image";
import useUser from "../hooks/useUser";
import LoginModal, { Action } from "../components/LoginModal";
import { useState } from "react";
import useSiteContext from "../hooks/useSiteContext";

export default function LeftSidebar() {
  const { isLoggedIn, user, logout, token } = useUser();
  const [loginVisibile, setLoginVisible] = useState(false);
  const site = useSiteContext();
  const linkItemStyle = "flex gap-3 py-4 px-3 select-none cursor-pointer items-center";
  return (
    <>
      <div className="hidden lg:block bg-blue-500/05 bg-white text-black sticky shadow-2xl">
        <div className="sticky left-0 top-20 font-semibold">
          <ul className="mt-2 px-2 py-6 lg:p-4">
            <li>
              <Link href="/sportsbook/?group=Cricket" className={linkItemStyle}>
                <Image src="/img/cricket.png" width={30} height={30} alt={""} />
                Cricket
              </Link>
            </li>
            <li>
              <Link href="/sportsbook/?group=Soccer" className={linkItemStyle}>
                <Image src="/img/football.png" width={30} height={30} alt={""} />
                Football
              </Link>
            </li>
            <li>
              <Link href="/sportsbook/?group=Tennis" className={linkItemStyle}>
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
              <Link href="/indian-card-games" className={linkItemStyle}>
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
            <h2 className="text-center text-xl px-4">Get Instant ID on WhatsApp</h2>
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
    </>
  )
}
