import {
    AiFillAlert,
    AiOutlineHistory,
} from "react-icons/ai";
import { useState, useEffect } from "react";
import Head from "next/head";
import { SiBetfair, SiMarketo } from "react-icons/si";
import { HiDocumentReport } from "react-icons/hi";
import { TbReport, TbReportMoney } from "react-icons/tb";
import { FaCoins, FaRupeeSign } from "react-icons/fa";
import { MdAccountCircle } from "react-icons/md";
import Link from "next/link";

const pages = [
    {
        icon: SiBetfair,
        title: 'Bet List',
        link: '/reports/betlist'
    },
    // {
    //     icon: HiDocumentReport,
    //     title: 'My Account Statement',
    //     link: '/reports/account-statement'
    // },
    // {
    //     icon: TbReportMoney,
    //     title: 'Admin Account Statement',
    //     link: '/reports/admin-statement'
    // },
    {
        icon: AiFillAlert,
        title: 'Alert Bets',
        link: '/reports/alert-bets'
    },
    {
        icon: FaRupeeSign,
        title: 'Commission Report',
        link: '/reports/commission'
    },
    {
        icon: TbReport,
        title: 'Game Report',
        link: '/reports/game-report'
    },
    {
        icon: SiMarketo,
        title: 'Market Analysis',
        link: '/reports/market-analysis'
    },
    {
        icon: FaCoins,
        title: 'P&L Statement',
        link: '/reports/pl-statement'
    },
    {
        icon: AiOutlineHistory,
        title: 'User History',
        link: '/reports/user-history'
    },
    // {
    //     icon: MdAccountCircle,
    //     title: 'User Account Statement',
    //     link: '/reports/user-statement'
    // },
];

export default function AllReports() {
    return (
        <>
            <Head>
                <title>Reports | Spade365</title>
                <meta name="description" content="Reports | Spade365" />
            </Head>
            <div className="flex flex-col justify-start items-center min-h-[800px] w-full mx-auto overflow-hidden">
                <h1 className="text-center md:text-left text-4xl lg:text-5xl my-6">
                    Reports
                </h1>
                <section className="grid grid-cols-2 lg:grid-cols-4 gap-5 w-full mt-8">
                    {pages.map((page, index) => (
                        <Link
                            href={page.link}
                            key={index}
                            className={`relative grid grid-cols-[max-content,1fr] items-center backdrop-blur-sm bg-gradient-to-r from-green-500/50 to-secondary/50 px-2 lg:px-4 py-3 rounded-lg`}
                        >
                            <page.icon className="text-6xl md:text-8xl opacity-20 md:opacity-50" />
                            <div className="text-left md:text-center -ml-12 md:ml-0">
                                <div>
                                    <p className="text-xl">{page.title}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </section>
            </div>
        </>
    );
}
