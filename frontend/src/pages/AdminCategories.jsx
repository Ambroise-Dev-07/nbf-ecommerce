import { useEffect, useState } from 'react';
import api from '../services/api';
import { extraireErreur } from '../utils/erreur';

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [modalOuverte, setModalOuverte] = useState(false);
  const [categorieEnEdition, setCategorieEnEdition] = useState(null);
  const [erreur, setErreur] = useState('');
  const [form, setForm] = useState({ nom_cat: '', description_cat: '' });

  const charger = () => {
    api.get('categories/').then((res) => setCategories(res.data));
  };

  useEffect(() => { charger(); }, []);

  const ouvrirCreation = () => {
    setCategorieEnEdition(null);
    setErreur('');
    setForm({ nom_cat: '', description_cat: '' });
    setModalOuverte(true);
  };

  const ouvrirEdition = (categorie) => {
    setCategorieEnEdition(categorie);
    setErreur('');
    setForm({ nom_cat: categorie.nom_cat, description_cat: categorie.description_cat });
    setModalOuverte(true);
  };

  const enregistrer = async (e) => {
    e.preventDefault();
    try {
      if (categorieEnEdition) {
        await api.put(`categories/${categorieEnEdition.id_cat}/`, form);
      } else {
        await api.post('categories/', form);
      }
      setModalOuverte(false);
      setErreur('');
      charger();
    } catch (err) {
      setErreur(extraireErreur(err, "Impossible d'enregistrer la catégorie."));
    }
  };

  const supprimer = async (id) => {
    if (!confirm('Supprimer cette catégorie ?')) return;
    try {
      await api.delete(`categories/${id}/`);
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
        <h1 className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Gestion des catégories</h1>
        <button onClick={ouvrirCreation} className="bg-[#1E1B2E] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-amber-500 hover:text-[#1E1B2E] transition">
          Nouvelle catégorie
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
            {categories.map((c) => (
              <tr key={c.id_cat} className="border-t border-gray-100">
                <td className="p-3">{c.nom_cat}</td>
                <td className="p-3">{c.description_cat}</td>
                <td className="p-3 space-x-2">
                  <button onClick={() => ouvrirEdition(c)} className="text-amber-600 hover:underline">Modifier</button>
                  <button onClick={() => supprimer(c.id_cat)} className="text-red-600 hover:underline">Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOuverte && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setModalOuverte(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{categorieEnEdition ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h2>
            {erreur && (
              <div className="mb-3 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {erreur}
              </div>
            )}
            <form onSubmit={enregistrer} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Nom</label>
                <input required value={form.nom_cat} onChange={(e) => setForm({ ...form, nom_cat: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={form.description_cat} onChange={(e) => setForm({ ...form, description_cat: e.target.value })}
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

export default AdminCategories;