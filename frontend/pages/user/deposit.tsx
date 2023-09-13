import Head from "next/head"
import { useEffect, useState, Fragment } from "react"
import { IoMdCopy } from "react-icons/io"
import { toast } from "react-toastify"
import impsImg from "../../public/img/imps.png"
import upiImg from "../../public/img/upi.png"
import Image from "next/image"
import { useRouter } from "next/router"
import { User } from "../../store/User"
import { Dialog, Transition } from '@headlessui/react'
import Link from "next/link"
import useSiteContext from "../../hooks/useSiteContext"

// deposit interface
export interface Deposit {
    id: number // deposit id in database
    user_id?: number // user id in database
    amount: number // request amount in rupees to deposit
    utr: string // unique transaction reference
    status: string // pending, approved, rejected
    remark?: string // admin remark 
    bank_id: number // admin bank id in which user deposited
    bonus?: number // bonus amount, calculated by backend from offer (if present) at the time of adding deposit request
    offer_id?: number | null // offer used by user
    createdAt?: string // date of deposit
    user?: User // details of user who made the deposit
    deposit_account?: BankAccount // details of bank account in which user deposited
    offer?: Offer | null // details of offer used by user, only one offer can be used
    readtnC?: boolean // Frontend only! read terms and conditions
}

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
    valid_till: Date
    is_reusable?: boolean
    is_bonus?: boolean
    is_active: boolean
    is_deleted: boolean // soft delete
    deposits: Deposit[]
    createdAt?: string
    updatedAt?: string
}

// BankAccount interface
export interface BankAccount {
    id: number,
    type: string, // savings, current etc
    method: string, // imps, neft, rtgs etc
    user_id: number,
    min_amount: number, // minimum amount that this account accepts
    max_amount: number, // maxiumum amount that this account accepts
    ifsc: string,
    name: string, // bank name
    image?: string, // base64 img. used for upi qr code
    account_name: string, // account holder name
    account: string,
    is_deleted: boolean,
    createdAt?: string,
    updatedAt?: string,
    for_admin?: boolean,
}

export default function Deposit() {
    const [canSubmit, setCanSubmit] = useState(false)
    const [bankAccounts, setBankAccounts] = useState([] as BankAccount[])
    const [offers, setOffers] = useState([] as Offer[])
    const [activeBank, setActiveBank] = useState({} as BankAccount)
    const [offerDetailsModalVisible, setOfferDetailsModalVisible] = useState(false)
    const [offerDetailsModalContent, setOfferDetailsModalContent] = useState('')
    const [termsModalVisible, setTermsModalVisible] = useState(false)
    const router = useRouter()
    const site = useSiteContext()
    const [deposit, setDeposit] = useState({
        id: 0,
        amount: 0,
        utr: "",
        status: "pending",
        bank_id: 0,
        // offer_id: 0,
        readtnC: false,
    } as Deposit)

    useEffect(() => {
        // on fetchBankAccounts success, set active bank to first bank account in list
        if (bankAccounts.length > 0 && deposit.bank_id) {
            const bank = bankAccounts.find(b => b.id === deposit.bank_id)
            if (bank) {
                setActiveBank(bank)
            }
        }
    }, [bankAccounts, deposit.bank_id])

    useEffect(() => {
        if (deposit.amount >= activeBank.min_amount && deposit.amount <= activeBank.max_amount && deposit.utr.length >= 6 && deposit.utr.length <= 12 && deposit.readtnC) {
            setCanSubmit(true)
        } else {
            setCanSubmit(false)
        }
    }, [deposit])

    // Call API to fetch BankAccounts
    const fetchBankAccounts = async () => {
        const limit = 20;
        const skip = 0;
        const options = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        };

        const response = await fetch(`/api/bankAccounts?limit=${limit}&skip=${skip}&search=`, options);

        if (response.status === 200) {
            const data = await response.json();
            if (!response.ok) {
                const error = (data && data.message) || response.status;
                return Promise.reject(error);
            }
            setBankAccounts(data);
            // if active bank is not set, set it to first bank account
            if (!deposit.bank_id && data.length > 0) {
                setDeposit({ ...deposit, bank_id: data[0].id })
            }
        } else {
            toast.error(await response.text())
        }
    }

    // Call API to fetch Offers
    const fetchOffers = async () => {
        const limit = 20;
        const skip = 0;
        const options = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        };

        const response = await fetch(`/api/offer?limit=${limit}&skip=${skip}&isActive=true&isValid=true&filter=deposit`, options);

        if (response.status === 200) {
            const data = await response.json();
            if (!response.ok) {
                const error = (data && data.message) || response.status;
                return Promise.reject(error);
            }
            setOffers(data);
        } else {
            toast.error(await response.text())
        }
    }

    // handle deposit form submit
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(deposit)
        };

        const response = await fetch(`/api/deposit`, options);

        if (response.status === 200) {
            const data = await response.json();
            if (!response.ok) {
                const error = (data && data.message) || response.status;
                return Promise.reject(error);
            }
            toast.success("Deposit request sent successfully. Amount will be credited in your account soon. Subject to approval.")
            router.push({ pathname: "/user/transactions", query: { tab: 0 } })
        } else {
            toast.error(await response.text())
        }
    }

    // get bank accounts & offers on load
    useEffect(() => {
        fetchBankAccounts();
        fetchOffers();
    }, [])

    const OfferCard = (props: { isActive?: boolean, promoCode: string, desc: string }) => {
        return <div className="mx-2 p-3 border-2 border-lightGrey rounded">
            <div className="flex-col">
                <div>
                    <input type="checkbox" className="float-right rounded-full checked:bg-primary" checked={props.isActive} />
                </div>
                <div className="text-grey1 text-base">{props.promoCode}</div>
                <div className="text-base">{props.desc}</div>
                <div className="underline cursor-pointer">Details</div>
            </div>
        </div>
    }

    return (
        <>
            <Head>
                <title>Deposit | Spade365</title>
                <meta name="description" content="Deposit | Spade365" />
            </Head>
            <div className="text-black grid grid-cols-6 md:grid-cols-12 break-words w-full max-w-7xl mx-auto my-12 px-4 max-md:bg-lightGrey max-md:my-0 max-md:p-2 bg-white">
                <div className="col-span-6 md:shadow-2xl py-9 px-16 max-md:w-full max-md:p-0">
                    <div className="my-8 max-md:bg-white max-md:m-2 max-md:p-4 max-md:rounded">
                        <div className="text-2xl md:text-3xl py-4 font-semibold tracking-wide">Deposit</div>
                        <div className="">
                            {activeBank.account && (
                                <div className="flex pb-2.5 place-content-between">
                                    <span className="text-xl text-grey">Account: <span className="font-bold uppercase tracking-wider ml-2">{activeBank.account}</span></span>
                                    <IoMdCopy
                                        onClick={() => {
                                            // copy to clipboard
                                            navigator.clipboard.writeText(activeBank.account)
                                            toast.success("Copied Account Number to Clipboard")
                                        }}
                                        className="ml-auto text-primary w-7 h-7 cursor-pointer" />
                                </div>
                            )}
                            {activeBank.ifsc && (
                                <div className="flex pb-2.5 place-content-between">
                                    <span className="text-xl text-grey">IFSC: <span className="font-bold uppercase tracking-wider ml-2">{activeBank.ifsc}</span></span>
                                    <IoMdCopy
                                        onClick={() => {
                                            // copy to clipboard
                                            navigator.clipboard.writeText(activeBank.ifsc)
                                            toast.success("Copied IFSC to Clipboard")
                                        }}
                                        className="ml-auto text-primary w-7 h-7 cursor-pointer" />
                                </div>
                            )}
                            {activeBank.account_name && (
                                <div className="flex pb-2.5 place-content-between">
                                    <span className="text-xl text-grey">Account Name: <span className="font-bold uppercase tracking-wider ml-2">{activeBank.account_name}</span></span>
                                    <IoMdCopy
                                        onClick={() => {
                                            // copy to clipboard
                                            navigator.clipboard.writeText(activeBank.account_name)
                                            toast.success("Copied Account Name to Clipboard")
                                        }}
                                        className="ml-auto text-primary w-7 h-7 cursor-pointer"
                                    />
                                </div>
                            )}

                            {activeBank.name && (
                                <div className="flex pb-2.5 place-content-between">
                                    <span className="text-xl text-grey">{activeBank.method == "upi" ? "UPI ID" : "Bank Name"}: <span className="font-bold uppercase tracking-wider ml-2">{activeBank.name}</span></span>
                                    <IoMdCopy
                                        onClick={() => {
                                            // copy to clipboard
                                            navigator.clipboard.writeText(activeBank.name)
                                            toast.success(`Copied ${activeBank.method == "upi" ? "UPI ID" : "Bank Name"} to Clipboard`)
                                        }}
                                        className="ml-auto text-primary w-7 h-7 cursor-pointer"
                                    />
                                </div>
                            )}
                            {activeBank.type != "upi" && (
                                <div className="flex pb-2.5 place-content-between">
                                    <span className="text-xl text-grey">Type: <span className="font-bold uppercase ml-2">{activeBank.method} {activeBank.type}</span></span>
                                    <IoMdCopy
                                        onClick={() => {
                                            // copy to clipboard
                                            navigator.clipboard.writeText(activeBank.method + " " + activeBank.type)
                                            toast.success("Copied Bank Type to Clipboard")
                                        }}
                                        className="ml-auto text-primary w-7 h-7 cursor-pointer"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col justify-center items-center mt-4">
                            {activeBank.image && (
                                <img src={activeBank.image} alt="bankLogo" className="w-56 h-auto object-contain" />
                            )}
                            {(activeBank.type === "upi") && (
                                <img src="/img/upi-powered.jpg" alt="upiLogo " className="w-96 mt-8" />
                            )}
                        </div>
                        <div className="mt-4 hidden md:flex flex-col">
                            <div className="mb-2.5">Notes</div>
                            <ul className="list-disc ml-4">
                                <li className="text-xs my-2">Make Payment with Payment methods</li>
                                <li className="text-xs my-2">Copy and Enter the 12 digit UTR Number</li>
                                <li className="text-xs my-2">Submit the form</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="col-span-6 md:shadow-2xl py-9 px-16 max-md:w-full max-md:p-2">
                    <form onSubmit={(e) => handleSubmit(e)}>
                        <div className="w-full max-md:p-4 bg-white rounded">
                            <div className="my-2 max-md:rounded">
                                <div className="font-semibold text-lg mb-3.5">Payment Options*</div>
                                <div className="flex overflow-x-scroll overflow-y-hidden pb-2.5">
                                    <Link
                                        href={`https://wa.me/${site?.whatsapp_number}?text=Hi%20I%20want%20to%20deposit%20in%20my%20spade%20account`}
                                        target={"_blank"}
                                        rel="noreferrer"
                                        className="p-2.5 mr-5 cursor-pointer w-[140px] min-h-[90px] rounded-xl min-w-[140px] bg-gradient-to-r from-primary/20 to-white/20" >
                                        <div className="flex flex-col">
                                            <Image className="mb-2" src={`/img/whatsapp.png`} alt="imps" width={40} height={40} />
                                            <h3 className="text-xl my-0 font-bold uppercase">
                                                {`Deposit via WhatsApp`}
                                            </h3>
                                            <small className="text-sm mt-2">24x7 Customer Support</small>
                                        </div>
                                    </Link>
                                    {bankAccounts.map((bank) => (
                                        <div
                                            key={bank.id}
                                            onClick={() => {
                                                setDeposit({
                                                    ...deposit,
                                                    bank_id: bank.id,
                                                })
                                            }}
                                            className="p-2.5 mr-5 cursor-pointer w-[140px] min-h-[90px] rounded-xl min-w-[140px] bg-gradient-to-r from-primary/20 to-white/20" >
                                            <div>
                                                <input
                                                    type="checkbox"
                                                    className="float-right rounded-full checked:bg-primary"
                                                    onChange={(e) => {
                                                        setDeposit({
                                                            ...deposit,
                                                            bank_id: bank.id,
                                                        })
                                                    }}
                                                    checked={bank.id === deposit.bank_id}
                                                />
                                            </div>
                                            <div className="flex flex-col">
                                                {bank.method === "imps" ? (
                                                    <Image className="mb-2" src={impsImg} alt="imps" width={109} height={29} />
                                                ) : bank.method === "upi" ? (
                                                    <Image className="mb-1" src={upiImg} alt="upi" width={80} height={29} />
                                                ) : (
                                                    <h3 className="text-2xl my-0 font-bold uppercase">
                                                        {bank.method}
                                                    </h3>
                                                )}
                                                <span className="uppercase">{bank.method}</span>
                                                <span className="text-base uppercase opacity-50">{bank.method === "imps" ? "Instant" : bank.method === "upi" ? "Instant" : bank.type}</span>
                                                {bank.min_amount && (
                                                    <span className="uppercase text-base">Min. &#x20b9; {bank.min_amount}</span>
                                                )}
                                                {bank.max_amount && (
                                                    <span className="uppercase text-base">Max. &#x20b9; {bank.max_amount}</span>
                                                )}
                                            </div>
                                            {/* <div className="text-xs text-primary uppercase">{bank.type}</div> */}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="font-semibold text-lg mb-3.5">Amount*</div>
                            <div>
                                <input
                                    onChange={(e) => {
                                        setDeposit({
                                            ...deposit,
                                            amount: parseInt(e.target.value),
                                        })
                                    }}
                                    className="w-full"
                                    type="number"
                                    placeholder={'Amount'}
                                    value={deposit.amount}
                                />
                                <span className="-ml-16">INR</span>
                            </div>
                            <div className="text-xs mt-1 mb-2 opacity-50">
                                {(activeBank.min_amount && activeBank.max_amount) && (
                                    <>
                                        INR {activeBank.min_amount} - {activeBank.max_amount}
                                    </>
                                )}
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-3 gap-4">
                                <button
                                    onClick={() => {
                                        setDeposit({
                                            ...deposit,
                                            amount: deposit.amount + 500,
                                        })
                                    }}
                                    type="button"
                                    className="bg-primary w-[102px] rounded py-1">
                                    <span className="text-sm text-white">+500</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setDeposit({
                                            ...deposit,
                                            amount: deposit.amount + 1000,
                                        })
                                    }}
                                    type="button"
                                    className="bg-primary w-[102px] rounded py-1">
                                    <span className="text-sm text-white">+1000</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setDeposit({
                                            ...deposit,
                                            amount: deposit.amount + 5000,
                                        })
                                    }}
                                    type="button" className="bg-primary w-[102px] rounded py-1">
                                    <span className="text-sm text-white">+5,000</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setDeposit({
                                            ...deposit,
                                            amount: deposit.amount + 10000,
                                        })
                                    }}
                                    type="button"
                                    className="bg-primary w-[102px] rounded py-1">
                                    <span className="text-sm text-white">+10,000</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setDeposit({
                                            ...deposit,
                                            amount: deposit.amount + 50000,
                                        })
                                    }}
                                    type="button"
                                    className="bg-primary w-[102px] rounded py-1">
                                    <span className="text-sm text-white">+50,000</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setDeposit({
                                            ...deposit,
                                            amount: deposit.amount + 100000,
                                        })
                                    }}
                                    type="button"
                                    className="bg-primary w-[102px] rounded py-1">
                                    <span className="text-sm text-white">+1,00,000</span>
                                </button>
                            </div>
                            {deposit.amount < activeBank.min_amount && (
                                <div className="text-accent text-sm my-4">Amount must be more than INR {activeBank.min_amount} for this payment method.</div>
                            )}
                            {deposit.amount > activeBank.max_amount && (
                                <div className="text-accent text-sm my-4">Amount must be less than INR {activeBank.max_amount} for this payment method.</div>
                            )}
                        </div>

                        <div className="max-md:bg-white max-md:p-4 max-md:rounded my-4">
                            <div className="font-semibold text-lg mb-3.5">{activeBank.type == "upi" ? "UPI Transaction ID*" : "Unique Transaction Reference*"}</div>
                            <div>
                                <input
                                    value={deposit.utr}
                                    onChange={(e) => {
                                        setDeposit({
                                            ...deposit,
                                            utr: e.target.value,
                                        })
                                    }}
                                    min={0}
                                    className="w-full"
                                    type="number"
                                    placeholder={`6 to 12 digit ${activeBank.type == "upi" ? "UPI Transaction ID" : "UTR Number"}`}
                                />
                            </div>
                            {(deposit.utr.length > 0 && (deposit.utr.length < 6 || deposit.utr.length > 12)) && (
                                <div className="text-accent text-sm my-4">UTR must be 6 to 12 digits</div>
                            )}
                        </div>

                        <div className="my-6 max-md:bg-white max-md:my-4 max-md:p-4 max-md:rounded">
                            <div className="mb-2">
                                <div className="font-semibold text-lg mb-3.5">Available Offers*</div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-4 max-h-[260px] overflow-y-scroll scrollbar-hide">
                                {offers.map((offer, index) => (
                                    <div
                                        onClick={() => {
                                            if (deposit.offer?.id === offer.id) {
                                                setDeposit({
                                                    ...deposit,
                                                    offer: null,
                                                    offer_id: null,
                                                })
                                                return
                                            } else {
                                                setDeposit({
                                                    ...deposit,
                                                    offer: offer,
                                                    offer_id: offer.id,
                                                })
                                            }
                                        }}
                                        key={offer.id}
                                        className="mx-2 p-3 border-2 border-lightGrey rounded cursor-pointer">
                                        <div className="flex-col">
                                            <div>
                                                <input type="checkbox" className="float-right rounded-full checked:bg-primary" checked={deposit.offer?.id === offer.id} />
                                            </div>
                                            <div className="text-grey1 text-base uppercase">{offer.code}</div>
                                            <div className="text-base uppercase">{offer.name}</div>
                                            <div
                                                onClick={() => {
                                                    setOfferDetailsModalContent(offer.description)
                                                    setOfferDetailsModalVisible(true)
                                                }}
                                                className="underline inline-block cursor-pointer text-primary"
                                            >Details</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="my-4">
                                <div className="flex">
                                    <input
                                        onChange={(e) => {
                                            setDeposit({
                                                ...deposit,
                                                readtnC: e.target.checked,
                                            })
                                        }}
                                        value={deposit.readtnC ? 'checked' : ''}
                                        type="checkbox"
                                        className="mr-2 mt-1 checked:bg-primary" />
                                    <span className="text-sm">I have read and agree with&nbsp;
                                        <span className="text-primary underline cursor-pointer" onClick={(e) => {
                                            e.preventDefault()
                                            setTermsModalVisible(true)
                                        }}>the terms of payment and withdrawal policy.</span>
                                    </span>
                                </div>

                                {(deposit.amount >= 100 && !deposit.readtnC) && (
                                    <div className="text-accent text-sm my-4">Please read and agree with T&amp;C</div>
                                )}

                                <button
                                    type="submit"
                                    className={`px-2 mt-6 py-3 rounded text-2xl my-3.5 w-full text-white ${canSubmit ? 'bg-primary' : 'bg-grey1'}`}
                                    disabled={!canSubmit}
                                >
                                    Submit
                                </button>
                            </div>

                            <div className="mt-4 flex flex-col md:hidden">
                                <div className="mb-1">Notes</div>
                                <ul className="list-disc ml-4">
                                    <li className="text-xs my-2">Make Payment with selected Payment method</li>
                                    <li className="text-xs my-2">Copy and Enter the 12 digit UTR Number</li>
                                    <li className="text-xs my-2">Submit the form</li>
                                </ul>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* Offer details */}
            <Transition appear show={offerDetailsModalVisible} as={Fragment}>
                <Dialog as="div" className="relative" onClose={() => setOfferDetailsModalVisible(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-lg font-medium leading-6 text-black"
                                    >
                                        Offer Details
                                    </Dialog.Title>
                                    <div className="mt-2">
                                        <p className="text-sm text-black">
                                            {offerDetailsModalContent}
                                        </p>
                                    </div>
                                    <div className="mt-4">
                                        <button
                                            type="button"
                                            className="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/80"
                                            onClick={() => setOfferDetailsModalVisible(false)}
                                        >
                                            Got it, thanks!
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Terms */}
            <Transition appear show={termsModalVisible} as={Fragment}>
                <Dialog as="div" className="relative" onClose={() => setTermsModalVisible(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-lg font-medium leading-6 text-black"
                                    >
                                        The terms of payment and withdrawal policy
                                    </Dialog.Title>
                                    <div className="mt-2">
                                        <p className="text-sm text-black my-4">
                                            <span className="font-semibold">Limits:</span> The maximum deposit limit on your account will vary depending on how long you have been a customer with us and whether you have successfully passed our security checks. Please contact at support@spade365.com for further information.
                                        </p>
                                        <p className="text-sm text-black my-4">
                                            <span className="font-semibold">Security:</span> Please note you may be asked to supply proof of identity and address before making a withdrawal from your account. Credit and Debit card payments undergo a 3D Secure process.
                                        </p>
                                        <p className="text-sm text-black my-4">
                                            <span className="font-semibold">Withdrawals:</span> Withdrawals will be directed to the same source. If your query is not covered by the information contained here, please email support@spade365.com where staff will be on hand to answer your query.
                                        </p>
                                    </div>
                                    <div className="mt-4">
                                        <button
                                            type="button"
                                            className="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/80"
                                            onClick={() => setTermsModalVisible(false)}
                                        >
                                            Got it!
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>

    )
}