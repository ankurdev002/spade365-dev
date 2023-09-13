import Head from "next/head"
import { useEffect, useRef, useState } from "react"
import { AiFillDelete, AiOutlineDownload } from "react-icons/ai"
import { BiLoaderAlt } from "react-icons/bi"
import { toast } from 'react-toastify'
import { User } from "./users"
import CsvDownloadButton from 'react-json-to-csv'
import Link from "next/link"
export interface Settings {
    colors: {
        primary: string,
        secondary: string,
        accent: string,
        neutral: string,
    },
    notices: {
        loggedIn: {
            // id?: number,
            text: string,
        },
        loggedOut: {
            // id?: number,
            text: string,
        }
    },
    whatsapp_number?: string,
    signup_bonus?: number,
    banners: {
        image: string,
        redirect: string,
        page: string,
    }[]
}

export default function Settings() {
    const [settings, setSettings] = useState({
        colors: {
            primary: "#235789",
            secondary: "#F1D302",
            accent: "#ED1C24",
            neutral: "#020100",
        },
        notices: {
            loggedIn:
            {
                text: "",
            }
            ,
            loggedOut:
            {
                text: "",
            }
        },
        whatsapp_number: "",
        signup_bonus: 0,
        // banners: banners // see staticData/banners.ts for example
        banners: []
    } as Settings)

    const [addBannerModal, setAddBannerModal] = useState(false) // modal for adding new banner
    const bannerInputRef = useRef<any>() // ref for banner image input
    const [newBanner, setNewBanner] = useState({ // data for new banner to be added
        image: '', // base64 image
        redirect: '', // url/link this banner will redirect to
        page: 'frontpage' // page this banner will be shown on (frontpage, gamepage, teampage)
    } as any)
    const [isSaving, setIsSaving] = useState(false) // is saving settings to database. Added loading animation to save button as having banners in settings can take a while
    const [allUsers, setAllUsers] = useState<User[]>([])
    const [dlUsersModal, setDlUsersModal] = useState(false)
    const [loadingUsers, setLoadingUsers] = useState(false)

    const resetColors = () => {
        setSettings({
            ...settings,
            colors: {
                primary: "#235789",
                secondary: "#F1D302",
                accent: "#ED1C24",
                neutral: "#020100",
            }
        })
    }

    const getSettings = async () => {
        const response = await fetch('/api/site/');
        if (response.status === 200) {
            const data = await response.json();
            if (response.status === 200) {
                setSettings(data)
            }
        } else {
            toast.error(await response.text());
        }
    }

    const saveSettings = async () => {
        setIsSaving(true)
        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        };

        const response = await fetch('/api/site/', options);
        if (response.status === 200) {
            const data = await response.json();
            if (response.status === 200) {
                toast.success('Settings updated!');
                setIsSaving(false)
            }
        } else {
            toast.error(await response.text());
            setIsSaving(false)
        }
    }

    const getAllUsers = async () => {
        setLoadingUsers(true)
        const options = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        };

        const response = await fetch(`/api/team/users?limit=${10000000}&skip=${0}&search=&download=${true}`, options);

        if (response.status === 200) {
            const data = await response.json();
            if (!response.ok) {
                const error = (data && data.message) || response.status;
                return Promise.reject(error);
            }
            setAllUsers(data);
            setDlUsersModal(true);
            setLoadingUsers(false);
        } else {
            toast.error(await response.text());
        }
    }

    const downloadDB = async () => {
        const response = await fetch('/api/site/db-backup');
        if (response.status === 200) {
            // download file
            const blob = await response.blob();
            // Create blob link to download
            const url = window.URL.createObjectURL(
                new Blob([blob]),
            );
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute(
                'download',
                `db_backup_${new Date().toISOString()}.json`,
            );

            // Append to html link element page
            document.body.appendChild(link);

            // Start download
            link?.click();

            // Clean up and remove the link
            link?.parentNode?.removeChild(link);
        } else {
            toast.error('Database backup failed!');
        }
    }

    useEffect(() => {
        // get settings from database on page load
        getSettings()
    }, [])

    return (
        <>
            <Head>
                <title>Settings | Spade365</title>
                <meta name="description" content="Settings | Spade365" />
            </Head>
            <div className="flex flex-col justify-start items-center min-h-[800px] w-full mx-auto overflow-hidden">
                <div className="flex flex-row justify-between w-full items-center mb-8 md:mb-4">
                    <h1 className="text-left text-4xl lg:text-5xl my-6 w-1/2">
                        Settings
                    </h1>
                    <div className="flex flex-row justify-start items-center md:w-1/2">
                        <div className="ml-auto flex flex-col justify-end items-end bg-gray">
                            <button
                                onClick={() => saveSettings()}
                                className="px-4 py-2 text-base lg:text-xl bg-white hover:bg-white/80 text-black shadow rounded">
                                {isSaving ? (
                                    <div className="flex flex-row">
                                        <span>Saving...</span>
                                        <BiLoaderAlt className="animate-spin text-2xl ml-2" />
                                    </div>
                                ) : 'Save'}
                            </button>
                            {isSaving && (
                                <span className="max-w-sm mt-4 text-right text-xs text-white/50">If there are banners, settings update may take some time...</span>
                            )}
                        </div>
                    </div>
                </div>
                {/* - Site settings section for changing colors: primary, secondary, accent, neutral 
                    - Site settings section for changing and removing site banners: front page, game page, team page etc
                */}
                <div className="grid grid-cols-1 lg:grid-cols-2 justify-between items-start gap-8 w-full">
                    {/* Banners */}
                    <div className="border-2 border-white/20 px-4 py-2">

                        <div className="mt-4 flex flex-row justify-between items-start w-full">
                            <div className="mb-4 flex flex-col justify-start items-start max-w-lg">
                                <h2 className="text-2xl">Server</h2>
                                <p className="text-base opacity-75">Download latest database copy. All site data is included in the file. In case of data loss, corruption, blocks or migration, this file can be imported into a new postgres database to continue as if nothing happened. Database is backed up on server <strong>EVERY 6 HOURS</strong>. Backups are kept on server for 30 days.</p>
                            </div>
                            <div className="flex flex-col">
                                <button
                                    onClick={() => downloadDB()}
                                    className="bg-white text-black px-4 py-2 text-sm font-semibold rounded-md flex flex-row justify-center items-center">
                                    <AiOutlineDownload className='text-2xl' />
                                    <span className='ml-1'>Download Database</span>
                                </button>
                                {/* button to download user list in csv */}
                                <button
                                    type="button"
                                    title='Download All Users in a csv file'
                                    className='bg-white text-black px-4 py-2 text-sm font-semibold rounded-md flex flex-row justify-center items-center mt-2'
                                    onClick={() => {
                                        getAllUsers();
                                    }}
                                >
                                    {loadingUsers ? (
                                        <BiLoaderAlt className='animate-spin text-2xl' />
                                    ) : (
                                        <>
                                            <AiOutlineDownload className='text-2xl' />
                                            <span className='ml-1'>Download All Users (CSV)</span>
                                        </>
                                    )}
                                </button>
                                <Link href="/reports/logs" className='bg-white text-black px-4 py-2 text-sm font-semibold rounded-md flex flex-row justify-center items-center mt-2'>
                                    View Logs
                                </Link>
                            </div>
                        </div>

                        {/* Signup Bonus */}
                        <div className="flex flex-col justify-start items-start w-full relative my-4">
                            <h2 className="text-2xl my-2">
                                Signup Bonus
                            </h2>
                            <small className="text-xs text-gray-400 my-2">
                                Bonus amount that will be given to user on signup.
                            </small>
                            <div className="flex flex-row justify-start items-center w-full mt-2">
                                {/* text input for adding signup bonus */}
                                <input type="number" min={0} max={100000} name="signup_bonus" id="signup_bonus" placeholder={'Signup bonus. Ex: 100'} className="w-full bg-transparent" value={settings.signup_bonus} onChange={(e) => setSettings({
                                    ...settings, signup_bonus: parseInt(e.target.value)
                                })} />
                            </div>
                        </div>

                        <div className="flex flex-row justify-between items-center w-full">
                            <div className="my-4 flex flex-col justify-start items-start">
                                <h2 className="text-2xl">Banners</h2>
                                <p className="text-base opacity-75">JPG/PNG. 686 x 250px</p>
                            </div>
                            <button className="bg-white text-black px-4 py-2 text-sm font-semibold rounded-md" onClick={() => setAddBannerModal(true)}>
                                Add Banner
                            </button>
                        </div>
                        <div className="flex flex-col justify-start items-start w-full">
                            {/* for each image in settings.banners, show image with base64 in banner.image, url in banner.url and page in banner.page */}
                            <div className="grid grid-cols-2 gap-4 justify-start items-start w-full text-white">
                                {
                                    settings.banners.map((banner: any, index: number) => (
                                        <div key={index} className="flex flex-col justify-start items-start w-full relative">
                                            {/* delete button on top right */}
                                            <button className="absolute top-0 right-0 bg-red-500 hover:bg-red-500/80 text-white p-2 rounded-full" onClick={() => setSettings({ ...settings, banners: settings.banners.filter((banner: any, i: number) => i !== index) })}>
                                                <AiFillDelete />
                                            </button>
                                            <img src={banner ? banner.image : ''} alt="" className="h-auto w-full aspect-video object-fill" />
                                            <input type="text" placeholder="URL this banner will redirect to" name="bannerUrl" prefix="" id={`bannerUrl-${index}`} className="my-2 w-full bg-transparent" value={banner ? banner.redirect : ''} onChange={(e) => setSettings({ ...settings, banners: settings.banners.map((banner: any, i: number) => i === index ? { ...banner, redirect: e.target.value } : banner) })} />
                                            <select name="bannerPage" id={`bannerPage-${index}`} className="my-2 w-full bg-transparent" value={banner ? banner.page : ''} onChange={(e) => setSettings({ ...settings, banners: settings.banners.map((banner: any, i: number) => i === index ? { ...banner, page: e.target.value } : banner) })}>
                                                <option value="frontpage" className="text-white bg-slate-900">Front page</option>
                                                {/* <option value="gamepage">Game page</option>
                                                <option value="teampage">Team page</option> */}
                                            </select>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    </div>

                    {/* Notices */}
                    <div className="border-2 border-white/20 px-4 py-2">
                        {/* Whatsapp number */}
                        <div className="flex flex-col justify-start items-start w-full relative my-4">
                            <h2 className="text-2xl my-2">
                                Whatsapp number
                            </h2>
                            <small className="text-xs text-gray-400 my-2">
                                Whatsapp contact number for users.
                            </small>
                            <div className="flex flex-row justify-start items-center w-full mt-2">
                                {/* text input for adding whatsapp number */}
                                <input type="text" name="whatsapp_number" id="whatsapp_number" placeholder={'Whatsapp number'} className="w-full bg-transparent" value={settings.whatsapp_number} onChange={(e) => setSettings({
                                    ...settings, whatsapp_number: e.target.value
                                })} />
                            </div>
                        </div>
                        <div className="flex flex-row justify-between items-center w-full">
                            <h2 className="text-2xl my-4">
                                Notices
                            </h2>
                            <button className="bg-white text-black px-4 py-2 text-sm font-semibold rounded-md" onClick={() => {
                                setSettings({ ...settings, notices: { loggedIn: { text: '' }, loggedOut: { text: '' } } })
                            }}>
                                Remove All Notices
                            </button>
                        </div>
                        <div className="flex flex-col justify-start items-start w-full mb-6">
                            {/* notice for logged in users */}
                            <div className="flex flex-col justify-start items-start w-full relative">
                                <h3 className="text-base my-2">
                                    Logged in users
                                </h3>
                                <small className="text-xs text-gray-400 my-2">
                                    This notice will be shown to all logged in users in the header of the site.
                                </small>

                                <div className="flex flex-row justify-start items-center w-full mt-2">
                                    {/* textarea for adding notice */}
                                    <textarea name="notice" id="notice" rows={2} placeholder={'Notice for logged in users'} className="w-full bg-transparent" value={settings.notices.loggedIn.text} onChange={(e) => setSettings({
                                        ...settings, notices: {
                                            ...settings.notices,
                                            loggedIn: {
                                                text: e.target.value
                                            }
                                        }
                                    })}></textarea>
                                </div>
                            </div>
                            {/* notice for logged out users */}
                            <div className="flex flex-col justify-start items-start w-full relative mt-4">
                                <h3 className="text-base my-2">
                                    Logged out users
                                </h3>
                                <small className="text-xs text-gray-400 my-2">
                                    This notice will be shown to all logged out users in the header of the site.
                                </small>
                                <div className="flex flex-row justify-start items-center w-full mt-2">
                                    {/* textarea for adding notice */}
                                    <textarea name="notice" id="notice" rows={2} placeholder={'Notice for logged out users'} className="w-full bg-transparent" value={settings.notices.loggedOut.text} onChange={(e) => setSettings({
                                        ...settings, notices: {
                                            ...settings.notices,
                                            loggedOut: {
                                                text: e.target.value
                                            }
                                        }
                                    })}></textarea>
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Colors */}
                    {/* <div className="border-2 border-white/20 px-4 py-2">
                        <div className="flex flex-row justify-between items-center w-full">
                            <h2 className="text-2xl my-4">
                                Colors
                            </h2>
                            <button className="bg-white text-black px-4 py-2 text-xs rounded-md" onClick={resetColors}>
                                Reset colors
                            </button>
                        </div>
                        <div className="flex flex-col justify-start items-start w-full">
                            <div className="grid grid-cols-4 w-full gap-4">
                                <div className="flex flex-col justify-start items-center w-full">
                                    <label htmlFor="primary" className="text-xs my-2">
                                        Primary
                                    </label>
                                    <input type="color" name="primary" id="primary"
                                        className="my-2 w-8 h-8" value={settings.colors.primary} onChange={(e) => setSettings({ ...settings, colors: { ...settings.colors, primary: e.target.value } })} />
                                </div>
                                <div className="flex flex-col justify-start items-center w-full">
                                    <label htmlFor="secondary" className="text-xs my-2">
                                        Secondary
                                    </label>
                                    <input type="color" name="secondary" id="secondary" className="my-2 w-8 h-8" value={settings.colors.secondary} onChange={(e) => setSettings({ ...settings, colors: { ...settings.colors, secondary: e.target.value } })} />
                                </div>
                                <div className="flex flex-col justify-start items-center w-full">
                                    <label htmlFor="accent" className="text-xs my-2">
                                        Accent
                                    </label>
                                    <input type="color" name="accent" id="accent" className="my-2 w-8 h-8" value={settings.colors.accent} onChange={(e) => setSettings({ ...settings, colors: { ...settings.colors, accent: e.target.value } })} />
                                </div>
                                <div className="flex flex-col justify-start items-center w-full">
                                    <label htmlFor="neutral" className="text-xs my-2">
                                        Neutral
                                    </label>
                                    <input type="color" name="neutral" id="neutral" className="my-2 w-8 h-8" value={settings.colors.neutral} onChange={(e) => setSettings({ ...settings, colors: { ...settings.colors, neutral: e.target.value } })} />
                                </div>
                            </div>
                        </div>
                    </div> */}
                </div>

                {/* Add banner modal */}
                <div className={`fixed top-0 backdrop-blur left-0 w-full h-full bg-black/50 z-50 flex flex-col justify-center items-center ${addBannerModal ? 'visible' : 'invisible'}`}>
                    <div className="bg-slate-900/95 w-[80vw] max-w-[500px] rounded-md flex flex-col justify-start items-start p-4">
                        <h2 className="text-2xl my-4">
                            Add Banner
                        </h2>
                        <div className="flex flex-col justify-start items-start w-full ">
                            <input
                                ref={bannerInputRef}
                                type="file"
                                name="bannerImage"
                                id="bannerImage"
                                accept="image/*" // Only allow images
                                className="my-2 bg-transparent border p-2 border-dotted w-full"
                                onChange={(e) => {
                                    if (!e.target.files) return; // If no file was selected, return
                                    const file = e.target.files[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (e) => {
                                            if (e.target) {
                                                setNewBanner({ ...newBanner, image: e.target.result as string })
                                            }
                                        }
                                        reader.readAsDataURL(file);
                                    }
                                }}
                            />

                            <input type="text" placeholder="URL this banner will redirect to" name="bannerUrl" prefix="" id="bannerUrl" className="my-2 w-full bg-transparent" value={newBanner.redirect} onChange={(e) => setNewBanner({ ...newBanner, redirect: e.target.value })} />
                            <select name="bannerPage" id="bannerPage" className="my-2 w-full bg-transparent" value={newBanner.page}
                                onChange={(e) => setNewBanner({ ...newBanner, page: e.target.value as string })}>
                                <option value="frontpage" className="text-white bg-slate-900">Front page</option>
                                {/* <option value="gamepage">Game page</option>
                                <option value="teampage">Team page</option> */}
                            </select>
                            <div className="flex flex-row justify-end items-center w-full mt-4">
                                <button className="bg-white text-black px-4 py-2 text-base rounded-md mr-4" onClick={() => setAddBannerModal(false)}>
                                    Cancel
                                </button>
                                <button className="bg-secondary text-black px-4 py-2 text-base rounded-md" onClick={() => {
                                    if (!newBanner.image) {
                                        alert('Please select an image for the banner');
                                        return;
                                    }
                                    setSettings({ ...settings, banners: [...settings.banners, newBanner] });
                                    setNewBanner({ image: '', redirect: '', page: 'frontpage' });
                                    bannerInputRef.current.value = '';
                                    setAddBannerModal(false);
                                }}>
                                    Add banner
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Download Users Modal */}
                <div className={`fixed top-0 backdrop-blur left-0 w-full h-full bg-black/50 z-50 flex flex-col justify-center items-center ${dlUsersModal ? 'visible' : 'invisible'}`}>
                    <div className="bg-slate-900/95 w-[80vw] max-w-[500px] rounded-md flex flex-col justify-center items-center p-4">
                        <h2 className="text-2xl my-4 mx-auto w-full text-center">
                            Download All Users in CSV File
                        </h2>
                        <div className="flex flex-col justify-center items-center w-full text-center py-4">
                            <CsvDownloadButton title='Download All Users in a csv file' data={allUsers} filename={`users.csv`} className='p-2 bg-white text-black rounded-md flex flex-row justify-center items-center'>
                                <AiOutlineDownload className='text-2xl' />
                                <span className='ml-1 hidden lg:inline-block'>Download All Users (CSV)</span>
                            </CsvDownloadButton>
                            <div className="flex flex-row justify-end items-center w-full mt-8">
                                <button className="bg-white text-black px-4 py-2 text-base rounded-md mr-4" onClick={() => setDlUsersModal(false)}>
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