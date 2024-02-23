import Image from "next/image";
import yapbaylogo from "@/public/yapbaylogo.png";
import Container from "@/components/blog/container";

export default function Home() {
  return (
    <main>
      <Container>
        <Image
          src={yapbaylogo}
          height={256}
          width={256}
          alt="YapBay logo"
          className="mx-auto mb-4"
        />
        <h2 className="text-4xl font-bold tracking-tighter sm:text-6xl mb-4 text-center">
          Welcome to Yap Bay
        </h2>
        <p className="mx-auto max-w-2xl text-gray-500 md:text-xl lg:text-base xl:text-xl dark:text-gray-400 mb-4">
          YapBay is an uncensorable P2P remittance marketplace that supports
          both fiat currency and cryptocurrency. Currently in development.
        </p>
        <p className="mx-auto max-w-2xl text-gray-500 md:text-xl lg:text-base xl:text-xl dark:text-gray-400 mb-4">
          During February and March 2024, YapBay is building with{" "}
          <a href="https://backdropbuild.com/" target="_blank">
            BackdropBuild
          </a>
          !
        </p>
      </Container>
    </main>
  );
}
