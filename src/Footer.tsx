import React from 'react';
import { Link } from "react-router-dom";
import Container from './components/Container';
import StatusBadge from "./components/StatusBadge";
import { Twitter, Github, MessageCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="site-footer">
      <Container>
        <div className="footer-container">
          <div className="footer-section flex items-center justify-center text-center">
            <div className="footer-nav flex flex-col items-center">
              <Link to="/" className="text-xl sm:text-2xl text-purple-700 flex items-center gap-2">
                <img
                  src="/logo.png"
                  alt="LocalSolana Logo"
                  className="h-4 sm:h-6 md:h-10 lg:h-12 w-auto max-h-12 mx-auto"
                  loading="lazy"
                />
                <StatusBadge />
                <h4 className="font-black text-purple-800 mb-2 sm:mb-4">LocalSolana</h4>
              </Link>
              <p className="text-sm">Buy and sell USDC on Solana P2P anywhere, anyhow</p>
            </div>
          </div>

          <div className="footer-section">
            <h3 className="footer-title">Quick Links</h3>
            <nav className="footer-nav">
              <a target="_blank" href="https://LocalSolana.com/" rel="noopener noreferrer">Features</a>
              <a target="_blank" href="https://localsolana.com/about/" rel="noopener noreferrer">About</a>
              <a target="_blank" href="https://LocalSolana.com/blog" rel="noopener noreferrer">Blog</a>
              <a target="_blank" href="https://localsolana.com/roadmap/" rel="noopener noreferrer">Roadmap</a>
            </nav>
          </div>

          <div className="footer-section">
            <h3 className="footer-title">Legal</h3>
            <nav className="footer-nav">
              <a target="_blank" href="https://LocalSolana.com/terms" rel="noopener noreferrer">Terms of Service</a>
              <a target="_blank" href="https://LocalSolana.com/privacy" rel="noopener noreferrer">Privacy Policy</a>
              <a target="_blank" href="https://localsolana.com/disclaimer" rel="noopener noreferrer">Disclaimer</a>
            </nav>
          </div>

          <div className="footer-section">
            <h3 className="footer-title">Connect</h3>

            <p>
              <a target="_blank" href="https://getwaitlist.com/waitlist/19781" rel="noopener noreferrer">Get on the Waitlist</a>
            </p>

            <p>
              <a className="!font-normal" href="mailto:hello@panmoni.com">hello@panmoni.com</a>
            </p>



            <div className="social-links">
              <a
                href="https://x.com/localsolana"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X (Twitter)"
                className="flex items-center"
              >
                <Twitter size={20} className="text-purple-700 hover:text-purple-800" />
              </a>
              <a
                href="https://github.com/Panmoni/localsolana"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="flex items-center"
              >
                <Github size={20} className="text-purple-700 hover:text-purple-800" />
              </a>
              <a
                href="https://t.me/Panmoni/802"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
                className="flex items-center"
              >
                <MessageCircle size={20} className="text-purple-700 hover:text-purple-800" />
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="mb-2">We welcome you for discussion and support in our <a href="https://t.me/Panmoni/802" target='_blank' rel="noopener noreferrer">Telegram</a> group.</p>
          <p className="mb-4">Te damos la bienvenida para soporte en Español en <a href="https://t.me/Panmoni/804" target='_blank' rel="noopener noreferrer">Telegram</a>.</p>
          <p>&copy; {new Date().getFullYear()} A <a className="panmoni-link" href="https://panmoni.com" target='_blank' rel="noopener noreferrer">Panmoni</a> project</p>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
