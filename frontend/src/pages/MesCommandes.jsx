import { useEffect, useState } from 'react';

import api from '../services/api';
import { formaterPrix } from '../utils/format';

const couleurs = {
  en_attente: 'bg-orange-100 text-orange-700',
  confirmee: 'bg-green-100 text-green-700',
  annulee: 'bg-red-100 text-red-700',
};
const labels = { en_attente: 'En attente', confirmee: 'Confirmée', annulee: 'Annulée' };

function MesCommandes() {
  const [commandes, setCommandes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [ouvertes, setOuvertes] = useState({});

  useEffect(() => {
    api.get('commandes/').then((res) => {
      setCommandes(res.data);
      setChargement(false);
    });
  }, []);

  const toggle = (id) => {
    setOuvertes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (chargement) {
    return (
      <div className="flex justify-center mt-20">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (commandes.length === 0) {
    return <div className="text-center mt-20 text-gray-500">Vous n'avez pas encore de commande</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        Mes commandes
      </h1>

      <div className="space-y-4">
        {commandes.map((commande) => (
          <div key={commande.id_comm} className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex justify-between items-center mb-2">
              <strong>Commande #{commande.id_comm}</strong>
              <span className={`text-xs px-2 py-1 rounded-full ${couleurs[commande.statut_comm]}`}>
                {labels[commande.statut_comm]}
              </span>
            </div>
            <p className="text-sm text-gray-500">Date : {new Date(commande.date_commande).toLocaleDateString()}</p>
            <p className="text-sm text-gray-500 mb-3">Total : {formaterPrix(commande.montant_total_comm)}</p>

            <button
              onClick={() => toggle(commande.id_comm)}
              className="text-sm text-indigo-600 hover:underline"
            >
              {ouvertes[commande.id_comm] ? 'Masquer le détail' : 'Voir le détail'}
            </button>

            {ouvertes[commande.id_comm] && (
              <ul className="mt-3 space-y-1 border-t border-gray-100 pt-3">
                {commande.lignes.map((ligne) => (
                  <li key={ligne.id_ligne_comm} className="text-sm text-gray-600">
                    {ligne.produit.nom_prod} — {ligne.quantite_ligne_comm} x {formaterPrix(ligne.prix_unitaire)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default MesCommandes;