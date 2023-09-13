import Head from "next/head";
import { useEffect, useState } from "react";
import { AiOutlineArrowLeft, AiOutlineArrowRight } from "react-icons/ai";

export interface BonusStatement {
    date: string;
    amount: number;
    status: "success" | "fail";
}

export default function BonusStatement() {
    const [walletType, setWalletType] = useState<"general" | "sports" |
        "casino">("general");
    const [bonusStatement, setBonusStatement] = useState<BonusStatement[]>([
        {
            date: "04:00PM, 09 Dec 2022",
            amount: 200,
            status: "success",
        },
        {
            date: "02:00PM, 12 Dec 2022",
            amount: 4000,
            status: "success",
        },
    ]);
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const fetchBonusStatement = async () => {
        // TODO: fetch user bonus statement from API.
        // - Pass walletType as query.
        // - Pass page number multiplied by 20 as skip in query
    }

    useEffect(() => {
        fetchBonusStatement();
    }, []);

    return (
        <>
            <Head>
                <title>Bonus Statement | Spade365</title>
                <meta name="description" content="Bonus Statement | Spade365" />
            </Head>
            <div className="text-black bg-white px-6 py-12 break-words w-full max-w-7xl mx-auto">
                <h2 className="text-center text-5xl">Bonus Statement</h2>
                <div className="flex flex-col max-w-5xl mx-auto w-full mt-8">

                    {/* select box with label: Wallet Type */}
                    <div className="flex flex-col justify-between items-center mb-8">
                        <label className="text-xl font-bold mb-2" htmlFor="wallet-type">Wallet Type</label>
                        <select
                            className="w-1/2 h-12 border border-neutral/80 rounded-lg px-2 lg:px-4"
                            name="wallet-type"
                            id="wallet-type"
                            value={walletType}
                            onChange={(e) => setWalletType(e.target.value as any)}
                        >
                            <option value="general">General Bonus</option>
                            <option value="sports">Sports Bonus</option>
                            <option value="casino">Casino Bonus</option>
                        </select>
                    </div>

                    {/* show if empty transfer statement */}
                    {bonusStatement.length === 0 && (
                        <p className="text-center text-xl mb-8 max-w-xs mx-auto">No data to display.<br />Try changing the wallet type.</p>
                    )}

                    {/* table with date/time, amount and status */}
                    <table className="table-auto w-full text-left">
                        <thead>
                            <tr>
                                <th className="px-2 lg:px-4 py-2 border font-bold">Date</th>
                                <th className="px-2 lg:px-4 py-2 border font-bold">Amount</th>
                                <th className="px-2 lg:px-4 py-2 border font-bold">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(bonusStatement && bonusStatement.length > 0) && (
                                bonusStatement.map((statement: BonusStatement, index: number) => (
                                    <tr key={index}>
                                        <td className="border px-2 lg:px-4 py-2">{statement.date}</td>
                                        <td className="border px-2 lg:px-4 py-2">{statement.amount}</td>
                                        <td className="border px-2 lg:px-4 py-2">{statement.status}</td>
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