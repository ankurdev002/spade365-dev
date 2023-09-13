import Head from "next/head";
import { useState } from "react";
import { toast } from "react-toastify";
import useInput from "../../hooks/useInput";
import useUser from "../../hooks/useUser";

export default function ChangePassword() {
  const [password, setPassword] = useState({
    old: "",
    new: "",
    confirm: "",
  });
  const user = useUser();
  const { reset: resetName, ...name } = useInput(user.user?.name);
  const { reset: resetEmail, ...email } = useInput(user.user?.email);

  const handlePasswordUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password.new !== password.confirm) {
      toast.error("New password and confirm password do not match");
      return;
    }
    const options = {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        oldPassword: password.old,
        newPassword: password.new,
      }),
    };

    const response = await fetch(`/api/users/profile`, options);

    if (response.status === 200) {
      const data = await response.json();
      if (!response.ok) {
        const error = (data && data.message) || response.status;
        return Promise.reject(error);
      }
      toast.success("Password updated successfully");
    } else {
      toast.error(await response.text());
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const options = {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        (() => {
          const data: Record<string, any> = {};
          if (name.value) data.name = name.value;
          if (email.value) data.email = email.value;
          return data;
        })()
      ),
    };

    const response = await fetch(`/api/users/profile`, options);

    if (response.status === 200) {
      const data = await response.json();
      if (!response.ok) {
        const error = (data && data.message) || response.status;
        return Promise.reject(error);
      }
      toast.success("Profile updated successfully");
    } else {
      toast.error(await response.text());
    }
  };

  return (
    <>
      <Head>
        <title>Change Password | Spade365</title>
        <meta name="description" content="Change Password | Spade365" />
      </Head>

      <div className="text-black bg-white px-6 py-12 break-words w-full max-w-7xl mx-auto">
        {/* update password */}
        <div>
          <h2 className="text-center text-5xl">Profile Update</h2>
          <div className="flex flex-col max-w-5xl mx-auto w-full mt-8">
            {/* Edit Casino Stakes */}
            <form
              className="flex flex-col w-full"
              onSubmit={(e) => handlePasswordUpdate(e)}
            >
              <h3 className="text-2xl my-6">Change Password</h3>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex flex-col">
                  {/* <label>Old Password</label> */}
                  <input
                    name="old-password"
                    type="password"
                    className="focus:ring-secondary focus:border-secondary"
                    placeholder="Old Password"
                    value={password.old}
                    onChange={(e) =>
                      setPassword({ ...password, old: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col">
                  {/* <label>New Password</label> */}
                  <input
                    name="new-password"
                    type="password"
                    className="focus:ring-secondary focus:border-secondary"
                    placeholder="New Password"
                    value={password.new}
                    onChange={(e) =>
                      setPassword({ ...password, new: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col">
                  {/* <label>Confirm New Password</label> */}
                  <input
                    name="confirm-password"
                    type="password"
                    className="focus:ring-secondary focus:border-secondary"
                    placeholder="Confirm New Password"
                    value={password.confirm}
                    onChange={(e) =>
                      setPassword({ ...password, confirm: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  type="submit"
                  className="bg-accent text-white p-3 hover:bg-accent/80"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
        {/* edit information */}
        <div>
          {/* <h2 className="text-center text-5xl">Update Profile</h2> */}
          <div className="flex flex-col max-w-5xl mx-auto w-full mt-8">
            {/* Edit Casino Stakes */}
            <form
              className="flex flex-col w-full"
              onSubmit={(e) => handleProfileUpdate(e)}
            >
              <h3 className="text-2xl my-6">Update Profile</h3>
              <div className="grid grid-cols-1 gap-2">
                {/* name */}
                <div className="flex flex-col">
                  <input
                    name="name"
                    type="text"
                    className="focus:ring-secondary focus:border-secondary"
                    placeholder="Name"
                    {...name}
                  />
                </div>
                {/* email */}
                <div className="flex flex-col">
                  <input
                    name="email"
                    type="email"
                    className="focus:ring-secondary focus:border-secondary"
                    placeholder="Email"
                    {...email}
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  type="submit"
                  className="bg-accent text-white p-3 hover:bg-accent/80"
                >
                  Update Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
