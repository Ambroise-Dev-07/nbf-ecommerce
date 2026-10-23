import { useEffect, useMemo, useState } from 'react';
import { Printer } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { formaterPrix } from '../utils/format';

const ONGLETS = [
  { id: 'stock', label: 'État du stock' },
  { id: 'commandes', label: 'État des commandes' },
  { id: 'ventes', label: 'État des ventes' },
];

const LIBELLES_STATUT = {
  en_attente: 'En attente',
  confirmee: 'Confirmée',
  annulee: 'Annulée',
};

const SEUIL_STOCK_FAIBLE = 5;

const dateLisible = (valeur) => {
  if (!valeur) return '…';
  const [annee, mois, jour] = valeur.split('-');
  return `${jour}/${mois}/${annee}`;
};

const aujourdHui = () => new Date().toISOString().slice(0, 10);

const premierJourDuMois = () => {
  const maintenant = new Date();
  return `${maintenant.getFullYear()}-${String(maintenant.getMonth() + 1).padStart(2, '0')}-01`;
};

function AdminEtats() {
  const [parametres, setParametres] = useSearchParams();
  const ongletDemande = parametres.get('etat');
  const onglet = ONGLETS.some((o) => o.id === ongletDemande) ? ongletDemande : 'stock';

  const [produits, setProduits] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [debut, setDebut] = useState(premierJourDuMois);
  const [fin, setFin] = useState(aujourdHui);

  useEffect(() => {
    Promise.all([api.get('produits/'), api.get('commandes/')])
      .then(([resProduits, resCommandes]) => {
        setProduits(resProduits.data);
        setCommandes(resCommandes.data);
      })
      .catch(() => setErreur('Impossible de charger les données des états.'))
      .finally(() => setChargement(false));
  }, []);

  const produitsTries = useMemo(
    () =>
      [...produits].sort(
        (a, b) => a.stock_prod - b.stock_prod || a.nom_prod.localeCompare(b.nom_prod)
      ),
    [produits]
  );

  const resumeStock = useMemo(
    () =>
      produits.reduce(
        (acc, p) => {
          acc.quantite += p.stock_prod;
          acc.valeur += p.stock_prod * Number(p.prix_prod);
          if (p.stock_prod === 0) acc.ruptures += 1;
          else if (p.stock_prod <= SEUIL_STOCK_FAIBLE) acc.faibles += 1;
          return acc;
        },
        { quantite: 0, valeur: 0, ruptures: 0, faibles: 0 }
      ),
    [produits]
  );

  const commandesPeriode = useMemo(
    () =>
      commandes
        .filter((c) => {
          const jour = c.date_commande.slice(0, 10);
          if (debut && jour < debut) return false;
          if (fin && jour > fin) return false;
          return true;
        })
        .sort((a, b) => b.date_commande.localeCompare(a.date_commande)),
    [commandes, debut, fin]
  );

  const totauxCommandes = useMemo(() => {
    const parStatut = { en_attente: 0, confirmee: 0, annulee: 0 };
    let montant = 0;
    commandesPeriode.forEach((c) => {
      parStatut[c.statut_comm] = (parStatut[c.statut_comm] || 0) + 1;
      montant += Number(c.montant_total_comm);
    });
    return { montant, parStatut };
  }, [commandesPeriode]);

  const ventes = useMemo(() => {
    const confirmees = commandesPeriode.filter((c) => c.statut_comm === 'confirmee');
    const parProduit = new Map();
    let chiffreAffaires = 0;
    let articles = 0;

    confirmees.forEach((c) => {
      chiffreAffaires += Number(c.montant_total_comm);
      (c.lignes || []).forEach((ligne) => {
        articles += ligne.quantite_ligne_comm;
        const entree = parProduit.get(ligne.produit.nom_prod) || {
          nom: ligne.produit.nom_prod,
          quantite: 0,
          montant: 0,
        };
        entree.quantite += ligne.quantite_ligne_comm;
        entree.montant += ligne.quantite_ligne_comm * Number(ligne.prix_unitaire);
        parProduit.set(entree.nom, entree);
      });
    });

    return {
      nombre: confirmees.length,
      chiffreAffaires,
      articles,
      panierMoyen: confirmees.length ? chiffreAffaires / confirmees.length : 0,
      produits: [...parProduit.values()].sort((a, b) => b.montant - a.montant),
    };
  }, [commandesPeriode]);

  const textePeriode =
    debut || fin
      ? `du ${dateLisible(debut)} au ${dateLisible(fin)}`
      : 'toutes périodes';

  if (chargement) {
    return (
      <div className="flex justify-center mt-20">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto etat-page">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3 mb-5">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            États
          </h1>
          <p className="text-sm text-gray-500">
            NEW BRAIN FACTORY — édité le{' '}
            {new Date().toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 no-print">
          <Link
            to="/admin/produits"
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition"
          >
            Gestion du stock
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-[#1E1B2E] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-amber-500 hover:text-[#1E1B2E] transition"
          >
            <Printer size={16} /> Imprimer
          </button>
        </div>
      </div>

      {erreur && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700 no-print">
          {erreur}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4 no-print">
        {ONGLETS.map((o) => (
          <button
            key={o.id}
            onClick={() => setParametres({ etat: o.id })}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              onglet === o.id
                ? 'bg-[#1E1B2E] text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {onglet !== 'stock' && (
        <div className="flex flex-wrap items-end gap-3 mb-4 no-print">
          <label className="text-sm">
            <span className="block text-xs text-gray-500 mb-1">Du</span>
            <input
              type="date"
              value={debut}
              onChange={(e) => setDebut(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </label>
          <label className="text-sm">
            <span className="block text-xs text-gray-500 mb-1">Au</span>
            <input
              type="date"
              value={fin}
              onChange={(e) => setFin(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </label>
          <button
            onClick={() => {
              setDebut('');
              setFin('');
            }}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-600 rounded-md text-sm font-medium hover:bg-gray-50 transition"
          >
            Toutes périodes
          </button>
        </div>
      )}

      {onglet === 'stock' && (
        <>
          <div className="mb-4">
            <h2 className="text-lg font-bold">État du stock</h2>
            <p className="text-sm text-gray-500">
              Situation au {new Date().toLocaleDateString('fr-FR')} — {produits.length} produit
              {produits.length > 1 ? 's' : ''} référencé{produits.length > 1 ? 's' : ''}
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-xs text-gray-500">Unités en stock</p>
              <p className="text-xl font-bold">{resumeStock.quantite}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-xs text-gray-500">Valeur du stock</p>
              <p className="text-xl font-bold">{formaterPrix(resumeStock.valeur)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-xs text-gray-500">Ruptures</p>
              <p className="text-xl font-bold text-red-600">{resumeStock.ruptures}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-xs text-gray-500">Stocks faibles (≤ {SEUIL_STOCK_FAIBLE})</p>
              <p className="text-xl font-bold text-amber-600">{resumeStock.faibles}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-x-auto mb-8">
            <table className="etat-table w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="p-3">Produit</th>
                  <th className="p-3">Catégorie</th>
                  <th className="p-3">Marque</th>
                  <th className="p-3 text-right">Prix unitaire</th>
                  <th className="p-3 text-right">Stock</th>
                  <th className="p-3 text-right">Valeur</th>
                  <th className="p-3">Situation</th>
                </tr>
              </thead>
              <tbody>
                {produitsTries.map((p) => (
                  <tr key={p.id_prod} className="border-t border-gray-100">
                    <td className="p-3">{p.nom_prod}</td>
                    <td className="p-3">{p.categorie.nom_cat}</td>
                    <td className="p-3">{p.marque.nom_marq}</td>
                    <td className="p-3 text-right">{formaterPrix(p.prix_prod)}</td>
                    <td className="p-3 text-right font-medium">{p.stock_prod}</td>
                    <td className="p-3 text-right">
                      {formaterPrix(p.stock_prod * Number(p.prix_prod))}
                    </td>
                    <td className="p-3">
                      {p.stock_prod === 0 ? (
                        <span className="etat-badge text-red-700 bg-red-50">Rupture</span>
                      ) : p.stock_prod <= SEUIL_STOCK_FAIBLE ? (
                        <span className="etat-badge text-amber-700 bg-amber-50">Stock faible</span>
                      ) : (
                        <span className="etat-badge text-green-700 bg-green-50">Disponible</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                  <td className="p-3" colSpan={4}>Total</td>
                  <td className="p-3 text-right">{resumeStock.quantite}</td>
                  <td className="p-3 text-right">{formaterPrix(resumeStock.valeur)}</td>
                  <td className="p-3" />
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}

      {onglet === 'commandes' && (
        <>
          <div className="mb-4">
            <h2 className="text-lg font-bold">État des commandes</h2>
            <p className="text-sm text-gray-500">Période : {textePeriode}</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-xs text-gray-500">Commandes</p>
              <p className="text-xl font-bold">{commandesPeriode.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-xs text-gray-500">Montant total</p>
              <p className="text-xl font-bold">{formaterPrix(totauxCommandes.montant)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-xs text-gray-500">Confirmées</p>
              <p className="text-xl font-bold text-green-600">{totauxCommandes.parStatut.confirmee}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-xs text-gray-500">En attente · Annulées</p>
              <p className="text-xl font-bold">
                <span className="text-orange-600">{totauxCommandes.parStatut.en_attente}</span>
                <span className="text-gray-300"> · </span>
                <span className="text-red-600">{totauxCommandes.parStatut.annulee}</span>
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-x-auto mb-8">
            <table className="etat-table w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="p-3">N°</th>
                  <th className="p-3">Client</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Articles</th>
                  <th className="p-3 text-right">Montant</th>
                  <th className="p-3">Statut</th>
                </tr>
              </thead>
              <tbody>
                {commandesPeriode.map((c) => (
                  <tr key={c.id_comm} className="border-t border-gray-100">
                    <td className="p-3">{c.id_comm}</td>
                    <td className="p-3">{c.user_username || c.user}</td>
                    <td className="p-3">{new Date(c.date_commande).toLocaleDateString('fr-FR')}</td>
                    <td className="p-3 text-xs text-gray-600">
                      {(c.lignes || [])
                        .map((l) => `${l.produit.nom_prod} × ${l.quantite_ligne_comm}`)
                        .join(', ') || '—'}
                    </td>
                    <td className="p-3 text-right">{formaterPrix(c.montant_total_comm)}</td>
                    <td className="p-3">
                      <span className={`etat-badge ${
                        c.statut_comm === 'confirmee'
                          ? 'text-green-700 bg-green-50'
                          : c.statut_comm === 'annulee'
                            ? 'text-red-700 bg-red-50'
                            : 'text-orange-700 bg-orange-50'
                      }`}>
                        {LIBELLES_STATUT[c.statut_comm] || c.statut_comm}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                  <td className="p-3" colSpan={4}>Total</td>
                  <td className="p-3 text-right">{formaterPrix(totauxCommandes.montant)}</td>
                  <td className="p-3" />
                </tr>
              </tfoot>
            </table>
          </div>

          {commandesPeriode.length === 0 && (
            <p className="text-center text-gray-500 mb-8">
              Aucune commande sur cette période.
            </p>
          )}
        </>
      )}

      {onglet === 'ventes' && (
        <>
          <div className="mb-4">
            <h2 className="text-lg font-bold">État des ventes</h2>
            <p className="text-sm text-gray-500">
              Période : {textePeriode} — commandes confirmées uniquement
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-xs text-gray-500">Chiffre d&apos;affaires</p>
              <p className="text-xl font-bold">{formaterPrix(ventes.chiffreAffaires)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-xs text-gray-500">Commandes confirmées</p>
              <p className="text-xl font-bold">{ventes.nombre}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-xs text-gray-500">Panier moyen</p>
              <p className="text-xl font-bold">{formaterPrix(ventes.panierMoyen)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-xs text-gray-500">Articles vendus</p>
              <p className="text-xl font-bold">{ventes.articles}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-x-auto mb-8">
            <table className="etat-table w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="p-3">Produit</th>
                  <th className="p-3 text-right">Quantité vendue</th>
                  <th className="p-3 text-right">Chiffre d&apos;affaires</th>
                </tr>
              </thead>
              <tbody>
                {ventes.produits.map((p) => (
                  <tr key={p.nom} className="border-t border-gray-100">
                    <td className="p-3">{p.nom}</td>
                    <td className="p-3 text-right">{p.quantite}</td>
                    <td className="p-3 text-right">{formaterPrix(p.montant)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                  <td className="p-3">Total</td>
                  <td className="p-3 text-right">{ventes.articles}</td>
                  <td className="p-3 text-right">{formaterPrix(ventes.chiffreAffaires)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {ventes.produits.length === 0 && (
            <p className="text-center text-gray-500 mb-8">
              Aucune vente confirmée sur cette période.
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default AdminEtats;
