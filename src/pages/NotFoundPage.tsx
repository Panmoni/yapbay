import React from 'react';
import { Link } from 'react-router-dom';
import Container from '@/components/Shared/Container';

const NotFoundPage: React.FC = () => {
  return (
    <Container className="text-center py-16">
      {' '}
      {/* Added padding */}
      <h1 className="text-6xl font-bold text-primary-700 mb-4">404</h1>
      <p className="text-2xl text-neutral-800 mb-8">Oops! Page Not Found</p>
      <p className="text-neutral-700 mb-8">
        The page you are looking for might have been removed, had its name changed, is temporarily
        unavailable or I'm afraid that you fat-fingered it, my friend.
      </p>
      <img
        src="/fatfinger.png"
        alt="A fat finger... perhaps yours?"
        className="mx-auto mb-8"
        style={{ maxWidth: '200px' }}
      />
      <Link
        to="/"
        className="inline-block px-6 py-3 bg-primary-700 text-white rounded-md hover:bg-primary-800 transition duration-300"
      >
        <span className="text-white">Go to Homepage</span>
      </Link>
      <p className="text-neutral-500 mt-8 text-xs">
        Photo by{' '}
        <a href="https://unsplash.com/@glencarrie?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">
          Glen Carrie
        </a>{' '}
        on{' '}
        <a href="https://unsplash.com/photos/persons-finger-with-white-background-UQ7TSF5YpJE?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">
          Unsplash
        </a>
      </p>
    </Container>
  );
};

export default NotFoundPage;
