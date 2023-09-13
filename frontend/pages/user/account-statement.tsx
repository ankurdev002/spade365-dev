import Head from "next/head";
import { useEffect, useState } from "react";
import { AiOutlineArrowLeft, AiOutlineArrowRight } from "react-icons/ai";

export interface AccountStatement {
    platform: string;
    amount: number;
    date: string;
    description: string;
    pAndL: number;
    creditLimit: number;
}

export default function AccountStatement() {
    const [accountStatement, setAccountStatement] = useState<AccountStatement[]>([
        {
            platform: "Evolution",
            amount: 200,
            date: "04:00PM, 25 Dec 2022",
            description: "Betting P&L",
            pAndL: 200,
            creditLimit: 0,
        },
        {
            platform: "XYZ",
            amount: 4000,
            date: "02:00PM, 12 Dec 2022",
            description: "Sports Bonus",
            pAndL: 4000,
            creditLimit: 200,
        },
        {
            platform: "Evolution",
            amount: 1000,
            date: "02:00PM, 25 Nov 2022",
            description: "Live Casino",
            pAndL: 4000,
            creditLimit: 0,
        },
        {
            platform: "Evolution",
            amount: 200,
            date: "02:00PM, 25 Nov 2022",
            description: "Live Casino",
            pAndL: -400,
            creditLimit: 0,
        },
    ]);
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const fetchAccountStatement = async () => {
        // TODO: fetch user account statement from API.
        // - Pass page number multiplied by 20 as skip in query
    }

    useEffect(() => {
        fetchAccountStatement();
    }, []);

    return (
        <>
            <Head>
                <title>Account Statement | Spade365</title>
                <meta name="description" content="User Account Statement" />
            </Head>
            <div className="text-black bg-white px-6 py-12 break-words w-full max-w-7xl mx-auto">
                <h2 className="text-center text-5xl">Account Statement</h2>
                <div className="flex flex-col max-w-5xl mx-auto w-full mt-8">

                    {/* show if empty transfer statement */}
                    {accountStatement.length === 0 && (
                        <p className="text-center text-xl mb-8 max-w-xs mx-auto">No data to display.</p>
                    )}

                    {/* table with date/time, amount and status */}
                    <table className="table-auto w-full text-left">
                        <thead>
                            <tr>
                                <th className="px-2 lg:px-4 py-2 border font-bold">Platform</th>
                                <th className="px-2 lg:px-4 py-2 border font-bold">Amount</th>
                                <th className="px-2 lg:px-4 py-2 border font-bold">P&amp;L</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(accountStatement && accountStatement.length > 0) && (
                                accountStatement.map((statement: AccountStatement, index: number) => (
                                    <tr key={index}>
                                        <td className="border px-2 lg:px-4 py-2">
                                            <div className="flex flex-col justify-start items-start">
                                                <span className="font-bold text-xl">{statement.platform}</span>
                                                <span className="text-sm">{statement.description}</span>
                                                <span className="text-sm mt-4">{statement.date}</span>
                                            </div>
                                        </td>
                                        <td className="border px-2 lg:px-4 py-2">{statement.amount}</td>
                                        <td className={`border px-2 lg:px-4 py-2 ${(statement.pAndL >= 0 ? 'text-green-600' : 'text-red-600')}`}>
                                            {statement.pAndL > 0 ? '+' : ''}{statement.pAndL}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* pagination */}
                <div className="flex flex-row justify-center items-center my-12">
                    <button className="bg-primary hover:bg-neutral/80 text-white font-bold py-2 px-4 rounded-l text-center flex flex-row items-center justify-center" onClick={() => setPage(page - 1)}>
                        <AiOutlineArrowLeft className='mr-2' />{'Previous'}
                    </button>
                    <button className="bg-primary hover:bg-neutral/80 text-white font-bold py-2 px-4 rounded-r text-center border-l-2 flex flex-row items-center justify-center" onClick={() => setPage(page + 1)}>
                        {'Next'}<AiOutlineArrowRight className='ml-2' />
                    </button>
                </div>
            </div>
        </>
    )
}