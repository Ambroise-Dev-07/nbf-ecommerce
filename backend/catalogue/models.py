from django.db import models

class Categorie(models.Model):
    id_cat = models.AutoField(primary_key=True)
    nom_cat = models.CharField(max_length=100)
    description_cat = models.TextField(blank=True)

    def __str__(self):
        return self.nom_cat

    def ajouter_produit_cat(self, produit):
        produit.categorie = self
        produit.save()


class Marque(models.Model):
    id_marq = models.AutoField(primary_key=True)
    nom_marq = models.CharField(max_length=100)
    description_marq = models.TextField(blank=True)

    def __str__(self):
        return self.nom_marq

    def ajouter_produit_marq(self, produit):
        produit.marque = self
        produit.save()


class Produit(models.Model):
    id_prod = models.AutoField(primary_key=True)
    nom_prod = models.CharField(max_length=200)
    description_prod = models.TextField(blank=True)
    prix_prod = models.DecimalField(max_digits=10, decimal_places=2)
    stock_prod = models.PositiveIntegerField(default=0)
    image_prod = models.ImageField(upload_to='produits/', blank=True, null=True)
    categorie = models.ForeignKey(Categorie, on_delete=models.CASCADE, related_name='produits')
    marque = models.ForeignKey(Marque, on_delete=models.CASCADE, related_name='produits')

    def __str__(self):
        return self.nom_prod

    def modifier_stock_prod(self, quantite):
        self.stock_prod += quantite
        self.save()

    def calculer_prix_prod(self):
        return self.prix_prod