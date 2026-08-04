from django.db import models
from commandes.models import Commande
from django.conf import settings
import requests


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
    statut_paie = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente')
    reference_transaction = models.CharField(max_length=100, blank=True)
    date_paiement = models.DateTimeField(auto_now_add=True)
    commande = models.OneToOneField(Commande, on_delete=models.CASCADE, related_name='paiement')

    def __str__(self):
        return f"Paiement #{self.id_paie} - {self.statut_paie}"

    def initier_paiement(self, phone_number: str) -> dict:
        network = 'FLOOZ' if self.methode_paie == 'flooz' else 'TMONEY'

        response = requests.post('https://paygateglobal.com/api/v1/pay', json={
            'auth_token': settings.PAYGATE_SECRET,
            'phone_number': phone_number,
            'amount': str(self.montant_paie),
            'description': f'Commande {self.commande.id_comm}',
            'identifier': str(self.id_paie),
            'network': network,
        })
        data = response.json()
        print("Réponse PayGate:", data)

        if data.get('status') == 0:
            self.statut_paie = 'en_attente'
            self.reference_transaction = data.get('tx_reference', '')
        else:
            self.statut_paie = 'echoue'

        self.save()
        return data

    def verifier_statut(self) -> str:
        return self.statut_paie

    def confirmer_paiement(self) -> None:
        self.statut_paie = 'valide'
        self.save()
        self.commande.confirmer_comm()

    def annuler_paiement(self) -> None:
        self.statut_paie = 'echoue'
        self.save()