import Link from "next/link";
import { BsBank2 } from "react-icons/bs";
import { FaRegMoneyBillAlt, FaGlassCheers } from "react-icons/fa";
import { useContext, Fragment } from "react";
import { MenuStore } from "../store/Menu";
import { Transition } from "@headlessui/react";
import { FiClock, FiList, FiLogOut, FiX } from "react-icons/fi";
import { RiHandCoinLine } from "react-icons/ri";
import { TbBook2 } from "react-icons/tb";
import { HiLockClosed } from "react-icons/hi";
import { TfiNotepad } from "react-icons/tfi";
import { AiFillSetting } from "react-icons/ai";
import { MdPolicy, MdPrivacyTip } from "react-icons/md";
import useUser from "../hooks/useUser";

export default function SideMenu() {
  const { sideMenuOpen, toggleSideMenuOpen } = useContext(MenuStore);
  const { user, logout } = useUser();
  const menu = [
    {
      label: "Transactions",
      to: "/user/transactions",
      icon: FaRegMoneyBillAlt,
    },
    {
      label: "open bets",
      to: "/user/bets",
      icon: FiList,
    },
    {
      label: "betting profit & loss",
      to: "/user/betting-profit-loss",
      icon: FaRegMoneyBillAlt,
    },
    {
      label: "account statement",
      to: "/user/account-statement",
      icon: FaRegMoneyBillAlt,
    },
    {
      label: "bonus statement",
      to: "/user/bonus-statement",
      icon: RiHandCoinLine,
    },
    // {
    //   label: "transfer statement",
    //   to: "/user/transfer-statement",
    //   icon: TbBook2,
    // },
    {
      label: "time setting",
      to: "/user/time-setting",
      icon: FiClock,
    },
    {
      label: "change password",
      to: "/user/change-password",
      icon: HiLockClosed,
    },
    {
      label: "rules & regulations",
      to: "/rules-regulations",
      icon: TfiNotepad,
    },
    {
      label: "settings",
      to: "/user/settings",
      icon: AiFillSetting,
    },
    {
      label: "exclusion policy",
      to: "/exclusion-policy",
      icon: MdPolicy,
    },
    {
      label: "responsible gambling",
      to: "/responsible-gambling",
      icon: FaGlassCheers,
    },
    {
      label: "privacy policy",
      to: "/privacy",
      icon: MdPrivacyTip,
    },
  ];

  return (
    <Transition
      show={sideMenuOpen}
      as={Fragment}
      enter="transition-all ease-linear duration-400"
      enterFrom="-mr-[100%]"
      enterTo="w-80 lg:w-96 mr-0"
      leave="transition-all duration-400 ease-linear"
      leaveFrom="mr-0 opacity-100"
      leaveTo="-mr-[100%] opacity-0"
    >
      <div className="h-screen sticky top-0">
        {/* close btn */}
        <Transition.Child
          as={Fragment}
          enter="transition-all duration-150 ease-linear delay-250"
          enterFrom="opacity-0"
          enterTo="-translate-x-full opacity-100"
          leave="transition-all ease-linear duration-150"
          leaveFrom="-translate-x-full opacity-100"
          leaveTo="translate-x-full opacity-0"
        >
          <button
            className="bg-white h-7 pl-2 pr-2 absolute -left-0 translate-y-full rounded-l-full"
            onClick={toggleSideMenuOpen}
          >
            <FiX className="h-5 w-5" />
          </button>
        </Transition.Child>
        <div className="h-screen overflow-auto w-full bg-white pb-12">
          {/* id */}
          <p className="py-6 mx-4 font-bold text-center text-lg border-b-[1px]">
            91_{user?.phone}
          </p>

          {/* credit balance */}
          <div className="mx-4 border-b-[1px]">
            <div className="flex gap-3 items-center py-3">
              <BsBank2 className="text-primary w-5 h-5" />
              <p className="font-medium py-3">Balance information</p>
            </div>

            <div className="flex justify-between text-sm mb-3">
              <p>Available Credit:</p>
              <p className="font-bold">{user?.credit}</p>
            </div>
            <div className="flex justify-between text-sm">
              <p>Net Exposure:</p>
              <p>0.00</p>
            </div>

            <div className="flex justify-between items-center py-5 gap-4">
              <Link
                href="/user/deposit"
                className="bg-primary text-white px-3 py-2 rounded-md hover:bg-primary/80"
              >
                Deposit
              </Link>
              <Link
                href="/user/withdraw"
                className="bg-primary text-white px-3 py-2 rounded-md hover:bg-primary/80"
              >
                Withdrawal
              </Link>
            </div>
          </div>

          {/* menu */}
          <ul>
            {menu.map((menu, i) => (
              <li key={i} className="mx-4 border-b-[1px]">
                <Link href={menu.to} className="flex gap-3 items-center py-4">
                  <menu.icon className="text-primary w-5 h-5" />
                  <p className="font-medium capitalize">{menu.label}</p>
                </Link>
              </li>
            ))}
          </ul>
          <div className="px-4 border-t-[1px] absolute bottom-0 left-0 right-0 bg-white">
            <button
              className="flex gap-3 items-center py-4"
              onClick={() => {
                logout();
                toggleSideMenuOpen();
              }}
            >
              <FiLogOut className="text-primary w-5 h-5" />
              <p className="font-medium capitalize">sign out</p>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  );
}
