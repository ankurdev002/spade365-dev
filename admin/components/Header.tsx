import Logo from "./Logo";
import { useContext, useEffect, useState } from "react";
import Link from "next/link";
import { MenuStore } from "../store/Menu";
import { FaGamepad, FaHandsWash, FaUserFriends } from "react-icons/fa";
import { AiFillBank, AiFillDashboard, AiFillSetting, AiOutlineArrowRight } from "react-icons/ai";
import { SiGoogleanalytics } from "react-icons/si";
import { RiAdminFill, RiStickyNoteLine } from "react-icons/ri";
import { useRouter } from "next/router";
import { BsChevronDown, BsReverseListColumnsReverse } from "react-icons/bs";
import useUser from "../hooks/useUser";
import { MdOutlineLocalOffer } from "react-icons/md";
import { BiCoinStack } from "react-icons/bi";
// import { User } from "../pages/users";

const Header = () => {
  const { toggleSideMenuOpen } = useContext(MenuStore);
  const router = useRouter();
  const [activePage, setActivePage] = useState("deposits");
  const { isLoggedIn, user, logout } = useUser();

  const getActivePage = () => {
    // get the last part of the url and set it as active page
    const path = router.pathname.split("/");
    const lastPath = path[path.length - 1];
    setActivePage(lastPath);
  };

  useEffect(() => {
    getActivePage();
  }, [router.pathname]);

  return (
    <>
      <div className="w-full text-white break-words bg-slate-900 border-b border-white/10">
        <div className="flex justify-between items-center pt-4 pb-2 px-6 text-white break-words sm:mx-auto sm:my-0 sm:w-full container">
          <div className="text-white flex flex-row justify-center items-center">
            <div className="w-36">
              <Link href="/" title="Spade365">
                <Logo size="2xl" />
                {/* <small className="text-xs">Admin Panel</small> */}
              </Link>
              {/* <Link href="/">
                            <Image src={Logo} alt="Spade365" width={400} height={53} />
                        </Link> */}
            </div>
          </div>
          <div className="flex text-black justify-end items-end w-full break-words">
            <Link
              href="https://spade365.com/"
              target={"_blank"}
              className="flex relative justify-center items-center rounded shadow text-xs leading-5 text-center break-words cursor-pointer sm:mr-5 bg-accent text-white px-4 py-2 hover:shadow-lg hover:bg-opacity-80"
            >
              Visit Site <AiOutlineArrowRight className="ml-2" />
            </Link>
            {/* <button
              className="flex relative justify-center items-center ml-2 rounded shadow text-xs leading-5 text-center break-words cursor-pointer bg-white px-4 py-2 hover:shadow-lg hover:bg-opacity-80"
              onClick={toggleSideMenuOpen}
            >
              <FiUser className="w-5 h-5" />
            </button> */}
          </div>
        </div>
      </div>
      <div className="text-white bg-neutral border-b border-white/10">
        <div className="w-full overflow-x-scroll md:overflow-visible scrollbar-hide">
          <div className="grid grid-flow-col auto-cols-auto text-center w-full min-w-[1080px] py-4 my-0 mx-auto container u">
            {user?.access?.dashboard && (
              <Link
                href="/"
                className={`hover:text-secondary relative not-italic leading-3 uppercase cursor-pointer sm:uppercase sm:not-italic sm:leading-3 text-xs ${activePage === "" ? "!text-secondary" : ""}`}
              >
                <div className="flex flex-row justify-center items-center">
                  <AiFillDashboard className="mr-2 text-xl" />
                  <span>Dashboard</span>
                </div>
              </Link>
            )}
            {user?.access?.users && (
              <Link
                href="/users"
                className={`hover:text-secondary relative not-italic leading-3 uppercase cursor-pointer sm:uppercase sm:not-italic sm:leading-3 text-xs ${activePage === "users" ? "!text-secondary" : ""}`}
              >
                <div className="flex flex-row justify-center items-center">
                  <FaUserFriends className="mr-2 text-xl" />
                  <span>Users</span>
                </div>
              </Link>
            )}
            {user?.access?.transactions && (
              <Link
                href="/transactions"
                className={`hover:text-secondary relative not-italic leading-3 uppercase cursor-pointer sm:uppercase sm:not-italic sm:leading-3 text-xs ${activePage === "transactions" ? "!text-secondary" : ""}`}
              >
                <div className="flex flex-row justify-center items-center">
                  <BsReverseListColumnsReverse className="mr-2 text-xl" />
                  <span>Transactions</span>
                </div>
              </Link>
            )}
            {user?.access?.deposits && (
              <Link
                href="/deposits"
                className={`hover:text-secondary relative not-italic leading-3 uppercase cursor-pointer sm:uppercase sm:not-italic sm:leading-3 text-xs ${activePage === "deposits" ? "!text-secondary" : ""}`}
              >
                <div className="flex flex-row justify-center items-center">
                  <BiCoinStack className="mr-2 text-xl" />
                  <span>Deposits</span>
                </div>
              </Link>
            )}
            {user?.access?.withdrawals && (
              <Link
                href="/withdrawals"
                className={`hover:text-secondary relative not-italic leading-3 uppercase cursor-pointer sm:uppercase sm:not-italic sm:leading-3 text-xs ${activePage === "withdrawals" ? "!text-secondary" : ""}`}
              >
                <div className="flex flex-row justify-center items-center">
                  <FaHandsWash className="mr-2 text-xl" />
                  <span>Withdraws</span>
                </div>
              </Link>
            )}
            {user?.access?.offers && (
              <Link
                href="/offers"
                className={`hover:text-secondary relative not-italic leading-3 uppercase cursor-pointer sm:uppercase sm:not-italic sm:leading-3 text-xs ${activePage === "offers" ? "!text-secondary" : ""}`}
              >
                <div className="flex flex-row justify-center items-center">
                  <MdOutlineLocalOffer className="mr-2 text-xl" />
                  <span>Offers</span>
                </div>
              </Link>
            )}
            {user?.access?.bankAccounts && (
              <Link
                href="/bankAccounts"
                className={`hover:text-secondary relative not-italic leading-3 uppercase cursor-pointer sm:uppercase sm:not-italic sm:leading-3 text-xs ${activePage === "bankAccounts" ? "!text-secondary" : ""}`}
              >
                <div className="flex flex-row justify-center items-center">
                  <AiFillBank className="mr-2 text-xl" />
                  <span>BankAccounts</span>
                </div>
              </Link>
            )}
            {/* {user?.access?.reports && (
              <Link
                href="/reports/market-analysis"
                className={`hover:text-secondary relative not-italic leading-3 uppercase cursor-pointer sm:uppercase sm:not-italic sm:leading-3 text-xs ${activePage === "market-analysis" ? "!text-secondary" : ""}`}
              >
                <div className="flex flex-row justify-center items-center">
                  <SiGoogleanalytics className="mr-2 text-xl" />
                  <span>Market<span className="hidden lg:inline-block"> Analysis</span></span>
                </div>
              </Link>
            )} */}
            {user?.access?.reports && (
              <></>
              // <Link
              //   href="/reports/betlist/"
              //   className={`hover:text-secondary relative not-italic leading-3 uppercase cursor-pointer sm:uppercase sm:not-italic sm:leading-3 text-xs ${activePage === "transactions" ? "!text-secondary" : ""}`}
              // >
              //   <div className="flex flex-row justify-center items-center">
              //     <BsReverseListColumnsReverse className="mr-2 text-xl" />
              //     <span>Bets</span>
              //   </div>
              // </Link>
              // <div
              //   className={`hover:text-secondary not-italic !overflow-y-visible z-10 leading-3 uppercase cursor-pointer sm:uppercase sm:not-italic sm:leading-3 text-xs group inline-block relative`}
              // >
              //   <Link
              //     href="/reports"
              //     className="flex flex-row justify-center items-center ">
              //     <RiStickyNoteLine className="mr-2 text-xl" />
              //     <span>Reports</span>
              //     <BsChevronDown className="ml-2 text-base" />
              //   </Link>
              //   <ul className="absolute hidden text-left text-white bg-neutral py-2 group-hover:block">
              //     <li className="">
              //       <Link
              //         className="rounded-t hover:text-secondary p-2 block whitespace-no-wrap"
              //         href="/reports/betlist"
              //       >Bet List</Link>
              //     </li>
              //     {/* <li className="">
              //       <Link
              //         className="hover:text-secondary p-2 block whitespace-no-wrap"
              //         href="/reports/account-statement"
              //       >My Account Statement</Link>
              //     </li>
              //     <li className="">
              //       <Link
              //         className="rounded-b hover:text-secondary p-2 block whitespace-no-wrap"
              //         href="/reports/admin-statement"
              //       >Admin Account Statement</Link>
              //     </li> */}
              //     {/* <li className="">
              //       <Link
              //         className="rounded-b hover:text-secondary p-2 block whitespace-no-wrap"
              //         href="/reports/user-statement"
              //       >User Account Statement</Link>
              //     </li> */}
              //     <li className="">
              //       <Link
              //         className="rounded-b hover:text-secondary p-2 block whitespace-no-wrap"
              //         href="/reports/pl-statement"
              //       >P&L Statement</Link>
              //     </li>
              //     <li className="">
              //       <Link
              //         className="rounded-b hover:text-secondary p-2 block whitespace-no-wrap"
              //         href="/reports/user-history"
              //       >User History</Link>
              //     </li>
              //     <li className="">
              //       <Link
              //         className="rounded-b hover:text-secondary p-2 block whitespace-no-wrap"
              //         href="/reports/alert-bets"
              //       >Alert Bets</Link>
              //     </li>
              //     <li className="">
              //       <Link
              //         className="rounded-b hover:text-secondary p-2 block whitespace-no-wrap"
              //         href="/reports/game-report"
              //       >Game Report</Link>
              //     </li>
              //     <li className="">
              //       <Link
              //         className="rounded-b hover:text-secondary p-2 block whitespace-no-wrap"
              //         href="/reports/commission"
              //       >Commission Report</Link>
              //     </li>
              //   </ul>
              // </div>
            )}
            {user?.access?.team && (
              <Link
                href="/team"
                className={`hover:text-secondary relative not-italic leading-3 uppercase cursor-pointer sm:uppercase sm:not-italic sm:leading-3 text-xs ${activePage === "team" ? "!text-secondary" : ""}`}
              >
                <div className="flex flex-row justify-center items-center">
                  <RiAdminFill className="mr-2 text-xl" />
                  <span>Admins</span>
                </div>
              </Link>
            )}
            {user?.access?.games && (
              <Link
                href="/games"
                className={`hover:text-secondary relative not-italic leading-3 uppercase cursor-pointer sm:uppercase sm:not-italic sm:leading-3 text-xs ${activePage === "games" ? "!text-secondary" : ""}`}
              >
                <div className="flex flex-row justify-center items-center">
                  <FaGamepad className="mr-2 text-xl" />
                  <span>Games</span>
                </div>
              </Link>
            )}
            {user?.access?.settings && (
              <Link
                href="/settings"
                className={`hover:text-secondary relative not-italic leading-3 uppercase cursor-pointer sm:uppercase sm:not-italic sm:leading-3 text-xs ${activePage === "settings" ? "!text-secondary" : ""}`}
              >
                <div className="flex flex-row justify-center items-center">
                  <AiFillSetting className="mr-2 text-xl" />
                  <span>Settings</span>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
