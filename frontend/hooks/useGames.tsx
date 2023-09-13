import { useContext } from "react";
import { GamesStore } from "../store/Games";

export default function useGames() {
    const store = useContext(GamesStore);

    return store;
}
