import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { formaterPrix } from '../utils/format';

function Paiement() {
  const { commandeId } = useParams();
  const navigate = useNavigate();
  const [methode, setMethode] = useState('flooz');
  const [telephone, setTelephone] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [paiement, setPaiement] = useState(null);
  const [montant, setMontant] = useState(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    api.get(`commandes/${commandeId}/`)
      .then((res) => setMontant(res.data.montant_total_comm))
      .catch(() => setErreur('Commande introuvable.'));
  }, [commandeId]);

  // Suivi automatique tant que le paiement est en attente de validation.
  useEffect(() => {
    if (!paiement || paiement.statut_paie !== 'en_attente') return undefined;

    const intervalle = setInterval(async () => {
      try {
        const res = await api.post(`paiements/${paiement.id_paie}/verifier/`);
        setPaiement(res.data);
      } catch {
        // Erreur réseau ponctuelle : on retentera au prochain passage.
      }
    }, 5000);

    return () => clearInterval(intervalle);
  }, [paiement]);

  const verifierMaintenant = async () => {
    if (!paiement) return;
    setEnCours(true);
    try {
      const res = await api.post(`paiements/${paiement.id_paie}/verifier/`);
      setPaiement(res.data);
    } catch {
      setErreur('Impossible de vérifier le paiement pour le moment.');
    } finally {
      setEnCours(false);
    }
  };

  const payer = async () => {
    if (!/^\d{8,15}$/.test(telephone.trim())) {
      setErreur('Entre un numéro de téléphone valide (8 à 15 chiffres).');
      return;
    }
    setErreur('');
    setEnCours(true);
    try {
      const res = await api.post('paiements/', {
        commande: commandeId,
        methode_paie: methode,
        phone_number: telephone.trim(),
      });
      setPaiement(res.data);
    } catch (err) {
      const donnees = err.response?.data;
      setErreur(
        donnees?.detail
          || donnees?.non_field_errors?.[0]
          || donnees?.phone_number?.[0]
          || 'Le paiement a échoué. Réessaie dans un instant.'
      );
      if (donnees?.paiement) setPaiement(donnees.paiement);
    } finally {
      setEnCours(false);
    }
  };

  const reessayer = () => {
    setPaiement(null);
    setErreur('');
  };

  if (paiement?.statut_paie === 'valide') {
    return (
      <div className="max-w-sm mx-auto mt-10 sm:mt-20 px-4 text-center">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
          <h1 className="text-lg font-bold mb-2">Paiement confirmé</h1>
          <p className="text-sm text-gray-500 mb-6">
            Ta commande #{commandeId} est validée.
          </p>
          <button
            onClick={() => navigate('/mes-commandes')}
            className="w-full bg-[#1E1B2E] text-white py-2 rounded-md font-medium hover:bg-amber-500 hover:text-[#1E1B2E] transition"
          >
            Voir mes commandes
          </button>
        </div>
      </div>
    );
  }

  if (paiement?.statut_paie === 'en_attente') {
    return (
      <div className="max-w-sm mx-auto mt-10 sm:mt-20 px-4 text-center">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">…</div>
          <h1 className="text-lg font-bold mb-2">Paiement en attente de validation</h1>
          <p className="text-sm text-gray-500 mb-6">
            Valide la transaction depuis le pop-up sur ton téléphone.
            La page se met à jour automatiquement.
          </p>
          <button
            onClick={verifierMaintenant}
            disabled={enCours}
            className="w-full bg-[#1E1B2E] text-white py-2 rounded-md font-medium hover:bg-amber-500 hover:text-[#1E1B2E] disabled:bg-gray-300 transition mb-2"
          >
            {enCours ? 'Vérification...' : 'Vérifier maintenant'}
          </button>
          <button
            onClick={() => navigate('/mes-commandes')}
            className="w-full bg-gray-100 hover:bg-gray-200 py-2 rounded-md text-sm font-medium transition"
          >
            Suivre mes commandes
          </button>
        </div>
      </div>
    );
  }

  if (paiement?.statut_paie === 'echoue') {
    return (
      <div className="max-w-sm mx-auto mt-10 sm:mt-20 px-4 text-center">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✕</div>
          <h1 className="text-lg font-bold mb-2">Paiement refusé</h1>
          <p className="text-sm text-gray-500 mb-6">
            La transaction n'a pas abouti. Tu peux réessayer avec un autre numéro.
          </p>
          <button
            onClick={reessayer}
            className="w-full bg-[#1E1B2E] text-white py-2 rounded-md font-medium hover:bg-amber-500 hover:text-[#1E1B2E] transition"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto mt-10 sm:mt-20 px-4">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-lg font-bold mb-1">Paiement de la commande #{commandeId}</h1>
        {montant !== null && (
          <p className="text-sm text-gray-500 mb-4">Montant : {formaterPrix(montant)}</p>
        )}
        {erreur && <p className="text-red-600 text-sm mb-3">{erreur}</p>}

        <p className="text-sm font-medium mb-2">Choisissez votre méthode de paiement :</p>
        <div className="flex gap-4 mb-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="methode" value="flooz" checked={methode === 'flooz'} onChange={(e) => setMethode(e.target.value)} className="accent-amber-500" />
            Flooz
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="methode" value="mixx_yas" checked={methode === 'mixx_yas'} onChange={(e) => setMethode(e.target.value)} className="accent-amber-500" />
            Mixx by Yas
          </label>
        </div>

        <input
          placeholder="Numéro de téléphone"
          value={telephone}
          onChange={(e) => setTelephone(e.target.value)}
          inputMode="numeric"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />

        <button
          onClick={payer}
          disabled={enCours}
          className="w-full bg-[#1E1B2E] text-white py-2 rounded-md font-medium hover:bg-amber-500 hover:text-[#1E1B2E] disabled:bg-gray-300 transition"
        >
          {enCours ? 'Traitement...' : 'Confirmer le paiement'}
        </button>
      </div>
    </div>
  );
}

export default Paiement;
