"use client";

import React, { useState } from "react";

import Link from "next/link";
import Image from "next/image";

const GlobalHeader = () => {
  const [isOpen, setIsOpen] = useState(false);

  const closeMobileMenu = () => {
    setIsOpen(false);
  };

  return (
    <header>
      <nav aria-label="Main Navigation">
        <div className="px-4 py-4 flex items-center mx-auto justify-center my-4">
          {/* Logo - always show */}
          <Link href="/" aria-label="Home" passHref>
            <Image
              src="/yapbaylogo.png"
              width={36}
              height={36}
              alt="Yap Bay"
              priority={true}
              className="cursor-pointer max-w-none"
            />
          </Link>

          <h1 className="text-2xl ml-1 mr-4 font-bold uppercase">
            <Link href="/" aria-label="Home" passHref>
              YapBay
            </Link>
          </h1>

          {/* Primary Nav Menu */}
          <div className="items-center space-x-1 hidden md:flex">
            <Link href="/app" passHref>
              <span className="py-5 px-3 cursor-pointer whitespace-nowrap text-lg">
                App
              </span>
            </Link>
            <Link href="/blog" passHref>
              <span className="py-5 px-3 cursor-pointer whitespace-nowrap text-lg">
                Blog
              </span>
            </Link>
            <Link href="/about" passHref>
              <span className="py-5 px-3 cursor-pointer whitespace-nowrap text-lg">
                About
              </span>
            </Link>
            <Link href="/roadmap" passHref>
              <span className="py-5 px-3 cursor-pointer whitespace-nowrap text-lg">
                Roadmap
              </span>
            </Link>
            <Link href="/contact" passHref>
              <span className="py-5 px-3 cursor-pointer whitespace-nowrap text-lg">
                Contact
              </span>
            </Link>
          </div>
          {/* Primary Nav Menu */}

          {/* Hamburger Menu Button */}
          <div className="md:hidden flex items-center ml-2">
            <button aria-label="Open Menu" onClick={() => setIsOpen(!isOpen)}>
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`${
            isOpen ? "flex" : "hidden"
          } md:hidden flex-col items-center justify-center bg-midnight w-1/2 mx-auto border border-muted shadow-md p-4`}
        >
          <Link href="/app">
            <span
              onClick={closeMobileMenu}
              className="block py-2 px-4 text-sm hover:bg-secondary cursor-pointer"
            >
              App
            </span>
          </Link>
          <Link href="/blog" passHref>
            <span
              onClick={closeMobileMenu}
              className="block py-2 px-4 text-sm hover:bg-secondary cursor-pointer"
            >
              Blog
            </span>
          </Link>
          <Link href="/about" passHref>
            <span
              onClick={closeMobileMenu}
              className="block py-2 px-4 text-sm hover:bg-secondary cursor-pointer"
            >
              About
            </span>
          </Link>
          <Link href="/roadmap" passHref>
            <span
              onClick={closeMobileMenu}
              className="block py-2 px-4 text-sm hover:bg-secondary cursor-pointer"
            >
              Roadmap
            </span>
          </Link>
          <Link href="/contact" passHref>
            <span
              onClick={closeMobileMenu}
              className="block py-2 px-4 text-sm hover:bg-secondary cursor-pointer"
            >
              Contact
            </span>
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default GlobalHeader;
