import { useEffect, useState } from 'react';
import api from '../services/api';
import { formaterPrix } from '../utils/format';

const couleurs = {
  en_attente: 'bg-orange-100 text-orange-700',
  confirmee: 'bg-green-100 text-green-700',
  annulee: 'bg-red-100 text-red-700',
};

function AdminCommandes() {
  const [commandes, setCommandes] = useState([]);

  const charger = () => {
    api.get('commandes/').then((res) => setCommandes(res.data));
  };

  useEffect(() => { charger(); }, []);

  const changerStatut = async (id, statut) => {
    try {
      await api.patch(`commandes/${id}/`, { statut_comm: statut });
      charger();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        Gestion des commandes
      </h1>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">N°</th>
              <th className="p-3">Client</th>
              <th className="p-3">Date</th>
              <th className="p-3">Montant</th>
              <th className="p-3">Statut</th>
            </tr>
          </thead>
          <tbody>
            {commandes.map((c) => (
              <tr key={c.id_comm} className="border-t border-gray-100">
                <td className="p-3">{c.id_comm}</td>
                <td className="p-3">{c.user}</td>
                <td className="p-3">{new Date(c.date_commande).toLocaleDateString()}</td>
                <td className="p-3">{formaterPrix(c.montant_total_comm)}</td>
                <td className="p-3">
                  <select
                    value={c.statut_comm}
                    onChange={(e) => changerStatut(c.id_comm, e.target.value)}
                    className={`px-2 py-1 rounded-md text-xs font-medium border-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${couleurs[c.statut_comm]}`}
                  >
                    <option value="en_attente">En attente</option>
                    <option value="confirmee">Confirmée</option>
                    <option value="annulee">Annulée</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminCommandes;