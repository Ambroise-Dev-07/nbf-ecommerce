import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/auth';

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [erreur, setErreur] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setErreur('');
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setErreur('Identifiants incorrects');
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-10 sm:mt-20 px-4">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-xl font-bold mb-4">Connexion</h1>
        {erreur && <p className="text-red-600 text-sm mb-3">{erreur}</p>}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom d'utilisateur</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#1E1B2E] text-white py-2 rounded-md font-medium hover:bg-amber-500 hover:text-[#1E1B2E] transition"
          >
            Se connecter
          </button>
        </form>
        <p className="mt-4 text-sm text-center">
          Pas de compte ? <Link to="/register" className="text-amber-600 hover:underline">S'inscrire</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;