export const formaterPrix = (valeur) => {
  return Number(valeur).toLocaleString('fr-FR') + ' FCFA';
};