import Head from "next/head";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import useUser from "../../hooks/useUser";

export enum Time {
  SYSTEM = "system",
  DEVICE = "device",
  INDIA = "india",
}

export default function TimeSetting() {
  const user = useUser();
  const [time, setTime] = useState<Time>(user.user?.timezone ?? Time.SYSTEM);
  const [currentTime, setCurrentTime] = useState<string>("");

  const calculateTime = (time: Time) => {
    if (time === Time.SYSTEM) {
      // set current time to GMT 0
      setCurrentTime(
        new Date().toLocaleTimeString("en-US", { timeZone: "GMT" })
      );
    } else if (time === Time.DEVICE) {
      setCurrentTime(new Date().toLocaleTimeString());
    } else if (time === Time.INDIA) {
      setCurrentTime(
        new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata" })
      );
    }
  };

  // set a timeout to update the current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      calculateTime(time);
    }, 1000);
    return () => clearInterval(interval);
  }, [time]);

  // on time change, update the current time
  useEffect(() => {
    calculateTime(time);
  }, [time]);

  // update user profile time preference in the backend
  const handleTimeUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const options = {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timezone: time }),
    };

    const response = await fetch(`/api/users/profile`, options);

    if (response.status === 200) {
      const data = await response.json();
      if (!response.ok) {
        const error = (data && data.message) || response.status;
        return Promise.reject(error);
      }
      toast.success("Timezone updated");
    } else {
      toast.error(await response.text());
    }
  };

  return (
    <>
      <Head>
        <title>Time Setting | Spade365</title>
        <meta name="description" content="Time Setting | Spade365" />
      </Head>
      <div className="text-black bg-white px-6 py-12 break-words w-full h-full  min-h-[500px] max-w-7xl mx-auto">
        <h2 className="text-center text-5xl">Time Setting</h2>
        <div className="flex flex-col max-w-5xl mx-auto w-full mt-8">
          {/* Edit Casino Stakes */}
          <form
            className="flex flex-col w-full"
            onSubmit={(e) => handleTimeUpdate(e)}
          >
            <div className="bg-neutral rounded-lg shadow text-secondary text-center mx-auto mb-6">
              <h2 className="text-5xl p-4 text-stroke-white">{currentTime}</h2>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {/* 3 radio inouts with value: system, device and India */}
              <div className="flex flex-col max-w-xs mx-auto">
                <label className="flex items-center my-2">
                  <input
                    type="radio"
                    name="time"
                    className="text-accent"
                    value={Time.SYSTEM}
                    checked={time === Time.SYSTEM}
                    onChange={(e) => setTime(e.target.value as Time)}
                  />
                  <span className="ml-2">System time (GMT +00:00)</span>
                </label>
                <label className="flex items-center my-2">
                  <input
                    type="radio"
                    name="time"
                    className="text-accent"
                    value={Time.DEVICE}
                    checked={time === Time.DEVICE}
                    onChange={(e) => setTime(e.target.value as Time)}
                  />
                  <span className="ml-2">Your device time</span>
                </label>
                <label className="flex items-center my-2">
                  <input
                    type="radio"
                    name="time"
                    className="text-accent"
                    value={Time.INDIA}
                    checked={time === Time.INDIA}
                    onChange={(e) => setTime(e.target.value as Time)}
                  />
                  <span className="ml-2">India Standard Time (GMT +05:30)</span>
                </label>
              </div>
            </div>
            <div className="flex justify-center mt-4">
              <button
                type="submit"
                className="bg-accent text-white p-3 hover:bg-accent/80"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
