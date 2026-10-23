import { useEffect, useRef, useState } from 'react';
import { Check, Minus, Plus, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../services/auth';
import api from '../services/api';
import { formaterPrix } from '../utils/format';
import { extraireErreur } from '../utils/erreur';

function Catalogue() {
  const [produits, setProduits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [marques, setMarques] = useState([]);
  const [filtreCat, setFiltreCat] = useState('');
  const [filtreMarque, setFiltreMarque] = useState('');
  const [recherche, setRecherche] = useState('');
  const [produitSelectionne, setProduitSelectionne] = useState(null);
  const [message, setMessage] = useState('');
  const [enAjout, setEnAjout] = useState(null);
  const [panier, setPanier] = useState(null);
  const [quantitesLocales, setQuantitesLocales] = useState({});
  const minuteries = useRef({});
  const modificationsEnAttente = useRef({});
  const navigate = useNavigate();

  const chargerPanier = async () => {
    if (!isAuthenticated()) return;
    try {
      const res = await api.get('paniers/');
      setPanier(res.data[0] || null);
    } catch {
      // Panier indisponible : le catalogue reste utilisable.
    }
  };

  useEffect(() => {
    api.get('produits/').then((res) => setProduits(res.data));
    api.get('categories/').then((res) => setCategories(res.data));
    api.get('marques/').then((res) => setMarques(res.data));
    chargerPanier();

    const temporisateurs = minuteries.current;
    const enAttente = modificationsEnAttente.current;
    return () => {
      Object.values(temporisateurs).forEach(clearTimeout);
      // Envoie les dernières quantités modifiées si l'utilisateur quitte
      // la page avant la fin du délai d'attente.
      Object.entries(enAttente).forEach(([id, quantite]) => {
        api.patch(`lignes-panier/${id}/`, { quantite_ligne_pan: quantite })
          .catch(() => {});
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!message) return undefined;
    const minuterie = setTimeout(() => setMessage(''), 3000);
    return () => clearTimeout(minuterie);
  }, [message]);

  const produitsFiltres = produits.filter((p) => {
    const matchStock = p.stock_prod > 0;
    const matchCat = !filtreCat || p.categorie.id_cat === Number(filtreCat);
    const matchMarque = !filtreMarque || p.marque.id_marq === Number(filtreMarque);
    const matchRecherche = p.nom_prod.toLowerCase().includes(recherche.toLowerCase());
    return matchStock && matchCat && matchMarque && matchRecherche;
  });

  const ligneDuProduit = (produitId) =>
    panier?.lignes?.find((ligne) => ligne.produit.id_prod === produitId) || null;

  const quantiteAffichee = (produit) =>
    ligneDuProduit(produit.id_prod)?.quantite_ligne_pan
      ?? quantitesLocales[produit.id_prod]
      ?? 1;

  const changerQuantite = (produit, valeur) => {
    const max = Math.max(produit.stock_prod, 1);
    const quantite = Math.min(Math.max(Number(valeur) || 1, 1), max);
    const ligne = ligneDuProduit(produit.id_prod);

    if (!ligne) {
      // Produit absent du panier : on mémorise la quantité à ajouter.
      setQuantitesLocales((prev) => ({ ...prev, [produit.id_prod]: quantite }));
      return;
    }

    // Produit déjà au panier : la quantité est modifiée directement.
    setPanier((prev) => ({
      ...prev,
      lignes: prev.lignes.map((l) =>
        l.id_ligne_pan === ligne.id_ligne_pan
          ? { ...l, quantite_ligne_pan: quantite }
          : l
      ),
    }));

    modificationsEnAttente.current[ligne.id_ligne_pan] = quantite;

    clearTimeout(minuteries.current[ligne.id_ligne_pan]);
    minuteries.current[ligne.id_ligne_pan] = setTimeout(async () => {
      try {
        await api.patch(`lignes-panier/${ligne.id_ligne_pan}/`, {
          quantite_ligne_pan: quantite,
        });
        delete modificationsEnAttente.current[ligne.id_ligne_pan];
        setMessage(`${produit.nom_prod} : quantité mise à jour (${quantite})`);
      } catch (err) {
        delete modificationsEnAttente.current[ligne.id_ligne_pan];
        setMessage(
          extraireErreur(err, `Quantité refusée pour ${produit.nom_prod}.`)
        );
        chargerPanier();
      }
    }, 500);
  };

  const ajouterAuPanier = async (produit, e) => {
    e.stopPropagation();
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    const quantite = quantiteAffichee(produit);
    setEnAjout(produit.id_prod);
    try {
      let panierId = panier?.id_pan;
      if (!panierId) {
        const nouveauPanier = await api.post('paniers/');
        panierId = nouveauPanier.data.id_pan;
      }
      await api.post('lignes-panier/', {
        panier: panierId,
        produit_id: produit.id_prod,
        quantite_ligne_pan: quantite,
      });
      setMessage(`${produit.nom_prod} × ${quantite} ajouté au panier`);
      setQuantitesLocales((prev) => ({ ...prev, [produit.id_prod]: 1 }));
      await chargerPanier();
    } catch (err) {
      setMessage(
        extraireErreur(err, `Impossible d'ajouter ${produit.nom_prod} au panier.`)
      );
    } finally {
      setEnAjout(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        Catalogue
      </h1>

      {message && (
        <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-800">
          {message}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          placeholder="Rechercher un produit"
          onChange={(e) => setRecherche(e.target.value)}
          className="w-full sm:w-60 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <select
          value={filtreCat}
          onChange={(e) => setFiltreCat(e.target.value)}
          className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c.id_cat} value={c.id_cat}>{c.nom_cat}</option>
          ))}
        </select>
        <select
          value={filtreMarque}
          onChange={(e) => setFiltreMarque(e.target.value)}
          className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="">Toutes les marques</option>
          {marques.map((m) => (
            <option key={m.id_marq} value={m.id_marq}>{m.nom_marq}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {produitsFiltres.map((produit) => {
          const quantite = quantiteAffichee(produit);
          const auPanier = Boolean(ligneDuProduit(produit.id_prod));
          const max = Math.max(produit.stock_prod, 1);

          return (
            <div
              key={produit.id_prod}
              onClick={() => setProduitSelectionne(produit)}
              className="bg-white rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col"
            >
              {produit.image_prod && (
                <div className="h-44 overflow-hidden bg-gray-100">
                  <img
                    src={produit.image_prod}
                    alt={produit.nom_prod}
                    className="w-full h-full object-cover block"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
              )}
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {produit.nom_prod}
                </h3>
                <p className="text-lg font-bold text-amber-600 mb-2">{formaterPrix(produit.prix_prod)}</p>
                <span className="text-xs px-2 py-1 rounded-full w-fit mb-3 bg-green-100 text-green-700">
                  Stock: {produit.stock_prod}
                </span>

                <div
                  className="flex items-center justify-between mb-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-xs text-gray-500">
                    {auPanier ? 'Quantité au panier' : 'Quantité'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label={`Diminuer la quantité de ${produit.nom_prod}`}
                      onClick={() => changerQuantite(produit, quantite - 1)}
                      disabled={quantite <= 1 || produit.stock_prod === 0}
                      className="p-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={max}
                      value={quantite}
                      onChange={(e) => changerQuantite(produit, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      disabled={produit.stock_prod === 0}
                      className="w-12 px-1 py-1 text-center text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-50 disabled:text-gray-400"
                    />
                    <button
                      type="button"
                      aria-label={`Augmenter la quantité de ${produit.nom_prod}`}
                      onClick={() => changerQuantite(produit, quantite + 1)}
                      disabled={quantite >= max || produit.stock_prod === 0}
                      className="p-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {auPanier ? (
                  <div className="mt-auto flex items-center justify-center gap-2 bg-green-50 text-green-700 py-2 rounded-md text-sm font-medium">
                    <Check size={16} /> Au panier
                  </div>
                ) : (
                  <button
                    onClick={(e) => ajouterAuPanier(produit, e)}
                    disabled={produit.stock_prod === 0 || enAjout === produit.id_prod}
                    className="mt-auto flex items-center justify-center gap-2 bg-[#1E1B2E] text-white py-2 rounded-md text-sm font-medium hover:bg-amber-500 hover:text-[#1E1B2E] disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                  >
                    <ShoppingCart size={16} />
                    {enAjout === produit.id_prod ? 'Ajout...' : 'Ajouter'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {produitsFiltres.length === 0 && (
        <p className="text-center text-gray-500 mt-16">
          Aucun produit disponible pour le moment.
        </p>
      )}

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
