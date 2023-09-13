import Head from 'next/head';
import { useEffect, useState } from 'react'
import { AiOutlinePause, AiOutlineArrowLeft, AiOutlineArrowRight, AiOutlineSearch, AiOutlineLoading3Quarters, AiOutlinePlayCircle, AiOutlineArrowUp, AiOutlineArrowDown, AiOutlinePlus, AiOutlineEdit } from 'react-icons/ai';
import { GrPowerReset } from 'react-icons/gr';
import { toast } from 'react-toastify';
import { convertReadableDate } from '../helpers/date';
// Game interface
export interface Game {
    id: number
    api: string
    code: string
    provider: string
    name: string
    category: string
    tags: Array<string>
    image: string
    enabled: boolean
    is_deleted: boolean
    order: number
    is_popular: boolean
    is_featured: boolean
    is_new: boolean
    createdAt?: string
    updatedAt?: string
}

export default function Games() {
    const [Games, setGames] = useState<Game[]>([])
    const [GameProviders, setGameProviders] = useState<string[]>([])
    const [page, setPage] = useState(1)
    const [hasNextPage, setHasNextPage] = useState(false)
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [provider, setProvider] = useState<string>('') // '' = all, provider = provider name
    const [showEnabled, setShowEnabled] = useState<boolean | null>(null) // null = all, true = enabled, false = disabled
    const [showReset, setShowReset] = useState(false) // for setting games to default providers
    const [showModal, setShowModal] = useState(false)
    const emptyGame: Game = {
        id: 0,
        api: '',
        code: '',
        provider: '',
        name: '',
        category: '',
        tags: [],
        image: '',
        enabled: true,
        is_deleted: false,
        order: 0,
        is_popular: false,
        is_featured: false,
        is_new: true,
        createdAt: '',
        updatedAt: '',
    }
    const [modalGame, setModalGame] = useState<Game>(emptyGame)

    // Call API to fetch Games
    const fetchGames = async () => {
        setLoading(true);
        const limit = 40;
        const skip = page > 1 ? (page - 1) * 40 : 0;
        const options = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        };

        const response = await fetch(`/api/game?limit=${limit}&skip=${skip}&search=${search}${showEnabled ? '&enabled=' + showEnabled : ''}${provider ? '&provider=' + provider : ''}`, options);

        if (response.status === 200) {
            const data = await response.json();
            if (!response.ok) {
                const error = (data && data.message) || response.status;
                return Promise.reject(error);
            }
            setGames(data);
            setHasNextPage(data && data.length === limit);
            setLoading(false);
            if (Games.length === 0 && data.length === 0 && skip === 0) setShowReset(true); // show reset button if db has no games
        } else {
            toast.error(await response.text());
        }
    }

    const fetchGameProviders = async () => {
        const options = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        };

        const response = await fetch(`/api/game/providers/`, options); // pass ?enabled=true to get only enabled providers

        if (response.status === 200) {
            const data = await response.json();
            if (!response.ok) {
                const error = (data && data.message) || response.status;
                return Promise.reject(error);
            }
            setGameProviders(data);
        } else {
            toast.error(await response.text());
        }
    }

    useEffect(() => {
        fetchGames()
    }, [page, search, provider, showEnabled])

    useEffect(() => {
        fetchGameProviders()
    }, [])

    // when games is changed, sort games by order
    useEffect(() => {
        setGames(Games.sort((a, b) => a.order - b.order))
    }, [Games])

    // Call API to add Game
    const addGame = async (game: Game) => {
        // if game details are empty, return
        if (!game.name || !game.api || !game.code || !game.provider) {
            toast.error('Name, API, Provider & Code are required to add an Game');
            return;
        }
        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(game)
        };

        const response = await fetch('/api/game/', options)

        if (response.status === 200) {
            setShowModal(false);
            setGames([game, ...Games])
            toast.success('Game added successfully');
        } else {
            toast.error(await response.text());
        }
    }

    // Call API update Game
    const updateGame = async (game: Game) => {
        // if game details are empty, return
        if (!game.name || !game.api || !game.code || !game.provider) {
            toast.error('Name, API, Provider & Code are required to update a Game');
            return;
        }
        const options = {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(game)
        };

        const response = await fetch(`/api/game/${game.id}/`, options);

        if (response.status === 200) {
            setShowModal(false);
            setGames(Games.map((o) => o.id === game.id ? game : o)); // update game in state
            toast.success('Game updated successfully');
        } else {
            toast.error(await response.text());
        }
    }

    // Call API update Game
    const updateGameKey = async (key: string, value: string | boolean, id?: number | null, provider?: string) => {
        let body;
        if (id) {
            body = {
                id: id,
                [key]: value
            }
        } else if (provider) {
            body = {
                provider: provider,
                [key]: value
            }
        }
        const options = {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        };
        // Call API to restore Game
        const response = await fetch(`/api/game/`, options);

        if (response.status === 200) {
            // update state by id or provider
            if (id) {
                setGames(Games.map((b) => b.id === id ? { ...b, [key]: value } : b))
            } else if (provider) {
                setGames(Games.map((b) => b.provider === provider ? { ...b, [key]: value } : b))
            }
            toast.success(await response.text());
        } else {
            toast.error(await response.text());
        }
    }

    // Call API to change Game Order. Order will be +1 or -1
    const updateGameKeyOrder = async (id: number, order: number) => {
        const options = {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: id,
                order: order
            })
        };
        // Call API to restore Game
        const response = await fetch(`/api/game/order/`, options);

        if (response.status === 200) {
            // DISABLED: as state update is slow and buggy
            // update state order, if order is -1, then move up, else move down
            // get game by id
            // const game = Games.find((b) => b.id === id) as Game;
            // if (order === -1) {
            //     // update order previous game, and this game
            //     setGames(Games.map((b) => b.order === game.order - 1 ? { ...b, order: b.order + 1 } : b)) // update order of previous game
            //     setGames(Games.map((b) => b.id === id ? { ...b, order: b.order - 1 } : b)) // update order of this game

            // } else {
            //     // update order of next game and this game and sort by order
            //     setGames(Games.map((b) => b.order === game.order + 1 ? { ...b, order: b.order - 1 } : b)) // update order of next game
            //     setGames(Games.map((b) => b.id === id ? { ...b, order: b.order + 1 } : b)) // update order of this game
            // }

            fetchGames() // Todo: disable refetch when state update works
            // toast.success(await response.text());
        } else {
            toast.error(await response.text());
        }
    }


    // Reset Games
    const resetGames = async () => {
        if (!confirm('Are you sure you want to reset all games?')) return; // confirm
        const options = {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
        };

        const response = await fetch(`/api/game/reset/`, options);

        if (response.status === 200) {
            fetchGames();
            toast.success(await response.text());
        } else {
            toast.error(await response.text());
        }
    }

    // Delete Game
    const deleteGame = async (id: number) => {
        if (!confirm('Are you sure you want to delete this Game?')) return; // confirm
        const options = {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        };

        const response = await fetch(`/api/game/${id}/`, options);

        if (response.status === 200) {
            // set is_deleted to true in state
            setGames(Games.map((b) => b.id === id ? { ...b, is_deleted: true, enabled: false } : b))
            toast.success('Game Disabled');
        } else {
            toast.error(await response.text());
        }
    }

    return (
        <>
            <Head>
                <title>Games | Spade365</title>
                <meta name="description" content="Games | Spade365" />
            </Head>
            <div className="flex flex-col justify-start items-center min-h-[800px] w-full container mx-auto overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between w-full items-center mb-8 md:mb-0">
                    <h1 className="text-center md:text-left text-4xl lg:text-5xl my-6 w-1/2">
                        Games
                    </h1>
                    {/* search and add Game button */}
                    <div className="flex flex-row justify-center md:justify-end items-center w-full md:w-1/2">
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
                                    setProvider('') // reset provider to all when search is changed
                                    setSearch(e.target.value)
                                }
                                }
                            />
                        </div>
                        {/* add Game button */}
                        <button
                            className="ml-4 p-2 bg-white text-black rounded-md flex flex-row justify-center items-center"
                            title='Add Game'
                            onClick={() => {
                                setModalGame(emptyGame)
                                setShowModal(true)
                            }}
                        >
                            <AiOutlinePlus className='text-2xl' />
                            <span className='ml-1 hidden lg:inline-block'>Add Game</span>
                        </button>

                        {/* reset Games button. show when no games in db */}
                        {showReset &&
                            <button
                                className="ml-4 p-2 bg-white text-black rounded-md flex flex-row justify-center items-center"
                                title='Reset Games'
                                onClick={() => {
                                    resetGames()
                                }}
                            >
                                <GrPowerReset className='text-2xl' />
                                <span className='ml-1 hidden lg:inline-block'>Reset Games</span>
                            </button>
                        }
                    </div>
                </div>
                {/* filter and actions select box with apply button */}
                <div className="flex flex-col md:flex-row justify-center md:justify-start items-center w-full mb-4">
                    {/* Providers */}
                    <div className="">
                        {/* select box with filter */}
                        <select
                            className="bg-gray text-white text-base font-semibold py-2 pl-4 pr-8 rounded bg-transparent max-w-xs"
                            value={provider}
                            onChange={(e) => {
                                setPage(1) // reset page to 1 when provider is changed
                                setSearch('') // reset search to empty when provider is changed
                                setProvider(e.target.value)
                            }}
                        >
                            <option className="bg-slate-900 text-white" value="">All Providers</option>
                            {/* for each GameProviders add otpion */}
                            {GameProviders.map((provider, index) => (
                                <option key={index} className="bg-slate-900 text-white" value={provider}>{provider}</option>
                            ))}
                        </select>
                    </div>
                    {/* if provider, show disable all and enable all buttons */}
                    {provider &&
                        <div className='mt-4 md:mt-0 flex flex-row'>
                            <button
                                className="ml-4 p-2 bg-green-500 text-white font-semibold rounded-md flex flex-row justify-center items-center"
                                title='Enable All'
                                onClick={() => {
                                    window.confirm(`Are you sure you want to enable all Games by ${provider}?`) && updateGameKey('enabled', true, null, provider)
                                }}
                            >
                                <span className='ml-1 inline-block'>Enable All</span>
                            </button>
                            <button
                                className="ml-4 p-2 bg-red-500 text-white font-semibold rounded-md flex flex-row justify-center items-center"
                                title='Disable All'
                                onClick={() => {
                                    window.confirm(`Are you sure you want to disable all Games by ${provider}?`) && updateGameKey('enabled', false, null, provider)
                                }}
                            >
                                <span className='ml-1 inline-block'>Disable All</span>
                            </button>
                        </div>
                    }
                </div>
                <div className='overflow-x-scroll scrollbar-hide w-full'>
                    {/* table with Games, Game, amount, date, status, action */}
                    <table className="table-auto w-full text-left break-words">
                        <thead className="bg-primary text-white">
                            <tr>
                                {/* <th className="border border-white/20 px-4 py-2 text-center">ID</th> */}
                                <th className="border border-white/20 px-4 py-2 text-center">Sort</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Api</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Provider</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Name</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Code</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Category</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Tags</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Enabled?</th>
                                {/* <th className="border border-white/20 px-4 py-2 text-center">Is Deleted?</th> */}
                                <th className="border border-white/20 px-4 py-2 text-center">Popular?</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Featured?</th>
                                <th className="border border-white/20 px-4 py-2 text-center">New?</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Date Added</th>
                                <th className="border border-white/20 px-4 py-2 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* map through Games and display them */}
                            {Games && Games.map((game) => (
                                <tr key={game.id} className={`h-[120px] odd:bg-transparent even:bg-primary/10 ${game.is_deleted ? 'text-red-500' : ''}`}>
                                    {/* <td className={`border border-white/20 px-4 py-2 text-left font-semibold`}>
                                        {game.id}
                                    </td> */}
                                    <td className="border border-white/20 px-4 py-2 text-center">
                                        {game.order}
                                        {/* up and down arrow to change order */}
                                        <div className='flex flex-row justify-center items-center mt-1'>
                                            <button title='Move Up' onClick={() => updateGameKeyOrder(game.id, -1)} className="bg-green-500/40 hover:bg-green-500/70 text-white font-bold py-2 px-2 text-center flex flex-row justify-center items-center">
                                                <AiOutlineArrowUp className='text-2xl' />
                                            </button>
                                            <button title='Move Down' onClick={() => updateGameKeyOrder(game.id, 1)} className="bg-red-500/40 hover:bg-red-500/70 text-white font-bold py-2 px-2 text-center flex flex-row justify-center items-center">
                                                <AiOutlineArrowDown className='text-2xl' />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="border border-white/20 px-4 py-2 uppercase text-center font-bold">
                                        {game.api}
                                    </td>
                                    <td className="border border-white/20 px-4 py-2 uppercase text-center font-bold">
                                        {game.provider}
                                    </td>
                                    <td className="border border-white/20 px-4 py-2 uppercase text-center font-semibold">
                                        {game.name}
                                    </td>
                                    <td className="border border-white/20 px-4 py-2 text-center">
                                        {game.code}
                                    </td>
                                    <td className="border border-white/20 px-4 py-2 uppercase text-center">
                                        {game.category}
                                    </td>
                                    <td className="border border-white/20 px-4 py-2 text-center">
                                        {game.tags && game.tags.map((tag) => tag.toLowerCase()).join(', ')}
                                    </td>
                                    <td className={`border border-white/20 px-4 py-2 uppercase text-center ${!game.enabled ? 'text-red-500' : 'text-green-500'}`}>
                                        {game.enabled ? 'Yes' : 'No'}
                                        {/* checkbox for enabled */}
                                        <input
                                            type="checkbox"
                                            name="enabled"
                                            className="ml-2"
                                            checked={game.enabled}
                                            onChange={(e) => {
                                                const checked = e.target.checked
                                                updateGameKey('enabled', checked as boolean, game.id)
                                            }}
                                        />
                                    </td>
                                    {/* <td className={`border border-white/20 px-4 py-2 text-center`}>
                                        {game.is_deleted ? 'Yes' : 'No'}
                                    </td> */}
                                    <td className={`border border-white/20 px-4 py-2 text-center ${!game.is_featured ?? 'text-green-500'}`}>
                                        {game.is_popular ? 'Yes' : 'No'}
                                        {/* checkbox for is_popular */}
                                        <input
                                            type="checkbox"
                                            name="is_popular"
                                            className="ml-2"
                                            checked={game.is_popular}
                                            onChange={(e) => {
                                                const checked = e.target.checked
                                                updateGameKey('is_popular', checked as boolean, game.id)
                                            }}
                                        />
                                    </td>
                                    <td className={`border border-white/20 px-4 py-2 text-center ${!game.is_featured ?? 'text-green-500'}`}>
                                        {game.is_featured ? 'Yes' : 'No'}
                                        {/* checkbox for is_featured */}
                                        <input
                                            type="checkbox"
                                            name="is_featured"
                                            className="ml-2"
                                            checked={game.is_featured}
                                            onChange={(e) => {
                                                const checked = e.target.checked
                                                updateGameKey('is_featured', checked as boolean, game.id)
                                            }}
                                        />

                                    </td>
                                    <td className={`border border-white/20 px-4 py-2 uppercase font-semibold text-center ${!game.is_new ?? 'text-blue-500'}`}>
                                        {game.is_new ? 'Yes' : 'No'}
                                        {/* checkbox for is_new */}
                                        <input
                                            type="checkbox"
                                            name="is_new"
                                            className="ml-2"
                                            checked={game.is_new}
                                            onChange={(e) => {
                                                const checked = e.target.checked
                                                updateGameKey('is_new', checked as boolean, game.id)
                                            }}
                                        />
                                    </td>
                                    <td className="border border-white/20 px-4 py-2 text-center" title={game.createdAt}>
                                        {game.createdAt && convertReadableDate(game.createdAt as string)}
                                    </td>
                                    <td className="border border-white/20 px-4 py-2 max-w-[200px] ">
                                        <div className='grid grid-cols-1 gap-2'>
                                            {/* Edit game */}
                                            <button title='Edit Game' onClick={() => {
                                                setModalGame(game)
                                                setShowModal(true)
                                            }} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-2 rounded text-center flex flex-row justify-center items-center">
                                                <AiOutlineEdit className='text-2xl' />
                                            </button>
                                            {/* Activate/Deactivate */}
                                            {!game.is_deleted && (
                                                game.enabled ? (
                                                    <button title='Deactivate Game' onClick={() => updateGameKey('enabled', false, game.id)} className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-2 rounded text-center flex flex-row justify-center items-center">
                                                        <AiOutlinePause className='text-2xl' />
                                                    </button>
                                                ) : (
                                                    <button title='Activate Game' onClick={() => updateGameKey('enabled', true, game.id)} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-2 rounded text-center flex flex-row justify-center items-center">
                                                        <AiOutlinePlayCircle className='text-2xl' />
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                {/* <td colSpan={8} className="border border-white/20 px-4 py-2 text-center">
                                <span className='text-sm text-white/60'>Showing {Games.length} of {total} Games</span>
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

                {/* Add/Edit Game Modal */}
                <div className={`fixed top-0 backdrop-blur left-0 w-full h-full bg-black/50 z-50 flex flex-col justify-center items-center ${showModal ? 'visible' : 'invisible'}`}>
                    <div className="bg-slate-900/95 w-[95vw] max-w-[1200px] rounded-md overflow-y-scroll scrollbar-hide flex flex-col justify-start items-start p-4">
                        <h2 className="text-2xl my-4">
                            {modalGame.id == 0 ? 'Add Game' : 'Edit Game'}
                        </h2>
                        <div className="flex flex-col justify-start items-start w-full ">

                            <div className='grid grid-cols-1 md:grid-cols-2 gap-x-2 w-full'>
                                <div className='w-full'>
                                    <label className="text-sm text-white/80 mb-2 font-semibold flex flex-col">
                                        {/* select for api, with fawk and wacs */}
                                        API*
                                        <small className='font-light'>Select the API for the game</small>
                                    </label>
                                    <select className="bg-slate-900/80 text-white/80 w-full rounded-md px-4 py-2 mb-4" value={modalGame.api} onChange={(e) => setModalGame({ ...modalGame, api: e.target.value })} required>
                                        <option value=''>Select API</option>
                                        <option value='fawk'>FAWK</option>
                                        <option value='wacs'>WACS</option>
                                    </select>
                                </div>
                                <div className='w-full'>
                                    <label className="text-sm text-white/80 mb-2 font-semibold flex flex-col">
                                        {/* Game code */}
                                        Game Code*
                                        <small className='font-light'>Game code for the game</small>
                                    </label>
                                    <input type={"text"} placeholder={"Game Code"} className="bg-slate-900/80 text-white/80 w-full rounded-md px-4 py-2 mb-4" value={modalGame.code} onChange={(e) => setModalGame({ ...modalGame, code: e.target.value })} required />
                                </div>
                            </div>

                            <div className='grid grid-cols-1 md:grid-cols-2 gap-x-2 w-full'>
                                <div className='w-full'>
                                    <label className="text-sm text-white/80 mb-2 font-semibold flex flex-col">
                                        Game Name*
                                        <small className='font-light'>Name of the game</small>
                                    </label>
                                    <input type={"text"} placeholder={"Game Name"} className="bg-slate-900/80 text-white/80 w-full rounded-md px-4 py-2 mb-4" value={modalGame.name} onChange={(e) => setModalGame({ ...modalGame, name: e.target.value })} required />
                                </div>
                                <div className='w-full'>
                                    <label className="text-sm text-white/80 mb-2 font-semibold flex flex-col">
                                        Game Provider*
                                        <small className='font-light'>Provider of the game. Ex: Evolution, Ezugi etc</small>
                                    </label>
                                    <input type={"text"} placeholder={"Game Provider"} className="bg-slate-900/80 text-white/80 w-full rounded-md px-4 py-2 mb-4" value={modalGame.provider} onChange={(e) => setModalGame({ ...modalGame, provider: e.target.value })} required />
                                </div>
                            </div>

                            <div className='grid grid-cols-1 md:grid-cols-2 gap-x-2 w-full'>
                                <div className='w-full'>
                                    {/* tags, seperated by comma */}
                                    <label className="text-sm text-white/80 mb-2 font-semibold flex flex-col">
                                        Tags*
                                        <small className='font-light'>Tags for the game. Ex: Live, Table, Slots, Roulette etc</small>
                                    </label>
                                    <input type={"text"} placeholder={"Tags"} className="bg-slate-900/80 text-white/80 w-full rounded-md px-4 py-2 mb-4" value={modalGame.tags} onChange={(e) => setModalGame({ ...modalGame, tags: e.target.value.split(',') })} required />
                                </div>
                                <div className='w-full'>
                                    <label className="text-sm text-white/80 mb-2 font-semibold flex flex-col">
                                        {/* image url */}
                                        Image URL
                                        <small className='font-light'>Image URL for the game</small>
                                    </label>
                                    <input type={"text"} placeholder={"Image URL"} className="bg-slate-900/80 text-white/80 w-full rounded-md px-4 py-2 mb-4" value={modalGame.image} onChange={(e) => setModalGame({ ...modalGame, image: e.target.value })} />
                                </div>
                            </div>

                            {/* checkboxes in grid, for enabled, featured, new, deleted etc */}
                            {/* <div className='grid grid-cols-12 auto-cols-auto gap-x-2 w-full'>
                                <div className='w-full'>
                                    <label className="text-sm text-white/80 mb-2 font-semibold flex flex-col">
                                        Enabled
                                        <small className='font-light'>Is the game enabled?</small>
                                    </label>
                                    <input type={"checkbox"} className="bg-slate-900/80 w-full max-w-[20px] rounded-md px-4 py-2 mb-4" checked={modalGame.enabled} onChange={(e) => setModalGame({ ...modalGame, enabled: e.target.checked })} />
                                </div>
                                <div className='w-full'>
                                    <label className="text-sm text-white/80 mb-2 font-semibold flex flex-col">
                                        Featured
                                        <small className='font-light'>Is the game featured?</small>
                                    </label>
                                    <input type={"checkbox"} className="bg-slate-900/80 w-full max-w-[20px] rounded-md px-4 py-2 mb-4" checked={modalGame.is_featured} onChange={(e) => setModalGame({ ...modalGame, is_featured: e.target.checked })} />
                                </div>
                                <div className='w-full'>
                                    <label className="text-sm text-white/80 mb-2 font-semibold flex flex-col">
                                        New
                                        <small className='font-light'>Is the game new?</small>
                                    </label>
                                    <input type={"checkbox"} className="bg-slate-900/80 w-full max-w-[20px] rounded-md px-4 py-2 mb-4" checked={modalGame.is_new} onChange={(e) => setModalGame({ ...modalGame, is_new: e.target.checked })} />
                                </div>
                            </div> */}

                            <div className="flex flex-row justify-end items-center w-full mt-4">
                                <button className="bg-white text-black px-4 py-2 text-base rounded-md mr-4" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button className="bg-secondary text-black px-4 py-2 text-base rounded-md" onClick={() => {
                                    if (modalGame.id == 0) {
                                        addGame(modalGame)
                                    } else {
                                        updateGame(modalGame)
                                    }
                                }}>
                                    {modalGame.id == 0 ? 'Add Game' : 'Update Game'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </>
    )
}