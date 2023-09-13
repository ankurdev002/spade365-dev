import Head from 'next/head';
import { useEffect, useState } from 'react';
import { AiOutlineArrowLeft, AiOutlineArrowRight } from 'react-icons/ai';
import { FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { Deposit } from './deposit'; // deposit type
import { convertActiveDate, convertReadableDate } from '../../helpers/date';
import impsImg from "../../public/img/imps.png"
import upiImg from "../../public/img/upi.png"
import Image from "next/image"
import { Withdraw } from './withdraw'; // withdraw type
import { useRouter } from 'next/router';

export default function Transactions() {
    const [tab, setTab] = useState(0); // 0 for deposit, 1 for withdrawal
    const [deposits, setDeposits] = useState([] as Deposit[]);
    const [Withdrawals, setWithdrawals] = useState([] as Withdraw[]);
    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(true);
    const router = useRouter();

    // set tab from router query
    useEffect(() => {
        if (router.query.tab) {
            setTab(parseInt(router.query.tab as string))
        }
    }, [router.query.tab])

    // fetch user deposits from api
    const fetchDeposits = async () => {
        const limit = 20;
        const skip = page > 1 ? (page - 1) * 20 : 0;
        const options = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        };

        const response = await fetch(`/api/deposit?limit=${limit}&skip=${skip}&filter=`, options);

        if (response.status === 200) {
            const data = await response.json();
            if (!response.ok) {
                const error = (data && data.message) || response.status;
                return Promise.reject(error);
            }
            setDeposits(data);
            setHasNextPage(data && data.length === limit);
        } else {
            toast.error(await response.text());
        }
    }

    // fetch user withdrawals from api
    const fetchWithdrawals = async () => {
        const limit = 20;
        const skip = page > 1 ? (page - 1) * 20 : 0;
        const options = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        };

        const response = await fetch(`/api/withdraw?limit=${limit}&skip=${skip}&filter=`, options);

        if (response.status === 200) {
            const data = await response.json();
            if (!response.ok) {
                const error = (data && data.message) || response.status;
                return Promise.reject(error);
            }
            setWithdrawals(data);
            setHasNextPage(data && data.length === limit);
        } else {
            toast.error(await response.text());
        }
    }

    // on load, and on page change, fetch deposits and withdrawals
    useEffect(() => {
        fetchDeposits();
        fetchWithdrawals();
    }, [page]);

    return (
        <>
            <Head>
                <title>Transactions | Spade365</title>
                <meta name="description" content="Transactions | Spade365" />
            </Head>
            <div className="text-black break-words w-full max-w-7xl mx-auto px-6 py-12 flex flex-col max-md:p-0">
                <div className="w-full min-h-[70vh] bg-white py-9 px-16 max-md:p-2">
                    <div className="flex py-2 px-8 mb-11 bg-white p-2 rounded w-max mx-auto">
                        <div className={`text-2xl md:mx-5 cursor-pointer max-md:text-xl py-4 px-8 rounded ${tab === 0 && 'md:underline decoration-primary bg-primary text-white'}`} onClick={() => setTab(0)}>Deposits</div>
                        <div className={`text-2xl md:mx-5 cursor-pointer max-md:text-xl py-4 px-8 rounded ${tab === 1 && 'md:underline decoration-primary bg-primary text-white'}`} onClick={() => setTab(1)}>Withdrawals</div>
                    </div>
                    {tab == 0 && <div className="flex-col w-full max-md:mt-8">
                        {deposits && deposits.map((deposit, index) => (
                            <div key={index}>
                                <div key={deposit.id} className="w-full max-w-xl mx-auto mb-6 flex rounded border-2 px-8 py-4 bg-white">
                                    <div className='flex w-[20%]'>
                                        <span className="text-sm mr-2.5">#</span>
                                        {/* last 4 digits of deposit.deposit_account.account */}
                                        {deposit.deposit_account?.method == "upi" ? (
                                            <>
                                                <span className="text-sm">****{deposit.deposit_account?.name.slice(-4)}</span>
                                            </>
                                        ) : (
                                            <span className="text-sm">****{deposit.deposit_account?.account?.slice(-4)}</span>
                                        )}
                                    </div>
                                    <div className='flex flex-col items-center w-[50%]'>
                                        <span className="text-3xl"> <sup>₹</sup>{deposit.amount}</span>
                                        {(deposit.offer_id && deposit.offer) && (
                                            <div className='opacity-75'>
                                                <span className="text-xs text-grey">Bonus: ₹ {deposit.bonus}</span>
                                            </div>
                                        )}
                                        <div className={`text-white uppercase text-sm px-5 py-1 my-2.5 ${deposit.status == "pending" ? "bg-yellow-600" : deposit.status == "approved" ? "bg-green-600" : deposit.status == "rejected" ? "bg-red-600" : ""}`}>{deposit.status}</div>
                                        {deposit.remark && (
                                            <div className='w-full text-xs opacity-100 text-left my-2 max-h-[280px] overflow-scroll'>
                                                <p>
                                                    {deposit.remark && <span>{
                                                        deposit.remark.split("\n").map((item, i) => {
                                                            return <span key={i}>{item}<br /></span>
                                                        })
                                                    }</span>}
                                                </p>
                                            </div>
                                        )}
                                        <div className="flex flex-col justify-center items-center">
                                            <span className="text-sm mr-1">{convertReadableDate(deposit.createdAt as string)}</span>
                                            <span className="text-sm mr-1 opacity-50">{convertActiveDate(deposit.createdAt as string)}</span>
                                        </div>
                                    </div>
                                    <div className='ml-auto w-[20%] uppercase flex flex-col justify-start items-end text-right'>
                                        {deposit.deposit_account?.method == "upi" && (
                                            <>
                                                <Image className="mb-2" src={upiImg} alt="imps" width={80} height={29} />
                                            </>
                                        )}
                                        {deposit.deposit_account?.method == "imps" && (
                                            <>
                                                <Image className="mb-2" src={impsImg} alt="imps" width={80} height={29} />
                                            </>
                                        )}
                                        {(deposit.deposit_account?.method && deposit.deposit_account?.method != "upi" && deposit.deposit_account?.method != "imps") && (
                                            <>
                                                <h3 className="text-2xl my-0 font-bold uppercase">
                                                    {deposit.deposit_account?.method}
                                                </h3>
                                            </>
                                        )}
                                        <span className="text-xs text-grey">{deposit.deposit_account?.method}</span>
                                        <span className="text-xs text-grey">{deposit.deposit_account?.type}</span>
                                    </div>
                                    <div className='mt-auto'>
                                        <FiRefreshCw className='cursor-pointer' onClick={() => fetchDeposits()} />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {deposits && deposits.length == 0 && <div className="w-full max-w-xl mx-auto mb-6 flex rounded border-2 px-8 py-4 bg-white">
                            <div className='flex w-full justify-center items-center'>
                                <span className="text-sm mr-2.5">No deposits yet</span>
                            </div>
                        </div>
                        }
                    </div>}
                    {tab == 1 && (
                        <div className="flex-col w-full max-md:mt-8">
                            {Withdrawals && Withdrawals.map((withdraw, index) => (
                                <div key={withdraw.id} className="w-full max-w-xl mx-auto mb-6 flex rounded border-2 px-8 py-4 bg-white">
                                    <div className='flex w-[20%]'>
                                        <span className="text-sm mr-2.5">#</span>
                                        <span className="text-sm">****{withdraw.bank_account?.account?.slice(-4)}</span>
                                    </div>
                                    <div className='flex flex-col items-center w-[50%]'>
                                        <span className="text-3xl"> <sup>₹</sup>{withdraw.amount}</span>
                                        <div className={`text-white uppercase text-sm px-5 py-1 my-2.5 ${withdraw.status == "pending" ? "bg-yellow-600" : withdraw.status == "approved" ? "bg-green-600" : withdraw.status == "rejected" ? "bg-red-600" : ""}`}>{withdraw.status}</div>
                                        {withdraw.remark && (
                                            <div className='w-full text-xs opacity-100 text-left my-2 max-h-[280px] overflow-scroll'>
                                                <p>
                                                    {withdraw.remark && <span>{
                                                        withdraw.remark.split("\n").map((item, i) => {
                                                            return <span key={i}>{item}<br /></span>
                                                        })
                                                    }</span>}
                                                </p>
                                            </div>
                                        )}
                                        <div className="flex flex-col justify-center items-center">
                                            <span className="text-sm mt-2">{convertReadableDate(withdraw.createdAt as string)}</span>
                                            <span className="text-sm mt-1 opacity-50">{convertActiveDate(withdraw.createdAt as string)}</span>
                                        </div>
                                    </div>
                                    <div className='ml-auto w-[20%] uppercase flex flex-col justify-start items-end text-right'>
                                        <span className="text-xs text-grey">{withdraw.bank_account?.name}</span>
                                        <span className="text-xs text-grey">{withdraw.bank_account?.ifsc}</span>
                                    </div>
                                    <div className='mt-auto'>
                                        <FiRefreshCw className='cursor-pointer' onClick={() => fetchWithdrawals()} />
                                    </div>
                                </div>
                            ))}
                            {Withdrawals && Withdrawals.length == 0 && <div className="w-full max-w-xl mx-auto mb-6 flex rounded border-2 px-8 py-4 bg-white">
                                <div className='flex w-full justify-center items-center'>
                                    <span className="text-sm mr-2.5">No withdrawals yet</span>
                                </div>
                            </div>}
                        </div>
                    )}
                </div>

                {/* pagination */}
                {(page > 1 || hasNextPage) && (
                    <div className="flex flex-row justify-center items-center my-12">
                        {page > 1 && (
                            <button className="bg-primary hover:bg-neutral/80 text-white font-bold py-2 px-4 rounded-l text-center flex flex-row items-center justify-center" onClick={() => setPage(page - 1)}>
                                <AiOutlineArrowLeft className='mr-2' />{'Previous'}
                            </button>
                        )}
                        {hasNextPage && (
                            <button className="bg-primary hover:bg-neutral/80 text-white font-bold py-2 px-4 rounded-r text-center border-l-2 border-white/20 flex flex-row items-center justify-center" onClick={() => setPage(page + 1)}>
                                {'Next'}<AiOutlineArrowRight className='ml-2' />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </>
    )
}