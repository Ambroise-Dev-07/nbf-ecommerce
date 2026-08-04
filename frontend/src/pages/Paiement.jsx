import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

function Paiement() {
  const { commandeId } = useParams();
  const navigate = useNavigate();
  const [methode, setMethode] = useState('flooz');
  const [telephone, setTelephone] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [reussi, setReussi] = useState(false);
  const [erreur, setErreur] = useState('');

  const payer = async () => {
    if (!telephone) {
      setErreur('Entre ton numéro de téléphone');
      return;
    }
    setErreur('');
    setEnCours(true);
    try {
      const commande = await api.get(`commandes/${commandeId}/`);
      await api.post('paiements/', {
        commande: commandeId,
        montant_paie: commande.data.montant_total_comm,
        methode_paie: methode,
        phone_number: telephone,
      });
      setReussi(true);
    } catch (err) {
      setErreur('Erreur lors du paiement');
    } finally {
      setEnCours(false);
    }
  };

  if (reussi) {
    return (
      <div className="max-w-sm mx-auto mt-20 px-4 text-center">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
          <h1 className="text-lg font-bold mb-2">Paiement initié avec succès</h1>
          <p className="text-sm text-gray-500 mb-6">Valide la transaction depuis le pop-up sur ton téléphone.</p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-indigo-600 text-white py-2 rounded-md font-medium hover:bg-indigo-500 transition"
          >
            Retour au catalogue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto mt-20 px-4">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-lg font-bold mb-4">Paiement de la commande #{commandeId}</h1>
        {erreur && <p className="text-red-600 text-sm mb-3">{erreur}</p>}

        <p className="text-sm font-medium mb-2">Choisissez votre méthode de paiement :</p>
        <div className="flex gap-4 mb-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="methode" value="flooz" checked={methode === 'flooz'} onChange={(e) => setMethode(e.target.value)} />
            Flooz
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="methode" value="mixx_yas" checked={methode === 'mixx_yas'} onChange={(e) => setMethode(e.target.value)} />
            Mixx by Yas
          </label>
        </div>

        <input
          placeholder="Numéro de téléphone"
          value={telephone}
          onChange={(e) => setTelephone(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <button
          onClick={payer}
          disabled={enCours}
          className="w-full bg-indigo-600 text-white py-2 rounded-md font-medium hover:bg-indigo-500 disabled:bg-gray-300 transition"
        >
          {enCours ? 'Traitement...' : 'Confirmer le paiement'}
        </button>
      </div>
    </div>
  );
}

export default Paiement;