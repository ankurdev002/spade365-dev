import {
    AiOutlineArrowLeft,
    AiOutlineArrowRight,
    AiOutlineLoading3Quarters,
} from "react-icons/ai";
import { useState, useEffect } from "react";
import { convertReadableDate } from '../../helpers/date';
import Head from "next/head";
import { toast } from "react-toastify";
// import { User } from "../users";
import Link from "next/link";
import { HiRefresh } from "react-icons/hi";

export interface Log {
    id: number;
    type: string, // type of log: error, info, warning, etc
    message: string, // log message
    createdAt?: string;
    updatedAt?: string;
}

export default function Logs() {
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [type, setType] = useState("");
    const [hasNextPage, setHasNextPage] = useState(false);

    const fetchLogs = async () => {
        setLoading(true);
        const limit = 80;
        const skip = page > 1 ? (page - 1) * 80 : 0;
        const options = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        };

        const response = await fetch(`/api/team/logs?limit=${limit}&skip=${skip}&type=${type}`, options);

        if (response.status === 200) {
            const data = await response.json();
            if (!response.ok) {
                const error = (data && data.message) || response.status;
                return Promise.reject(error);
            }
            setLogs(data);
            setHasNextPage(data && data.length >= limit);
            setLoading(false);
        } else {
            toast.error(await response.text());
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, type]);
    return (
        <>
            <Head>
                <title>Logs | Spade365</title>
                <meta name="description" content="Logs | Spade365" />
            </Head>
            <div className="flex flex-col justify-start items-center min-h-[800px] w-full mx-auto overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between w-full items-center mb-8 md:mb-4">
                    <h1 className="text-center md:text-left text-4xl lg:text-5xl my-6 w-1/2">
                        Logs
                        <button className="bg-white text-black p-1 text-2xl cursor-pointer rounded ml-4" title="Refresh" onClick={() => {
                            fetchLogs();
                            toast.success('Logs refreshed successfully!')
                        }} >
                            <HiRefresh />
                        </button>
                    </h1>
                    {/* Status */}
                    <div className="flex flex-row justify-center md:justify-start items-center w-full md:w-1/2">
                        <div className="md:ml-auto flex flex-row justify-center items-center">
                            {/* select box with filter */}
                            <select
                                className="bg-gray text-white text-base font-semibold py-2 pl-4 pr-8 rounded bg-transparent"
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                            >
                                <option className="bg-slate-900 text-white" value="">ALL</option>
                                <option className="bg-slate-900 text-white" value="info">Info</option>
                                <option className="bg-slate-900 text-white" value="error">Error</option>
                                <option className="bg-slate-900 text-white" value="warning">Warning</option>
                                <option className="bg-slate-900 text-white" value="success">Success</option>
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
                                    Date
                                </th>
                                <th className="border border-white/20 px-2 md:px-4 py-2 text-center">
                                    Type
                                </th>
                                <th className="border border-white/20 px-2 md:px-4 py-2 text-center">
                                    Message
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* map through logs and display them */}
                            {logs.map((log) => (
                                <tr key={log.id} className={`h-[120px]`}>
                                    <td className={`border border-white/20 px-2 md:px-4 py-2 font-bold text-center`}>
                                        {log.id}
                                    </td>
                                    <td className="border border-white/20 px-2 md:px-4 py-2">
                                        {log.updatedAt && convertReadableDate(log.updatedAt as string)}
                                    </td>
                                    <td className={`border border-white/20 px-2 md:px-4 py-2 font-bold ${log.type === "success" ? "text-green-500" : log.type === "error" || log.type === "warning" ? "text-red-500" : log.type === "info" ? "text-yellow-500" : "text-white"}`}>
                                        {log.type}
                                    </td>
                                    <td className={`border border-white/20 px-2 md:px-4 py-2 text-white`}>
                                        {log.message}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                {loading && (
                                    <td colSpan={18} className="border border-white/20 px-4 py-8 text-center">
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
