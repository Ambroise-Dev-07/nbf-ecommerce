import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { formaterPrix } from '../utils/format';

function Panier() {
  const [panier, setPanier] = useState(null);
  const [chargement, setChargement] = useState(true);
  const navigate = useNavigate();

  const chargerPanier = () => {
    api.get('paniers/').then((res) => {
      setPanier(res.data[0] || null);
      setChargement(false);
    });
  };

  useEffect(() => {
    chargerPanier();
  }, []);

  const modifierQuantite = async (ligneId, quantite) => {
    await api.patch(`lignes-panier/${ligneId}/`, { quantite_ligne_pan: quantite });
    setPanier((prev) => ({
      ...prev,
      lignes: prev.lignes.map((l) =>
        l.id_ligne_pan === ligneId ? { ...l, quantite_ligne_pan: quantite } : l
      ),
    }));
  };

  const supprimerLigne = async (ligneId) => {
    await api.delete(`lignes-panier/${ligneId}/`);
    chargerPanier();
  };

  const passerCommande = async () => {
    try {
      const res = await api.post('commandes/');
      navigate(`/paiement/${res.data.id_comm}`);
    } catch (err) {
      console.error(err);
    }
  };

  if (chargement) {
    return (
      <div className="flex justify-center mt-20">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!panier || panier.lignes.length === 0) {
    return (
      <div className="text-center mt-20 text-gray-500">
        Votre panier est vide
      </div>
    );
  }

  const total = panier.lignes.reduce(
    (sum, ligne) => sum + ligne.quantite_ligne_pan * parseFloat(ligne.produit.prix_prod),
    0
  );

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        Mon panier
      </h1>

      <div className="space-y-3">
        {panier.lignes.map((ligne) => (
          <div key={ligne.id_ligne_pan} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold">{ligne.produit.nom_prod}</p>
              <p className="text-sm text-gray-500">{formaterPrix(ligne.produit.prix_prod)} / unité</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={ligne.produit.stock_prod}
                value={ligne.quantite_ligne_pan}
                onChange={(e) => modifierQuantite(ligne.id_ligne_pan, Number(e.target.value))}
                className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => supprimerLigne(ligne.id_ligne_pan)}
                className="p-2 text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="text-right mt-6">
        <h2 className="text-xl font-bold mb-3">Total : {formaterPrix(total)}</h2>
        <button
          onClick={passerCommande}
          className="bg-indigo-600 text-white px-6 py-3 rounded-md font-medium hover:bg-indigo-500 transition"
        >
          Passer la commande
        </button>
      </div>
    </div>
  );
}

export default Panier;