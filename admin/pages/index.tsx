import Head from "next/head";
import { useEffect, useState } from "react";
import { HiRefresh } from "react-icons/hi";
import { toast } from "react-toastify";

export interface Analytics {
  users: number,
  bets: number,
  deposits: number,
  withdrawals: number,
  newUsers: number,
  activeUsers: number,
  newBets: number,
  newDeposits: number,
  newWithdrawals: number,
  wonBets: number,
  lostBets: number,
  openBets: number,
  voidBets: number,
  sportsBets: number,
  sportsFancyBets: number,
  casinoBets: number,
}

export default function Dashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState(7);

  // call api to fetch analytics data
  const fetchAnalytics = async () => {
    setLoading(true);
    const limit = 20;
    const options = {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    };

    const response = await fetch(`/api/team/dashboard?from=${from}`, options);

    if (response.status === 200) {
      const data = await response.json();
      if (!response.ok) {
        const error = (data && data.message) || response.status;
        return Promise.reject(error);
      }
      setAnalytics(data);
      setLoading(false);
    } else {
      toast.error(await response.text());
    }
  }

  useEffect(() => {
    fetchAnalytics();
  }, [from]);

  return (
    <>
      <Head>
        <title>Bank Accounts | Spade365</title>
        <meta name="description" content="Bank Accounts | Spade365" />
      </Head>
      <div className="flex flex-col justify-start items-center min-h-[800px] w-full container mx-auto overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between w-full items-center mb-8 md:mb-4">
          <div className="flex flex-col md:flex-row justify-between w-full items-center mb-8 md:mb-4">
            <h1 className="text-center md:text-left text-4xl lg:text-5xl my-6 w-1/2">
              Dashboard
              <button className="text-black bg-white p-1 text-2xl cursor-pointer rounded ml-4" title="Refresh Analytics" onClick={() => {
                fetchAnalytics()
                toast.success('Analytics refreshed successfully!')
              }} >
                <HiRefresh />
              </button>
            </h1>
            {/* Filter */}
            <div className="flex flex-row justify-center md:justify-start items-center w-full md:w-1/2">
              {/* search inpout with search icon */}
              <div className="md:ml-auto">
                {/* select box with filter */}
                <select
                  className="bg-gray text-white text-base font-semibold py-2 pl-4 pr-8 rounded bg-transparent"
                  value={from}
                  onChange={(e) => setFrom(parseInt(e.target.value))}
                >
                  <option className="bg-slate-900 text-white" value={1}>Last 24 Hours</option>
                  <option className="bg-slate-900 text-white" value={2}>Last 48 Hours</option>
                  <option className="bg-slate-900 text-white" value={3}>Last 3 Days</option>
                  <option className="bg-slate-900 text-white" value={7}>Last 7 Days</option>
                  <option className="bg-slate-900 text-white" value={30}>Last 30 Days</option>
                  <option className="bg-slate-900 text-white" value={90}>Last 3 Months</option>
                  <option className="bg-slate-900 text-white" value={180}>Last 6 Months</option>
                  <option className="bg-slate-900 text-white" value={365}>Last 12 Months</option>
                </select>
              </div>
            </div>
          </div>
        </div>


        {/* tabs with icon analytics data number */}
        <div className="w-full">
          <div className="mx-auto px-6 lg:px-8 py-8 bg-gradient-to-br from-green-600 to-purple-800 rounded-lg w-full">
            <dl className="grid grid-cols-3 gap-16 text-center lg:grid-cols-6 justify-center items-center self-center justify-items-center w-full">
              <div className="mx-auto flex flex-col gap-y-4">
                <dt className="text-base leading-7 text-gray-200">Total Users</dt>
                <dd className="order-first text-3xl font-semibold tracking-tight text-white sm:text-5xl">{analytics?.users?.toLocaleString()}</dd>
              </div>

              <div className="mx-auto flex flex-col gap-y-4">
                <dt className="text-base leading-7 text-gray-200">New Users</dt>
                <dd className="order-first text-3xl font-semibold tracking-tight text-white sm:text-5xl">+ {analytics?.newUsers?.toLocaleString()}</dd>
              </div>

              <div className="mx-auto flex flex-col gap-y-4">
                <dt className="text-base leading-7 text-gray-200">Active Users</dt>
                <dd className="order-first text-3xl font-semibold tracking-tight text-white sm:text-5xl">{analytics?.activeUsers?.toLocaleString()}</dd>
              </div>

              <div className="mx-auto flex flex-col gap-y-4">
                <dt className="text-base leading-7 text-gray-200">Total Bets</dt>
                <dd className="order-first text-3xl font-semibold tracking-tight text-white sm:text-5xl">{analytics?.bets?.toLocaleString()}</dd>
              </div>

              <div className="mx-auto flex flex-col gap-y-4">
                <dt className="text-base leading-7 text-gray-200">New Bets</dt>
                <dd className="order-first text-3xl font-semibold tracking-tight text-white sm:text-5xl">+ {analytics?.newBets?.toLocaleString()}</dd>
              </div>

              <div className="mx-auto flex flex-col gap-y-4">
                <dt className="text-base leading-7 text-gray-200">Bets Won</dt>
                <dd className="order-first text-3xl font-semibold tracking-tight text-white sm:text-5xl">{analytics?.wonBets?.toLocaleString()}</dd>
              </div>

              <div className="mx-auto flex flex-col gap-y-4">
                <dt className="text-base leading-7 text-gray-200">Bets Lost</dt>
                <dd className="order-first text-3xl font-semibold tracking-tight text-white sm:text-5xl">{analytics?.lostBets?.toLocaleString()}</dd>
              </div>

              <div className="mx-auto flex flex-col gap-y-4">
                <dt className="text-base leading-7 text-gray-200">Bets Open</dt>
                <dd className="order-first text-3xl font-semibold tracking-tight text-white sm:text-5xl">{analytics?.openBets?.toLocaleString()}</dd>
              </div>

              <div className="mx-auto flex flex-col gap-y-4">
                <dt className="text-base leading-7 text-gray-200">Bets Void</dt>
                <dd className="order-first text-3xl font-semibold tracking-tight text-white sm:text-5xl">{analytics?.voidBets?.toLocaleString()}</dd>
              </div>

              <div className="mx-auto flex flex-col gap-y-4">
                <dt className="text-base leading-7 text-gray-200">Sportsbook Bets</dt>
                <dd className="order-first text-3xl font-semibold tracking-tight text-white sm:text-5xl">{analytics?.sportsBets?.toLocaleString()}</dd>
              </div>
              <div className="mx-auto flex flex-col gap-y-4">
                <dt className="text-base leading-7 text-gray-200">SB Fancy Bets</dt>
                <dd className="order-first text-3xl font-semibold tracking-tight text-white sm:text-5xl">{analytics?.sportsFancyBets?.toLocaleString()}</dd>
              </div>
              <div className="mx-auto flex flex-col gap-y-4">
                <dt className="text-base leading-7 text-gray-200">Live Casino Bets</dt>
                <dd className="order-first text-3xl font-semibold tracking-tight text-white sm:text-5xl">{analytics?.casinoBets?.toLocaleString()}</dd>
              </div>

              <div className="mx-auto flex flex-col gap-y-4">
                <dt className="text-base leading-7 text-gray-200">Total Deposits</dt>
                <dd className="order-first text-3xl font-semibold tracking-tight text-white sm:text-5xl">{analytics?.deposits?.toLocaleString()}</dd>
              </div>

              <div className="mx-auto flex flex-col gap-y-4">
                <dt className="text-base leading-7 text-gray-200">New Deposits</dt>
                <dd className="order-first text-3xl font-semibold tracking-tight text-white sm:text-5xl">+ {analytics?.newDeposits?.toLocaleString()}</dd>
              </div>

              <div className="mx-auto flex flex-col gap-y-4">
                <dt className="text-base leading-7 text-gray-200">Total Withdrawals</dt>
                <dd className="order-first text-3xl font-semibold tracking-tight text-white sm:text-5xl">{analytics?.withdrawals?.toLocaleString()}</dd>
              </div>

              <div className="mx-auto flex flex-col gap-y-4">
                <dt className="text-base leading-7 text-gray-200">New Withdrawals</dt>
                <dd className="order-first text-3xl font-semibold tracking-tight text-white sm:text-5xl">+ {analytics?.newWithdrawals?.toLocaleString()}</dd>
              </div>
            </dl>
          </div>
        </div>

      </div>
    </>
  );
}
