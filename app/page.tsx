import Image from "next/image";
import yapbaylogo from "@/public/yapbaylogo.png"
export default function Home() {
  return (
    <>
    <main className="text-center">
      <Image src={yapbaylogo} height={256} width={256} alt="YapBay logo" className="mx-auto mb-4" />
      <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl mb-4">
        Welcome to Yap Bay
      </h1>
      <p
        className="mx-auto max-w-2xl text-gray-500 md:text-xl lg:text-base xl:text-xl dark:text-gray-400 mb-4"
      >
        YapBay is an uncensorable P2P remittance marketplace that supports both fiat currency and cryptocurrency. Currently in development.
      </p>
      <p
        className="mx-auto max-w-2xl text-gray-500 md:text-xl lg:text-base xl:text-xl dark:text-gray-400 mb-4"
      >During February and March 2024, YapBay is building with <a href="https://backdropbuild.com/" target="_blank">BackdropBuild</a>!</p>
      <p
        className="mx-auto max-w-2xl text-gray-500 md:text-xl lg:text-base xl:text-xl dark:text-gray-400"
      >
        A&nbsp;
          <a
            href="https://www.panmoni.com/"
            target="_blank"
            rel="noopener noreferrer"
            title="Panmoni is a Web3 product studio"
            className="unset gradient-link tracking-wider font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#00abda] to-[#1476ff] hover:after:bg-gradient-to-r hover:after:from-[#00abda] hover:after:to-[#1476ff] astro-C44LKZXB"
          >
            Panmoni
          </a>{" "}
          project.
      </p>
    </main>
    <footer className="mt-4">
      <div className="flex justify-center gap-4">
        <a
          href="mailto:hello@yapbay.com"
          className="inline-flex items-center justify-center w-8 h-8 rounded-full shadow-sm hover:shadow"
        >
          <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="122.88px" height="78.607px" viewBox="0 0 122.88 78.607" enable-background="new 0 0 122.88 78.607" xmlSpace="preserve"><g><path fill-rule="evenodd" clip-rule="evenodd" d="M61.058,65.992l24.224-24.221l36.837,36.836H73.673h-25.23H0l36.836-36.836 L61.058,65.992L61.058,65.992z M1.401,0l59.656,59.654L120.714,0H1.401L1.401,0z M0,69.673l31.625-31.628L0,6.42V69.673L0,69.673z M122.88,72.698L88.227,38.045L122.88,3.393V72.698L122.88,72.698z"/></g></svg>
          <span className="sr-only">hello@yapbay.com</span>
        </a>
        <a
          href="https://twitter.com/yapbay_" target="_blank"
          className="inline-flex items-center justify-center w-8 h-8 rounded-full shadow-sm hover:shadow"
        >
          <svg xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" imageRendering="optimizeQuality" fill-rule="evenodd" clip-rule="evenodd" viewBox="0 0 512 509.64"><rect width="512" height="509.64" rx="115.61" ry="115.61"/><path fill="#fff" fill-rule="nonzero" d="M323.74 148.35h36.12l-78.91 90.2 92.83 122.73h-72.69l-56.93-74.43-65.15 74.43h-36.14l84.4-96.47-89.05-116.46h74.53l51.46 68.04 59.53-68.04zm-12.68 191.31h20.02l-129.2-170.82H180.4l130.66 170.82z"/></svg>
          <span className="sr-only">X</span>
        </a>
        
      </div>
    </footer>
    </>
  );
}
