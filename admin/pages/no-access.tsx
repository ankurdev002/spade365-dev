import Head from "next/head";

export default function NoAccess() {
    return (
        <>
            <Head>
                <title>NoAccess | Spade365</title>
                <meta name="description" content="NoAccess | Spade365" />
            </Head>
            <div className="flex flex-col justify-center items-center min-h-[70vh] w-full mx-auto overflow-hidden">
                <h1 className="text-center md:text-left text-4xl lg:text-5xl my-6">
                    NoAccess
                </h1>
                <div className="flex flex-col justify-start items-center w-full">
                    <h2>You don&apos;t have access to this page</h2>
                    <p>Please contact an admin or your supervisor to give you access.</p>
                </div>
            </div>
        </>
    );
}
