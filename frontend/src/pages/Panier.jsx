import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { formaterPrix } from '../utils/format';

function Panier() {
  const [panier, setPanier] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [enCours, setEnCours] = useState(false);
  const navigate = useNavigate();

  const chargerPanier = async () => {
    try {
      const res = await api.get('paniers/');
      setPanier(res.data[0] || null);
      setErreur('');
    } catch {
      setErreur('Impossible de charger le panier.');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerPanier();
  }, []);

  const supprimerLigne = async (ligneId) => {
    try {
      await api.delete(`lignes-panier/${ligneId}/`);
      chargerPanier();
    } catch {
      setErreur('Impossible de supprimer cette ligne.');
    }
  };

  const passerCommande = async () => {
    setEnCours(true);
    try {
      const res = await api.post('commandes/');
      navigate(`/paiement/${res.data.id_comm}`);
    } catch (err) {
      const donnees = err.response?.data;
      const detail = donnees?.non_field_errors?.[0]
        || donnees?.detail
        || 'Impossible de passer la commande.';
      setErreur(detail);
    } finally {
      setEnCours(false);
    }
  };

  if (chargement) {
    return (
      <div className="flex justify-center mt-20">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        Mon panier
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Les quantités se modifient depuis le{' '}
        <Link to="/" className="text-amber-600 hover:underline">catalogue</Link>.
      </p>

      {erreur && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
          {erreur}
        </div>
      )}

      {!panier || panier.lignes.length === 0 ? (
        <div className="text-center mt-20 text-gray-500">Votre panier est vide</div>
      ) : (
        <>
          <div className="space-y-3">
            {panier.lignes.map((ligne) => (
              <div key={ligne.id_ligne_pan} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{ligne.produit.nom_prod}</p>
                  <p className="text-sm text-gray-500">{formaterPrix(ligne.produit.prix_prod)} / unité</p>
                  <p className="text-xs text-gray-400">Stock disponible : {ligne.produit.stock_prod}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Quantité</p>
                    <p className="text-lg font-bold">{ligne.quantite_ligne_pan}</p>
                  </div>
                  <button
                    onClick={() => supprimerLigne(ligne.id_ligne_pan)}
                    aria-label={`Retirer ${ligne.produit.nom_prod} du panier`}
                    className="p-2 text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-right mt-6">
            <h2 className="text-xl font-bold mb-3">
              Total :{' '}
              {formaterPrix(
                panier.lignes.reduce(
                  (sum, ligne) =>
                    sum + ligne.quantite_ligne_pan * parseFloat(ligne.produit.prix_prod),
                  0
                )
              )}
            </h2>
            <button
              onClick={passerCommande}
              disabled={enCours}
              className="w-full sm:w-auto bg-[#1E1B2E] text-white px-6 py-3 rounded-md font-medium hover:bg-amber-500 hover:text-[#1E1B2E] disabled:bg-gray-300 transition"
            >
              {enCours ? 'Envoi...' : 'Passer la commande'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Panier;
