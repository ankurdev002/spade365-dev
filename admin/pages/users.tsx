import Head from 'next/head';
import { useEffect, useState } from 'react'
import { AiFillEdit, AiFillCloseCircle, AiOutlineArrowLeft, AiOutlineArrowRight, AiOutlineSearch, AiOutlineLoading3Quarters } from 'react-icons/ai'
import { IoIosPersonAdd } from 'react-icons/io'
import { toast } from 'react-toastify';
import { convertReadableDate, convertActiveDate } from '../helpers/date';
import { HiRefresh } from 'react-icons/hi'
import { useRouter } from 'next/router';
import Link from 'next/link';
// user interface
export interface User {
    username: string
    id: number // user id in database
    name?: string
    email?: string
    phone: string
    role?: string
    credit?: number
    bonus?: number
    winnings?: number // total winnings of user bets. admin only
    losses?: number // total losses of user bets. admin only
    pnl?: number // total profit and loss of user bets, i.e winnings + losses. admin only
    deposits?: number // total deposits of user. admin only
    withdrawals?: number // total withdrawals of user. admin only
    exposure?: number  // total exposure. Will be mostly saved in negative value, i.e the total amount of money user can lose on all bets.
    exposureTime?: Date  // last exposure time. Required by provider: Fawk Poker
    exposureLimit?: number // Exposure limit. How much exposure is allowed.
    wagering?: number //  total wagering/rolling amount of user on all bets.stake. resets on every deposit.
    newPassword?: string // for setting new password while editing or adding user. Not for fetching user data from API as password field is encrypted and not returned.
    ip?: string
    user_agent?: string
    is_active?: boolean
    is_verified?: boolean
    is_deleted?: boolean
    is_banned?: boolean
    createdAt?: string
    updatedAt?: string
    lastActive?: string
    access?: { // access permissions for admin panel
        dashboard?: boolean,
        users?: boolean,
        games?: boolean,
        team?: boolean,
        offers?: boolean,
        deposits?: boolean,
        withdrawals?: boolean,
        bankAccounts?: boolean,
        transactions?: boolean,
        settings?: boolean,
        reports?: boolean,
    }
    transactions?: Transaction[]
}

// transaction type
export interface Transaction {
    id?: number
    createdAt?: string
    updatedAt?: string
    user_id: number
    type: string
    amount: number
    game_data: any
    status: string
    remark: string
    reference: string
    timestamp: string
}

export default function Users() {
    const [users, setUsers] = useState<User[]>([])
    const [page, setPage] = useState(1)
    const [hasNextPage, setHasNextPage] = useState(false)
    const [search, setSearch] = useState('')
    const [showUserModal, setShowUserModal] = useState(false)
    const [showTransactionModal, setShowTransactionModal] = useState(false)
    const [loading, setLoading] = useState(true)
    const router = useRouter();
    const emptyUser: User = {
        username: '',
        id: 0,
        name: '',
        email: '',
        phone: '',
        credit: 0,
        newPassword: '',
        is_verified: false,
        is_banned: false,
        is_deleted: false,
        bonus: 0,
        exposure: 0,
        exposureLimit: -200000, // default 2 lakhs exposure limit
    }
    const [modalUser, setModalUser] = useState<User>(emptyUser)

    // Call API to fetch users
    const fetchUsers = async () => {
        setLoading(true);
        const limit = 20;
        const skip = page > 1 ? (page - 1) * 20 : 0;
        const options = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        };

        const response = await fetch(`/api/team/users?limit=${limit}&skip=${skip}&search=${search}&user=${router.query.user || 0}`, options);

        if (response.status === 200) {
            const data = await response.json();
            if (!response.ok) {
                const error = (data && data.message) || response.status;
                return Promise.reject(error);
            }
            setUsers(data);
            setHasNextPage(data && data.length === limit);
            setLoading(false);
        } else {
            toast.error(await response.text());
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [page, search, router.query.user])

    // Call API to add user
    const addUser = async (user: User) => {
        // if user password or phone is empty, return
        if (!user.newPassword || !user.phone) {
            toast.error('Please enter phone number and password');
            return;
        }
        // if password not empty and less than 8 characters, return
        if (user.newPassword && user.newPassword.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }
        const body = {
            name: user.name,
            email: user.email,
            phoneNumber: user.phone,
            newPassword: user.newPassword,
            is_verified: user.is_verified,
            is_banned: user.is_banned,
            role: user.role,
            credit: user.credit,
            bonus: user.bonus,
            exposure: user.exposure,
            exposureLimit: user.exposureLimit
        }
        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        };

        const response = await fetch('/api/team/users/', options)

        if (response.status === 200) {
            // add user to state
            const updatedUsers = [user, ...users]
            setUsers(updatedUsers)
            // close modal
            setShowUserModal(false)
            toast.success('User added successfully!');
            router.reload();
        } else {
            toast.error(await response.text());
        }
    }

    // Call API update user
    const updateUser = async (user: User) => {
        // if user password or phone is empty, return
        if (!user.phone) {
            toast.error('User must have a phone number');
            return;
        }
        // if password not empty and less than 8 characters, return
        if (user.newPassword && user.newPassword.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }
        const body = {
            name: user.name,
            email: user.email,
            phoneNumber: user.phone,
            newPassword: user.newPassword,
            is_verified: user.is_verified,
            is_banned: user.is_banned,
            role: user.role,
            credit: user.credit,
            bonus: user.bonus,
            exposure: user.exposure,
            exposureLimit: user.exposureLimit
        }
        const options = {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        };

        const response = await fetch(`/api/team/users/${user.id}/`, options);

        if (response.status === 200) {
            setShowUserModal(false)
            toast.success('User updated successfully!');
            // update user in state
            const updatedUsers = users.map(u => u.id === user.id ? user : u);
            setUsers(updatedUsers)
        } else {
            toast.error(await response.text());
        }
    }

    // Call API to delete user
    const deleteUser = async (id: number) => {
        // confirm deleteion
        const confirm = window.confirm('Are you sure you want to delete this user? All data related to this user like bets, deposits, bank accounts etc will also be deleted.')
        if (!confirm) return

        const response = await fetch(`/api/team/users/${id}/`, { method: 'DELETE' });

        if (response.status === 200) {
            // delete user from state
            const updatedUsers = users.filter(u => u.id !== id);
            setUsers(updatedUsers);
            toast.success('User deleted successfully!');
        } else {
            toast.error(await response.text());
        }
    }

    return (
        <>
            <Head>
                <title>Users | Spade365</title>
                <meta name="description" content="Users | Spade365" />
            </Head>
            <div className="flex flex-col justify-start items-center min-h-[800px] w-full container mx-auto overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between w-full items-center mb-8 md:mb-4">
                    <h1 className="text-center md:text-left text-4xl lg:text-5xl my-6 w-1/2">
                        {!router.query.user ? `Users` : `User ID: ${router.query.user}`}
                        <button className="bg-white text-black p-1 text-2xl cursor-pointer rounded ml-4" title="Refresh" onClick={() => {
                            fetchUsers()
                            toast.success('Users refreshed successfully!')
                        }} >
                            <HiRefresh />
                        </button>
                    </h1>
                    {/* search and add user button */}
                    <div className="flex flex-row justify-center md:justify-start items-center w-full md:w-1/2">
                        {/* search inpout with search icon */}
                        <div className="md:ml-auto flex flex-row justify-start items-center w-full bg-gray rounded-md border max-w-xs">
                            <button className="p-2 h-full rounded-md">
                                <AiOutlineSearch className='text-2xl' />
                            </button>
                            <input
                                type="search"
                                className="w-full p-2 focus:outline-none focus:ring-0 border-none bg-transparent"
                                placeholder="Search"
                                autoComplete="new-search"
                                value={search}
                                onChange={(e) => {
                                    setPage(1) // reset page to 1 when search is changed
                                    setSearch(e.target.value)
                                }
                                }
                            />
                        </div>
                        {/* button to add user */}
                        <button
                            className="ml-4 p-2 bg-white text-black rounded-md flex flex-row justify-center items-center"
                            title='Add User'
                            onClick={() => {
                                setModalUser(emptyUser)
                                setShowUserModal(true)
                            }}
                        >
                            <IoIosPersonAdd className='text-2xl' />
                            <span className='ml-1 hidden lg:inline-block'>Add User</span>
                        </button>
                    </div>
                </div>
                <div className='overflow-x-scroll scrollbar-hide w-full'>
                    {/* table with users, user, amount, date, status, action */}
                    <table className="table-auto w-full text-left break-words">
                        <thead className="bg-primary text-white">
                            <tr>
                                <th className="border border-white/20 px-4 py-2 text-center">ID</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Phone</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Name</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Username</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Email</th>
                                <th className="border border-white/20 px-4 py-2">Deposits</th>
                                <th className="border border-white/20 px-4 py-2">Withdrawals</th>
                                {/* <th className="border border-white/20 px-4 py-2 text-center">Bonus</th> */}
                                <th className="border border-white/20 px-4 py-2 text-center">Balance</th>
                                <th className="border border-white/20 px-4 py-2 text-center">P/L</th>
                                {/* <th className="border border-white/20 px-4 py-2 text-center">Exposure</th> */}
                                {/* <th className="border border-white/20 px-4 py-2 text-center">Exp. Limit</th> */}
                                <th className="border border-white/20 px-4 py-2 text-center">Status</th>
                                <th className="border border-white/20 px-4 py-2 text-center">IP</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Last Active</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Date Joined</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* map through users and display them */}
                            {users.map((user) => (
                                <tr key={user.id} className={`h-[120px] odd:bg-transparent even:bg-primary/10 ${user.is_banned || user.is_deleted ? 'text-red-500' : ''}`}>
                                    <td className="border border-white/20 px-4 py-2 font-semibold">
                                        {user.id}
                                    </td>
                                    <td className={`border border-white/20 px-4 py-2 text-left`}>
                                        {user.phone}
                                    </td>
                                    <td className={`border border-white/20 px-4 py-2 text-left`}>
                                        {user.name}
                                    </td>
                                    <td className={`border border-white/20 px-4 py-2 text-left`}>
                                        {user.username}
                                    </td>
                                    <td className={`border border-white/20 px-4 py-2 text-left`}>
                                        {user.email}
                                    </td>
                                    <td className="border border-white/20 px-4 py-2">
                                        {user.deposits}
                                    </td>
                                    <td className="border border-white/20 px-4 py-2">
                                        {user.withdrawals}
                                    </td>
                                    {/* <td className="border border-white/20 px-4 py-2">
                                        {user.bonus}
                                    </td> */}
                                    <td className={`border border-white/20 px-4 py-2 ${user.credit && user.credit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        <span className='mr-1'>&#8377;</span>{user.credit}
                                    </td>
                                    <td className="border border-white/20 px-4 py-2 text-left min-w-[250px]">
                                        <div className="flex flex-col justify-start items-start h-full">
                                            <span>Wagering: {user.wagering}</span>
                                            <span>Win: {user.winnings}</span>
                                            <span>Loss: {user.losses}</span>
                                            <span>Total: {user.pnl}</span>
                                        </div>
                                    </td>
                                    {/* <td className="border border-white/20 px-4 py-2">
                                        {user.exposure}
                                    </td> */}
                                    {/* <td className="border border-white/20 px-4 py-2">
                                        {user.exposureLimit}
                                    </td> */}
                                    <td className="border border-white/20 px-4 py-2 min-w-[80px]">
                                        <div className='grid grid-cols-1 gap-2 text-center justify-center items-center'>
                                            {user.is_banned ? ( // if user is banned
                                                <span className="bg-red-500 text-white px-2 py-1 rounded-md" title='Banned'>
                                                    {'B'}{<span className='hidden 3xl:inline'>anned</span>}
                                                </span>
                                            ) : ( // if user is not banned
                                                <span className="bg-green-500 text-white px-2 py-1 rounded-md" title='Active'>
                                                    {'A'}{<span className='hidden 3xl:inline'>ctive</span>}
                                                </span>
                                            )}
                                            {/* {user.is_verified ? ( // if user is verified
                                            <span className="bg-green-500 text-white px-2 py-1 rounded-md" title='Verified'>
                                                {'V'}{<span className='hidden 3xl:inline'>erified</span>}
                                            </span>
                                        ) : ( // if user is not verified
                                            <span className="bg-red-500 text-white px-2 py-1 rounded-md" title='Not Verified'>
                                                {'N'}{<span className='hidden 3xl:inline'>ot Verified</span>}
                                            </span>
                                        )} */}
                                        </div>
                                    </td>
                                    <td className="border border-white/20 px-4 py-2">
                                        <div className="flex flex-col max-w-xs">
                                            <span>{user.ip && <Link href={`https://ipinfo.io/${user.ip}`} target='_blank' rel="noreferrer" className='font-semibold hover:underline'>{user.ip}</Link>}</span>
                                            <span className='text-xs'>{user.user_agent || ""}</span>
                                        </div>
                                    </td>
                                    <td className="border border-white/20 px-4 py-2" title={user.lastActive}>
                                        {user.lastActive && convertActiveDate(user.lastActive as string)}
                                    </td>
                                    <td className="border border-white/20 px-4 py-2" title={user.createdAt}>
                                        {user.createdAt && convertReadableDate(user.createdAt as string)}
                                    </td>
                                    <td className="border border-white/20 px-4 py-2 min-w-[200px]">
                                        <div className='grid grid-cols-1 gap-2'>

                                            {/* view transactions, open transaction modal */}
                                            <Link href={`/transactions?user=${user.id}`} passHref>
                                                <button title='View Transactions' type="button" className="bg-green-600 hover:bg-green-800 text-white font-bold py-2 px-2 rounded text-center flex flex-row justify-center items-center col-span-1 w-full">
                                                    Transactions
                                                </button>
                                            </Link>

                                            {/* View bets, direct to bets page with ?user= */}
                                            <Link href={`/reports/betlist?user=${user.id}`} passHref>
                                                <button title='View Bets' type="button" className="bg-teal-600 hover:bg-teal-800 text-white font-bold py-2 px-2 rounded text-center flex flex-row justify-center items-center col-span-1 w-full">
                                                    Bets
                                                </button>
                                            </Link>

                                            {/* View Deposits */}
                                            <Link href={`/deposits?user=${user.id}&type=deposit`} passHref>
                                                <button title='View Deposits' type="button" className="bg-purple-600 hover:bg-purple-800 text-white font-bold py-2 px-2 rounded text-center flex flex-row justify-center items-center col-span-1 w-full">
                                                    Deposits
                                                </button>
                                            </Link>

                                            {/* View Withdrawals */}
                                            <Link href={`/withdrawals?user=${user.id}`} passHref>
                                                <button title='View Withdrawals' type="button" className="bg-yellow-600 hover:bg-yellow-800 text-white font-bold py-2 px-2 rounded text-center flex flex-row justify-center items-center col-span-1 w-full">
                                                    Withdrawals
                                                </button>
                                            </Link>

                                            {/* Edit button */}
                                            <button
                                                title='Edit User'
                                                type="button"
                                                onClick={() => {
                                                    setModalUser(user)
                                                    setShowUserModal(true)
                                                }}
                                                className="bg-blue-600 hover:bg-blue-800 text-white font-bold py-2 px-2 rounded text-center flex flex-row justify-center items-center col-span-1">
                                                Edit
                                            </button>

                                            {/* Delete Button */}
                                            <button title='Delete User' type="button" onClick={() => deleteUser(user.id)} className="bg-red-600 hover:bg-red-800 text-white font-bold py-2 px-2 rounded text-center flex flex-row justify-center items-center col-span-1">
                                                DELETE
                                            </button>
                                            {/* <button
                                                title='View Transactions'
                                                type="button"
                                                onClick={() => {
                                                    setModalUser(user)
                                                    setShowTransactionModal(true)
                                                }}
                                                className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-2 rounded text-center flex flex-row justify-center items-center col-span-1 w-full">
                                                Transactions
                                            </button> */}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                {/* <td colSpan={8} className="border border-white/20 px-4 py-2 text-center">
                                <span className='text-sm text-white/60'>Showing {users.length} of {total} users</span>
                            </td> */}
                                {/* loading spinner if loading is true */}
                                {loading && (
                                    <td colSpan={18} className="border border-white/20 px-4 py-8 text-center">
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

                {/* Add/Edit User Modal */}
                <div className={`fixed top-0 backdrop-blur left-0 w-full h-full bg-black/50 z-50 flex flex-col justify-center items-center ${showUserModal ? 'visible' : 'invisible'}`}>
                    <div className="bg-slate-900/95 w-[95vw] max-w-[1200px] rounded-md overflow-y-scroll scrollbar-hide flex flex-col justify-start items-start p-4">
                        <h2 className="text-2xl my-4">
                            {modalUser.id == 0 ? 'Add User' : 'Edit User'}
                        </h2>
                        <div className="flex flex-col justify-start items-start w-full ">
                            <div className='grid grid-cols-2 gap-4 w-full'>
                                <div className='w-full'>
                                    <label className="text-sm text-white/80 mb-2 font-semibold flex flex-col">
                                        Phone*
                                        <small className='font-light'>10 Digit phone number of user. Without +91 (Required)</small>
                                    </label>
                                    <input type="text" className="bg-slate-900/80 text-white/80 w-full rounded-md px-4 py-2 mb-4" value={modalUser.phone} onChange={(e) => setModalUser({ ...modalUser, phone: e.target.value })} />
                                </div>
                                <div className='w-full'>
                                    <label className="text-sm text-white/80 mb-2 flex flex-col">
                                        Name
                                        <small className='font-light'>Name of user (if any)</small>
                                    </label>
                                    <input type="text" className="bg-slate-900/80 text-white/80 w-full rounded-md px-4 py-2 mb-4" value={modalUser.name} onChange={(e) => setModalUser({ ...modalUser, name: e.target.value })} />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-4 w-full'>
                                <div className='w-full'>
                                    <label className="text-sm text-white/80 mb-2 flex flex-col">
                                        Email
                                        <small className='font-light'>Email of user (if any)</small>
                                    </label>
                                    <input type="text" className="bg-slate-900/80 text-white/80 w-full rounded-md px-4 py-2 mb-4" value={modalUser.email} onChange={(e) => setModalUser({ ...modalUser, email: e.target.value })} />
                                </div>
                                <div className='w-full'>
                                    {/* New password */}
                                    <label className={`text-sm text-white/80 mb-2 font-semibold flex flex-col ${modalUser.id == 0 ? 'font-semibold' : ''}`}>New Password{modalUser.id == 0 ? '*' : ''}
                                        <small className='font-light'>Changing this will update the password for user.</small>
                                    </label>
                                    <input type="password" className="bg-slate-900/80 text-white/80 w-full rounded-md px-4 py-2 mb-4" value={modalUser.newPassword} onChange={(e) => setModalUser({ ...modalUser, newPassword: e.target.value })} />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-4 w-full'>
                                <div className='w-full'>
                                    <label className="text-sm text-white/80 mb-2 flex flex-col">Credits/Balance (₹)
                                        <small className='font-light'>Credits/Wallet Balance of user. Changing this will update the user balance.</small>
                                    </label>
                                    <input type="number" className="bg-slate-900/80 text-white/80 w-full rounded-md px-4 py-2 mb-4" min={0} value={modalUser.credit} onChange={(e) => setModalUser({ ...modalUser, credit: parseInt(e.target.value) })} />
                                </div>

                                <div className='w-full'>
                                    <label className="text-sm text-white/80 mb-2 flex flex-col">Bonus (₹)
                                        <small className='font-light'>Bonus claimed by user. Changing this will update the user bonus.</small>
                                    </label>
                                    <input type="number" className="bg-slate-900/80 text-white/80 w-full rounded-md px-4 py-2 mb-4" min={0} value={modalUser.bonus} onChange={(e) => setModalUser({ ...modalUser, bonus: parseInt(e.target.value) })} />
                                </div>

                                {/* <div className='w-full'>
                                <label className="text-sm text-white/80 mb-2 flex flex-col">Is User Verified?</label>
                            <select className="bg-slate-900/80 text-white/80 w-full rounded-md px-4 py-2 mb-4" value={modalUser.is_verified ? 1 : 0} onChange={(e) => setModalUser({ ...modalUser, is_verified: parseInt(e.target.value) == 1 ? true : false })}>
                                <option value={0}>No</option>
                                <option value={1}>Yes</option>
                            </select>
                            </div> */}
                            </div>
                            <div className='grid grid-cols-2 gap-4 w-full'>
                                <div className='w-full'>
                                    <label className="text-sm text-white/80 mb-2 flex flex-col">Exposure (₹)
                                        <small className='font-light'>How much exposure the user currently has for all his bets</small>
                                    </label>
                                    <input type="number" className="bg-slate-900/80 text-white/80 w-full rounded-md px-4 py-2 mb-4" value={modalUser.exposure} onChange={(e) => setModalUser({ ...modalUser, exposure: parseInt(e.target.value) })} />
                                </div>

                                <div className='w-full'>
                                    <label className="text-sm text-white/80 mb-2 flex flex-col">Exposure Limit (₹)
                                        <small className='font-light'>Max Exposure user is allowed to have</small>
                                    </label>
                                    <input type="number" className="bg-slate-900/80 text-white/80 w-full rounded-md px-4 py-2 mb-4" min={0} value={modalUser.exposureLimit} onChange={(e) => setModalUser({ ...modalUser, exposureLimit: parseInt(e.target.value) })} />
                                </div>
                            </div>
                            <div className='grid grid-cols-2 gap-4 w-full'>
                                <div className='w-full'>
                                    <label className="text-sm text-white/80 mb-2 flex flex-col">
                                        Deleted?
                                        <small className='font-light'>Is user deleted from logging in? If yes, user won&apos;t be allowed to login or signup.</small>
                                    </label>
                                    <select className="bg-slate-900/80 text-white/80 w-full rounded-md px-4 py-2 mb-4" value={modalUser.is_deleted ? 1 : 0} onChange={(e) => setModalUser({ ...modalUser, is_deleted: parseInt(e.target.value) == 1 ? true : false })}>
                                        <option value={0}>No</option>
                                        <option value={1}>Yes</option>
                                    </select>
                                </div>
                                <div className='w-full'>
                                    <label className="text-sm text-white/80 mb-2 flex flex-col">
                                        Banned?
                                        <small className='font-light'>Is user banned from logging in? If yes, user won&apos;t be allowed to login or signup.</small>
                                    </label>
                                    <select className="bg-slate-900/80 text-white/80 w-full rounded-md px-4 py-2 mb-4" value={modalUser.is_banned ? 1 : 0} onChange={(e) => setModalUser({ ...modalUser, is_banned: parseInt(e.target.value) == 1 ? true : false })}>
                                        <option value={0}>No</option>
                                        <option value={1}>Yes</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-row justify-end items-center w-full mt-4">
                                <button className="bg-white text-black px-4 py-2 text-base rounded-md mr-4" onClick={() => setShowUserModal(false)}>
                                    Cancel
                                </button>
                                <button className="bg-secondary text-black px-4 py-2 text-base rounded-md" onClick={() => {
                                    if (modalUser.id == 0) {
                                        addUser(modalUser)
                                    } else {
                                        updateUser(modalUser)
                                    }
                                }}>
                                    {modalUser.id == 0 ? 'Add User' : 'Update User'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transactions Modal */}
                <div className={`fixed top-0 backdrop-blur left-0 w-full h-full bg-black/50 z-50 flex flex-col justify-center items-center ${showTransactionModal ? 'visible' : 'invisible'}`}>
                    <div className="bg-slate-900/95 w-[95vw] max-w-[1400px] rounded-md overflow-y-scroll scrollbar-hide flex flex-col justify-start items-start p-4">
                        <h2 className="text-2xl my-4">
                            {`Transactions for User: ${modalUser.id}`}
                        </h2>
                        <div className="flex flex-col justify-start items-start w-full ">
                            <table className="table-auto w-full text-left break-words overflow-scroll scrollbar-hide min-h-[500px] max-h-[600px]">
                                <thead className="bg-primary text-white">
                                    <tr>
                                        <th className="border border-white/20 px-4 py-2">ID</th>
                                        <th className="border border-white/20 px-4 py-2">Type</th>
                                        <th className="border border-white/20 px-4 py-2">Amount</th>
                                        <th className="border border-white/20 px-4 py-2">Status</th>
                                        <th className="border border-white/20 px-4 py-2">Remark</th>
                                        <th className="border border-white/20 px-4 py-2">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {modalUser?.transactions?.map((transaction, index) => (
                                        <tr key={index} className="text-left">
                                            <td className="border border-white/20 px-4 py-2">{transaction.id}</td>
                                            <td className={`border border-white/20 px-4 py-2 font-medium ${transaction.type == "credit" ? 'text-green-500' : transaction.type == "debit" ? 'text-red-500' : 'text-white'}`}>{transaction.type}</td>
                                            <td className="border border-white/20 px-4 py-2">{transaction.amount}</td>
                                            <td className="border border-white/20 px-4 py-2">{transaction.status}</td>
                                            <td className="border border-white/20 px-4 py-2">{transaction.remark}</td>
                                            <td className="border border-white/20 px-4 py-2">{convertReadableDate(transaction.createdAt as string)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="flex flex-row justify-end items-center w-full mt-4">
                                <button className="bg-white text-black px-4 py-2 text-base rounded-md mr-4" onClick={() => setShowTransactionModal(false)}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}