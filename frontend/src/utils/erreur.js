/**
 * Extrait un message lisible d'une erreur renvoyée par l'API Django REST.
 * Gère les erreurs de champ, les erreurs globales et les réponses non JSON.
 */
export function extraireErreur(err, messageParDefaut = 'Une erreur est survenue.') {
  const donnees = err?.response?.data;
  if (!donnees) return messageParDefaut;

  if (typeof donnees === 'string') return donnees;
  if (Array.isArray(donnees)) {
    return donnees.map((valeur) => String(valeur)).join(' ');
  }

  if (donnees.detail) return String(donnees.detail);
  if (donnees.non_field_errors?.length) {
    return donnees.non_field_errors.join(' ');
  }

  const messages = Object.entries(donnees).flatMap(([champ, valeur]) => {
    const texte = Array.isArray(valeur) ? valeur.join(' ') : String(valeur);
    return `${champ} : ${texte}`;
  });

  return messages.length ? messages.join(' — ') : messageParDefaut;
}
