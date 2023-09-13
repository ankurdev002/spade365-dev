import Head from "next/head";
import { useEffect, useState } from "react";
import { AiOutlineArrowLeft, AiOutlineArrowRight } from "react-icons/ai";

export interface TransferStatement {
    date: string;
    amount: number;
    status: "success" | "fail";
}

export default function TransferStatement() {
    const [transferStatement, setTransferStatement] = useState<TransferStatement[]>([
        {
            date: "04:00PM, 20 Dec 2022",
            amount: 15000,
            status: "success",
        },
        {
            date: "10:30PM, 09 Nov 2022",
            amount: 1000,
            status: "success",
        },
        {
            date: "12:00PM, 01 Jan 2023",
            amount: 200,
            status: "fail",
        },
    ]);
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const fetchStatement = async () => {
        // TODO: fetch user transfer statement from API
        // - Pass page number multiplied by 20 as skip in query
    }

    useEffect(() => {
        fetchStatement();
    }, []);

    return (
        <>
            <Head>
                <title>Transfer Statement | Spade365</title>
                <meta name="description" content="Transfer Statement | Spade365" />
            </Head>
            <div className="text-black bg-white px-6 py-12 break-words w-full max-w-7xl mx-auto">
                <h2 className="text-center text-5xl">Transfer Statement</h2>
                <div className="flex flex-col max-w-5xl mx-auto w-full mt-8">

                    {/* show if empty transfer statement */}
                    {transferStatement.length === 0 && (
                        <p className="text-center text-xl mb-8 max-w-xs mx-auto">There have been no transfers in the last 2 weeks.</p>
                    )}

                    {/* table with date/time, amount and status */}
                    <table className="table-auto w-full text-left">
                        <thead>
                            <tr>
                                <th className="px-2 lg:px-4 py-2 border font-bold">Date/Time</th>
                                <th className="px-2 lg:px-4 py-2 border font-bold">Amount</th>
                                <th className="px-2 lg:px-4 py-2 border font-bold">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(transferStatement && transferStatement.length > 0) && (
                                transferStatement.map((statement: TransferStatement, index: number) => (
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