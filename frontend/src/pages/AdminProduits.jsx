import { useEffect, useState } from 'react';
import { Upload as UploadIcon } from 'lucide-react';
import api from '../services/api';
import { formaterPrix } from '../utils/format';

function AdminProduits() {
  const [produits, setProduits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [marques, setMarques] = useState([]);
  const [modalOuverte, setModalOuverte] = useState(false);
  const [produitEnEdition, setProduitEnEdition] = useState(null);
  const [fichierImage, setFichierImage] = useState(null);
  const [form, setForm] = useState({ nom_prod: '', description_prod: '', prix_prod: '', stock_prod: '', categorie_id: '', marque_id: '' });

  const charger = () => {
    api.get('produits/').then((res) => setProduits(res.data));
    api.get('categories/').then((res) => setCategories(res.data));
    api.get('marques/').then((res) => setMarques(res.data));
  };

  useEffect(() => { charger(); }, []);

  const ouvrirCreation = () => {
    setProduitEnEdition(null);
    setFichierImage(null);
    setForm({ nom_prod: '', description_prod: '', prix_prod: '', stock_prod: '', categorie_id: '', marque_id: '' });
    setModalOuverte(true);
  };

  const ouvrirEdition = (produit) => {
    setProduitEnEdition(produit);
    setFichierImage(null);
    setForm({
      nom_prod: produit.nom_prod,
      description_prod: produit.description_prod,
      prix_prod: produit.prix_prod,
      stock_prod: produit.stock_prod,
      categorie_id: produit.categorie.id_cat,
      marque_id: produit.marque.id_marq,
    });
    setModalOuverte(true);
  };

  const enregistrer = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('nom_prod', form.nom_prod);
    formData.append('description_prod', form.description_prod || '');
    formData.append('prix_prod', form.prix_prod);
    formData.append('stock_prod', form.stock_prod);
    formData.append('categorie_id', form.categorie_id);
    formData.append('marque_id', form.marque_id);
    if (fichierImage) formData.append('image_prod', fichierImage);

    try {
      if (produitEnEdition) {
        await api.patch(`produits/${produitEnEdition.id_prod}/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('produits/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setModalOuverte(false);
      charger();
    } catch (err) {
      console.error(err);
    }
  };

  const supprimer = async (id) => {
    if (!confirm('Supprimer ce produit ?')) return;
    await api.delete(`produits/${id}/`);
    charger();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Gestion des produits</h1>
        <button onClick={ouvrirCreation} className="bg-[#1E1B2E] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-amber-500 hover:text-[#1E1B2E] transition">
          Nouveau produit
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Nom</th>
              <th className="p-3">Prix</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Catégorie</th>
              <th className="p-3">Marque</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {produits.map((p) => (
              <tr key={p.id_prod} className="border-t border-gray-100">
                <td className="p-3">{p.nom_prod}</td>
                <td className="p-3">{formaterPrix(p.prix_prod)}</td>
                <td className="p-3">{p.stock_prod}</td>
                <td className="p-3">{p.categorie.nom_cat}</td>
                <td className="p-3">{p.marque.nom_marq}</td>
                <td className="p-3 space-x-2">
                  <button onClick={() => ouvrirEdition(p)} className="text-amber-600 hover:underline">Modifier</button>
                  <button onClick={() => supprimer(p.id_prod)} className="text-red-600 hover:underline">Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOuverte && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setModalOuverte(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{produitEnEdition ? 'Modifier le produit' : 'Nouveau produit'}</h2>
            <form onSubmit={enregistrer} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Nom</label>
                <input required value={form.nom_prod} onChange={(e) => setForm({ ...form, nom_prod: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={form.description_prod} onChange={(e) => setForm({ ...form, description_prod: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Prix</label>
                <input required type="number" value={form.prix_prod} onChange={(e) => setForm({ ...form, prix_prod: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Stock</label>
                <input required type="number" value={form.stock_prod} onChange={(e) => setForm({ ...form, stock_prod: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Catégorie</label>
                <select required value={form.categorie_id} onChange={(e) => setForm({ ...form, categorie_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                  <option value="">Choisir...</option>
                  {categories.map((c) => <option key={c.id_cat} value={c.id_cat}>{c.nom_cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Marque</label>
                <select required value={form.marque_id} onChange={(e) => setForm({ ...form, marque_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                  <option value="">Choisir...</option>
                  {marques.map((m) => <option key={m.id_marq} value={m.id_marq}>{m.nom_marq}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Image</label>
                <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm cursor-pointer hover:bg-gray-50 w-fit">
                  <UploadIcon size={16} /> Choisir une image
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setFichierImage(e.target.files[0])} />
                </label>
                {fichierImage && <p className="text-xs text-gray-500 mt-1">{fichierImage.name}</p>}
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

export default AdminProduits;