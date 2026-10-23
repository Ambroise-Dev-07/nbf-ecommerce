from django.contrib.auth import authenticate
from django.contrib.auth.models import AbstractUser
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
        from commandes.models import LignePanier, Panier

        panier, _ = Panier.objects.get_or_create(user=self)
        ligne, created = LignePanier.objects.get_or_create(
            panier=panier,
            produit=produit,
            defaults={'quantite_ligne_pan': quantite},
        )
        if not created:
            ligne.quantite_ligne_pan += quantite
            ligne.save(update_fields=['quantite_ligne_pan'])
        return ligne
