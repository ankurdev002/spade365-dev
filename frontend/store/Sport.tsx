import { createContext, ReactNode, useState } from "react";

export interface Sport {
  key: string;
  group: string;
  title: string;
  description: string;
  active: boolean;
  has_outrights: boolean;
}

export interface Odd {
  home_team: string;
  away_team: string;
  sport_title: string;
  sport_key: string;
  id: string;
  commence_time: string;
  bookmakers: {
    key: string;
    last_update: string;
    title: string;
    markets: {
      key: string;
      last_update: string;
      outcomes: {
        name: string;
        price: string;
      }[];
    }[];
  }[];
}

export interface FancyOdd { // Fancy odd is for cricket
  id: number;
  active: boolean;
  title: string;
  description: string;
  sport_key: string;
  sport_title: string;
  eventId: string;
  backOdd: number;
  backScore: number;
  layOdd: number;
  layScore: number;
  commence_time: string;
  primaryKey: string;
  secondaryKey: string;
  teams: string[];
}

export interface Odds {
  sport_key: string;
  group: string;
  odds: Odd[];
}

export enum GROUP {
  CRICKET = "Cricket",
  TENNIS = "Tennis",
  FOOTBALL = "Football",
  SOCCER = "Soccer",
  AMERICAN_FOOTBALL = "American Football",
}

type Options = {
  sortBy: "ASC" | "DESC";
  limit?: number;
};
export const SportContext = createContext<{
  sportsLoading: boolean;
  oddsLoading: boolean;
  sports: Sport[];
  odds: Odds[];
  getSports: () => Promise<void>;
  getOdds: (sport: Sport) => Promise<void>;
  getOddsByGroup: (group: GROUP, option?: Options) => Odd[];
  getOddsBySportsKey: (key: string) => Odd[];
  getOddsByMatchId: (id: string) => Odd[];
  getFancyOdd: (sportKey: string, eventId: string) => Promise<void | FancyOdd[]>;
}>({
  sportsLoading: false,
  oddsLoading: false,
  sports: [],
  odds: [],
  getSports: async () => { },
  getOdds: async () => { },
  getOddsByGroup: () => [],
  getOddsBySportsKey: () => [],
  getOddsByMatchId: () => [],
  getFancyOdd: async () => { },
});

export default function SportProvider({ children }: { children: ReactNode }) {
  const [oddsLoading, setOddsLoading] = useState<boolean>(false);
  const [sportsLoading, setSportsLoading] = useState<boolean>(false);
  const [sports, setSports] = useState<Sport[]>([]);
  const [odds, setOdds] = useState<Odds[]>([]);

  // Call API to fetch sports data
  const getSports = async () => {
    try {
      if (sports.length > 0) return; // if sports already loaded, bail. we don't want to fetch sports again and again
      setSportsLoading(true);

      const response = await fetch(`/api/sports/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200) {
        const data = await response.json();
        if (!response.ok) {
          const error = (data && data.message) || response.status;
          return Promise.reject(error);
        }
        // for each if bookmakers not empty, set sports
        let sports: Sport[] = [];
        data.forEach((sport: Sport) => {
          if (sport.active) {
            sports.push(sport);
          }
        });
        setSports(sports);
        setSportsLoading(false);
      }
    } catch (error) {
      return console.log(error);
    }
  };

  // Get odds
  const getOdds = async (sport: Sport) => {
    try {
      if (sportsLoading) return; // if sports are loading, bail. we don't want to fetch odds if sports are not loaded yet as it increases the amount of requests
      setOddsLoading(true);

      const response = await fetch(`/api/sports/odds/?sport=${sport.key}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200) {
        const data = await response.json();
        // console.log(data);
        if (!response.ok) {
          const error = (data && data.message) || response.status;
          // return Promise.reject(error);
          return console.log(error);
        }
        //   data is an array
        const newData = data.filter(
          (sport: Record<string, any>) => sport.bookmakers.length > 0
        );
        if (newData.length <= 0) return;
        // if (!data.bookmakers || data.bookmakers.length === 0) {
        //     // if bookmakers empty, bail
        //     return;
        // }

        // set odds by parent key as sport key, so we can get odds by sport key. if sport_key exists in odds array, update odds, else add new odds
        const index = odds.findIndex((odds) => odds.sport_key === sport.key);
        if (index > -1) {
          setOdds((prev) => {
            const newOdds = [...prev];
            newOdds[index] = {
              sport_key: sport.key,
              group: sport.group,
              odds: data,
            };
            return [...newOdds];
          });
        } else {
          // set odds
          setOdds((prev) => [
            ...prev,
            {
              sport_key: sport.key,
              group: sport.group,
              odds: data,
            },
          ]);
        }

        setOddsLoading(false);
      }
    } catch (error) {
      console.log(error);
      return;
    }
  };

  const getFancyOdd = async (sportKey: string, eventId: string) => {
    try {
      if (sportsLoading) return; // if sports are loading, bail. we don't want to fetch odds if sports are not loaded yet as it increases the amount of requests
      setOddsLoading(true);

      // by sportKey get group
      const group = sports.find((sport) => sport.key === sportKey)?.group;

      // if sport group is cricket, get fancy odds
      if (group === GROUP.CRICKET) {
        const fancyOddsResponse = await fetch(
          `/api/sports/fancyOdds/${eventId}/?sport=${sportKey}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (fancyOddsResponse.status === 200) {
          const fancyOddsData = await fancyOddsResponse.json();
          // console.log(fancyOddsData);

          // return fancy odds
          return fancyOddsData as FancyOdd[];
        }
      }
    } catch (error) {
      console.log(error);
      return;
    }
  }


  const getOddsByGroup = (group: GROUP, options?: Options) => {
    try {
      if (sportsLoading) return []; // if sports are loading, bail. we don't want to fetch odds if sports are not loaded yet as it increases the amount of requests
      const { sortBy = "DESC", limit } = options ?? {};
      // get all the odds in an group
      let oddsByGroup: Odd[] = [];
      odds.filter((odd) => odd.group === group).forEach((odd) => {
        oddsByGroup = oddsByGroup.concat(odd.odds);
      });

      // sort
      if (sortBy === "ASC") {
        oddsByGroup = oddsByGroup.sort((x, y) => new Date(x.commence_time) < new Date(y.commence_time) ? 1 : -1);
      } else {
        oddsByGroup = oddsByGroup.sort((x, y) => new Date(x.commence_time) < new Date(y.commence_time) ? 1 : -1).reverse();
      }

      // limit
      if (typeof limit === "number") {
        return oddsByGroup.slice(0, limit);
      }

      return oddsByGroup;
    } catch (error) {
      console.log(error);
      return [];
    }
  };

  const getOddsBySportsKey = (sportKey: string) => {
    try {
      if (sportsLoading) return []; // if sports are loading, bail. we don't want to fetch odds if sports are not loaded yet as it increases the amount of requests
      if (!sportKey) return [];
      if (sports.length <= 0) return [];
      let oddsBySportsKey: Odd[] = [];
      odds.filter((odd) => odd.sport_key === sportKey).forEach((odd) => {
        oddsBySportsKey = oddsBySportsKey.concat(odd.odds);
      });

      return oddsBySportsKey;
    } catch (error) {
      console.log(error);
      return [];
    }
  };

  const getOddsByMatchId = (matchId: string) => {
    try {
      if (sportsLoading) return []; // if sports are loading, bail. we don't want to fetch odds if sports are not loaded yet as it increases the amount of requests
      if (!matchId) return [];
      if (sports.length <= 0) return [];

      // find odds by id = matchId, return only that odd
      const oddsByMatchId = odds.map((odd) => odd.odds).flat().find((odd) => odd.id === matchId);

      return oddsByMatchId ? [oddsByMatchId] : [];
    } catch (error) {
      console.log(error);
      return [];
    }
  };

  const value = {
    sportsLoading,
    oddsLoading,
    sports,
    odds,
    getSports,
    getOdds,
    getOddsByGroup,
    getOddsBySportsKey,
    getOddsByMatchId,
    getFancyOdd,
  };

  return (
    <SportContext.Provider value={value}>{children}</SportContext.Provider>
  );
}
