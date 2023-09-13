import axios from "axios";
import Head from "next/head";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/router"

// Withdraw type
export interface Withdraw {
  id: number // withdraw id
  user_id: number // user id
  amount: number // withdraw amount
  bank_account: Account // bank account details
  bank_id?: number // bank account id
  status: string // pending, approved, rejected
  createdAt: string;
  updatedAt: string;
  reference?: string;
  remark?: string; // remark by admin
  readTnC?: boolean; // read terms and conditions, only for frontend
}

type Account = {
  BankAccountId?: number;
  account: string;
  confirm_account?: string; // only for frontend
  createdAt?: string;
  id?: number;
  ifsc: string;
  is_deleted?: boolean;
  last_used?: string;
  name: string;
  bank_name?: string;
  updatedAt?: string;
  user_id?: number;
};

export default function Withdraw() {
  const [tab, setTab] = useState(0);
  const [usingOldAccount, setUsingOldAccount] = useState(false);
  const router = useRouter();
  const [canSubmit, setCanSubmit] = useState(false)
  const [withdraw, setWithdraw] = useState({
    amount: 0,
    bank_account: {
      account: "",
      ifsc: "",
      name: "",
      bank_name: "",
    },
    // bank_id: 0, // bank account id
    readTnC: false, // read terms and conditions, only for frontend
  } as Withdraw);
  const [accounts, setAccounts] = useState<Account[]>(); // all bank accounts

  // get all accounts
  useEffect(() => {
    getAllAccounts();
  }, []);

  // set tab from router query
  useEffect(() => {
    if (router.query.tab) {
      setTab(parseInt(router.query.tab as string))
    }
  }, [router.query.tab])

  // if usingOldAccount is changed to false, reset bank account
  useEffect(() => {
    if (!usingOldAccount) {
      setWithdraw({
        ...withdraw,
        bank_account: {
          account: "",
          ifsc: "",
          name: "",
        },
        bank_id: 0,
      });
    }
  }, [usingOldAccount]);

  // get all accounts
  const getAllAccounts = async () => {
    await axios({
      method: "GET",
      url: `/api/withdraw/accounts`,
    })
      .then((res) => {
        setAccounts(res.data);
        if (res.data.length > 0) setTab(1);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  // on deposit state change, check if can submit
  useEffect(() => {
    if (withdraw.amount >= 100 && withdraw.bank_account.account.length > 6 && withdraw.bank_account.ifsc.length > 6 && withdraw.bank_account.name.length > 0 && withdraw.readTnC) {
      setCanSubmit(true)
    } else {
      setCanSubmit(false)
    }
  }, [withdraw])

  // Withdraw handler
  const handleWithdraw = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // bankaccount.account and bankaccount.confirm_account should be same
    if (withdraw.bank_account.account !== withdraw.bank_account.confirm_account) {
      toast.error("Account number and confirm account number don't match")
      return;
    }

    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(withdraw)
    };

    const response = await fetch(`/api/withdraw`, options);

    if (response.status === 200) {
      const data = await response.json();
      if (!response.ok) {
        const error = (data && data.message) || response.status;
        return Promise.reject(error);
      }
      toast.success("Withdraw request sent successfully. If approved, amount will be credited in your bank account soon.")
      // router.push to "/user/transactions" with tab query as 1
      router.push({
        pathname: "/user/transactions",
        query: { tab: 1 }
      })
    } else {
      toast.error(await response.text())
    }
  };

  return (
    <>
      <Head>
        <title>Withdraw | Spade365</title>
        <meta name="description" content="Withdraw | Spade365" />
      </Head>
      <div className="text-black bg-white break-words w-full max-w-7xl mx-auto my-12 px-4 flex min-h-[100vh] max-md:my-0 max-md:p-2">
        <div className="w-1/2 shadow-2xl py-9 px-16 max-md:hidden">
          <div className="text-3xl py-4 font-bold">Withdraw funds</div>
          <div className="flex">
            <div className="text-accent text-base">
              <p>
                1. This form is for withdrawing the amount from the main wallet
                only.
              </p>
              <p>
                2. The bonus wallet amount cannot be withdrawn by this form.
              </p>
            </div>
            {/* <div className="w-[10%] flex">
              <span className="underline mr-1 cursor-pointer">Help</span>
              <div className="h-fit rounded-full text-primary border border-primary px-2 py-1 text-xs">
                ?
              </div>
            </div> */}
          </div>
        </div>

        <div className="w-1/2 md:shadow-2xl py-9 px-16 max-md:w-full max-md:p-2">
          <div className="max-md:p-4 md:hidden">
            <div className="py-4 font-bold flex tetx-base">
              Withdraw funds
              <div className="w-[10%] flex ml-auto">
                <span className="underline mr-1 cursor-pointer">Help</span>
                <div className="h-fit rounded-full text-primary border border-primary px-2 py-1 text-xs">
                  ?
                </div>
              </div>
            </div>
            <div className="flex">
              <div className="text-accent text-base">
                <p>
                  1. This form is for withdrawing the amount from the main
                  wallet only.
                </p>
                <p>
                  2. The bonus wallet amount cannot be withdrawn by this form.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center max-md:p-4">
            <button
              type="button"
              className="p-4 rounded text-xl my-3.5 bg-primary w-[40%] text-white mr-2 max-md:w-[47%] max-md:my-1"
              onClick={() => {
                setUsingOldAccount(false);
                setTab(0);
              }}
            >
              Use New Account
            </button>
            <button
              type="button"
              className="p-4 rounded text-xl my-3.5 bg-primary w-[40%] text-white max-md:w-[47%] max-md:my-1"
              onClick={() => setTab(1)}
            >
              Use Previous Account
            </button>
          </div>

          {tab == 0 && (
            <form onSubmit={(e) => handleWithdraw(e)}>
              <div className="my-8 max-md:p-4 max-md:my-2">
                {/* amount */}
                <>
                  <div className="font-bold text-base mb-3.5">
                    Amount<span className="text-red-500">*</span>
                  </div>
                  <div>
                    <input
                      className="w-[90%]"
                      type="number"
                      placeholder={"0"}
                      value={withdraw.amount}
                      onChange={(e) =>
                        setWithdraw({
                          ...withdraw,
                          amount: parseInt(e.target.value),
                        })
                      }
                    />
                    <span className="ml-2">INR</span>
                  </div>

                  {/* quick amount  */}
                  <div className="flex place-content-between my-2">
                    <button
                      type="button"
                      className="bg-primary w-[32%] rounded py-2"
                      onClick={() =>
                        setWithdraw({
                          ...withdraw,
                          amount: withdraw.amount + 1000,
                        })
                      }
                    >
                      <span className="text-base text-white">+1,000</span>
                    </button>
                    <button
                      type="button"
                      className="bg-primary w-[32%] rounded py-2"
                      onClick={() =>
                        setWithdraw({
                          ...withdraw,
                          amount: withdraw.amount + 5000,
                        })
                      }
                    >
                      <span className="text-base text-white">+5,000</span>
                    </button>
                    <button
                      type="button"
                      className="bg-primary w-[32%] rounded py-2"
                      onClick={() =>
                        setWithdraw({
                          ...withdraw,
                          amount: withdraw.amount + 10000,
                        })
                      }
                    >
                      <span className="text-base text-white">+10,000</span>
                    </button>
                  </div>

                  {/* balance error */}
                  {/* <div className="text-accent text-xs">
                    You don`t have enough money on your balance
                  </div> */}
                </>
                {/* IFSC code */}
                <div className="mt-5">
                  <div className="font-bold text-base mb-3.5">
                    IFSC Code<span className="text-red-500">*</span>
                  </div>
                  <input
                    value={withdraw.bank_account.ifsc}
                    disabled={usingOldAccount}
                    onChange={(e) =>
                      setWithdraw({
                        ...withdraw,
                        bank_account: {
                          ...withdraw.bank_account,
                          ifsc: e.target.value,
                        },
                      })
                    }
                    className={`w-full ${usingOldAccount && "bg-gray-200"}`}
                    type="text" />
                </div>
                {/* bank name */}
                <div className="mt-5">
                  <div className="font-bold text-base mb-3.5">
                    Bank name<span className="text-red-500">*</span>
                  </div>
                  <input
                    className={`w-full ${usingOldAccount && "bg-gray-200"}`}
                    type="text"
                    disabled={usingOldAccount}
                    placeholder="Bank Name"
                    maxLength={32}
                    value={withdraw.bank_account.bank_name}
                    onChange={(e) =>
                      setWithdraw({
                        ...withdraw,
                        bank_account: {
                          ...withdraw.bank_account,
                          bank_name: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                {/* account number */}
                <div className="mt-5">
                  <div className="font-bold text-base mb-3.5">
                    Account number<span className="text-red-500">*</span>
                  </div>
                  <input
                    className={`w-full ${usingOldAccount && "bg-gray-200"}`}
                    type="text"
                    disabled={usingOldAccount}
                    placeholder="Carefully enter your account number"
                    value={withdraw.bank_account.account}
                    onChange={(e) =>
                      setWithdraw({
                        ...withdraw,
                        bank_account: {
                          ...withdraw.bank_account,
                          account: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                {/* confirm account number */}
                <div className="mt-5">
                  <div className="font-bold text-base mb-3.5">
                    Confirm account number
                    <span className="text-red-500">*</span>
                  </div>
                  <input
                    className={`w-full ${usingOldAccount && "bg-gray-200"}`}
                    type="text"
                    disabled={usingOldAccount}
                    placeholder="Confirm your account number"
                    value={withdraw.bank_account.confirm_account}
                    onChange={(e) =>
                      setWithdraw({
                        ...withdraw,
                        bank_account: {
                          ...withdraw.bank_account,
                          confirm_account: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                {/* account name */}
                <div className="mt-5">
                  <div className="font-bold text-base mb-3.5">
                    Account name<span className="text-red-500">*</span>
                  </div>
                  <input
                    className={`w-full ${usingOldAccount && "bg-gray-200"}`}
                    type="text"
                    disabled={usingOldAccount}
                    placeholder="Account Name"
                    maxLength={32}
                    value={withdraw.bank_account.name}
                    onChange={(e) =>
                      setWithdraw({
                        ...withdraw,
                        bank_account: {
                          ...withdraw.bank_account,
                          name: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="my-2 max-md:p-4">
                <div className="flex">
                  <input
                    type="checkbox"
                    className="mr-2 mt-1 checked:bg-primary"
                    checked={withdraw.readTnC}
                    onChange={() => setWithdraw({ ...withdraw, readTnC: !withdraw.readTnC })}
                  />
                  <span className="text-sm">
                    I have read and agree with&nbsp;
                    <span className="text-primary underline">
                      the terms of payment and withdrawal policy.
                    </span>
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={`p-2 rounded text-lg my-3.5 w-full text-white ${canSubmit ? "bg-primary" : "bg-grey1"
                    }`}
                >
                  Submit
                </button>
              </div>
            </form>
          )}

          {tab == 1 && (
            <div className="text-center">
              <p className="opacity-80 text-xl my-6 font-semibold">{(accounts && accounts?.length > 0) ? 'Click to select a bank account' : 'You dont have any bank accounts added yet.'}</p>
              <div className="grid grid-cols-2 gap-4 overflow-x-scroll overflow-y-hidden scrollbar-hide pb-2.5 my-4">
                {(accounts ?? []).map((account, index) => (
                  <div
                    key={account.id}
                    onClick={() => {
                      setWithdraw({
                        ...withdraw,
                        bank_id: account.id,
                        bank_account: {
                          ...account,
                          confirm_account: account.account,
                        }
                      })
                      setUsingOldAccount(true)
                      setTab(0)
                    }}
                    className="py-2.5 px-6 mr-5 cursor-pointer rounded-xl bg-gradient-to-r from-accent/80 to-primary/80 text-left text-white min-h-[120px]">
                    <div className="flex flex-col items-start justify-center w-full h-full">
                      <span className="text-xl uppercase mb-1">{index + 1}. {account.name}</span>
                      {account.bank_name && <span className="uppercase font-medium text-xl mb-1">{account.bank_name}</span>}
                      <span className="uppercase font-bold text-xl mb-1">{account.account}</span>
                      <span className="uppercase font-medium text-xl">{account.ifsc}</span>
                    </div>
                    {/* <div className="text-xs text-primary uppercase">{bank.type}</div> */}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
