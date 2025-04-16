import React from "react";
import { Link } from "react-router-dom";

const NoOffers: React.FC = () => {
  return (
    <div className="p-10 text-center mx-4 my-6">
      <h2 className="text-3xl font-bold text-[#5b21b6] mb-4">No Offers Yet!</h2>

      <div className="px-6 py-2 mb-6">
        <p className="text-lg text-neutral-700 mb-3">
          There are no offers available at this time, but you can be the first!
        </p>

        <div className="flex flex-col md:flex-row justify-center items-center gap-4 mt-6">
          <Link to="/create-offer" className="bg-[#6d28d9] hover:bg-[#5b21b6] text-white px-6 py-2 rounded-md font-medium transition-colors">
            Create Your Offer
          </Link>

          <a
            href="https://t.me/Panmoni/802"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#0088cc] hover:bg-[#0077b5] text-white px-6 py-2 rounded-md font-medium transition-colors"
          >
            Join Telegram Group
          </a>
        </div>
      </div>

      <div className="mt-4 p-3">
        <p className="text-neutral-700 italic">
          <span className="text-[#5b21b6] font-medium">¿Hablas Español?</span> Con gusto te ayudamos en Español también.
        </p>
        <a
          href="https://t.me/Panmoni/804"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 text-[#0088cc] hover:text-[#0077b5] font-medium underline"
        >
          Grupo de Telegram en Español
        </a>
      </div>
    </div>
  );
};

export default NoOffers;
