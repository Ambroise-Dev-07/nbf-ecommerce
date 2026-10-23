import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/auth';
import { extraireErreur } from '../utils/erreur';

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', telephone_user: '' });
  const [erreur, setErreur] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErreur('');
    try {
      await register(form);
      navigate('/login');
    } catch (err) {
      setErreur(
        extraireErreur(err, "Erreur lors de l'inscription. Vérifie tes informations.")
      );
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-10 sm:mt-20 px-4">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-xl font-bold mb-4">Inscription</h1>
        {erreur && <p className="text-red-600 text-sm mb-3">{erreur}</p>}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom d'utilisateur</label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mot de passe</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Téléphone</label>
            <input
              name="telephone_user"
              value={form.telephone_user}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#1E1B2E] text-white py-2 rounded-md font-medium hover:bg-amber-500 hover:text-[#1E1B2E] transition"
          >
            S'inscrire
          </button>
        </form>
        <p className="mt-4 text-sm text-center">
          Déjà un compte ? <Link to="/login" className="text-amber-600 hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;