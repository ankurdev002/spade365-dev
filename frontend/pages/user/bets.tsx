import Head from "next/head";
import { useEffect, useState } from "react";
import { AiOutlineArrowLeft, AiOutlineArrowRight } from "react-icons/ai";
// import AvailableCredit from "../../components/AvailableCredit";
// import BetContainer from "../../components/BetContainer";
import axios from "axios";
import { convertReadableDate } from "../../helpers/date";

export interface Bet {
  id: number;
  user_id: number;
  category: string;
  event_id: string;
  sport_id: string;
  bookmaker: string;
  region: string;
  market: string;
  bet_type: string;
  stake: number;
  commence_time: string;
  liability: number;
  selectedTeam: string;
  selectedOdd: string;
  user_balance?: number, // user balance before at the time of placing bet
  user_balance_after: number, // user balance after bet results 
  pnl: number;
  status: string;
  settlement_id: null;
  is_deleted: boolean;
  matchName: null;
  gameId: null;
  marketId: null;
  marketType: null;
  runnerId: null;
  runnerName: null;
  // reqStake: null;
  requestedOdds: null;
  betvoid: null;
  // downpl: null;
  gameType: null;
  gameSubType: null;
  marketValidity: null;
  isBack: null;
  roundId: null;
  // pl: null;
  orderId: null;
  betExposure: null;
  exposureTime: null;
  homeTeam?: string;
  awayTeam?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BetUserStats {
  wagering: number
  totalBets: number
  totalOpenBets: number
  totalVoidBets: number
  totalWonBets: number
  totalLostBets: number
  totalStakeAmount: number
  totalOpenStakeAmount: number
  totalWinningAmount: number
  totalLossAmount: number
  totalPnl: number
}

export default function OpenBets() {
  const [myBets, setmyBets] = useState<Bet[]>([]);
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState(""); // OPEN, VOID, WON, LOST
  const [hasNextPage, setHasNextPage] = useState(false);
  const [userStats, setUserStats] = useState<BetUserStats | null>(null);
  const limit = 30;

  const statuses = ["OPEN", "VOID", "WON", "LOST"];

  const fetchBettingStatement = async () => {
    await axios({
      method: "GET",
      url: `/api/bets?skip=${page * limit}&limit=${limit}&status=${status}`,
    })
      .then((res) => {
        setmyBets(res.data)
        setHasNextPage(res.data && res.data.length === limit);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const fetchUserBetStats = async () => {
    const options = {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    };

    const response = await fetch(`/api/bets/stats`, options);

    if (response.status === 200) {
      const data = await response.json();
      if (!response.ok) {
        const error = (data && data.message) || response.status;
        return Promise.reject(error);
      }
      setUserStats(data);
    } else {
      console.log(await response.text());
    }
  };

  useEffect(() => {
    fetchBettingStatement();
  }, [page, status]);

  useEffect(() => {
    fetchUserBetStats();
  }, []);

  return (
    <>
      <Head>
        <title>Open Bets | Spade365</title>
        <meta name="description" content="Open Bets | Spade365" />
      </Head>
      <div className="text-black bg-white h-full min-h-[600px] px-2 md:px-6 py-12 break-words w-full max-w-[100vw] overflow-scroll scrollbar-hide">
        <div className="text-3xl w-full pb-2 border-b border-grey max-md:text-xl max-md:font-bold max-md:border-0 max-md:py-2 flex flex-row justify-between items-center">
          <h1>My Bets</h1>
          <div>
            <select
              className="border border-grey1 rounded-md px-2 py-1 min-w-[160px] font-normal"
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All</option>
              {statuses.map((status, index) => (
                <option key={index} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* <div className="flex my-8 hidden">
          <div className="ml-auto w-[25%]">
            <AvailableCredit />
          </div>
        </div> */}
        {userStats && (
          <div className="w-full my-6">
            <h1 className="text-left text-2xl lg:text-4xl mb-6 w-full">
              Bet Stats
            </h1>
            <div className="grid grid-cols-2 md:grid-cols-5 mx-auto">
              <div className="rounded-sm border border-primary/20"><div className="bg-primary flex items-center justify-between py-4"><p className="mr-0 text-white text-lg pl-5">Bets Rolling (Wagering)</p></div><p className="py-4 text-3xl ml-5">₹ {userStats.wagering}</p></div>
              {/* <div className="rounded-sm border border-primary/20"><div className="bg-primary flex items-center justify-between py-4"><p className="mr-0 text-white text-lg pl-5">Open Stake</p></div><p className="py-4 text-3xl ml-5">₹ {userStats.totalOpenStakeAmount ? userStats.totalOpenStakeAmount.toLocaleString() : 0}</p></div> */}
              <div className="rounded-sm border border-primary/20"><div className="bg-primary flex items-center justify-between py-4"><p className="mr-0 text-white text-lg pl-5">Total Bets</p></div><p className="py-4 text-3xl ml-5">{userStats.totalBets || 0}</p></div>
              <div className="rounded-sm border border-primary/20"><div className="bg-primary flex items-center justify-between py-4"><p className="mr-0 text-white text-lg pl-5">Won Bets</p></div><p className="py-4 text-3xl ml-5">{userStats.totalWonBets || 0}</p></div>
              <div className="rounded-sm border border-primary/20"><div className="bg-primary flex items-center justify-between py-4"><p className="mr-0 text-white text-lg pl-5">Lost Bets</p></div><p className="py-4 text-3xl ml-5">{userStats.totalLostBets || 0}</p></div>
              <div className="rounded-sm border border-primary/20"><div className="bg-primary flex items-center justify-between py-4"><p className="mr-0 text-white text-lg pl-5">Open Bets</p></div><p className="py-4 text-3xl ml-5">{userStats.totalOpenBets || 0}</p></div>
              <div className="rounded-sm border border-primary/20"><div className="bg-primary flex items-center justify-between py-4"><p className="mr-0 text-white text-lg pl-5">Void Bets</p></div><p className="py-4 text-3xl ml-5">{userStats.totalVoidBets || 0}</p></div>
              {/* <div className="rounded-sm border border-primary/20"><div className="bg-primary flex items-center justify-between py-4"><p className="mr-0 text-white text-lg pl-5">Total Profit</p></div><p className="py-4 text-3xl ml-5">₹ {userStats.totalWinningAmount ? userStats.totalWinningAmount.toLocaleString() : 0}</p></div>
              <div className="rounded-sm border border-primary/20"><div className="bg-primary flex items-center justify-between py-4"><p className="mr-0 text-white text-lg pl-5">Total Loss</p></div><p className="py-4 text-3xl ml-5">₹ {userStats.totalLossAmount ? userStats.totalLossAmount.toLocaleString() : 0}</p></div>
              <div className="rounded-sm border border-primary/20"><div className="bg-primary flex items-center justify-between py-4"><p className="mr-0 text-white text-lg pl-5">Final PNL</p></div><p className="py-4 text-3xl ml-5">₹ {userStats.totalPnl ? userStats.totalPnl.toLocaleString() : 0}</p></div> */}
            </div>
          </div>
        )}

        <div className='w-full h-full !overflow-x-auto scrollbar-hide'>
          <div className="min-w-[600px] h-full !overflow-x-auto">
            {myBets.length === 0 && (
              <div className="text-center text-base py-6 font-bold">
                You have no {status.toLowerCase()} bets
              </div>
            )}
            {/* table with date/time, amount and status */}
            <table className="table-auto w-full text-left break-words">
              <thead>
                <tr className="text-sm">
                  <th className="px-2 lg:px-4 py-2 border font-normal bg-gray-200">
                    Date
                  </th>
                  <th className="px-2 lg:px-4 py-2 border font-normal bg-gray-200">
                    Status
                  </th>
                  <th className="px-2 lg:px-4 py-2 border font-normal bg-gray-200">
                    PL
                  </th>
                  {/* <th className="px-2 lg:px-4 py-2 border font-normal bg-gray-200">
                    Category
                  </th> */}
                  {/* <th className="px-2 lg:px-4 py-2 border font-normal bg-gray-200">
                    Details
                  </th> */}
                  <th className="px-2 lg:px-4 py-2 border font-normal bg-gray-200">
                    Stake
                  </th>
                  <th className="px-2 lg:px-4 py-2 border font-normal bg-gray-200">
                    Odds
                  </th>
                </tr>
              </thead>
              <tbody>
                {(myBets && myBets.length > 0) && myBets.map((bet, index: number) => (
                  <tr key={index}>
                    <td className="border px-2 lg:px-4 py-2">
                      {convertReadableDate(bet.createdAt)}
                    </td>
                    <td className={`border px-2 lg:px-4 py-2 font-bold ${bet.status == "WON" ? 'text-green-500' : bet.status == "LOST" ? 'text-red-500' : bet.status == "VOID" ? 'text-yellow-500' : 'text-white'}`}>
                      {bet.status}
                    </td>
                    <td className={`border px-2 lg:px-4 py-2 font-bold`}>
                      ₹{bet.pnl || ""}
                    </td>
                    {/* <td className={`border px-2 lg:px-4 py-2`}>
                      <div className="flex flex-col justify-start items-start h-full">
                        <span>{bet.sport_id ? bet.sport_id : ''}</span>
                        {bet.homeTeam && bet.awayTeam && (
                          <span>{`${bet.homeTeam} vs ${bet.awayTeam}`}</span>
                        )}
                      </div>
                    </td> */}
                    {/* <td className="border px-2 lg:px-4 py-2">
                      <div className="flex flex-col justify-start items-start h-full">
                        {<span><strong>Bal. Before</strong>: ₹ {bet.user_balance}</span>}
                        {bet.user_balance_after > 0 && <span><strong>Bal. After</strong>: ₹ {bet.user_balance_after}</span>}
                        {bet.updatedAt ? <span><strong>Updated</strong>: {convertReadableDate(bet.updatedAt as string)}</span> : ''}
                      </div>
                    </td> */}
                    <td className="border px-2 lg:px-4 py-2">
                      ₹{bet.stake}
                    </td>
                    <td className="border px-2 lg:px-4 py-2">
                      <div className="flex flex-col justify-start items-start h-full">
                        {bet.selectedOdd && <span><strong>Odds</strong>: {bet.selectedOdd}</span>}
                        {bet.selectedTeam && <span><strong>Team</strong>: {bet.selectedTeam}</span>}
                        {bet.runnerName && <span><strong>Runner</strong>: {bet.runnerName}</span>}
                        {bet.gameType && <span><strong>Game</strong>: {bet.gameType}</span>}
                        {bet.roundId && <span><strong>Round</strong>: {bet.roundId}</span>}
                        {bet.sport_id && <span><strong>Sport</strong>: {bet.sport_id}</span>}
                        {bet.homeTeam && bet.awayTeam && (<span><strong>Game</strong>: {`${bet.homeTeam} vs ${bet.awayTeam}`}</span>)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* pagination */}
        {(page > 1 || hasNextPage) && (
          <div className="flex flex-row justify-center items-center my-12">
            {page > 1 && (
              <button
                className="bg-primary hover:bg-neutral/80 text-white font-bold py-2 px-4 rounded-l text-center flex flex-row items-center justify-center"
                onClick={() => setPage(page - 1)}
              >
                <AiOutlineArrowLeft className="mr-2" />
                {"Previous"}
              </button>
            )}
            {hasNextPage && (
              <button
                className="bg-primary hover:bg-neutral/80 text-white font-bold py-2 px-4 rounded-r text-center border-l-2 border-white/20 flex flex-row items-center justify-center"
                onClick={() => setPage(page + 1)}
              >
                {"Next"}
                <AiOutlineArrowRight className="ml-2" />
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
