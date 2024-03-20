// @/app/page.tsx

"use client";

import React from "react";
import Container from "@/components/blog/container";
import { PageTitle } from "@/components/ui/PageTitle";
import Image from "next/image";
import Link from "next/link";

import slide1 from "@/public/assets/slides/1.png";
import slide2 from "@/public/assets/slides/2.png";
import slide3 from "@/public/assets/slides/3.png";
import slide4 from "@/public/assets/slides/4.png";
import slide5 from "@/public/assets/slides/5.png";

// import { AccountForm, Inputs } from "@/components/contracts/accountForm";
// import { InterfaceVpcEndpointAttributes } from "aws-cdk-lib/aws-ec2";

// TODO: Add app page

const App = () => {
  return (
    <main>
      <Container>
        <PageTitle title="App" />
        <div className="my-12 space-y-8 max-w-2xl mx-auto">
          <h3 className="text-2xl font-semibold">Watch the Demo Video</h3>

          <iframe
            width="720"
            height="405"
            src="https://www.youtube.com/embed/uFS4gxSHbZI?si=UYKxbUidkErP4fyL"
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>

          <p className="text-lg leading-relaxed mb-4">
            <a target="_blank" href="">
              Or click here to watch it on YouTube.
            </a>
          </p>

          <h3 className="text-2xl font-semibold">Test out the Demo!</h3>
          <ol className="list-decimal	list-outside	pl-5 space-y-6 text-lg">
            <li>
              Install{" "}
              <a
                target="_blank"
                className="font-bold"
                href="https://metamask.io/"
              >
                Metamask
              </a>
              .
            </li>
            <li>
              Switch to the <span className="font-bold">Sepolia testnet</span>.
              Click the top left Network button in Metamask. Toggle Show test
              networks. Select Sepolia.
            </li>
            <li>
              Get some <span className="font-bold">SEP</span> (Sepolia testnet
              ETH) from{" "}
              <a
                target="_blank"
                href="https://www.alchemy.com/faucets/ethereum-sepolia"
              >
                Alchemy
              </a>
              ,{" "}
              <a target="_blank" href="https://www.infura.io/faucet/sepolia">
                Infura
              </a>
              ,{" "}
              <a target="_blank" href="https://sepolia-faucet.pk910.de/">
                pk910.de
              </a>
              , or{" "}
              <a
                target="_blank"
                href="https://faucet.quicknode.com/ethereum/sepolia"
              >
                Quicknode
              </a>
              .
            </li>
            <li>
              Visit{" "}
              <a target="_blank" href="https://YapBay.com/app/">
                YapBay.com/app
              </a>{" "}
              and
              <span className="font-bold"> connect your wallet</span> below the
              navbar.
            </li>
            <li>
              <a target="_blank" href="https://YapBay.com/app/register">
                <span className="font-bold">Register</span> a user with the
                YapBay Account contract at /app/register.
              </a>
            </li>
            <li>
              <a target="_blank" href="https://YapBay.com/app/profile">
                View and edit your user profile at /app/profile, if you like.
              </a>
            </li>
            <li>
              <a target="_blank" href="https://YapBay.com/app/offers/create">
                <span className="font-bold">Create an offer</span> with the
                YapBay Offer contract at /app/offers/create, if you like.
              </a>
            </li>
            <li>
              <a target="_blank" href="https://YapBay.com/app/offers">
                View all offers and edit your offers at /app/offers
              </a>
            </li>
            <li>
              Select a Buy Offer (first) and then a Sell Offer. Click the Chain
              Offers button to{" "}
              <span className="font-bold">create a Chained Trade</span>, or
              fiat-to-fiat (F2F) remittance!
            </li>
            <li>
              <span className="font-bold">See below</span> to get an idea of the
              trade flow after creating the Chained Trade / Remittance.
            </li>
          </ol>

          <h3 className="text-2xl font-semibold">Deck Slides</h3>
          <p className="text-lg leading-relaxed mb-4">
            Here is the trade (remittance) flow after creating the chained
            trade.
          </p>

          <Link href="/assets/slides/1.png" target="_blank">
            <Image
              className="border-black border rounded-lg my-4"
              src={slide1}
              alt="Slide 1"
              width={800}
              height={450}
            />
          </Link>
          <Link href="/assets/slides/2.png" target="_blank">
            <Image
              className="border-black border rounded-lg my-4"
              src={slide2}
              alt="Slide 2"
              width={800}
              height={450}
            />
          </Link>
          <Link href="/assets/slides/3.png" target="_blank">
            <Image
              className="border-black border rounded-lg my-4"
              src={slide3}
              alt="Slide 3"
              width={800}
              height={450}
            />
          </Link>
          <Link href="/assets/slides/4.png" target="_blank">
            <Image
              className="border-black border rounded-lg my-4"
              src={slide4}
              alt="Slide 4"
              width={800}
              height={450}
            />
          </Link>
          <Link href="/assets/slides/5.png" target="_blank">
            <Image
              className="border-black border rounded-lg my-4"
              src={slide5}
              alt="Slide 5"
              width={800}
              height={450}
            />
          </Link>

          <p className="text-lg leading-relaxed mb-4">
            <Link href="/assets/slides/YapBayDeck.pdf" target="_blank">
              Or download the PDF.
            </Link>
          </p>
        </div>
      </Container>
    </main>
  );
};

export default App;
