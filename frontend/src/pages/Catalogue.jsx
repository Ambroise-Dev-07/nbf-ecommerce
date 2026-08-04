import { useEffect, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../services/auth';
import api from '../services/api';
import { formaterPrix } from '../utils/format';

function Catalogue() {
  const [produits, setProduits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [marques, setMarques] = useState([]);
  const [filtreCat, setFiltreCat] = useState('');
  const [filtreMarque, setFiltreMarque] = useState('');
  const [recherche, setRecherche] = useState('');
  const [produitSelectionne, setProduitSelectionne] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('produits/').then((res) => setProduits(res.data));
    api.get('categories/').then((res) => setCategories(res.data));
    api.get('marques/').then((res) => setMarques(res.data));
  }, []);

  const produitsFiltres = produits.filter((p) => {
    const matchCat = !filtreCat || p.categorie.id_cat === Number(filtreCat);
    const matchMarque = !filtreMarque || p.marque.id_marq === Number(filtreMarque);
    const matchRecherche = p.nom_prod.toLowerCase().includes(recherche.toLowerCase());
    return matchCat && matchMarque && matchRecherche;
  });

  const ajouterAuPanier = async (produit, e) => {
    e.stopPropagation();
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    try {
      let panierRes = await api.get('paniers/');
      let panierId = panierRes.data[0]?.id_pan;
      if (!panierId) {
        const nouveauPanier = await api.post('paniers/');
        panierId = nouveauPanier.data.id_pan;
      }
      await api.post('lignes-panier/', {
        panier: panierId,
        produit_id: produit.id_prod,
        quantite_ligne_pan: 1,
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        Catalogue
      </h1>

      <div className="flex gap-3 mb-6">
        <input
          placeholder="Rechercher un produit"
          onChange={(e) => setRecherche(e.target.value)}
          className="w-60 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={filtreCat}
          onChange={(e) => setFiltreCat(e.target.value)}
          className="w-48 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c.id_cat} value={c.id_cat}>{c.nom_cat}</option>
          ))}
        </select>
        <select
          value={filtreMarque}
          onChange={(e) => setFiltreMarque(e.target.value)}
          className="w-48 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Toutes les marques</option>
          {marques.map((m) => (
            <option key={m.id_marq} value={m.id_marq}>{m.nom_marq}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {produitsFiltres.map((produit) => (
          <div
            key={produit.id_prod}
            onClick={() => setProduitSelectionne(produit)}
            className="bg-white rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col"
          >
            {produit.image_prod && (
              <div className="h-44 overflow-hidden bg-gray-100">
                <img src={produit.image_prod} alt={produit.nom_prod} className="w-full h-full object-cover block" />
              </div>
            )}
            <div className="p-4 flex-1 flex flex-col">
              <h3 className="font-semibold mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {produit.nom_prod}
              </h3>
              <p className="text-lg font-bold text-amber-600 mb-2">{formaterPrix(produit.prix_prod)}</p>
              <span
                className={`text-xs px-2 py-1 rounded-full w-fit mb-3 ${
                  produit.stock_prod > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}
              >
                {produit.stock_prod > 0 ? `Stock: ${produit.stock_prod}` : 'Rupture'}
              </span>
              <button
                onClick={(e) => ajouterAuPanier(produit, e)}
                disabled={produit.stock_prod === 0}
                className="mt-auto flex items-center justify-center gap-2 bg-[#1E1B2E] text-white py-2 rounded-md text-sm font-medium hover:bg-amber-500 hover:text-[#1E1B2E] disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                <ShoppingCart size={16} /> Ajouter
              </button>
            </div>
          </div>
        ))}
      </div>

      {produitSelectionne && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setProduitSelectionne(null)}
        >
          <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">{produitSelectionne.nom_prod}</h2>
            <dl className="space-y-2 text-sm">
              <div><dt className="font-medium inline">Description : </dt><dd className="inline">{produitSelectionne.description_prod}</dd></div>
              <div><dt className="font-medium inline">Prix : </dt><dd className="inline">{formaterPrix(produitSelectionne.prix_prod)}</dd></div>
              <div><dt className="font-medium inline">Stock : </dt><dd className="inline">{produitSelectionne.stock_prod}</dd></div>
              <div><dt className="font-medium inline">Catégorie : </dt><dd className="inline">{produitSelectionne.categorie.nom_cat}</dd></div>
              <div><dt className="font-medium inline">Marque : </dt><dd className="inline">{produitSelectionne.marque.nom_marq}</dd></div>
            </dl>
            <button
              onClick={() => setProduitSelectionne(null)}
              className="mt-5 w-full bg-gray-100 hover:bg-gray-200 py-2 rounded-md text-sm font-medium transition"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Catalogue;