import {
    AiOutlineArrowLeft,
    AiOutlineArrowRight,
    AiOutlineLoading3Quarters,
} from "react-icons/ai";
import { useState, useEffect } from "react";
import { convertReadableDate } from '../helpers/date';
import Head from "next/head";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { User } from "./users";
import Link from "next/link";
import { HiRefresh } from "react-icons/hi";

export interface Transaction {
    id: number;
    user_id: number;
    user?: User;
    type: string;
    amount: number;
    game_data: string;
    status: string;
    remark: string;
    reference: string;
    timestamp: string;
    user_balance: number;
    createdAt?: string;
    updatedAt?: string;
}

export default function Transactions() {
    const router = useRouter();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState("");
    const [hasNextPage, setHasNextPage] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const fetchTransactions = async () => {
        setLoading(true);
        const limit = 40;
        const skip = page > 1 ? (page - 1) * limit : 0;
        const options = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        };

        const response = await fetch(`/api/transactions?limit=${limit}&skip=${skip}&status=${status}&user=${router.query.user || 0}`, options);

        if (response.status === 200) {
            const data = await response.json();
            if (!response.ok) {
                const error = (data && data.message) || response.status;
                return Promise.reject(error);
            }
            setTransactions(data);
            setHasNextPage(data && data.length >= limit);
            setLoading(false);
        } else {
            toast.error(await response.text());
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [page, status, router.query.user]);
    return (
        <>
            <Head>
                <title>Transactions | Spade365</title>
                <meta name="description" content="Transactions | Spade365" />
            </Head>
            <div className="flex flex-col justify-start items-center min-h-[800px] w-full mx-auto overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between w-full items-center mb-8 md:mb-4">
                    <h1 className="text-center md:text-left text-4xl lg:text-5xl my-6 w-1/2">
                        Transactions {router.query.user && <span className="font-bold">for {router.query.user}</span>}
                        <button className="bg-white text-black p-1 text-2xl cursor-pointer rounded ml-4" title="Refresh" onClick={() => {
                            fetchTransactions();
                            toast.success('Transactions refreshed successfully!')
                        }} >
                            <HiRefresh />
                        </button>
                    </h1>
                    {/* Status */}
                    <div className="flex flex-row justify-center md:justify-start items-center w-full md:w-1/2">
                        <div className="md:ml-auto flex flex-row justify-center items-center">
                            <Link href={`/reports/betlist/?user=${router.query.user || ''}`} className="ml-4 py-2 px-6 bg-blue-600 hover:bg-blue-800 text-white rounded-md flex flex-row justify-center items-center mr-2 font-bold">View {router.query.user ? `User` : `All`} Bets</Link>
                            {/* select box with filter */}
                            <select
                                className="bg-gray text-white text-base font-semibold py-2 pl-4 pr-8 rounded bg-transparent"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <option className="bg-slate-900 text-white" value="">ALL</option>
                                <option className="bg-slate-900 text-white" value="pending">Pending</option>
                                <option className="bg-slate-900 text-white" value="success">Success</option>
                                <option className="bg-slate-900 text-white" value="rejected">Rejected</option>
                                <option className="bg-slate-900 text-white" value="reverted">Reverted</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className='overflow-x-scroll scrollbar-hide w-full'>
                    {/* table with team, user, amount, date, status, action */}
                    <table className="table-auto w-full text-left break-words">
                        <thead className="bg-primary text-white">
                            <tr>
                                <th className="border border-white/20 px-2 md:px-4 py-2">
                                    ID
                                </th>
                                <th className="border border-white/20 px-2 md:px-4 py-2">
                                    Updated
                                </th>
                                <th className="border border-white/20 px-2 md:px-4 py-2 text-center">
                                    Type
                                </th>
                                <th className="border border-white/20 px-2 md:px-4 py-2 text-center">
                                    Amount
                                </th>
                                <th className="border border-white/20 px-2 md:px-4 py-2 text-center">
                                    Balance
                                </th>
                                <th className="border border-white/20 px-2 md:px-4 py-2">
                                    Remark
                                </th>
                                <th className="border border-white/20 px-2 md:px-4 py-2">
                                    User
                                </th>
                                <th className="border border-white/20 px-2 md:px-4 py-2 text-center">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* map through transactions and display them */}
                            {transactions.map((transaction) => (
                                <tr key={transaction.id} className={`h-[120px]`}>
                                    <td className={`border border-white/20 px-2 md:px-4 py-2 font-bold text-center`}>
                                        {transaction.id}
                                    </td>
                                    <td className="border border-white/20 px-2 md:px-4 py-2">
                                        {transaction.updatedAt && convertReadableDate(transaction.updatedAt as string)}
                                    </td>
                                    <td className={`border border-white/20 px-2 md:px-4 py-2 font-bold ${transaction.type === "Bet: WON" || transaction.type === "credit" ? "text-green-500" : transaction.type === "Bet: LOST" || transaction.type === "debit" ? "text-red-500" : transaction.type === "Bet: VOID" ? "text-yellow-500" : "text-white"}`}>
                                        {transaction.type}
                                    </td>
                                    <td className={`border border-white/20 px-2 md:px-4 py-2 font-bold text-white`}>
                                        ₹ {transaction.amount}
                                    </td>
                                    <td className="border border-white/20 px-2 md:px-4 py-2 text-center">
                                        ₹ {transaction.user_balance}
                                    </td>
                                    <td className="border border-white/20 px-2 md:px-4 py-2 capitalize">
                                        <div className="flex flex-col justify-start items-start h-full">
                                            <span>{transaction.remark}</span>
                                            {transaction.reference && <span className="flex flex-row">Ref. ID: {transaction.reference}</span>}
                                        </div>
                                    </td>
                                    <td className="border border-white/20 px-2 md:px-4 py-2 text-left min-w-[250px]">
                                        <div className="flex flex-col justify-start items-start h-full">
                                            {transaction.user_id && <span className="flex flex-row"><strong>ID</strong>: <Link href={`/users?user=${transaction.user_id}`} className="font-bold">{transaction.user_id}</Link></span>}
                                            {transaction.user?.phone && <span><strong>Phone</strong>: {transaction.user.phone}</span>}
                                            {<span><strong>Wallet</strong>: ₹ {transaction?.user?.credit || 0}</span>}
                                            {transaction.user?.bonus ? <span><strong>Bonus</strong>: ₹ {transaction.user.bonus}</span> : ''}
                                        </div>
                                    </td>
                                    <td className="border border-white/20 px-2 md:px-4 py-2 min-w-[200px]">
                                        <div className='grid grid-cols-1 gap-2'>
                                            {transaction.user_id && (
                                                <>
                                                    <Link href={`/users?user=${transaction.user_id}`} className="bg-white hover:bg-gray-200 text-black font-bold py-2 px-2 md:px-6 rounded text-center flex flex-row items-center justify-center col-span-1">View User</Link>
                                                    <Link href={`/reports/betlist?user=${transaction.user_id}`} className="bg-white hover:bg-gray-200 text-black font-bold py-2 px-2 md:px-6 rounded text-center flex flex-row items-center justify-center col-span-1">View Bets</Link>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                {loading && (
                                    <td
                                        colSpan={18}
                                        className="border border-white/20 px-4 py-8 text-center"
                                    >
                                        <div className="flex flex-row justify-center items-center text-white">
                                            <AiOutlineLoading3Quarters className="animate-spin text-3xl mr-2" />
                                        </div>
                                    </td>
                                )}
                            </tr>
                        </tfoot>
                    </table>
                </div>
                {/* pagination */}
                {(page > 1 || hasNextPage) && (
                    <div className="flex flex-row justify-center items-center my-12">
                        {page > 1 && (
                            <button
                                className="bg-primary hover:bg-neutral/80 text-white font-bold py-2 px-4 rounded-l text-center flex flex-row items-center justify-center"
                                onClick={() => setPage(page - 1)}
                            >
                                <AiOutlineArrowLeft className="mr-2" />
                                {"Previous"}
                            </button>
                        )}
                        {hasNextPage && (
                            <button
                                className="bg-primary hover:bg-neutral/80 text-white font-bold py-2 px-4 rounded-r text-center border-l-2 border-white/20 flex flex-row items-center justify-center"
                                onClick={() => setPage(page + 1)}
                            >
                                {"Next"}
                                <AiOutlineArrowRight className="ml-2" />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
