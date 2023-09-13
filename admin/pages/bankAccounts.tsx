import Head from 'next/head';
import { useEffect, useState } from 'react'
import { AiFillCloseCircle, AiOutlineArrowLeft, AiOutlineArrowRight, AiOutlineSearch, AiOutlineLoading3Quarters, AiFillBank, AiOutlineUpload, AiOutlineClose } from 'react-icons/ai'
import { TfiReload } from 'react-icons/tfi';
import { toast } from 'react-toastify';
import { convertReadableDate } from '../helpers/date';
// BankAccount interface
export interface BankAccount {
    id: number,
    type: string, // savings, current, upi etc
    method: string, // imps, neft, rtgs, upi etc
    user_id: number,
    min_amount: number, // minimum amount that this account accepts
    max_amount: number, // maxiumum amount that this account accepts
    ifsc: string,
    name: string, // bank name, also used for upi id
    image?: string, // base64 img. used for upi qr code
    account_name: string, // account holder name, also used for upi name
    bank_name?: string, // optional as bank name is not needed when adding upi id
    account: string, // optional as account number is not needed when adding upi id
    is_deleted: boolean,
    createdAt?: string,
    updatedAt?: string,
    for_admin?: boolean,
}

export default function BankAccounts() {
    const [BankAccounts, setBankAccounts] = useState<BankAccount[]>([])
    const [page, setPage] = useState(1)
    const [hasNextPage, setHasNextPage] = useState(false)
    const [search, setSearch] = useState('')
    const [showBankAccountModal, setShowBankAccountModal] = useState(false)
    const [loading, setLoading] = useState(true)
    const emptyBankAccount: BankAccount = {
        id: 0,
        type: 'savings',
        method: 'neft',
        user_id: 0,
        min_amount: 100,
        max_amount: 10000,
        ifsc: '',
        name: '',
        account_name: '',
        account: '',
        is_deleted: false,
        for_admin: true
    }
    const [modalBankAccount, setModalBankAccount] = useState<BankAccount>(emptyBankAccount)

    // Call API to fetch BankAccounts
    const fetchBankAccounts = async () => {
        setLoading(true);
        const limit = 20;
        const skip = page > 1 ? (page - 1) * 20 : 0;
        const options = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        };

        const response = await fetch(`/api/bankAccounts?limit=${limit}&skip=${skip}&search=${search}`, options);

        if (response.status === 200) {
            const data = await response.json();
            if (!response.ok) {
                const error = (data && data.message) || response.status;
                return Promise.reject(error);
            }
            setBankAccounts(data);
            setHasNextPage(data && data.length === limit);
            setLoading(false);
        } else {
            toast.error(await response.text());
        }
    }

    useEffect(() => {
        fetchBankAccounts()
    }, [page, search])

    useEffect(() => {
        if (modalBankAccount.type == "upi" && modalBankAccount.method != "upi") {
            setModalBankAccount({ ...modalBankAccount, method: "upi" })
        }
    }, [modalBankAccount.method, modalBankAccount.type])

    // Call API to add BankAccount
    const addBankAccount = async (bank: BankAccount) => {
        // if bank details are empty, return
        if (!bank.name || !bank.type || !bank.method || !bank.min_amount || !bank.max_amount || !bank.account_name) {
            toast.error('All fields are required to add a bank account');
            return;
        }
        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ifsc: bank.ifsc,
                name: bank.name,
                account: bank.account,
                account_name: bank.account_name,
                image: bank.image,
                type: bank.type,
                method: bank.method,
                min_amount: bank.min_amount,
                max_amount: bank.max_amount,
            })
        };

        const response = await fetch('/api/bankAccounts/', options)

        if (response.status === 200) {
            // add bank to state
            const data = await response.json();
            if (!response.ok) {
                const error = (data && data.message) || response.status;
                return Promise.reject(error);
            }
            setShowBankAccountModal(false);
            setBankAccounts([data, ...BankAccounts])
            toast.success('Bank Account added successfully');
        } else {
            toast.error(await response.text());
        }
    }

    // Call API update BankAccount
    const updateBankAccount = async (bank: BankAccount) => {
        // if bank details are empty, return
        if (!bank.name || !bank.type || !bank.method || !bank.min_amount || !bank.max_amount || !bank.account_name) {
            toast.error('All fields are required to add a bank account');
            return;
        }
        const body = {
            ifsc: bank.ifsc,
            name: bank.name,
            account: bank.account,
            account_name: bank.account_name,
            image: bank.image,
            type: bank.type,
            method: bank.method,
            min_amount: bank.min_amount,
            max_amount: bank.max_amount,
        }
        const options = {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        };

        const response = await fetch(`/api/bankAccounts/${bank.id}/`, options)

        if (response.status === 200) {
            const data = await response.json();
            if (!response.ok) {
                const error = (data && data.message) || response.status;
                return Promise.reject(error);
            }
            setShowBankAccountModal(false);
            setBankAccounts(BankAccounts.map((b) => b.id === bank.id ? bank : b)) // update bank in state
            toast.success('Bank Account updated successfully');
        } else {
            toast.error(await response.text());
        }
    }

    const restoreBankAccount = async (id: number) => {
        if (!confirm('Are you sure you want to restore and activate this bank account?')) return; // confirm
        const options = {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
        };
        // Call API to restore BankAccount
        const response = await fetch(`/api/bankAccounts/${id}/restore/`, options)

        if (response.status === 200) {
            // set is_deleted to false in state
            setBankAccounts(BankAccounts.map((b) => b.id === id ? { ...b, is_deleted: false } : b))
            toast.success('Bank Account Restored');
        } else {
            toast.error(await response.text());
        }
    }

    // Call API to delete BankAccount
    const deleteBankAccount = async (id: number) => {
        if (!confirm('Are you sure you want to delete this bank account?')) return; // confirm
        const options = {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        };

        const response = await fetch(`/api/bankAccounts/${id}/`, options)

        if (response.status === 200) {
            // set is_deleted to true in state
            setBankAccounts(BankAccounts.map((b) => b.id === id ? { ...b, is_deleted: true } : b))
            toast.success('Bank Account Disabled');
        } else {
            toast.error(await response.text());
        }
    }

    return (
        <>
            <Head>
                <title>Bank Accounts | Spade365</title>
                <meta name="description" content="Bank Accounts | Spade365" />
            </Head>
            <div className="flex flex-col justify-start items-center min-h-[800px] w-full container mx-auto overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between w-full items-center mb-8 md:mb-4">
                    <h1 className="text-center md:text-left text-4xl lg:text-5xl my-6 w-1/2">
                        Bank Accounts
                    </h1>
                    {/* search and add BankAccount button */}
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
                        {/* button to add BankAccount */}
                        <button
                            className="ml-4 p-2 bg-white text-black rounded-md flex flex-row justify-center items-center"
                            title='Add BankAccount'
                            onClick={() => {
                                setModalBankAccount(emptyBankAccount)
                                setShowBankAccountModal(true)
                            }}
                        >
                            <AiFillBank className='text-2xl' />
                            <span className='ml-1 hidden lg:inline-block'>Add Bank Account</span>
                        </button>
                    </div>
                </div>
                <div className='overflow-x-scroll scrollbar-hide w-full'>
                    {/* table with BankAccounts, BankAccount, amount, date, status, action */}
                    <table className="table-auto w-full text-left break-words">
                        <thead className="bg-primary text-white">
                            <tr>
                                <th className="border border-white/20 px-4 py-2 text-center">ID</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Bank Name</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Type</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Method</th>
                                <th className="border border-white/20 px-4 py-2 text-center">IFSC</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Account Name</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Account No.</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Min. Amount</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Max. Amount</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Active</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Date Added</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* map through BankAccounts and display them */}
                            {BankAccounts && BankAccounts.map((account) => (
                                <tr key={account.id} className={`h-[120px] odd:bg-transparent even:bg-primary/10 ${account.is_deleted ? 'text-red-500' : ''}`}>
                                    <td className={`border border-white/20 px-4 py-2 text-left font-semibold`}>
                                        {account.id}
                                    </td>
                                    <td className="border border-white/20 px-4 py-2 uppercase text-center">
                                        {account.name}
                                    </td>
                                    <td className="border border-white/20 px-4 py-2 uppercase text-center">
                                        {account.type}
                                    </td>
                                    <td className="border border-white/20 px-4 py-2 uppercase text-center">
                                        {account.method}
                                    </td>
                                    <td className="border border-white/20 px-4 py-2 uppercase text-center">
                                        {account.ifsc}
                                    </td>
                                    <td className="border border-white/20 px-4 py-2 uppercase text-center">
                                        {account.account_name}
                                    </td>
                                    <td className="border border-white/20 px-4 py-2 uppercase text-center">
                                        {account.account}
                                    </td>
                                    <td className={`border border-white/20 px-4 py-2 text-center`}>
                                        {account.min_amount}
                                    </td>
                                    <td className="border border-white/20 px-4 py-2 text-center">
                                        {account.max_amount}
                                    </td>
                                    <td className={`border border-white/20 px-4 py-2 uppercase font-semibold text-center ${account.is_deleted ? 'text-red-500' : 'text-green-500'}`}>
                                        {account.is_deleted ? 'No' : 'Yes'}
                                    </td>
                                    <td className="border border-white/20 px-4 py-2 text-center" title={account.createdAt}>
                                        {account.createdAt && convertReadableDate(account.createdAt as string)}
                                    </td>
                                    <td className="border border-white/20 px-4 py-2 max-w-[200px] ">
                                        <div className='grid grid-cols-1 gap-2'>
                                            {/* Edit button. Disabled for now, as bank accounts will be used for record keeping, not a good idea to update them. */}
                                            {/* <button
                                                title='Edit BankAccount'
                                                onClick={() => {
                                                    setModalBankAccount(account)
                                                    setShowBankAccountModal(true)
                                                }}
                                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-2 rounded text-center flex flex-row justify-center items-center">
                                                <AiFillEdit className='text-2xl' />
                                            </button> */}
                                            {account.is_deleted ? (
                                                <button title='Activate Bank Account' onClick={() => restoreBankAccount(account.id)} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-2 rounded text-center flex flex-row justify-center items-center">
                                                    <TfiReload className='text-2xl' />
                                                </button>
                                            ) : (
                                                <button title='Delete Bank Account' onClick={() => deleteBankAccount(account.id)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-2 rounded text-center flex flex-row justify-center items-center">
                                                    <AiFillCloseCircle className='text-2xl' />
                                                </button>
                                            )}

                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                {/* <td colSpan={8} className="border border-white/20 px-4 py-2 text-center">
                                <span className='text-sm text-white/60'>Showing {BankAccounts.length} of {total} BankAccounts</span>
                            </td> */}
                                {/* loading spinner if loading is true */}
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

                {/* Add/Edit BankAccount Modal */}
                <div className={`fixed top-0 backdrop-blur left-0 w-full h-full bg-black/50 z-50 flex flex-col justify-center items-center ${showBankAccountModal ? 'visible' : 'invisible'}`}>
                    <div className="bg-slate-900/95 w-[95vw] max-w-[1200px] rounded-md overflow-y-scroll scrollbar-hide flex flex-col justify-start items-start p-4">
                        <h2 className="text-2xl my-4">
                            {modalBankAccount.id == 0 ? 'Add Bank Account' : 'Edit Bank Account'}
                        </h2>
                        <div className="flex flex-col justify-start items-start w-full ">

                            <div className='grid grid-cols-1 md:grid-cols-2 gap-x-2 w-full'>
                                <div className='w-full'>
                                    <label className="text-sm text-white/80 mb-2 font-semibold">Account Type</label>
                                    <select className="bg-slate-900/80 text-white/80 w-full rounded-md px-4 py-2 mb-4" value={modalBankAccount.type} onChange={(e) => setModalBankAccount({ ...modalBankAccount, type: e.target.value })} required>
                                        <option value={'savings'}>Savings Account</option>
                                        <option value={'current'}>Current Account</option>
                                        <option value={'upi'}>UPI</option>
                                    </select>
                                </div>
                                <div className='w-full'>
                                    <label className="text-sm text-white/80 mb-2 font-semibold">Method</label>
                                    <select className="bg-slate-900/80 text-white/80 w-full rounded-md px-4 py-2 mb-4" value={modalBankAccount.method} onChange={(e) => setModalBankAccount({ ...modalBankAccount, method: e.target.value })} required>
                                        <option value={'imps'} disabled={modalBankAccount.type == "upi"}>IMPS</option>
                                        <option value={'neft'} disabled={modalBankAccount.type == "upi"}>NEFT</option>
                                        <option value={'rtgs'} disabled={modalBankAccount.type == "upi"}>RTGS</option>
                                        <option value={'upi'} disabled={modalBankAccount.type !== "upi"}>UPI</option>
                                    </select>
                                </div>
                            </div>

                            {modalBankAccount.type == 'upi' && (
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-x-2 w-full'>
                                    <div className='w-full'>
                                        <label className="text-sm text-white/80 mb-2 font-semibold">UPI ID*</label>
                                        <input placeholder='UPI ID. Example: 1234567890@upi' type="text" className="bg-slate-900/80 text-white/80 w-full rounded-md px-4 py-2 mb-4" value={modalBankAccount.name} onChange={(e) => setModalBankAccount({ ...modalBankAccount, name: e.target.value })} required />
                                    </div>
                                    <div className='w-full'>
                                        <label className="text-sm text-white/80 mb-2 font-semibold">UPI Name*</label>
                                        <input placeholder='Name of UPI. Example: Rakesh Kumar' type="text" className="bg-slate-900/80 text-white/80 w-full rounded-md px-4 py-2 mb-4" value={modalBankAccount.account_name} onChange={(e) => setModalBankAccount({ ...modalBankAccount, account_name: e.target.value })} required />
                                    </div>
                                </div>
                            )}

                            {modalBankAccount.type != 'upi' && (
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-x-2 w-full'>
                                    <div className='w-full'>
                                        <label className="text-sm text-white/80 mb-2 font-semibold">Bank Name*</label>
                                        <input placeholder='Name of bank. Example: SBI' type="text" className="bg-slate-900/80 text-white/80 w-full rounded-md px-4 py-2 mb-4" value={modalBankAccount.name} onChange={(e) => setModalBankAccount({ ...modalBankAccount, name: e.target.value })} required />
                                    </div>
                                    <div className='w-full'>
                                        <label className="text-sm text-white/80 mb-2 font-semibold">IFSC*</label>
                                        <input placeholder='IFSC Code of Bank. Example: SBIN0005943' type="text" className="bg-slate-900/80 text-white/80 w-full rounded-md px-4 py-2 mb-4" value={modalBankAccount.ifsc} onChange={(e) => setModalBankAccount({ ...modalBankAccount, ifsc: e.target.value })} required />
                                    </div>
                                </div>
                            )}
                            {modalBankAccount.type != 'upi' && (
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-x-2 w-full'>
                                    <div className='w-full'>
                                        <label className="text-sm text-white/80 mb-2 font-semibold">Account Name*</label>
                                        <input placeholder='Account holder name. Example: Rakesh Kumar' type="text" className="bg-slate-900/80 text-white/80 w-full rounded-md px-4 py-2 mb-4" value={modalBankAccount.account_name} onChange={(e) => setModalBankAccount({ ...modalBankAccount, account_name: e.target.value })} required />
                                    </div>
                                    <div className='w-full'>
                                        <label className="text-sm text-white/80 mb-2 font-semibold">Account Number*</label>
                                        <input placeholder='Account number.' type="text" className="bg-slate-900/80 text-white/80 w-full rounded-md px-4 py-2 mb-4" value={modalBankAccount.account} onChange={(e) => setModalBankAccount({ ...modalBankAccount, account: e.target.value })} required />
                                    </div>
                                </div>
                            )}

                            <div className='grid grid-cols-1 md:grid-cols-2 gap-x-2 w-full'>
                                <div className='w-full'>
                                    <label className="text-sm text-white/80 mb-2 font-semibold">Min Amount*</label>
                                    <input placeholder='Minimum amount that this bank account accepts' type="number" className="bg-slate-900/80 text-white/80 w-full rounded-md px-4 py-2 mb-4" value={modalBankAccount.min_amount} onChange={(e) => setModalBankAccount({ ...modalBankAccount, min_amount: parseInt(e.target.value) })} required />
                                </div>
                                <div className='w-full'>
                                    <label className="text-sm text-white/80 mb-2 font-semibold">Max Amount*</label>
                                    <input placeholder='Maximum amount that this bank account accepts' type="number" className="bg-slate-900/80 text-white/80 w-full rounded-md px-4 py-2 mb-4" value={modalBankAccount.max_amount} onChange={(e) => setModalBankAccount({ ...modalBankAccount, max_amount: parseInt(e.target.value) })} required />
                                </div>
                            </div>

                            {/* QR code Image (1:1 jpg, png) */}
                            {/* {modalBankAccount.type == 'upi' && ( */}
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-x-2 w-full mt-4'>
                                <div className='w-full col-span-1 flex flex-row justify-start items-start'>
                                    <div>
                                        <label className="text-sm text-white/80 mb-2 font-semibold">QR Code Image (1080x1080px)</label>
                                        <div className="bg-slate-900/80 text-white/80 w-full rounded-md py-2 mb-4 flex flex-row justify-start items-center">
                                            <input type="file" accept="image/*" id="image" onChange={(e) => {
                                                // convert image to base64
                                                const file = e?.target?.files ? e?.target?.files[0] : null;
                                                if (!file) return;
                                                const reader = new FileReader();
                                                reader.readAsDataURL(file as File);
                                                reader.onload = () => {
                                                    setModalBankAccount({ ...modalBankAccount, image: reader.result as string });
                                                };
                                                e.target.value = ''; // clear input
                                            }} />
                                            {/* <label htmlFor="image" className="cursor-pointer text-white flex flex-row justify-start items-center">
                                                <AiOutlineUpload className='mr-2 my-2' />{'Upload QR Code'}
                                            </label> */}
                                        </div>
                                    </div>
                                    {/* if modalBankAccount.image exists, show it */}
                                    {modalBankAccount.image && (
                                        <div>
                                            <div className="bg-slate-900/80 text-white/80 w-full rounded-md py-2 mb-4 flex flex-row justify-start items-center relative">
                                                {/* cross button to remove image */}
                                                <div className="absolute top-0 right-0 p-2 cursor-pointer" onClick={() => setModalBankAccount({ ...modalBankAccount, image: '' })}>
                                                    <AiOutlineClose className='text-white' />
                                                </div>
                                                <img src={modalBankAccount.image} className='w-32 h-32 object-cover' />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* )} */}

                            <div className="flex flex-row justify-end items-center w-full mt-4">
                                <button className="bg-white text-black px-4 py-2 text-base rounded-md mr-4" onClick={() => setShowBankAccountModal(false)}>
                                    Cancel
                                </button>
                                <button className="bg-secondary text-black px-4 py-2 text-base rounded-md" onClick={() => {
                                    if (modalBankAccount.id == 0) {
                                        addBankAccount(modalBankAccount)
                                    } else {
                                        updateBankAccount(modalBankAccount)
                                    }
                                }}>
                                    {modalBankAccount.id == 0 ? 'Add Account' : 'Update Account'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>


            </div>
        </>
    )
}