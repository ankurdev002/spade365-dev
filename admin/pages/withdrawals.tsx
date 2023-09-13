import Head from 'next/head'
import { useEffect, useState } from 'react'
import { AiFillEdit, AiFillCheckCircle, AiFillCloseCircle, AiOutlineArrowLeft, AiOutlineArrowRight, AiOutlineSearch, AiOutlineLoading3Quarters } from 'react-icons/ai'
import { HiRefresh } from 'react-icons/hi'
import { toast } from 'react-toastify'
import { BankAccount } from './bankAccounts'
import { convertReadableDate } from '../helpers/date'
import Link from 'next/link'
import { User } from './users'
import { useRouter } from 'next/router'

// Withdraw type
export interface Withdraw {
    id: number // withdraw id
    createdAt?: string // withdraw request date
    updatedAt?: string // withdraw request update date
    user_id: number // user id
    amount: number // withdraw amount
    bank_account: BankAccount // bank account details
    bank_id?: number // bank account id
    status: string // pending, approved, rejected
    user?: User
    reference?: string // reference number
    remark?: string // remark for rejecting withdraw request
}

export default function Withdraws() {
    const router = useRouter()
    const [withdraws, setWithdraws] = useState<Withdraw[]>([])
    const [page, setPage] = useState(1)
    const [hasNextPage, setHasNextPage] = useState(false)
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('') // all="", approved, rejected, pending
    const [remark, setRemark] = useState(`Hi Sir,

Total Rolling Done = 
    
10 Times Rolling and 10 Bets Not Done 
    
Bonus Withdrawal Rules : -
    
10 Times Rolling = Sir If You have Rs 1000 balance (Rs 500 deposit + Rs 500 bonus ) you have to play for minimum Rs 5000 (10 Times the balance ) for Withdrawal.
10 Times Rolling = Sir agar aapka balance Rs 1000 hai ( Rs 500 deposit + Rs 500 bonus ) to aapko minimum Rs 5000 ka khelna hoga ( 10 times the balance ) for Withdrawal.
    
Minimum Bets = Sir you have to Bet Minimum 10 bets for withdrawal ( Minimum bet Rs 100 )
Minimum Bets = Sir aapko Minimum 10 bets khelni hongi for withdrawal ( Minimum bet Rs 100 )
    
These are our bonus withdrawal conditions for 100% deposit bonus.
    
Regards
SPADE 365`) // remark for rejecting withdraw request
    const [remarkId, setRemarkId] = useState(0) // withdraw id for remark
    const [showRemarkModal, setShowRemarkModal] = useState(false) // show remark modal

    // Fetch withdraw requests from API
    const fetchWithdraws = async () => {
        setLoading(true)
        const limit = 20
        const skip = page > 1 ? (page - 1) * 20 : 0
        const options = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        }
        const response = await fetch(`/api/withdraw?limit=${limit}&skip=${skip}&filter=${filter}&user=${router.query.user || 0}`, options);

        if (response.status === 200) {
            const data = await response.json();
            if (!response.ok) {
                const error = (data && data.message) || response.status;
                return Promise.reject(error);
            }
            setWithdraws(data);
            setHasNextPage(data && data.length === limit);
            setLoading(false);
        } else {
            toast.error(await response.text());
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchWithdraws()
    }, [page, filter, router.query.user])

    // Approve withdraw
    const approveWithdraw = async (id: number) => {
        // confirm approval
        const confirm = window.confirm('Are you sure you want to approve this withdrawal? Make sure you have transferred money to user\'s bank account.')
        if (!confirm) return
        const options = {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
        };
        const body = JSON.stringify({ status: 'approved' });
        const response = await fetch(`/api/withdraw/${id}`, { ...options, body });
        if (response.status === 200) {
            const data = await response.json();
            if (!response.ok) {
                const error = (data && data.message) || response.status;
                return Promise.reject(error);
            }
            toast.success('Withdraw request approved successfully. User\'s account balance has been debited.');
            // update withdraw status in state
            const updatedWithdraw = withdraws.map(withdraw => {
                if (withdraw.id === id) {
                    withdraw.status = 'approved'
                }
                return withdraw
            })
            setWithdraws(updatedWithdraw)
        } else {
            toast.error(await response.text());
        }
    }

    // Reject deposit
    const rejectWithdraw = async (id: number) => {
        if (!showRemarkModal) {
            // setRemark('')
            setShowRemarkModal(true)
            setRemarkId(id)
            return
        }
        // confirm rejection
        const confirm = window.confirm('Are you sure you want to reject this withdrawal request? User will have to request again.')
        if (!confirm) return
        const options = {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
        };
        const body = JSON.stringify({ status: 'rejected', remark });
        const response = await fetch(`/api/withdraw/${id}`, { ...options, body });
        if (response.status === 200) {
            const data = await response.json();
            if (!response.ok) {
                const error = (data && data.message) || response.status;
                return Promise.reject(error);
            }
            toast.success('Withdraw requested rejected successfully');
            // update deposit status in state
            const updatedDeposits = withdraws.map(withdraw => {
                if (withdraw.id === id) {
                    withdraw.status = 'rejected'
                }
                return withdraw
            })
            setWithdraws(updatedDeposits)
        } else {
            toast.error(await response.text());
        }
        setShowRemarkModal(false)
    }

    return (
        <>
            <Head>
                <title>Withdrawals | Spade365</title>
                <meta name="description" content="Withdrawals | Spade365" />
            </Head>
            <div className="flex flex-col justify-start items-center min-h-[800px] w-full container mx-auto overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between w-full items-center mb-8 md:mb-4">
                    <h1 className="text-center md:text-left text-4xl lg:text-5xl my-6 w-1/2">
                        Withdraws {router.query.user && `for ${router.query.user}`}
                        <button className="bg-white text-black p-1 text-2xl cursor-pointer rounded ml-4" title="Refresh Withdraws" onClick={() => {
                            fetchWithdraws()
                            toast.success('Withdraws refreshed successfully!')
                        }}>
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
                    <table className="table-auto w-full text-left break-words">
                        <thead className="bg-primary text-white">
                            <tr>
                                <th className="border border-white/20 px-4 py-2 text-center">ID</th>
                                <th className="border border-white/20 px-4 py-2">Date</th>
                                <th className="border border-white/20 px-4 py-2">Details</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Status</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {withdraws.map((withdraw) => (
                                <tr key={withdraw.id} className={`h-[120px] odd:bg-transparent even:bg-primary/10`}>
                                    <td className={`border border-white/20 px-4 py-2 font-bold text-center `}>
                                        {withdraw.id}
                                    </td>
                                    <td className={`border border-white/20 px-4 py-2 font-bold text-left max-w-[120px]`}>
                                        {withdraw.createdAt && convertReadableDate(withdraw.createdAt as string)}
                                    </td>
                                    <td className="border border-white/20 px-4 py-2">
                                        <div className='flex flex-col justify-start align-start'>
                                            <div>
                                                <span>{'User: '}</span><span className='font-bold'>{withdraw.user_id}</span>
                                            </div>
                                            <div>
                                                <span>{'Phone: '}</span><span className='font-bold'>{withdraw?.user?.phone}</span>
                                            </div>
                                            <div>
                                                <span>{'Amount: ₹ '}</span><span className='font-bold'>{withdraw.amount}</span>
                                            </div>
                                            {withdraw?.bank_account && (
                                                <>
                                                    {withdraw?.bank_account?.bank_name && (
                                                        <div>
                                                            <span>{'Bank: '}</span><span className='font-bold'>{withdraw.bank_account.bank_name}</span>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <span>{'IFSC: '}</span><span className='font-bold'>{withdraw.bank_account.ifsc}</span>
                                                    </div>
                                                    <div>
                                                        <span>{'Account Name: '}</span><span className='font-bold'>{withdraw.bank_account.name}</span>
                                                    </div>
                                                    <div>
                                                        <span>{'Ac No.: '}</span><span className='font-bold'>{withdraw.bank_account.account}</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td className={`border border-white/20 uppercase text-left px-2 py-2  `}>
                                        <div className={`flex flex-col justify-start align-start text-white`}>
                                            <span className={`font-bold ${withdraw.status == 'pending' ? 'text-yellow-500' : withdraw.status == 'rejected' ? 'text-red-500' : withdraw.status == 'approved' ? 'text-green-500' : 'text-white'}`}>{withdraw.status}</span>
                                            {withdraw.remark && <span className='text-xs'>{
                                                withdraw.remark.split('\n').map((remark, index) => (
                                                    <span key={index}>
                                                        {remark}
                                                        <br />
                                                    </span>
                                                ))
                                            }</span>}
                                        </div>
                                    </td>
                                    <td className="border border-white/20 px-4 py-2 max-w-[200px] ">
                                        <div className='grid grid-cols-1 gap-2'>
                                            {withdraw.status === 'pending' && (
                                                <>
                                                    {/* edit button */}
                                                    {/* <button className="bg-secondary hover:bg-secondary/80 text-black font-bold py-2 px-4 rounded text-center flex flex-row justify-center items-center">
                                                    <AiFillEdit className='text-2xl' /><span className="ml-2 hidden lg:inline-block">Edit</span>
                                                </button> */}

                                                    {/* Approve button */}
                                                    <button onClick={() => approveWithdraw(withdraw.id)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-center flex flex-row justify-center items-center col-span-1">
                                                        <AiFillCheckCircle className='text-2xl' /><span className="ml-2 hidden lg:inline-block">Approve</span>
                                                    </button>

                                                    {/* Reject Button */}
                                                    <button onClick={() => rejectWithdraw(withdraw.id)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-center flex flex-row justify-center items-center col-span-1">
                                                        <AiFillCloseCircle className='text-2xl' /><span className="ml-2 hidden lg:inline-block">Reject</span>
                                                    </button>
                                                </>
                                            )}
                                            {/* View User */}
                                            <Link href={`/users?user=${withdraw.user_id}`} className="bg-white hover:bg-gray-200 text-black font-bold py-2 px-4 rounded text-center flex flex-row items-center justify-center col-span-1">View User</Link>
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
                            placeholder='Enter remark/reason for rejecting withdraw request. Example: Please play atleast 5 games to withdraw money...'
                            onChange={(e) => setRemark(e.target.value)} />
                        <div className="flex flex-row justify-end items-center w-full mt-4">
                            <button className="bg-white text-black px-4 py-2 text-base rounded-md mr-4" onClick={() => setShowRemarkModal(false)}>
                                Close
                            </button>
                            <button className="bg-red-500 text-white px-4 py-2 text-base rounded-md" onClick={() => rejectWithdraw(remarkId)}>
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}