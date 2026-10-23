import { useEffect, useState } from 'react';
import { Package, Users, ShoppingBag, DollarSign } from 'lucide-react';
import api from '../services/api';
import { formaterPrix } from '../utils/format';

const labelsStatut = { en_attente: 'En attente', confirmee: 'Confirmée', annulee: 'Annulée' };

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    api.get('statistiques/')
      .then((res) => setStats(res.data))
      .catch(() => setErreur('Impossible de charger les statistiques.'));
  }, []);

  if (erreur) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
          {erreur}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex justify-center mt-20">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const cartes = [
    { label: 'Produits au catalogue', valeur: stats.total_produits, icon: Package },
    { label: 'Clients inscrits', valeur: stats.total_clients, icon: Users },
    { label: 'Commandes totales', valeur: stats.total_commandes, icon: ShoppingBag },
    { label: 'Chiffre d\'affaires', valeur: formaterPrix(stats.chiffre_affaires), icon: DollarSign },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        Tableau de bord
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cartes.map((c) => (
          <div key={c.label} className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <c.icon size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{c.label}</p>
              <p className="text-xl font-bold">{c.valeur}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold mb-3">Commandes par statut</h2>
          <ul className="space-y-2">
            {stats.commandes_par_statut.map((s) => (
              <li key={s.statut_comm} className="flex justify-between text-sm">
                <span>{labelsStatut[s.statut_comm] || s.statut_comm}</span>
                <span className="font-medium">{s.total}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold mb-3">Top 5 des produits vendus</h2>
          <ul className="space-y-2">
            {stats.top_produits.map((p, i) => (
              <li key={i} className="flex justify-between text-sm">
                <span>{p.produit__nom_prod}</span>
                <span className="font-medium">{p.quantite_vendue} vendus</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;