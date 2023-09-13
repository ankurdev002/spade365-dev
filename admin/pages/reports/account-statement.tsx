import Head from "next/head";
import { useEffect, useState } from "react";
import {
  AiFillCloseCircle,
  AiFillEdit,
  AiOutlineArrowLeft,
  AiOutlineArrowRight,
  AiOutlineLoading3Quarters,
  AiOutlineSearch,
} from "react-icons/ai";

type Transaction = {
  id: number | string;
  date: string;
  fromTo: string;
  openingBalance: number;
  points: number;
  amount: number;
  profit: number;
  closingBalance: number;
  transaction: string;
};

export default function MyStatement() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [hasNextPage, setHasNextPage] = useState(false);

  useEffect(() => {
    // fetchTeam();
  }, [page, search]);

  return (
    <>
      <Head>
        <title>Account Statement | Spade365</title>
        <meta name="description" content="Account Statement | Spade365" />
      </Head>
      <div className="flex flex-col justify-start items-center min-h-[800px] w-full mx-auto overflow-hidden">
        {/* search header */}
        <div className="flex flex-col md:flex-row justify-between w-full items-center mb-8 md:mb-4">
          <h1 className="text-center md:text-left text-4xl lg:text-5xl my-6 w-1/2">
            My Account Statement
          </h1>
          {/* search */}
          <div className="flex flex-row justify-center md:justify-start items-center w-full md:w-1/2">
            {/* search inpout with search icon */}
            <div className="md:ml-auto flex flex-row justify-start items-center w-full bg-gray rounded-md border max-w-xs">
              <button className="p-2 h-full rounded-md">
                <AiOutlineSearch className="text-2xl" />
              </button>
              <input
                type="text"
                className="w-full p-2 focus:outline-none focus:ring-0 border-none bg-transparent"
                placeholder="Search by UserID, Status or UTR"
                autoComplete="nope"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {/* button to add user */}
            {/* <button
              className="ml-4 p-2 bg-white text-black rounded-md flex flex-row justify-center items-center"
              title="Add User"
              onClick={() => {
                // setModalUser(emptyUser);
                // setShowTeamModal(true);
              }}
            >
              <IoIosPersonAdd className="text-2xl" />
              <span className="ml-1 hidden lg:inline-block">Add Admin</span>
            </button> */}
          </div>
        </div>
        <div className='overflow-x-scroll scrollbar-hide w-full'>
          {/* table with team, user, amount, date, status, action */}
          <table className="table-auto w-full text-left break-words">
            <thead className="bg-primary text-white">
              <tr>
                {/* <th className="border border-white/20 px-2 md:px-4 py-2 text-center">
              ID
            </th> */}

                <th className="border border-white/20 px-2 md:px-4 py-2">
                  Date
                </th>
                <th className="border border-white/20 px-2 md:px-4 py-2 text-center">
                  From& To
                </th>
                <th className="border border-white/20 px-2 md:px-4 py-2 text-center">
                  Opening Bal
                </th>
                <th className="border border-white/20 px-2 md:px-4 py-2 text-center">
                  Points
                </th>
                <th className="border border-white/20 px-2 md:px-4 py-2 text-center">
                  Amount
                </th>
                <th className="border border-white/20 px-2 md:px-4 py-2 text-center">
                  My Profit
                </th>
                <th className="border border-white/20 px-2 md:px-4 py-2 text-center">
                  Closing Bal
                </th>
                <th className="border border-white/20 px-2 md:px-4 py-2 text-center">
                  Transaction
                </th>
              </tr>
            </thead>
            <tbody>
              {/* map through team and display them */}
              {transactions.map((transaction) => (
                <tr key={transaction.id} className={`h-[120px]`}>
                  <td
                    className={`border border-white/20 px-2 md:px-4 py-2 font-bold text-center`}
                  >
                    {transaction.id}
                  </td>
                  <td className="border border-white/20 px-2 md:px-4 py-2">
                    {transaction.date}
                  </td>
                  <td className="border border-white/20 px-2 md:px-4 py-2">
                    {transaction.fromTo}
                  </td>
                  <td className="border border-white/20 px-2 md:px-4 py-2">
                    {transaction.openingBalance}
                  </td>
                  <td className="border border-white/20 px-2 md:px-4 py-2">
                    {transaction.points}
                  </td>
                  <td className="border border-white/20 px-2 md:px-4 py-2">
                    {transaction.amount}
                  </td>
                  <td className="border border-white/20 px-2 md:px-4 py-2">
                    {transaction.profit}
                  </td>
                  <td className="border border-white/20 px-2 md:px-4 py-2">
                    {transaction.closingBalance}
                  </td>
                  <td className="border border-white/20 px-2 md:px-4 py-2">
                    {transaction.transaction}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                {loading ? (
                  <td
                    colSpan={12}
                    className="border border-white/20 px-4 py-8 text-center"
                  >
                    <div className="flex flex-row justify-center items-center text-white">
                      <AiOutlineLoading3Quarters className="animate-spin text-3xl mr-2" />
                    </div>
                  </td>
                ) : transactions.length === 0 ? (
                  <td
                    colSpan={12}
                    className="border border-white/20 px-4 py-8 text-center"
                  >
                    you have 0 transactions
                  </td>
                ) : null}
              </tr>
            </tfoot>
          </table>
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
