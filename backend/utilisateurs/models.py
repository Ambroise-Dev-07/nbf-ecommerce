from django.contrib.auth.models import AbstractUser
from django.contrib.auth import authenticate
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = [
        ('client', 'Client'),
        ('admin', 'Admin'),
    ]
    telephone_user = models.CharField(max_length=20, blank=True)
    adresse_user = models.CharField(max_length=255, blank=True)
    role_user = models.CharField(max_length=10, choices=ROLE_CHOICES, default='client')

    def __str__(self):
        return self.username

    def se_connecter_user(self, username, password):
        return authenticate(username=username, password=password)

    def ajouter_au_panier_user(self, produit, quantite=1):
        from commandes.models import Panier, LignePanier
        panier, _ = Panier.objects.get_or_create(user=self)
        ligne, created = LignePanier.objects.get_or_create(
            panier=panier, produit=produit,
            defaults={'quantite_ligne_pan': quantite}
        )
        if not created:
            ligne.quantite_ligne_pan += quantite
            ligne.save()
        return ligne

    def passer_commande_user(self):
        from commandes.models import Panier, Commande, LigneDeCommande
        panier = Panier.objects.get(user=self)
        commande = Commande.objects.create(user=self, montant_total_comm=0, statut_comm='en_attente')
        total = 0
        for ligne_pan in panier.lignes.all():
            LigneDeCommande.objects.create(
                commande=commande,
                produit=ligne_pan.produit,
                quantite_ligne_comm=ligne_pan.quantite_ligne_pan,
                prix_unitaire=ligne_pan.produit.prix_prod,
            )
            total += ligne_pan.quantite_ligne_pan * ligne_pan.produit.prix_prod
        commande.montant_total_comm = total
        commande.save()
        panier.lignes.all().delete()
        return commande