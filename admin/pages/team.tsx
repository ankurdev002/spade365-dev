import { useEffect, useState } from 'react'
import { AiFillEdit, AiFillCloseCircle, AiOutlineArrowLeft, AiOutlineArrowRight, AiOutlineSearch, AiOutlineLoading3Quarters } from 'react-icons/ai'
import { IoIosPersonAdd } from 'react-icons/io'
import { User } from './users'
import { toast } from 'react-toastify'
import Head from 'next/head'
import { convertReadableDate, convertActiveDate } from '../helpers/date'
import { HiRefresh } from 'react-icons/hi'

export default function Team() {
    const [team, setTeam] = useState<User[]>([])
    const [page, setPage] = useState(1)
    const [hasNextPage, setHasNextPage] = useState(false)
    const [search, setSearch] = useState('')
    const [showTeamModal, setShowTeamModal] = useState(false)
    const [loading, setLoading] = useState(true)
    const emptyUser: User = {
        username: '',
        id: 0,
        name: '',
        email: '',
        phone: '',
        credit: 0,
        newPassword: '',
        role: 'admin',
        is_verified: false,
        is_banned: false,
        access: {
            dashboard: true,
            users: true,
            games: true,
            team: true,
            deposits: true,
            withdrawals: true,
            bankAccounts: true,
            transactions: true,
            settings: true,
            offers: true,
            reports: true
        }
    }
    const [modalUser, setModalUser] = useState<User>(emptyUser)

    // Call api to fetch team
    const fetchTeam = async () => {
        setLoading(true);
        const limit = 20;
        const skip = page > 1 ? (page - 1) * 20 : 0;
        const options = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        };

        const response = await fetch(`/api/team?limit=${limit}&skip=${skip}&search=${search}`, options);

        if (response.status === 200) {
            const data = await response.json();
            if (!response.ok) {
                const error = (data && data.message) || response.status;
                return Promise.reject(error);
            }
            setTeam(data.users);
            setHasNextPage(data.users.length === limit);
            setLoading(false);
        } else {
            toast.error(await response.text());
        }
    }

    useEffect(() => {
        fetchTeam()
    }, [page, search])

    const handleAccessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        // update access
        setModalUser({
            ...modalUser,
            access: {
                ...modalUser.access,
                [name]: checked
            }
        })
    }

    // Call api to create user
    const addTeam = async (user: User) => {
        // if user password or phone is empty, return
        if (!user.username || !user.newPassword) {
            toast.error('Username and password cannot be empty!');
            return;
        }
        if (user.username.length < 5) {
            toast.error('Username must be at least 5 characters');
            return;
        }
        // if all under access is false, return
        if (user.access && !Object.values(user.access).some(val => val)) {
            toast.error('At least one access must be selected for the admin');
            return;
        }
        // if password not empty and less than 8 characters, return
        if (user.newPassword && user.newPassword.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }
        const body = {
            username: user.username,
            name: user.name,
            email: user.email,
            phoneNumber: user.phone,
            newPassword: user.newPassword,
            is_verified: user.is_verified,
            is_banned: user.is_banned,
            role: user.role,
            access: user.access
        }
        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        };

        const response = await fetch('/api/team/', options);

        if (response.status === 200) {
            // add user to state
            const updatedUsers = [user, ...team]
            setTeam(updatedUsers)
            // close modal
            setShowTeamModal(false)
            toast.success('Team member added successfully!');
        } else {
            toast.error(await response.text());
        }
    }

    // Call api to update user
    const updateTeam = async (user: User) => {
        // if user password or phone is empty, return
        if (!user.username) {
            toast.error('Username cannot be empty!');
            return;
        }
        if (user.username.length < 5) {
            toast.error('Username must be at least 5 characters');
            return;
        }
        // if password not empty and less than 8 characters, return
        if (user.newPassword && user.newPassword.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }
        const body = {
            username: user.username,
            name: user.name,
            email: user.email,
            phoneNumber: user.phone,
            newPassword: user.newPassword,
            is_verified: user.is_verified,
            is_banned: user.is_banned,
            role: user.role,
            access: user.access
        }
        const options = {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        };

        const response = await fetch(`/api/team/${user.id}/`, options);

        if (response.status === 200) {
            // update user in state
            const updatedUsers = team.map(u => u.id === user.id ? user : u)
            toast.success('Team member updated successfully!');
            setTeam(updatedUsers)
            // close modal
            setShowTeamModal(false)
        } else {
            toast.error(await response.text());
        }
    }

    // Call api to delete user
    const deleteTeam = async (id: number) => {
        // confirm deleteion
        const confirm = window.confirm('Are you sure you want to delete this admin? All data related to this admin will be deleted.')
        if (!confirm) return

        const response = await fetch(`/api/team/${id}/`, { method: 'DELETE' });

        if (response.status === 200) {
            // delete user from state
            const updatedUsers = team.filter(u => u.id !== id)
            setTeam(updatedUsers)
            toast.success('Team member deleted successfully!');
        } else {
            toast.error(await response.text());
        }
    }

    return (
        <>
            <Head>
                <title>Team | Spade365</title>
                <meta name="description" content="Team | Spade365" />
            </Head>
            <div className="flex flex-col justify-start items-center min-h-[800px] w-full mx-auto overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between w-full items-center mb-8 md:mb-4">
                    <h1 className="text-center md:text-left text-4xl lg:text-5xl my-6 w-1/2">
                        Admins
                        <button className="bg-white text-black p-1 text-2xl cursor-pointer rounded ml-4" title="Refresh Admins" onClick={() => {
                            fetchTeam()
                            toast.success('Admins refreshed successfully!')
                        }} >
                            <HiRefresh />
                        </button>
                    </h1>
                    {/* search */}
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
                                setShowTeamModal(true)
                            }}
                        >
                            <IoIosPersonAdd className='text-2xl' />
                            <span className='ml-1 hidden lg:inline-block'>Add Admin</span>
                        </button>
                    </div>
                </div>
                <div className='overflow-x-scroll scrollbar-hide w-full'>
                    {/* table with team, user, amount, date, status, action */}
                    <table className="table-auto w-full text-left break-words">
                        <thead className="bg-primary text-white">
                            <tr>
                                <th className="border border-white/20 px-2 md:px-4 py-2 text-center">ID</th>
                                <th className="border border-white/20 px-2 md:px-4 py-2">Username</th>
                                <th className="border border-white/20 px-2 md:px-4 py-2">Phone</th>
                                <th className="border border-white/20 px-2 md:px-4 py-2 text-center">Name</th>
                                <th className="border border-white/20 px-2 md:px-4 py-2 text-center">Email</th>
                                <th className="border border-white/20 px-2 md:px-4 py-2 text-center">Role</th>
                                <th className="border border-white/20 px-2 md:px-4 py-2 text-center">Status</th>
                                {/* <th className="border border-white/20 px-2 md:px-4 py-2 text-center">IP</th> */}
                                <th className="border border-white/20 px-4 py-2 text-center">Last Active</th>
                                <th className="border border-white/20 px-2 md:px-4 py-2 text-center">Date Joined</th>
                                <th className="border border-white/20 px-2 md:px-4 py-2 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* map through team and display them */}
                            {team.map((user) => (
                                <tr key={user.id} className={`h-[120px] odd:bg-transparent even:bg-primary/10 ${user.is_banned ? 'text-red-500' : ''}`}>
                                    <td className={`border border-white/20 px-2 md:px-4 py-2 font-bold text-center`}>
                                        {user.id}
                                    </td>
                                    <td className="border border-white/20 px-2 md:px-4 py-2">
                                        {user.username}
                                    </td>
                                    <td className="border border-white/20 px-2 md:px-4 py-2">
                                        {user.phone}
                                    </td>
                                    <td className="border border-white/20 px-2 md:px-4 py-2">
                                        {user.name}
                                    </td>
                                    <td className="border border-white/20 px-2 md:px-4 py-2">
                                        {user.email}
                                    </td>
                                    <td className={`border border-white/20 px-2 md:px-4 py-2 text-center font-bold uppercase ${user.role == 'admin' ? 'text-green-400' : 'text-blue-400'}`}>
                                        <div className='flex flex-col justify-center items-center'>
                                            <span className=''>{user.role}</span>
                                            <div className=''>
                                                {/* all where user.access is true */}

                                            </div>
                                        </div>
                                    </td>
                                    <td className="border border-white/20 px-2 md:px-4 py-2">
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
                                    {/* <td className="border border-white/20 px-2 md:px-4 py-2">
                                        <div className="flex flex-col max-w-xs">
                                            <span>{user.ip}</span>
                                            <span className='text-xs'>{user.user_agent || ""}</span>
                                        </div>
                                    </td> */}
                                    <td className="border border-white/20 px-2 md:px-4 py-2" title={user.lastActive}>
                                        {user.lastActive && convertActiveDate(user.lastActive as string)}
                                    </td>
                                    <td className="border border-white/20 px-4 py-2" title={user.createdAt}>
                                        {user.createdAt && convertReadableDate(user.createdAt as string)}
                                    </td>
                                    <td className="border border-white/20 px-2 md:px-4 py-2 max-w-[200px] ">
                                        <div className='grid grid-cols-1 lg:grid-cols-2 gap-2'>
                                            {/* Edit button */}
                                            <button
                                                title="Edit"
                                                onClick={() => {
                                                    setModalUser(user)
                                                    setShowTeamModal(true)
                                                }}
                                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold p-2 rounded text-center flex flex-row justify-center items-center">
                                                <AiFillEdit className='text-2xl' />
                                            </button>

                                            {/* Delete Button */}
                                            <button title="Delete" onClick={() => deleteTeam(user.id)} className="bg-red-500 hover:bg-red-700 text-white font-bold p-2 rounded text-center flex flex-row justify-center items-center">
                                                <AiFillCloseCircle className='text-2xl' />
                                            </button>
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
                            <button title='Previous' className="bg-primary hover:bg-neutral/80 text-white font-bold py-2 px-4 rounded-l text-center flex flex-row items-center justify-center" onClick={() => setPage(page - 1)}>
                                <AiOutlineArrowLeft className='mr-2' />{'Previous'}
                            </button>
                        )}
                        {hasNextPage && (
                            <button title='Next' className="bg-primary hover:bg-neutral/80 text-white font-bold py-2 px-4 rounded-r text-center border-l-2 border-white/20 flex flex-row items-center justify-center" onClick={() => setPage(page + 1)}>
                                {'Next'}<AiOutlineArrowRight className='ml-2' />
                            </button>
                        )}
                    </div>
                )}

                {/* Add/Edit User Modal */}
                <div className={`fixed top-0 backdrop-blur left-0 w-full h-full bg-black/50 z-50 flex flex-col justify-center items-center ${showTeamModal ? 'visible' : 'invisible'}`}>
                    <div className="bg-slate-900/95 w-[95vw] max-w-[1200px] rounded-md overflow-y-scroll scrollbar-hide flex flex-col justify-start items-start p-4">
                        <h2 className="text-2xl my-4">
                            {modalUser.id == 0 ? 'Add Admin' : 'Edit Admin'}
                        </h2>
                        <div className="flex flex-col justify-start items-start w-full ">

                            <div className="grid grid-cols-4 gap-4 w-full">
                                <div className="col-span-4">
                                    <label className="text-base text-white/80 flex flex-col">
                                        Role
                                    </label>
                                    <select className="bg-slate-900/80 text-white/80 w-full mt-2 rounded-md px-2 md:px-4 py-2 mb-4" value={modalUser.role} onChange={(e) => setModalUser({ ...modalUser, role: e.target.value })}>
                                        <option value="admin">Admin</option>
                                        {/* <option value="subadmin">Subadmin</option> */}
                                    </select>
                                    <small className="font-light text-white/60">{modalUser.role == 'admin' ? 'Admins can see all users, add other admins, manage deposits and withdrawals for all users and pretty much do everything. Please be careful with this role. We suggest only adding trusted admins.' : modalUser.role == 'subadmin' ? 'Subadmins can add and manage users they created. Manage deposits and withdrawals for users they created. They cannot add other team members or view or manage data related to all users, other than the ones they added.' : 'Please select a role.'}</small>
                                </div>

                                <div className="col-span-2">
                                    <label className="text-base text-white/80 font-bold flex flex-col">
                                        Username*
                                        <small className='font-light text-white/60'>Username that will be used for login.</small>
                                    </label>
                                    <input placeholder='Enter Username (Min. 5 Characters)' type="text" className="bg-slate-900/80 text-white/80 w-full mt-2 rounded-md px-2 md:px-4 py-2 mb-4" value={modalUser.username} onChange={(e) => setModalUser({ ...modalUser, username: e.target.value.toLowerCase() })} />
                                </div>

                                <div className="col-span-2">
                                    <label className={`text-base text-white/80 flex flex-col ${modalUser.id == 0 ? 'font-bold' : ''}`}>
                                        New Password{modalUser.id == 0 ? '*' : ''}
                                        <small className='font-light text-white/60'>Changing this will set the new password for admin.</small>
                                    </label>
                                    <input placeholder='Enter Password (Min. 8 Characters)' type="password" className="bg-slate-900/80 text-white/80 w-full mt-2 rounded-md px-2 md:px-4 py-2 mb-4" value={modalUser.newPassword} onChange={(e) => setModalUser({ ...modalUser, newPassword: e.target.value })} />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-base text-white/80 flex flex-col">
                                        Phone
                                        <small className='font-light text-white/60'>Phone number of admin. (optional)</small>
                                    </label>
                                    <input type="text" className="bg-slate-900/80 text-white/80 w-full mt-2 rounded-md px-2 md:px-4 py-2 mb-4" value={modalUser.phone} onChange={(e) => setModalUser({ ...modalUser, phone: e.target.value })} />
                                </div>

                                <div className="col-span-2">
                                    <label className="text-base text-white/80 flex flex-col">
                                        Name
                                        <small className='font-light text-white/60'>Name of admin. (optional)</small>
                                    </label>
                                    <input type="text" className="bg-slate-900/80 text-white/80 w-full mt-2 rounded-md px-2 md:px-4 py-2 mb-4" value={modalUser.name} onChange={(e) => setModalUser({ ...modalUser, name: e.target.value })} />
                                </div>

                                <div className="col-span-2">
                                    <label className="text-base text-white/80 flex flex-col">
                                        Email
                                        <small className='font-light text-white/60'>Email of admin. (optional)</small>
                                    </label>
                                    <input type="text" className="bg-slate-900/80 text-white/80 w-full mt-2 rounded-md px-2 md:px-4 py-2 mb-4" value={modalUser.email} onChange={(e) => setModalUser({ ...modalUser, email: e.target.value })} />
                                </div>

                                {/* <div className="col-span-2">
                                    <label className="text-base text-white/80">Is User Verified?</label>
                                    <select className="bg-slate-900/80 text-white/80 w-full mt-2 rounded-md px-2 md:px-4 py-2 mb-4" value={modalUser.is_verified ? 1 : 0} onChange={(e) => setModalUser({ ...modalUser, is_verified: parseInt(e.target.value) == 1 ? true : false })}>
                                        <option value={0}>No</option>
                                        <option value={1}>Yes</option>
                                    </select>
                                </div> */}

                                <div className="col-span-2">
                                    <label className="text-base text-white/80 flex flex-col">
                                        Is Admin Banned?
                                        <small className='font-light text-white/60'>Is admin banned from logging in? (optional) If yes, admin won&apos;t be allowed to login.</small>
                                    </label>
                                    <select className="bg-slate-900/80 text-white/80 w-full mt-2 rounded-md px-2 md:px-4 py-2 mb-4" value={modalUser.is_banned ? 1 : 0} onChange={(e) => setModalUser({ ...modalUser, is_banned: parseInt(e.target.value) == 1 ? true : false })}>
                                        <option value={0}>No</option>
                                        <option value={1}>Yes</option>
                                    </select>
                                </div>

                                <div className="col-span-4 w-full mb-8">
                                    <label className="text-base text-white/80 flex flex-col">
                                        Page Access
                                        <small className='font-light text-white/60'>Pages that the admin are allowed to access.</small>
                                    </label>
                                    {/* checkboxes */}
                                    <div className="flex flex-row flex-wrap mt-2 w-full">
                                        <div className="grid grid-cols-6 lg:grid-cols-11 gap-x-4 w-full break-words">
                                            {/* tickboxes for access dashboard, users, team, deposits, withdrawals, bankAccounts, transactions, settings, reports */}
                                            {/* on check, call handleAccessChange */}
                                            <div className='col-span-1 flex flex-col text-left justify-start items-start'>
                                                <input type="checkbox" name="dashboard" className="form-checkbox h-5 w-5 text-accent" checked={modalUser?.access?.dashboard ?? false} onChange={(e) => handleAccessChange(e)} />
                                                <label className="text-white/80 text-xs mt-1">Dashboard</label>
                                            </div>
                                            <div className='col-span-1 flex flex-col text-left justify-start items-start'>
                                                <input type="checkbox" name="users" className="form-checkbox h-5 w-5 text-accent" checked={modalUser?.access?.users ?? false} onChange={(e) => handleAccessChange(e)} />
                                                <label className="text-white/80 text-xs mt-1">Users</label>
                                            </div>
                                            <div className='col-span-1 flex flex-col text-left justify-start items-start'>
                                                <input type="checkbox" name="team" className="form-checkbox h-5 w-5 text-accent" checked={modalUser?.access?.team ?? false} onChange={(e) => handleAccessChange(e)} />
                                                <label className="text-white/80 text-xs mt-1">Admins</label>
                                            </div>
                                            <div className='col-span-1 flex flex-col text-left justify-start items-start'>
                                                <input type="checkbox" name="games" className="form-checkbox h-5 w-5 text-accent" checked={modalUser?.access?.games ?? false} onChange={(e) => handleAccessChange(e)} />
                                                <label className="text-white/80 text-xs mt-1">Games</label>
                                            </div>
                                            <div className='col-span-1 flex flex-col text-left justify-start items-start'>
                                                <input type="checkbox" name="deposits" className="form-checkbox h-5 w-5 text-accent" checked={modalUser?.access?.deposits ?? false} onChange={(e) => handleAccessChange(e)} />
                                                <label className="text-white/80 text-xs mt-1">Deposits</label>
                                            </div>
                                            <div className='col-span-1 flex flex-col text-left justify-start items-start'>
                                                <input type="checkbox" name="withdrawals" className="form-checkbox h-5 w-5 text-accent" checked={modalUser?.access?.withdrawals ?? false} onChange={(e) => handleAccessChange(e)} />
                                                <label className="text-white/80 text-xs mt-1">Withdrawals</label>
                                            </div>
                                            <div className='col-span-1 flex flex-col text-left justify-start items-start'>
                                                <input type="checkbox" name="bankAccounts" className="form-checkbox h-5 w-5 text-accent" checked={modalUser?.access?.bankAccounts ?? false} onChange={(e) => handleAccessChange(e)} />
                                                <label className="text-white/80 text-xs mt-1">Bank Accounts</label>
                                            </div>
                                            <div className='col-span-1 flex flex-col text-left justify-start items-start'>
                                                <input type="checkbox" name="transactions" className="form-checkbox h-5 w-5 text-accent" checked={modalUser?.access?.transactions ?? false} onChange={(e) => handleAccessChange(e)} />
                                                <label className="text-white/80 text-xs mt-1">Transactions</label>
                                            </div>
                                            <div className='col-span-1 flex flex-col text-left justify-start items-start'>
                                                <input type="checkbox" name="offers" className="form-checkbox h-5 w-5 text-accent" checked={modalUser?.access?.offers ?? false} onChange={(e) => handleAccessChange(e)} />
                                                <label className="text-white/80 text-xs mt-1">Offers</label>
                                            </div>
                                            <div className='col-span-1 flex flex-col text-left justify-start items-start'>
                                                <input type="checkbox" name="settings" className="form-checkbox h-5 w-5 text-accent" checked={modalUser?.access?.settings ?? false} onChange={(e) => handleAccessChange(e)} />
                                                <label className="text-white/80 text-xs mt-1">Settings</label>
                                            </div>
                                            <div className='col-span-1 flex flex-col text-left justify-start items-start'>
                                                <input type="checkbox" name="reports" className="form-checkbox h-5 w-5 text-accent" checked={modalUser?.access?.reports ?? false} onChange={(e) => handleAccessChange(e)} />
                                                <label className="text-white/80 text-xs mt-1">Reports</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            <div className="flex flex-row justify-end items-center w-full mt-4">
                                <button className="bg-white text-black px-2 md:px-4 py-2 text-base rounded-md mr-4" onClick={() => setShowTeamModal(false)}>
                                    Cancel
                                </button>
                                <button className="bg-secondary text-black px-2 md:px-4 py-2 text-base rounded-md" onClick={() => {
                                    if (modalUser.id == 0) {
                                        addTeam(modalUser)
                                    } else {
                                        updateTeam(modalUser)
                                    }
                                }}>
                                    {modalUser.id == 0 ? 'Add Admin' : 'Update Admin'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>


            </div>
        </>
    )
}