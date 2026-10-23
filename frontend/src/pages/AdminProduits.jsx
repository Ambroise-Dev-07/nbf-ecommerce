import { useEffect, useRef, useState } from 'react';
import { FileText, Printer, Upload as UploadIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formaterPrix } from '../utils/format';
import { extraireErreur } from '../utils/erreur';

const SEUIL_STOCK_FAIBLE = 5;

function AdminProduits() {
  const [produits, setProduits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [marques, setMarques] = useState([]);
  const [modalOuverte, setModalOuverte] = useState(false);
  const [produitEnEdition, setProduitEnEdition] = useState(null);
  const [fichierImage, setFichierImage] = useState(null);
  const [erreur, setErreur] = useState('');
  const [stockLocal, setStockLocal] = useState({});
  const [form, setForm] = useState({ nom_prod: '', description_prod: '', prix_prod: '', stock_prod: '', categorie_id: '', marque_id: '' });
  const minuteriesStock = useRef({});
  const stockEnAttente = useRef({});

  const charger = () => {
    api.get('produits/').then((res) => setProduits(res.data));
    api.get('categories/').then((res) => setCategories(res.data));
    api.get('marques/').then((res) => setMarques(res.data));
  };

  useEffect(() => {
    charger();

    const temporisateurs = minuteriesStock.current;
    const enAttente = stockEnAttente.current;
    return () => {
      Object.values(temporisateurs).forEach(clearTimeout);
      // Enregistre les stocks modifiés si l'on quitte la page avant la fin du délai.
      Object.entries(enAttente).forEach(([id, stock]) => {
        api.patch(`produits/${id}/`, { stock_prod: stock }).catch(() => {});
      });
    };
  }, []);

  const valeurStock = (produit) => stockLocal[produit.id_prod] ?? produit.stock_prod;

  const oublierStockLocal = (id) => {
    setStockLocal((prev) => {
      const suivant = { ...prev };
      delete suivant[id];
      return suivant;
    });
  };

  const appliquerStock = (produit, valeur) => {
    const stock = Math.max(Math.trunc(Number(valeur)) || 0, 0);

    setStockLocal((prev) => ({ ...prev, [produit.id_prod]: stock }));
    stockEnAttente.current[produit.id_prod] = stock;

    clearTimeout(minuteriesStock.current[produit.id_prod]);
    minuteriesStock.current[produit.id_prod] = setTimeout(async () => {
      try {
        const res = await api.patch(`produits/${produit.id_prod}/`, { stock_prod: stock });
        delete stockEnAttente.current[produit.id_prod];
        setProduits((prev) =>
          prev.map((p) =>
            p.id_prod === produit.id_prod ? { ...p, stock_prod: res.data.stock_prod } : p
          )
        );
        oublierStockLocal(produit.id_prod);
        setErreur('');
      } catch (err) {
        delete stockEnAttente.current[produit.id_prod];
        oublierStockLocal(produit.id_prod);
        setErreur(extraireErreur(err, `Impossible de mettre à jour le stock de ${produit.nom_prod}.`));
      }
    }, 600);
  };

  const annulerStockEnAttente = (id) => {
    clearTimeout(minuteriesStock.current[id]);
    delete minuteriesStock.current[id];
    delete stockEnAttente.current[id];
    oublierStockLocal(id);
  };

  const resumeStock = produits.reduce(
    (acc, p) => {
      const stock = stockLocal[p.id_prod] ?? p.stock_prod;
      acc.quantite += stock;
      acc.valeur += stock * Number(p.prix_prod);
      if (stock === 0) acc.ruptures += 1;
      else if (stock <= SEUIL_STOCK_FAIBLE) acc.faibles += 1;
      return acc;
    },
    { quantite: 0, valeur: 0, ruptures: 0, faibles: 0 }
  );

  const ouvrirCreation = () => {
    setProduitEnEdition(null);
    setFichierImage(null);
    setErreur('');
    setForm({ nom_prod: '', description_prod: '', prix_prod: '', stock_prod: '', categorie_id: '', marque_id: '' });
    setModalOuverte(true);
  };

  const ouvrirEdition = (produit) => {
    annulerStockEnAttente(produit.id_prod);
    setProduitEnEdition(produit);
    setFichierImage(null);
    setErreur('');
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
      setErreur(extraireErreur(err, "Impossible d'enregistrer le produit."));
    }
  };

  const supprimer = async (id) => {
    if (!confirm('Supprimer ce produit ?')) return;
    try {
      annulerStockEnAttente(id);
      await api.delete(`produits/${id}/`);
      setErreur('');
      charger();
    } catch (err) {
      setErreur(extraireErreur(err, 'Impossible de supprimer ce produit.'));
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3 mb-5">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Gestion des produits
          </h1>
          <p className="text-sm text-gray-500">
            Le stock se modifie directement dans le tableau (enregistrement automatique).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/etats?etat=stock"
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition"
          >
            <Printer size={16} /> État du stock
          </Link>
          <Link
            to="/admin/etats"
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition"
          >
            <FileText size={16} /> États imprimables
          </Link>
          <button onClick={ouvrirCreation} className="bg-[#1E1B2E] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-amber-500 hover:text-[#1E1B2E] transition">
            Nouveau produit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500">Produits</p>
          <p className="text-xl font-bold">{produits.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500">Unités en stock</p>
          <p className="text-xl font-bold">{resumeStock.quantite}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500">Valeur du stock</p>
          <p className="text-xl font-bold">{formaterPrix(resumeStock.valeur)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500">Alertes</p>
          <p className="text-xl font-bold">
            <span className={resumeStock.ruptures > 0 ? 'text-red-600' : 'text-gray-400'}>
              {resumeStock.ruptures} rupture{resumeStock.ruptures > 1 ? 's' : ''}
            </span>
            <span className="text-gray-300"> · </span>
            <span className={resumeStock.faibles > 0 ? 'text-amber-600' : 'text-gray-400'}>
              {resumeStock.faibles} faible{resumeStock.faibles > 1 ? 's' : ''}
            </span>
          </p>
        </div>
      </div>

      {erreur && !modalOuverte && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
          {erreur}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[820px]">
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
            {produits.map((p) => {
              const stock = valeurStock(p);
              const alerte = stock === 0
                ? <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Rupture</span>
                : stock <= SEUIL_STOCK_FAIBLE
                  ? <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Stock faible</span>
                  : null;

              return (
                <tr key={p.id_prod} className="border-t border-gray-100">
                  <td className="p-3">{p.nom_prod}</td>
                  <td className="p-3">{formaterPrix(p.prix_prod)}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label={`Retirer une unité de ${p.nom_prod}`}
                        onClick={() => appliquerStock(p, stock - 1)}
                        disabled={stock === 0}
                        className="w-7 h-7 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="0"
                        aria-label={`Stock de ${p.nom_prod}`}
                        value={stock}
                        onChange={(e) => appliquerStock(p, e.target.value)}
                        className="w-16 px-1 py-1 text-center text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <button
                        type="button"
                        aria-label={`Ajouter une unité de ${p.nom_prod}`}
                        onClick={() => appliquerStock(p, stock + 1)}
                        className="w-7 h-7 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
                      >
                        +
                      </button>
                    </div>
                    {alerte}
                  </td>
                  <td className="p-3">{p.categorie.nom_cat}</td>
                  <td className="p-3">{p.marque.nom_marq}</td>
                  <td className="p-3 space-x-2">
                    <button onClick={() => ouvrirEdition(p)} className="text-amber-600 hover:underline">Modifier</button>
                    <button onClick={() => supprimer(p.id_prod)} className="text-red-600 hover:underline">Supprimer</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {produits.length === 0 && (
        <p className="text-center text-gray-500 mt-10">Aucun produit enregistré.</p>
      )}

      {modalOuverte && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setModalOuverte(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{produitEnEdition ? 'Modifier le produit' : 'Nouveau produit'}</h2>
            {erreur && (
              <div className="mb-3 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {erreur}
              </div>
            )}
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
                <input required type="number" min="0" value={form.stock_prod} onChange={(e) => setForm({ ...form, stock_prod: e.target.value })}
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
