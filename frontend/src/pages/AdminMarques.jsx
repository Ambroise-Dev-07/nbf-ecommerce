import { useEffect, useState } from 'react';
import api from '../services/api';
import { extraireErreur } from '../utils/erreur';

function AdminMarques() {
  const [marques, setMarques] = useState([]);
  const [modalOuverte, setModalOuverte] = useState(false);
  const [marqueEnEdition, setMarqueEnEdition] = useState(null);
  const [erreur, setErreur] = useState('');
  const [form, setForm] = useState({ nom_marq: '', description_marq: '' });

  const charger = () => {
    api.get('marques/').then((res) => setMarques(res.data));
  };

  useEffect(() => { charger(); }, []);

  const ouvrirCreation = () => {
    setMarqueEnEdition(null);
    setErreur('');
    setForm({ nom_marq: '', description_marq: '' });
    setModalOuverte(true);
  };

  const ouvrirEdition = (marque) => {
    setMarqueEnEdition(marque);
    setErreur('');
    setForm({ nom_marq: marque.nom_marq, description_marq: marque.description_marq });
    setModalOuverte(true);
  };

  const enregistrer = async (e) => {
    e.preventDefault();
    try {
      if (marqueEnEdition) {
        await api.put(`marques/${marqueEnEdition.id_marq}/`, form);
      } else {
        await api.post('marques/', form);
      }
      setModalOuverte(false);
      setErreur('');
      charger();
    } catch (err) {
      setErreur(extraireErreur(err, "Impossible d'enregistrer la marque."));
    }
  };

  const supprimer = async (id) => {
    if (!confirm('Supprimer cette marque ?')) return;
    try {
      await api.delete(`marques/${id}/`);
      setErreur('');
      charger();
    } catch (err) {
      setErreur(
        extraireErreur(err, 'Impossible de supprimer (des produits y sont peut-être liés).')
      );
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Gestion des marques</h1>
        <button onClick={ouvrirCreation} className="bg-[#1E1B2E] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-amber-500 hover:text-[#1E1B2E] transition">
          Nouvelle marque
        </button>
      </div>

      {erreur && !modalOuverte && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
          {erreur}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[500px]">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Nom</th>
              <th className="p-3">Description</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {marques.map((m) => (
              <tr key={m.id_marq} className="border-t border-gray-100">
                <td className="p-3">{m.nom_marq}</td>
                <td className="p-3">{m.description_marq}</td>
                <td className="p-3 space-x-2">
                  <button onClick={() => ouvrirEdition(m)} className="text-amber-600 hover:underline">Modifier</button>
                  <button onClick={() => supprimer(m.id_marq)} className="text-red-600 hover:underline">Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOuverte && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setModalOuverte(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{marqueEnEdition ? 'Modifier la marque' : 'Nouvelle marque'}</h2>
            {erreur && (
              <div className="mb-3 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {erreur}
              </div>
            )}
            <form onSubmit={enregistrer} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Nom</label>
                <input required value={form.nom_marq} onChange={(e) => setForm({ ...form, nom_marq: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={form.description_marq} onChange={(e) => setForm({ ...form, description_marq: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModalOuverte(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 py-2 rounded-md text-sm font-medium transition">
                  Annuler
                </button>
                <button type="submit" className="flex-1 bg-[#1E1B2E] text-white py-2 rounded-md text-sm font-medium hover:bg-amber-500 hover:text-[#1E1B2E] transition">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminMarques;