import Head from 'next/head';
import { useEffect, useState } from 'react'
import { AiOutlinePause, AiFillCloseCircle, AiOutlineArrowLeft, AiOutlineArrowRight, AiOutlineSearch, AiOutlineLoading3Quarters, AiOutlinePlayCircle, AiFillEdit } from 'react-icons/ai'
import { IoIosPersonAdd } from 'react-icons/io'
import { MdOutlineLocalOffer } from 'react-icons/md';
import { TfiReload } from 'react-icons/tfi';
import { toast } from 'react-toastify';
import { convertReadableDate } from '../helpers/date';
import { Deposit } from './deposits';
// Offer interface
export interface Offer {
    id: number
    name: string
    description: string
    type: string
    value: number
    is_percentage: boolean
    min_deposit: number
    max_credit: number
    games_cutoff: number
    code: string
    is_reusable?: boolean // for multiple use
    is_bonus?: boolean // if true, then offer is a bonus and will be stored in user.bonus else will be added to user.credit/wallet
    valid_till: Date
    is_active: boolean
    is_deleted: boolean // soft delete
    deposits?: Deposit[] // for fetching deposits for this offer
    createdAt?: string
    updatedAt?: string
}

export default function Offers() {
    const [Offers, setOffers] = useState<Offer[]>([])
    const [page, setPage] = useState(1)
    const [hasNextPage, setHasNextPage] = useState(false)
    const [search, setSearch] = useState('')
    const [showOfferModal, setShowOfferModal] = useState(false)
    const [loading, setLoading] = useState(true)
    const emptyOffer: Offer = {
        id: 0,
        name: '',
        description: '',
        type: 'deposit',
        value: 0,
        is_percentage: false,
        min_deposit: 0,
        max_credit: 99999999,
        games_cutoff: 0,
        code: '',
        is_reusable: false,
        is_bonus: false,
        valid_till: new Date(new Date().setDate(new Date().getDate() + 30)), // valid_till new date after 30 days
        is_active: false,
        is_deleted: false,
        deposits: []
    }
    const [modalOffer, setModalOffer] = useState<Offer>(emptyOffer)

    // Call API to fetch Offers
    const fetchOffers = async () => {
        setLoading(true);
        const limit = 20;
        const skip = page > 1 ? (page - 1) * 20 : 0;
        const options = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        };

        const response = await fetch(`/api/offer?limit=${limit}&skip=${skip}&search=${search}`, options);

        if (response.status === 200) {
            const data = await response.json();
            if (!response.ok) {
                const error = (data && data.message) || response.status;
                return Promise.reject(error);
            }
            setOffers(data);
            setHasNextPage(data && data.length === limit);
            setLoading(false);
        } else {
            toast.error(await response.text());
        }
    }

    useEffect(() => {
        fetchOffers()
    }, [page, search])

    // Call API to add Offer
    const addOffer = async (offer: Offer) => {
        // if offer details are empty, return
        if (!offer.name || !offer.type || !offer.code) {
            toast.error('Name, Type, Value & Code are required to add an Offer');
            return;
        }
        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(offer)
        };

        const response = await fetch('/api/offer/', options)

        if (response.status === 200) {
            // add offer to state
            const data = await response.json();
            if (!response.ok) {
                const error = (data && data.message) || response.status;
                return Promise.reject(error);
            }
            setShowOfferModal(false);
            setOffers([data, ...Offers])
            toast.success('Offer added successfully');
        } else {
            toast.error(await response.text());
        }
    }

    // Call API update Offer
    const updateOffer = async (offer: Offer) => {
        // if offer details are empty, return
        if (!offer.name || !offer.type || !offer.code || !offer.value) {
            toast.error('Name, Type, Value & Code are required to update an Offer');
            return;
        }
        const options = {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(offer)
        };

        const response = await fetch(`/api/offer/${offer.id}/`, options);

        if (response.status === 200) {
            const data = await response.json();
            if (!response.ok) {
                const error = (data && data.message) || response.status;
                return Promise.reject(error);
            }
            setShowOfferModal(false);
            setOffers(Offers.map((o) => o.id === offer.id ? offer : o)); // update offer in state
            toast.success('Offer updated successfully');
        } else {
            toast.error(await response.text());
        }
    }

    // Activate Offer
    const activateOffer = async (id: number) => {
        if (!confirm('Are you sure you want to restore and activate this Offer?')) return; // confirm
        const options = {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
        };
        // Call API to restore Offer
        const response = await fetch(`/api/offer/activate/${id}/`, options);

        if (response.status === 200) {
            // set is_deleted to false in state
            setOffers(Offers.map((o) => o.id === id ? { ...o, is_active: true } : o));
            toast.success('Offer Restored');
        } else {
            toast.error(await response.text());
        }
    }

    // Deactivate Offer
    const deactivateOffer = async (id: number) => {
        if (!confirm('Are you sure you want to deactivate this Offer?')) return; // confirm
        const options = {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
        };

        const response = await fetch(`/api/offer/deactivate/${id}/`, options);

        if (response.status === 200) {
            // set is_active to false in state
            setOffers(Offers.map((o) => o.id === id ? { ...o, is_active: false } : o));
            toast.success('Offer Deactivated');
        } else {
            toast.error(await response.text());
        }
    }

    // Delete Offer
    const deleteOffer = async (id: number) => {
        if (!confirm('Are you sure you want to delete this Offer?')) return; // confirm
        const options = {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        };

        const response = await fetch(`/api/offer/${id}/`, options);

        if (response.status === 200) {
            // set is_deleted to true in state
            setOffers(Offers.map((b) => b.id === id ? { ...b, is_deleted: true, is_active: false } : b))
            toast.success('Offer Disabled');
        } else {
            toast.error(await response.text());
        }
    }

    // Restore Offer
    const restoreOffer = async (id: number) => {
        if (!confirm('Are you sure you want to restore this Offer?')) return; // confirm
        const options = {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
        };
        // Call API to restore Offer
        const response = await fetch(`/api/offer/restore/${id}/`, options);

        if (response.status === 200) {
            // set is_deleted to false in state
            setOffers(Offers.map((o) => o.id === id ? { ...o, is_deleted: false, is_active: true } : o));
            toast.success('Offer Restored');
        } else {
            toast.error(await response.text());
        }
    }

    return (
        <>
            <Head>
                <title>Offers | Spade365</title>
                <meta name="description" content="Offers | Spade365" />
            </Head>
            <div className="flex flex-col justify-start items-center min-h-[800px] w-full container mx-auto overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between w-full items-center mb-8 md:mb-4">
                    <h1 className="text-center md:text-left text-4xl lg:text-5xl my-6 w-1/2">
                        Offers
                    </h1>
                    {/* search and add Offer button */}
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
                                }}
                            />
                        </div>
                        {/* button to add Offer */}
                        <button
                            className="ml-4 p-2 bg-white text-black rounded-md flex flex-row justify-center items-center"
                            title='Add Offer'
                            onClick={() => {
                                setModalOffer(emptyOffer)
                                setShowOfferModal(true)
                            }}
                        >
                            <MdOutlineLocalOffer className='text-2xl' />
                            <span className='ml-1 hidden lg:inline-block'>Add Offer</span>
                        </button>
                    </div>
                </div>
                <div className='overflow-x-scroll scrollbar-hide w-full'>
                    {/* table with Offers, Offer, amount, date, status, action */}
                    <table className="table-auto w-full text-left break-words">
                        <thead className="bg-primary text-white">
                            <tr>
                                <th className="border border-white/20 px-4 py-2 text-center">ID</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Name</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Description</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Code</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Type</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Value</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Percentage?</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Min. Deposit</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Max. Credit</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Games Cutoff</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Valid Till</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Active</th>
                                {/* <th className="border border-white/20 px-4 py-2 text-center">Deposits</th> */}
                                <th className="border border-white/20 px-4 py-2 text-center">Date Added</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* map through Offers and display them */}
                            {Offers && Offers.map((offer) => (
                                <tr key={offer.id} className={`h-[120px] odd:bg-transparent even:bg-primary/10 ${offer.is_deleted ? 'text-red-500' : ''}`}>
                                    <td className={`border border-white/20 px-4 py-2 text-left font-semibold`}>
                                        {offer.id}
                                    </td>
                                    <td className="border border-white/20 px-4 py-2 uppercase text-center">
                                        {offer.name}
                                    </td>
                                    <td className="border border-white/20 px-4 py-2 text-center">
                                        {offer.description}
                                    </td>
                                    <td className="border border-white/20 px-4 py-2 uppercase text-center">
                                        {offer.code}
                                    </td>
                                    <td className="border border-white/20 px-4 py-2 uppercase text-center">
                                        {offer.type}
                                    </td>
                                    <td className="border border-white/20 px-4 py-2 uppercase text-center">
                                        {offer.value} {offer.is_percentage ? '%' : '₹'}
                                    </td>
                                    <td className="border border-white/20 px-4 py-2 uppercase text-center">
                                        {offer.is_percentage ? 'Yes' : 'No'}
                                    </td>
                                    <td className={`border border-white/20 px-4 py-2 text-center`}>
                                        {offer.min_deposit}
                                    </td>
                                    <td className="border border-white/20 px-4 py-2 text-center">
                                        {offer.max_credit}
                                    </td>
                                    <td className="border border-white/20 px-4 py-2 text-center">
                                        {offer.games_cutoff}
                                    </td>
                                    <td className="border border-white/20 px-4 py-2 text-center">
                                        {convertReadableDate(offer.valid_till)}
                                    </td>
                                    <td className={`border border-white/20 px-4 py-2 uppercase font-semibold text-center ${!offer.is_active ? 'text-red-500' : 'text-green-500'}`}>
                                        {offer.is_active ? 'Yes' : 'No'}
                                    </td>
                                    {/* <td className="border border-white/20 px-4 py-2 text-center">
                                        {offer.deposits && offer.deposits.length}
                                    </td> */}
                                    <td className="border border-white/20 px-4 py-2 text-center" title={offer.createdAt}>
                                        {offer.createdAt && convertReadableDate(offer.createdAt as string)}
                                    </td>
                                    <td className="border border-white/20 px-4 py-2 max-w-[200px] ">
                                        <div className='grid grid-cols-1 gap-2'>
                                            {/* Edit */}
                                            <button
                                                title='Edit Offer'
                                                onClick={() => {
                                                    setModalOffer(offer)
                                                    setShowOfferModal(true)
                                                }}
                                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-2 rounded text-center flex flex-row justify-center items-center">
                                                <AiFillEdit className='text-2xl' />
                                            </button>
                                            {/* Activate/Deactivate */}
                                            {!offer.is_deleted && (
                                                offer.is_active ? (
                                                    <button title='Deactivate Offer' onClick={() => deactivateOffer(offer.id)} className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-2 rounded text-center flex flex-row justify-center items-center">
                                                        <AiOutlinePause className='text-2xl' />
                                                    </button>
                                                ) : (
                                                    <button title='Activate Offer' onClick={() => activateOffer(offer.id)} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-2 rounded text-center flex flex-row justify-center items-center">
                                                        <AiOutlinePlayCircle className='text-2xl' />
                                                    </button>
                                                )
                                            )}
                                            {/* Delete/Restore */}
                                            {offer.is_deleted ? (
                                                <button title='Activate Offer' onClick={() => restoreOffer(offer.id)} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-2 rounded text-center flex flex-row justify-center items-center">
                                                    <TfiReload className='text-2xl' />
                                                </button>
                                            ) : (
                                                <button title='Delete Offer' onClick={() => deleteOffer(offer.id)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-2 rounded text-center flex flex-row justify-center items-center">
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
                                <span className='text-sm text-white/60'>Showing {Offers.length} of {total} Offers</span>
                            </td> */}
                                {/* loading spinner if loading is true */}
                                {loading && (
                                    <td colSpan={15} className="border border-white/20 px-4 py-8 text-center">
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

                {/* Add/Edit Offer Modal */}
                <div className={`fixed top-0 backdrop-blur left-0 w-full h-full bg-black/50 z-50 flex flex-col justify-center items-center ${showOfferModal ? 'visible' : 'invisible'}`}>
                    <div className="bg-slate-900/95 w-[95vw] max-w-[1200px] rounded-md overflow-y-scroll scrollbar-hide flex flex-col justify-start items-start p-4">
                        <h2 className="text-2xl my-4">
                            {modalOffer.id == 0 ? 'Add Offer' : 'Edit Offer'}
                        </h2>
                        <div className="flex flex-col justify-start items-start w-full ">

                            <div className='grid grid-cols-1 md:grid-cols-2 gap-x-2 w-full'>
                                <div className='w-full'>
                                    <label className="text-sm text-white/80 mb-2 font-semibold flex flex-col">
                                        Offer Type
                                        <small className='font-light'>Where will this bonus be applied. Default: Deposit</small>
                                    </label>
                                    <select className="bg-slate-900/80 text-white/80 w-full rounded-md px-4 py-2 mb-4" value={modalOffer.type} onChange={(e) => setModalOffer({ ...modalOffer, type: e.target.value })}>
                                        <option value={'deposit'}>Deposit</option>
                                    </select>
                                </div>
                                <div className='w-full'>
                                    <label className="text-sm text-white/80 mb-2 font-semibold flex flex-col">
                                        Offer Code*
                                        <small className='font-light'>Ex: BONUS500, SPADE1000</small>
                                    </label>
                                    <input placeholder='Offer Code. Ex: BONUS500' type="text" className="bg-slate-900/80 text-white/80 w-full rounded-md px-4 py-2 mb-4" value={modalOffer.code} onChange={(e) => setModalOffer({ ...modalOffer, code: e.target.value })} required />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-x-2 w-full'>
                                <div className='w-full col-span-2'>
                                    <label className="text-sm text-white/80 mb-2 font-semibold flex flex-col">
                                        Offer Name*
                                        <small className='font-light'>Explain the offer conditions, like Rs500 deposit pe Rs2000 Bonus..</small>
                                    </label>
                                    <input type={"text"} placeholder={"Offer Name. Ex: Ab Aaega Betting Ka Maza Offer..."} className="bg-slate-900/80 text-white/80 w-full rounded-md px-4 py-2 mb-4" value={modalOffer.name} onChange={(e) => setModalOffer({ ...modalOffer, name: e.target.value })} required />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-x-2 w-full'>
                                <div className='w-full col-span-2'>
                                    <label className="text-sm text-white/80 mb-2 font-semibold flex flex-col">
                                        Offer Description
                                        <small className='font-light'>Explain the offer conditions, like Rs500 deposit pe Rs2000 Bonus..</small>
                                    </label>
                                    <textarea placeholder={"Offer Description. Ex: Explain the offer conditions, like Rs500 deposit pe Rs2000 Bonus.."} className="bg-slate-900/80 text-white/80 w-full rounded-md px-4 py-2 mb-4" value={modalOffer.description} onChange={(e) => setModalOffer({ ...modalOffer, description: e.target.value })} />
                                </div>
                            </div>

                            <div className='grid grid-cols-1 md:grid-cols-2 gap-x-2 w-full'>
                                <div className='w-full col-span-1'>
                                    <label className="text-sm text-white/80 mb-2 font-semibold flex flex-col">
                                        Is Percentage?*
                                        <small className='font-light'>Is the bonus of type percentage?</small>
                                    </label>
                                    <select className="bg-slate-900/80 text-white/80 w-full rounded-md px-4 py-2 mb-4" value={modalOffer.is_percentage ? 1 : 0} onChange={(e) => setModalOffer({ ...modalOffer, is_percentage: parseInt(e.target.value) === 1 ? true : false })}>
                                        <option value={1}>Yes</option>
                                        <option value={0}>No</option>
                                    </select>
                                </div>
                                <div className='w-full col-span-1'>
                                    <label className="text-sm text-white/80 mb-2 font-semibold flex flex-col">Offer Value* {modalOffer.is_percentage ? '(Percent)' : '(₹)'}
                                        <small className='font-light'>Amount of bonus that will be given to the user</small>
                                    </label>
                                    <div className='relative'>
                                        <input placeholder='Value of bonus that will be given to the user when conditions are met.' type="number" min={0} className="bg-slate-900/80 text-white/80 w-full rounded-md px-4 py-2 mb-4" value={modalOffer.value} onChange={(e) => setModalOffer({ ...modalOffer, value: parseInt(e.target.value) })} required />
                                        <span className='font-light absolute -ml-16 top-2.5'>{modalOffer.is_percentage ? '%' : '₹'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className='grid grid-cols-1 md:grid-cols-2 gap-x-2 w-full'>
                                <div className='w-full col-span-1'>
                                    <label className="text-sm text-white/80 mb-2 font-semibold flex flex-col">
                                        Minimum Deposit (₹)*
                                        <small className='font-light'>Minimum amount of deposit that is required for this offer</small>
                                    </label>
                                    <input placeholder='Minimum amount of deposit that is required for this offer.' min={0} type="number" className="bg-slate-900/80 text-white/80 w-full rounded-md px-4 py-2 mb-4" value={modalOffer.min_deposit} onChange={(e) => setModalOffer({ ...modalOffer, min_deposit: parseInt(e.target.value) })} required />
                                </div>
                                <div className='w-full col-span-1'>
                                    <label className="text-sm text-white/80 mb-2 font-semibold flex flex-col">
                                        Max Credit/Bonus (₹) (Per User)*
                                        <small className='font-light'>Maximum amount of bonus per user that can be claimed on this offer</small>
                                    </label>
                                    <input placeholder='Maximum amount of bonus that can be claimed on this offer.' min={0} type="number" className="bg-slate-900/80 text-white/80 w-full rounded-md px-4 py-2 mb-4" value={modalOffer.max_credit} onChange={(e) => setModalOffer({ ...modalOffer, max_credit: parseInt(e.target.value) > 99999999 ? 99999999 : parseInt(e.target.value) })} required />
                                </div>
                            </div>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-x-2 w-full'>
                                <div className='w-full col-span-1'>
                                    <label className="text-sm text-white/80 mb-2 font-semibold flex flex-col">
                                        Save Bonus As?*
                                        <small className='font-light'>If Credit, then bonus will be added to credit else seperately as bonus</small>
                                    </label>
                                    <select className="bg-slate-900/80 text-white/80 w-full rounded-md px-4 py-2 mb-4" value={modalOffer.is_bonus ? 1 : 0} onChange={(e) => setModalOffer({ ...modalOffer, is_bonus: parseInt(e.target.value) === 1 ? true : false })}>
                                        <option value={0}>Credit/Wallet</option>
                                        <option value={1}>Bonus</option>
                                    </select>
                                </div>
                                <div className='w-full col-span-1'>
                                    <label className="text-sm text-white/80 mb-2 font-semibold flex flex-col">
                                        Is Reusable?*
                                        <small className='font-light'>Can this offer be claimed by same user multiple times?</small>
                                    </label>
                                    <select className="bg-slate-900/80 text-white/80 w-full rounded-md px-4 py-2 mb-4" value={modalOffer.is_reusable ? 1 : 0} onChange={(e) => setModalOffer({ ...modalOffer, is_reusable: parseInt(e.target.value) === 1 ? true : false })}>
                                        <option value={1}>Yes</option>
                                        <option value={0}>No</option>
                                    </select>
                                </div>
                            </div>

                            <div className='grid grid-cols-1 md:grid-cols-2 gap-x-2 w-full'>
                                <div className='w-full'>
                                    <label className="text-sm text-white/80 mb-2 font-semibold flex flex-col">Minimum Bets Placed*
                                        <small className='font-light'>Minimum number of bets placed before claiming this offer</small>
                                    </label>
                                    <input placeholder='Minimum number of bets placed before claiming this offer.' min={0} type="number" className="bg-slate-900/80 text-white/80 w-full rounded-md px-4 py-2 mb-4" value={modalOffer.games_cutoff} onChange={(e) => setModalOffer({ ...modalOffer, games_cutoff: parseInt(e.target.value) })} required />
                                </div>
                                <div className='w-full'>
                                    <label className="text-sm text-white/80 mb-2 font-semibold flex flex-col">Valid Till*
                                        <small className='font-light'>Date till which this offer is valid</small>
                                    </label>
                                    <input placeholder='Valid Till' type="date" className="bg-slate-900/80 text-white/80 w-full rounded-md px-4 py-2 mb-4" onChange={(e) => {
                                        if (e.target.value) setModalOffer({ ...modalOffer, valid_till: new Date(e.target.value) })
                                    }}
                                        value={modalOffer.valid_till ? new Date(modalOffer.valid_till).toISOString().split('T')[0] : ''}
                                        required />
                                </div>
                            </div>

                            <div className="flex flex-row justify-end items-center w-full mt-4">
                                <button className="bg-white text-black px-4 py-2 text-base rounded-md mr-4" onClick={() => setShowOfferModal(false)}>
                                    Cancel
                                </button>
                                <button className="bg-secondary text-black px-4 py-2 text-base rounded-md" onClick={() => {
                                    if (modalOffer.id == 0) {
                                        addOffer(modalOffer)
                                    } else {
                                        updateOffer(modalOffer)
                                    }
                                }}>
                                    {modalOffer.id == 0 ? 'Add Offer' : 'Update Offer'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>


            </div>
        </>
    )
}