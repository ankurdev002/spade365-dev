import Head from 'next/head'
import { useEffect, useState } from 'react'
import { AiFillEdit, AiFillCheckCircle, AiFillCloseCircle, AiOutlineArrowLeft, AiOutlineArrowRight, AiOutlineSearch, AiOutlineLoading3Quarters } from 'react-icons/ai'
import { HiRefresh } from 'react-icons/hi'
import { toast } from 'react-toastify'
import { BankAccount } from './bankAccounts'
import { Offer } from './offers'
import { User } from './users'
import { convertReadableDate } from '../helpers/date'
import Link from 'next/link'
import { useRouter } from 'next/router'

// deposit interface
export interface Deposit {
    id: number // deposit id in database
    user_id?: number // user id in database
    amount: number // request amount in rupees to deposit
    utr: string // unique transaction reference
    status: string // pending, approved, rejected
    bank_id: number // admin bank id in which user deposited
    offer_id?: number // offer used by user
    bonus?: number // bonus amount, calculated by backend from offer (if present) at the time of adding deposit request
    createdAt?: string // date of deposit
    user?: User // details of user who made the deposit
    deposit_account?: BankAccount // details of bank account in which user deposited
    offer?: Offer // details of offer used by user
    remark?: string // remark by admin in case of rejection
}

export default function Deposits() {
    const router = useRouter();
    const [deposits, setDeposits] = useState<Deposit[]>([])
    const [page, setPage] = useState(1)
    const [hasNextPage, setHasNextPage] = useState(false)
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('') // all="", approved, rejected, pending
    const [remark, setRemark] = useState(`Not received`) // remark for rejecting withdraw request
    const [remarkId, setRemarkId] = useState(0) // withdraw id for remark
    const [showRemarkModal, setShowRemarkModal] = useState(false) // show remark modal

    useEffect(() => {
        fetchDeposits()
    }, [page, filter, router.query.user])

    // Fetch deposits from API
    const fetchDeposits = async () => {
        setLoading(true)
        const limit = 20;
        const skip = page > 1 ? (page - 1) * 20 : 0;
        const options = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        };

        const response = await fetch(`/api/deposit?limit=${limit}&skip=${skip}&filter=${filter}&user=${router.query.user || 0}`, options);

        if (response.status === 200) {
            const data = await response.json();
            if (!response.ok) {
                const error = (data && data.message) || response.status;
                return Promise.reject(error);
            }
            setDeposits(data);
            setHasNextPage(data && data.length === limit);
            setLoading(false);
        } else {
            toast.error(await response.text());
        }
        setLoading(false)
    }

    // API Approve deposit
    const approveDeposit = async (id: number) => {
        // get deposit from id
        const deposit = deposits.find(deposit => deposit.id === id)
        // confirm approval
        const confirm = window.confirm(`Are you sure you want to approve this deposit? User\'s account will be credited with ₹ ${deposit?.amount}. ${deposit?.bonus ? `Bonus amount of ₹ ${deposit?.bonus} will also be credited` : ''}`)
        if (!confirm) return
        const options = {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
        };
        const body = JSON.stringify({ status: 'approved' });
        const response = await fetch(`/api/deposit/${id}/`, { ...options, body });
        if (response.status === 200) {
            const data = await response.json();
            if (!response.ok) {
                const error = (data && data.message) || response.status;
                return Promise.reject(error);
            }
            toast.success('Deposit Approved Successfully. User\'s account has been credited.');
            // update deposit status in state
            const updatedDeposits = deposits.map(deposit => {
                if (deposit.id === id) {
                    deposit.status = 'approved'
                }
                return deposit
            })
            setDeposits(updatedDeposits)
        } else {
            toast.error(await response.text());
        }
    }

    // API Reject Deposit
    const rejectDeposit = async (id: number) => {
        if (!showRemarkModal) {
            // setRemark('')
            setShowRemarkModal(true)
            setRemarkId(id)
            return
        }
        // confirm rejection
        const confirm = window.confirm('Are you sure you want to reject this deposit? User will have to request again.')
        if (!confirm) return
        const options = {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
        };
        const body = JSON.stringify({ status: 'rejected', remark });
        const response = await fetch(`/api/deposit/${id}/`, { ...options, body });
        if (response.status === 200) {
            const data = await response.json();
            if (!response.ok) {
                const error = (data && data.message) || response.status;
                return Promise.reject(error);
            }
            toast.success('Deposit Rejected Successfully');
            // update deposit status in state
            const updatedDeposits = deposits.map(deposit => {
                if (deposit.id === id) {
                    deposit.status = 'rejected'
                }
                return deposit
            })
            setDeposits(updatedDeposits)
        } else {
            toast.error(await response.text());
        }
        setShowRemarkModal(false)
    }

    return (
        <>
            <Head>
                <title>Deposits | Spade365</title>
                <meta name="description" content="Deposits | Spade365" />
            </Head>
            <div className="flex flex-col justify-start items-center min-h-[800px] w-full mx-auto overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between w-full items-center mb-8 md:mb-4">
                    <h1 className="text-center md:text-left text-4xl lg:text-5xl my-6 w-1/2">
                        Deposits {router.query.user && `for ${router.query.user}`}
                        <button className="bg-white text-black p-1 text-2xl cursor-pointer rounded ml-4" title="Refresh Deposits" onClick={() => {
                            fetchDeposits()
                            toast.success('Deposits refreshed successfully!')
                        }} >
                            <HiRefresh />
                        </button>
                    </h1>
                    {/* Filter */}
                    <div className="flex flex-row justify-center md:justify-start items-center w-full md:w-1/2">
                        {/* search inpout with search icon */}
                        <div className="md:ml-auto">
                            {/* select box with filter */}
                            <select
                                className="bg-gray text-white text-base font-semibold py-2 pl-4 pr-8 rounded bg-transparent"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            >
                                <option className="bg-slate-900 text-white" value="">All</option>
                                <option className="bg-slate-900 text-white" value="approved">Approved</option>
                                <option className="bg-slate-900 text-white" value="rejected">Rejected</option>
                                <option className="bg-slate-900 text-white" value="pending">Pending</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className='overflow-x-scroll scrollbar-hide w-full'>
                    {/* table with deposits, user, amount, date, status, action */}
                    <table className="table-auto w-full text-center break-words">
                        <thead className="bg-primary text-white">
                            <tr>
                                <th className="border border-white/20 px-4 py-2 text-center">ID</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Date</th>
                                <th className="border border-white/20 px-4 py-2 text-center">User</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Amount (₹)</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Bonus (₹)</th>
                                <th className="border border-white/20 px-4 py-2 text-center">UTR</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Deposit Bank</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Offer Details</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Status</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deposits.map((deposit) => (
                                <tr key={deposit.id} className={`h-[120px] odd:bg-transparent even:bg-primary/10`}>
                                    <td className={`border border-white/20 px-4 py-2 font-bold text-center`}>
                                        {deposit.id}
                                    </td>
                                    <td className={`border border-white/20 px-4 py-2 font-bold text-center`}>
                                        {deposit.createdAt && convertReadableDate(deposit.createdAt as string)}
                                    </td>
                                    <td className="border border-white/20 px-4 py-2 text-left">
                                        <span className='font-bold'>ID: {deposit.user_id}</span>
                                        {deposit.user && (
                                            <>
                                                <span className='block text-sm'>Phone: {deposit.user.phone}</span>
                                                <span className='block text-sm'>Balance: {deposit.user.credit}</span>
                                            </>
                                        )}
                                    </td>
                                    <td className="border border-white/20 px-4 py-2">
                                        <span className='font-bold'>{deposit.amount}</span>
                                    </td>
                                    <td className="border border-white/20 px-4 py-2">
                                        <span className='font-bold'>{deposit.bonus && deposit.bonus}</span>
                                    </td>
                                    <td className="border border-white/20 px-4 py-2">
                                        <span className='font-bold'>{deposit.utr}</span>
                                    </td>
                                    <td className="border border-white/20 px-4 py-2 text-left">
                                        {!!deposit.bank_id && <span>ID: {deposit.bank_id}</span>}
                                        {deposit.deposit_account && (
                                            <>
                                                {deposit.deposit_account.name && <span className='block text-sm'>Bank: {deposit.deposit_account.name}</span>}
                                                {deposit.deposit_account.account_name && <span className='block text-sm'>Name: {deposit.deposit_account.account_name}</span>}
                                                {deposit.deposit_account.ifsc && <span className='block text-sm'>IFSC: {deposit.deposit_account.ifsc}</span>}
                                                {deposit.deposit_account.account && <span className='block text-sm'>Account: {deposit.deposit_account.account}</span>}
                                            </>
                                        )}
                                    </td>
                                    <td className="border border-white/20 px-4 py-2 text-left">
                                        <span className=''>
                                            {deposit.offer_id && (
                                                <>
                                                    <span className='block text-sm'>ID: {deposit.offer_id}</span>
                                                    {deposit.offer && (
                                                        <>
                                                            {deposit.offer.description && <span className='block text-sm'>Code: {deposit.offer.code}</span>}
                                                            {deposit.offer.name && <span className='block text-sm'>Name: {deposit.offer.name}</span>}
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </span>
                                    </td>
                                    <td className={`border border-white/20 text-left px-2 py-2`}>
                                        <div className='flex flex-col justify-start align-start'>
                                            <span className={`uppercase font-bold ${deposit.status == 'pending' ? 'font-bold text-yellow-500' : deposit.status == 'rejected' ? 'text-red-500' : deposit.status == 'approved' ? 'text-green-500' : 'text-white'}`}>{deposit.status}</span>
                                            {deposit.remark && <span className='text-xs'>{deposit.remark}</span>}
                                        </div>
                                    </td>
                                    <td className="border border-white/20 px-4 py-2 max-w-[200px] ">
                                        <div className='grid grid-cols-1 gap-2'>
                                            {deposit.status === 'pending' && (
                                                <>
                                                    {/* edit button */}
                                                    {/* <button className="bg-secondary hover:bg-secondary/80 text-black font-bold py-2 px-4 rounded text-center flex flex-row justify-center items-center">
                                                    <AiFillEdit className='text-2xl' /><span className="ml-2 hidden lg:inline-block">Edit</span>
                                                    /button> */}

                                                    {/* Approve button */}
                                                    <button title='Approve Deposit' onClick={() => approveDeposit(deposit.id)} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-center flex flex-row justify-center items-center col-span-1">
                                                        <AiFillCheckCircle className='text-2xl' />
                                                    </button>

                                                    {/* Reject Button */}
                                                    <button title='Reject Deposit' onClick={() => rejectDeposit(deposit.id)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-center flex flex-row justify-center items-center col-span-1">
                                                        <AiFillCloseCircle className='text-2xl' />
                                                    </button>
                                                </>
                                            )}
                                            {/* View User */}
                                            <Link href={`/users?user=${deposit.user_id}`} className="bg-white hover:bg-gray-200 text-black font-bold py-2 px-4 rounded text-center flex flex-row items-center justify-center col-span-1">View User</Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                {loading && (
                                    <td colSpan={12} className="border border-white/20 px-4 py-8 text-center">
                                        <div className="flex flex-row justify-center items-center text-white">
                                            <AiOutlineLoading3Quarters className='animate-spin text-3xl mr-2' />
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

            {/* Remark Modal */}
            <div className={`fixed top-0 backdrop-blur left-0 w-full h-full bg-black/50 z-50 flex flex-col justify-center items-center ${showRemarkModal ? 'visible' : 'invisible'}`}>
                <div className="bg-slate-900/95 w-[95vw] max-w-[1200px] rounded-md overflow-y-scroll scrollbar-hide flex flex-col justify-start items-start p-4">
                    <div className="flex flex-col justify-start items-start w-full ">
                        <h2 className="text-2xl my-4">Remark/Reason</h2>
                        <textarea
                            className="w-full h-96 p-4 bg-slate-800/80 text-white rounded-md mt-1"
                            value={remark}
                            rows={4}
                            placeholder='Enter remark/reason for rejecting deposit request. Example: Money not recieved waited for 24 hours..'
                            onChange={(e) => setRemark(e.target.value)}
                        />
                        <div className="flex flex-row justify-end items-center w-full mt-4">
                            <button className="bg-white text-black px-4 py-2 text-base rounded-md mr-4" onClick={() => setShowRemarkModal(false)}>
                                Close
                            </button>
                            <button className="bg-red-500 text-white px-4 py-2 text-base rounded-md" onClick={() => rejectDeposit(remarkId)}>
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}