import Link from "next/link";
import { AiFillDashboard, AiFillSetting, AiOutlineStock } from "react-icons/ai";
import { FaHandsWash, FaUserFriends } from "react-icons/fa";
import { RiLuggageDepositFill, RiStickyNoteLine } from "react-icons/ri";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { SiGoogleanalytics } from "react-icons/si";
import { BiCog } from "react-icons/bi";

const links = [
  {
    label: "Dashboard",
    icon: AiFillDashboard,
    to: "/",
  },
  {
    label: "Deposits",
    icon: RiLuggageDepositFill,
    to: "/deposits",
  },
  {
    label: "Withdrawals",
    icon: FaHandsWash,
    to: "/withdrawals",
  },
  {
    label: "Users",
    icon: FaUserFriends,
    to: "/users",
  },
  {
    label: "Admins",
    icon: FaUserFriends,
    to: "/team",
  },
  {
    label: "Settings",
    icon: AiFillSetting,
    to: "/settings",
  },
  {
    label: "Reports",
    icon: RiStickyNoteLine,
    to: "",
    children: [
      {
        label: "Bet List",
        to: "/reports/betlist",
      },
      {
        label: "My Account Statement",
        to: "/reports/account-statement",
      },
      {
        label: "Admin Account Statement",
        to: "/reports/admin-statement",
      },
      {
        label: "User Account Statement",
        to: "/reports/user-statement",
      },
      {
        label: "P&L Statement",
        to: "/reports/pl-statement",
      },
      {
        label: "User History",
        to: "/reports/user-history",
      },
      {
        label: "Alert Bets",
        to: "/reports/alert-bets",
      },
      {
        label: "Game Report",
        to: "/reports/game-report",
      },
      {
        label: "Commission Report",
        to: "/reports/commission",
      },
    ],
  },
  {
    label: "Market Analysis",
    icon: SiGoogleanalytics,
    to: "/reports/market-analysis",
  },
];

type Links = typeof links;

export default function Menu() {
  const router = useRouter();
  const [activePage, setActivePage] = useState("deposits");

  const getActivePage = () => {
    // get the last part of the url and set it as active page
    const path = router.pathname.split("/");
    const lastPath = path[path.length - 1];
    setActivePage(lastPath);
    console.log(lastPath)
  };

  useEffect(() => {
    getActivePage();
  }, [router.pathname]);

  return (
    <>
      <div className="w-full h-full bg-black text-white">
        <div className="bg-slate-900/90 w-full h-full border-r border-white/10 shadow-lg">
          <div className="flex flex-col justify-start items-start text-left my-0 mx-auto py-6">
            {links.map((link, index) =>
              link.to ? (
                <Link
                  key={index}
                  href={link.to}
                  className={`hover:text-black hover:bg-secondary py-4 px-8 relative not-italic uppercase cursor-pointer sm:uppercase sm:not-italic block w-full ${activePage === link.to.replace("/", "") ? "text-black bg-secondary" : ""}`}
                >
                  <div className="flex flex-row justify-start items-center">
                    <link.icon className="mr-2 text-xl" />
                    <span>{link.label}</span>
                  </div>
                </Link>
              ) : (
                <SubLinkParent key={index} activePage={activePage} link={link} />
              )
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function SubLinkParent({
  activePage,
  link,
}: {
  activePage: string;
  link: Links[0];
}) {
  const [open, setOpen] = useState(false);

  const toggleOpen = () => setOpen((s) => !s);
  return (
    <>
      <button
        className={`hover:text-black hover:bg-secondary py-6 px-8 relative not-italic leading-3 uppercase cursor-pointer sm:uppercase sm:not-italic sm:leading-3 flex items-center justify-between w-full`} onClick={toggleOpen}
      >
        <div className="flex flex-row justify-start items-center">
          <link.icon className="mr-2 text-xl" />
          <span>{link.label}</span>
        </div>
        {open ? <FiChevronUp /> : <FiChevronDown />}
      </button>
      {open && (
        <div className="flex flex-col justify-start items-start text-left my-0 mx-auto max-w-[90vw]">
          {(link.children ?? []).map((link, index) => (
            <Link
              key={index}
              href={link.to}
              className={`hover:text-black hover:bg-secondary py-3 px-8 text-sm relative not-italic uppercase cursor-pointer sm:uppercase sm:not-italic block w-full ${activePage === link.to.replace("/", "") ? "text-black bg-secondary" : ""
                }`}
            >
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
