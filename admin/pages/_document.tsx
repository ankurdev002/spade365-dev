import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
    return (
        <Html lang='en'>
            <Head />
            <body className='bg-lightGrey text-black overflow-x-hidden'>
                {/* <div className='bg-spade-gradient'> */}
                <Main />
                {/* </div> */}
                <NextScript />
            </body>
        </Html>
    )
}