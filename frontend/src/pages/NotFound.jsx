import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="max-w-sm mx-auto mt-20 px-4 text-center">
      <p className="text-5xl font-bold text-amber-500 mb-2">404</p>
      <h1 className="text-lg font-bold mb-2">Page introuvable</h1>
      <p className="text-sm text-gray-500 mb-6">
        La page que tu cherches n'existe pas ou a été déplacée.
      </p>
      <Link
        to="/"
        className="inline-block bg-[#1E1B2E] text-white px-6 py-2 rounded-md font-medium hover:bg-amber-500 hover:text-[#1E1B2E] transition"
      >
        Retour au catalogue
      </Link>
    </div>
  );
}

export default NotFound;
