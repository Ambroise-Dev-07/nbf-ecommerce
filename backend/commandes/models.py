from django.db import models
from django.conf import settings
from catalogue.models import Produit


class Panier(models.Model):
    id_pan = models.AutoField(primary_key=True)
    date_creation_pan = models.DateTimeField(auto_now_add=True)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='panier')

    def __str__(self):
        return f"Panier de {self.user.username}"

    def ajouter_produit_pan(self, produit, quantite=1):
        ligne, created = LignePanier.objects.get_or_create(
            panier=self, produit=produit,
            defaults={'quantite_ligne_pan': quantite}
        )
        if not created:
            ligne.quantite_ligne_pan += quantite
            ligne.save()
        return ligne

    def supprimer_produit_pan(self, produit):
        LignePanier.objects.filter(panier=self, produit=produit).delete()

    def vider_panier(self):
        self.lignes.all().delete()

    def calculer_total_pan(self):
        return sum(ligne.calculer_sous_total_ligne_pan() for ligne in self.lignes.all())


class LignePanier(models.Model):
    id_ligne_pan = models.AutoField(primary_key=True)
    date_creation_ligne_pan = models.DateTimeField(auto_now_add=True)
    quantite_ligne_pan = models.PositiveIntegerField(default=1)
    panier = models.ForeignKey(Panier, on_delete=models.CASCADE, related_name='lignes')
    produit = models.ForeignKey(Produit, on_delete=models.CASCADE)

    def modifier_quantite_ligne_pan(self, qte: int):
        self.quantite_ligne_pan = qte
        self.save()

    def calculer_sous_total_ligne_pan(self) -> float:
        return self.quantite_ligne_pan * self.produit.prix_prod


class Commande(models.Model):
    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('confirmee', 'Confirmée'),
        ('annulee', 'Annulée'),
    ]
    id_comm = models.AutoField(primary_key=True)
    date_commande = models.DateTimeField(auto_now_add=True)
    montant_total_comm = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    statut_comm = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='commandes')

    def __str__(self):
        return f"Commande #{self.id_comm} - {self.user.username}"

    def confirmer_comm(self):
        self.statut_comm = 'confirmee'
        self.save()

    def annuler_comm(self):
        self.statut_comm = 'annulee'
        self.save()


class LigneDeCommande(models.Model):
    id_ligne_comm = models.AutoField(primary_key=True)
    quantite_ligne_comm = models.PositiveIntegerField()
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2)
    commande = models.ForeignKey(Commande, on_delete=models.CASCADE, related_name='lignes')
    produit = models.ForeignKey(Produit, on_delete=models.CASCADE)

    def sous_total_ligne_comm(self):
        return self.quantite_ligne_comm * self.prix_unitaire