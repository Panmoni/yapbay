import Link from "next/link";

export default function GlobalFooter() {
  return (
    <footer className="text-center text-sm text-slate bg-slate-100 py-6">
      <nav className="flex flex-wrap justify-center">
        <div className="px-5 py-2">
          <Link href="/app" className="text-base leading-6 no-underline">
            App
          </Link>
        </div>

        <div className="px-5 py-2">
          <Link href="/blog" className="text-base leading-6 no-underline">
            Blog
          </Link>
        </div>

        <div className="px-5 py-2">
          <Link href="/about" className="text-base leading-6 no-underline">
            About
          </Link>
        </div>

        <div className="px-5 py-2">
          <Link href="/roadmap" className="text-base leading-6 no-underline">
            Roadmap
          </Link>
        </div>

        <div className="px-5 py-2">
          <Link href="/contact" className="text-base leading-6 no-underline">
            Contact
          </Link>
        </div>
        <div className="px-5 py-2">
          <Link href="/tos" className="text-base leading-6 no-underline">
            Terms
          </Link>
        </div>
        <div className="px-5 py-2">
          <Link
            href="/tos#privacy"
            className="text-base leading-6 no-underline"
          >
            Privacy
          </Link>
        </div>
      </nav>

      <div className="flex justify-center mt-4 mb-6 space-x-6">
        <a href="mailto:hello@yapbay.com" className="no-underline">
          hello@yapbay.com
        </a>
      </div>
      <div className="flex justify-center my-4 space-x-6">
        <Link
          target="_blank"
          rel="noopener noreferrer"
          href="https://twitter.com/yapbay_"
          className="text-slate hover:text-accent"
        >
          <span className="sr-only">X</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            shapeRendering="geometricPrecision"
            textRendering="geometricPrecision"
            imageRendering="optimizeQuality"
            fillRule="evenodd"
            clipRule="evenodd"
            viewBox="0 0 512 512"
            className="w-6 h-6"
            aria-hidden="true"
            fill="currentColor"
          >
            <path d="M256 0c141.385 0 256 114.615 256 256S397.385 512 256 512 0 397.385 0 256 114.615 0 256 0z" />
            <path
              fill="#fff"
              fillRule="nonzero"
              d="M318.64 157.549h33.401l-72.973 83.407 85.85 113.495h-67.222l-52.647-68.836-60.242 68.836h-33.423l78.052-89.212-82.354-107.69h68.924l47.59 62.917 55.044-62.917zm-11.724 176.908h18.51L205.95 176.493h-19.86l120.826 157.964z"
            />
          </svg>
        </Link>
        <Link
          target="_blank"
          rel="noopener noreferrer"
          href="https://chat.whatsapp.com/EIczBVMiMTtCsiknBjtDrK"
          className="text-slate hover:text-accent"
        >
          <span className="sr-only">WhatsApp</span>
          <svg
            className="w-6 h-6"
            xmlns="http://www.w3.org/2000/svg"
            x="0px"
            y="0px"
            width="100"
            height="100"
            viewBox="0 0 50 50"
          >
            <path d="M25,2C12.318,2,2,12.318,2,25c0,3.96,1.023,7.854,2.963,11.29L2.037,46.73c-0.096,0.343-0.003,0.711,0.245,0.966 C2.473,47.893,2.733,48,3,48c0.08,0,0.161-0.01,0.24-0.029l10.896-2.699C17.463,47.058,21.21,48,25,48c12.682,0,23-10.318,23-23 S37.682,2,25,2z M36.57,33.116c-0.492,1.362-2.852,2.605-3.986,2.772c-1.018,0.149-2.306,0.213-3.72-0.231 c-0.857-0.27-1.957-0.628-3.366-1.229c-5.923-2.526-9.791-8.415-10.087-8.804C15.116,25.235,13,22.463,13,19.594 s1.525-4.28,2.067-4.864c0.542-0.584,1.181-0.73,1.575-0.73s0.787,0.005,1.132,0.021c0.363,0.018,0.85-0.137,1.329,1.001 c0.492,1.168,1.673,4.037,1.819,4.33c0.148,0.292,0.246,0.633,0.05,1.022c-0.196,0.389-0.294,0.632-0.59,0.973 s-0.62,0.76-0.886,1.022c-0.296,0.291-0.603,0.606-0.259,1.19c0.344,0.584,1.529,2.493,3.285,4.039 c2.255,1.986,4.158,2.602,4.748,2.894c0.59,0.292,0.935,0.243,1.279-0.146c0.344-0.39,1.476-1.703,1.869-2.286 s0.787-0.487,1.329-0.292c0.542,0.194,3.445,1.604,4.035,1.896c0.59,0.292,0.984,0.438,1.132,0.681 C37.062,30.587,37.062,31.755,36.57,33.116z"></path>
          </svg>
        </Link>
        <Link
          target="_blank"
          rel="noopener noreferrer"
          href="https://github.com/Panmoni/yapbay"
          className="text-slate hover:text-accent"
        >
          <span className="sr-only">GitHub</span>
          <svg
            className="w-6 h-6"
            aria-hidden="true"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              fillRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              clipRule="evenodd"
            ></path>
          </svg>
        </Link>
        <Link
          target="_blank"
          rel="noopener noreferrer"
          href="https://t.me/YapBay"
          className="text-slate hover:text-accent"
        >
          <span className="sr-only">Telegram</span>
          <svg
            className="w-6 h-6"
            aria-hidden="true"
            fill="currentColor"
            viewBox="0 0 32 32"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g id="SVGRepo_tracerCarrier"></g>
            <g id="SVGRepo_iconCarrier">
              {" "}
              <title>telegram</title>{" "}
              <path d="M22.122 10.040c0.006-0 0.014-0 0.022-0 0.209 0 0.403 0.065 0.562 0.177l-0.003-0.002c0.116 0.101 0.194 0.243 0.213 0.403l0 0.003c0.020 0.122 0.031 0.262 0.031 0.405 0 0.065-0.002 0.129-0.007 0.193l0-0.009c-0.225 2.369-1.201 8.114-1.697 10.766-0.21 1.123-0.623 1.499-1.023 1.535-0.869 0.081-1.529-0.574-2.371-1.126-1.318-0.865-2.063-1.403-3.342-2.246-1.479-0.973-0.52-1.51 0.322-2.384 0.221-0.23 4.052-3.715 4.127-4.031 0.004-0.019 0.006-0.040 0.006-0.062 0-0.078-0.029-0.149-0.076-0.203l0 0c-0.052-0.034-0.117-0.053-0.185-0.053-0.045 0-0.088 0.009-0.128 0.024l0.002-0.001q-0.198 0.045-6.316 4.174c-0.445 0.351-1.007 0.573-1.619 0.599l-0.006 0c-0.867-0.105-1.654-0.298-2.401-0.573l0.074 0.024c-0.938-0.306-1.683-0.467-1.619-0.985q0.051-0.404 1.114-0.827 6.548-2.853 8.733-3.761c1.607-0.853 3.47-1.555 5.429-2.010l0.157-0.031zM15.93 1.025c-8.302 0.020-15.025 6.755-15.025 15.060 0 8.317 6.742 15.060 15.060 15.060s15.060-6.742 15.060-15.060c0-8.305-6.723-15.040-15.023-15.060h-0.002q-0.035-0-0.070 0z"></path>{" "}
            </g>
          </svg>
        </Link>
      </div>
      <p className="my-4 text-base leading-6 text-center">
        A&nbsp;
        <Link
          href="https://www.panmoni.com/"
          target="_blank"
          rel="noopener noreferrer"
          title="Panmoni is a Web3 product studio"
          className="unset gradient-link tracking-wider font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#00abda] to-[#1476ff] hover:after:bg-gradient-to-r hover:after:from-[#00abda] hover:after:to-[#1476ff] astro-C44LKZXB"
        >
          Panmoni
        </Link>{" "}
        project. | version 0.0.1 (alpha)
      </p>
      <p>
        <strong>Disclaimer</strong>: YapBay is alpha software under active
        development. Use at your own risk.
      </p>
      <p className="mt-4">
        Powered by Sepolia testnet, Alchemy Platform, RainbowKit, Next.js,
        Ethers.js, Hardhat, TailwindCSS, Typescript, the CoinGecko API and
        Vercel.
      </p>
    </footer>
  );
}
