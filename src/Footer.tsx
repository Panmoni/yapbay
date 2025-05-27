import React from 'react';
import { Link } from 'react-router-dom';
import Container from '@/components/Shared/Container';
import StatusBadge from '@/components/Shared/StatusBadge';

export const Footer: React.FC = () => {
  return (
    <footer className="site-footer">
      <Container>
        <div className="footer-container">
          <div className="footer-section flex items-center justify-center text-center">
            <div className="footer-nav flex flex-col items-center">
              <Link to="/" className="text-xl sm:text-2xl text-primary-700 flex items-center gap-2">
                <img
                  src="/logo.png"
                  alt="YapBay Logo"
                  className="h-4 sm:h-6 md:h-10 lg:h-12 w-auto max-h-12 mx-auto rounded-full"
                  loading="lazy"
                />
                <h4 className="font-black text-primary-800 my-1">YapBay</h4>
                <StatusBadge />
              </Link>
              <p className="text-sm">Buy, sell and remit USDC on Celo L2 P2P anywhere, anyhow</p>
            </div>
          </div>

          <div className="footer-section">
            <h3 className="footer-title">About</h3>
            <nav className="footer-nav">
              <a target="_blank" href="https://yapbay.com/" rel="noopener noreferrer">
                Features
              </a>
              <a target="_blank" href="https://yapbay.com/about/" rel="noopener noreferrer">
                About
              </a>
              <a target="_blank" href="https://yapbay.com/blog" rel="noopener noreferrer">
                Blog
              </a>
              <a target="_blank" href="https://yapbay.com/roadmap/" rel="noopener noreferrer">
                Roadmap
              </a>
            </nav>
          </div>

          <div className="footer-section">
            <h3 className="footer-title">Legal</h3>
            <nav className="footer-nav">
              <a target="_blank" href="https://yapbay.com/terms" rel="noopener noreferrer">
                Terms of Service
              </a>
              <a target="_blank" href="https://yapbay.com/privacy" rel="noopener noreferrer">
                Privacy Policy
              </a>
              <a target="_blank" href="https://yapbay.com/disclaimer" rel="noopener noreferrer">
                Disclaimer
              </a>
            </nav>
          </div>

          <div className="footer-section">
            <h3 className="footer-title">Connect</h3>

            <p>
              <a
                target="_blank"
                href="https://getwaitlist.com/waitlist/17774"
                rel="noopener noreferrer"
              >
                Get on the Waitlist
              </a>
            </p>

            <p className="mt-2">
              <a className="!font-normal" href="mailto:hello@panmoni.com">
                hello@panmoni.com
              </a>
            </p>

            <div className="social-links">
              <a
                href="https://x.com/yapbay_"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X (Twitter)"
                className="flex items-center"
              >
                <svg
                  className="text-primary-700 hover:text-primary-800 w-5 h-5"
                  role="img"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <title>X</title>
                  <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                </svg>
              </a>
              <a
                href="https://github.com/Panmoni/yapbay"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="flex items-center"
              >
                <svg
                  className="text-primary-700 hover:text-primary-800 w-5 h-5"
                  role="img"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <title>GitHub</title>
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
              </a>
              <a
                href="https://t.me/Panmoni/288"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
                className="flex items-center"
              >
                <svg
                  className="text-primary-700 hover:text-primary-800 w-5 h-5"
                  role="img"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <title>Telegram</title>
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
              </a>
              <a
                href="mailto:hello@panmoni.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Email"
                className="flex items-center"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-primary-700 hover:text-primary-800 w-6 h-6"
                >
                  <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                  <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                  <g id="SVGRepo_iconCarrier">
                    {' '}
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M3.75 5.25L3 6V18L3.75 18.75H20.25L21 18V6L20.25 5.25H3.75ZM4.5 7.6955V17.25H19.5V7.69525L11.9999 14.5136L4.5 7.6955ZM18.3099 6.75H5.68986L11.9999 12.4864L18.3099 6.75Z"
                      fill="#080341"
                    ></path>{' '}
                  </g>
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="mb-2">
            This is beta software running on Celo Mainnet and the Alfajores testnet. Trades are
            limited to 100 CELO per transaction.
          </p>
          <p className="mb-2">To test on Celo Mainnet, you'll need CELO and USDC.</p>
          <p className="mb-2">
            Get{' '}
            <a href="https://faucet.celo.org/alfajores" target="blank">
              testnet CELO
            </a>{' '}
            and{' '}
            <a href="https://faucet.circle.com/" target="blank">
              Celo Alfajores USDC
            </a>{' '}
            in order to create test transactions on the Alfajores testnet.
          </p>
          <p className="mb-2">
            We welcome you for discussion and support in our{' '}
            <a href="https://t.me/Panmoni/288" target="_blank" rel="noopener noreferrer">
              Telegram
            </a>{' '}
            group.
          </p>
          <p className="mb-4">
            Te damos la bienvenida para soporte en Español en{' '}
            <a href="https://t.me/Panmoni/291" target="_blank" rel="noopener noreferrer">
              Telegram
            </a>
            .
          </p>
          <p>
            &copy; 2023-{new Date().getFullYear()} A{' '}
            <a className="panmoni-link" href="https://panmoni.com" target="_blank" rel="noopener">
              Panmoni
              <img
                src="/panmoni.svg"
                alt="Panmoni Logo"
                className="w-4 h-4 inline ml-1 align-middle"
              />
            </a>{' '}
            project
          </p>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
