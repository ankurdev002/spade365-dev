// this context loads the games from the backend and provides them to the rest of the app via the context

import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
export type Game = {
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

export const GamesStore = createContext<Store>({
    games: [],
    setGames: () => { },
    providers: [],
    setProviders: () => { },
});

export type Store = {
    games: Array<Game>
    setGames: (games: Array<Game>) => void
    providers: Array<string>
    setProviders: (providers: Array<string>) => void
}

export default function GamesStoreProvider({ children }: { children: React.ReactElement }) {
    const [games, setGames] = useState<Array<Game>>([]);
    const [providers, setProviders] = useState<Array<string>>([]);

    useEffect(() => {
        axios({
            method: 'GET',
            url: '/api/game/?skip=0&enabled=true', // get all enabled games
        })
            .then((res) => {
                setGames(res.data);
            })
            .catch((err) => {
                console.log(err);
            });

        axios({
            method: 'GET',
            url: '/api/game/providers/?enabled=true', // get game providers with atleast 1 enabled game
        })
            .then((res) => {
                setProviders(res.data);
            })
            .catch((err) => {
                console.log(err);
            });
    }, []);

    const value: Store = {
        games,
        setGames,
        providers,
        setProviders,
    };

    return <GamesStore.Provider value={value}>{children}</GamesStore.Provider>;
}