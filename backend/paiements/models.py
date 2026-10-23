import logging

import requests
from django.conf import settings
from django.db import models

from commandes.models import Commande

logger = logging.getLogger(__name__)

# Statuts renvoyés par PayGate Global.
# API de paiement (v1) : 0 = transaction enregistrée, 2 = jeton invalide,
#                        4 = paramètres invalides, 6 = doublon.
# API de statut (v2)   : 0 = payé, 2 = en cours, 4 = expiré, 6 = annulé.
STATUTS_PAYES = {0, '0'}
STATUTS_EN_COURS = {2, '2'}
STATUTS_ECHEC = {4, '4', 6, '6'}


class Paiement(models.Model):
    METHODE_CHOICES = [
        ('flooz', 'Flooz'),
        ('mixx_yas', 'Mixx by Yas'),
    ]
    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('valide', 'Validé'),
        ('echoue', 'Échoué'),
    ]
    id_paie = models.AutoField(primary_key=True)
    montant_paie = models.DecimalField(max_digits=10, decimal_places=2)
    methode_paie = models.CharField(max_length=20, choices=METHODE_CHOICES)
    statut_paie = models.CharField(
        max_length=20, choices=STATUT_CHOICES, default='en_attente'
    )
    reference_transaction = models.CharField(max_length=100, blank=True)
    date_paiement = models.DateTimeField(auto_now_add=True)
    commande = models.ForeignKey(
        Commande, on_delete=models.CASCADE, related_name='paiements'
    )

    class Meta:
        ordering = ['-date_paiement']

    def __str__(self):
        return f"Paiement #{self.id_paie} - {self.statut_paie}"

    def initier_paiement(self, phone_number: str) -> dict:
        """Envoie la demande de paiement à PayGate Global.

        Retourne la réponse de l'API ; en cas d'erreur réseau, le paiement
        est marqué comme échoué et un dictionnaire d'erreur est renvoyé.
        """
        if not settings.PAYGATE_SECRET:
            logger.error("PAYGATE_SECRET n'est pas configuré.")
            self.statut_paie = 'echoue'
            self.save(update_fields=['statut_paie'])
            return {'status': -1, 'error': 'PAYGATE_SECRET manquant'}

        network = 'FLOOZ' if self.methode_paie == 'flooz' else 'TMONEY'

        payload = {
            'auth_token': settings.PAYGATE_SECRET,
            'phone_number': phone_number,
            'amount': int(self.montant_paie),
            'description': f'Commande {self.commande_id}',
            'identifier': str(self.id_paie),
            'network': network,
        }

        try:
            response = requests.post(
                settings.PAYGATE_PAY_URL,
                json=payload,
                timeout=settings.PAYGATE_TIMEOUT,
            )
            response.raise_for_status()
            data = response.json()
        except (requests.RequestException, ValueError) as exc:
            logger.exception(
                "Échec de l'appel PayGate pour le paiement %s", self.id_paie
            )
            self.statut_paie = 'echoue'
            self.save(update_fields=['statut_paie'])
            return {'status': -1, 'error': str(exc)}

        statut = data.get('status')
        logger.info(
            "Réponse PayGate pour le paiement %s : statut=%s",
            self.id_paie,
            statut,
        )

        if statut in STATUTS_PAYES or statut in STATUTS_EN_COURS:
            # La transaction est enregistrée : le client doit valider sur
            # son téléphone, le statut définitif sera vérifié plus tard.
            self.statut_paie = 'en_attente'
            self.reference_transaction = str(data.get('tx_reference', ''))
        else:
            self.statut_paie = 'echoue'

        self.save(update_fields=['statut_paie', 'reference_transaction'])
        return data

    def verifier_statut(self) -> str:
        return self.statut_paie

    def rafraichir_statut(self) -> str:
        """Interroge PayGate pour mettre à jour le statut du paiement.

        L'API de statut n'est sollicitée que pour un paiement en attente.
        En cas d'erreur réseau, le statut local est conservé.
        """
        if self.statut_paie != 'en_attente':
            return self.statut_paie

        try:
            response = requests.post(
                settings.PAYGATE_STATUS_URL,
                json={
                    'auth_token': settings.PAYGATE_SECRET,
                    'identifier': str(self.id_paie),
                },
                timeout=settings.PAYGATE_TIMEOUT,
            )
            response.raise_for_status()
            data = response.json()
        except (requests.RequestException, ValueError):
            logger.exception(
                "Impossible de vérifier le statut du paiement %s", self.id_paie
            )
            return self.statut_paie

        statut = data.get('status')
        if statut in STATUTS_PAYES:
            self.confirmer_paiement()
        elif statut in STATUTS_ECHEC:
            self.annuler_paiement()
        elif statut in STATUTS_EN_COURS:
            logger.info(
                "Paiement %s toujours en cours de validation.", self.id_paie
            )
        else:
            logger.warning(
                "Statut PayGate inconnu pour le paiement %s : %s",
                self.id_paie,
                statut,
            )
        return self.statut_paie

    def confirmer_paiement(self) -> None:
        if self.statut_paie == 'valide':
            return
        self.statut_paie = 'valide'
        self.save(update_fields=['statut_paie'])
        self.commande.confirmer_comm()

    def annuler_paiement(self) -> None:
        if self.statut_paie == 'echoue':
            return
        self.statut_paie = 'echoue'
        self.save(update_fields=['statut_paie'])
