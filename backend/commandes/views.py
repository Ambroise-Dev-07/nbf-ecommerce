from rest_framework import viewsets, permissions
from .models import Panier, LignePanier, Commande, LigneDeCommande
from .serializers import PanierSerializer, LignePanierSerializer, CommandeSerializer, LigneDeCommandeSerializer
from rest_framework.exceptions import ValidationError
from .models import Panier

class PanierViewSet(viewsets.ModelViewSet):
    serializer_class = PanierSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Panier.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class LignePanierViewSet(viewsets.ModelViewSet):
    serializer_class = LignePanierSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return LignePanier.objects.filter(panier__user=self.request.user)





class CommandeViewSet(viewsets.ModelViewSet):
    serializer_class = CommandeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role_user == 'admin':
            return Commande.objects.all()
        return Commande.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        try:
            panier = Panier.objects.get(user=self.request.user)
        except Panier.DoesNotExist:
            raise ValidationError("Aucun panier trouvé.")

        lignes_panier = panier.lignes.all()
        if not lignes_panier.exists():
            raise ValidationError("Le panier est vide.")

        for ligne in lignes_panier:
            if ligne.quantite_ligne_pan > ligne.produit.stock_prod:
                raise ValidationError(f"Stock insuffisant pour {ligne.produit.nom_prod}.")

        commande = serializer.save(user=self.request.user, montant_total_comm=0)

        total = 0
        for ligne in lignes_panier:
            LigneDeCommande.objects.create(
                commande=commande,
                produit=ligne.produit,
                quantite_ligne_comm=ligne.quantite_ligne_pan,
                prix_unitaire=ligne.produit.prix_prod,
            )
            total += ligne.quantite_ligne_pan * ligne.produit.prix_prod

            produit = ligne.produit
            produit.stock_prod -= ligne.quantite_ligne_pan
            produit.save()

        commande.montant_total_comm = total
        commande.save()

        lignes_panier.delete()

class LigneDeCommandeViewSet(viewsets.ModelViewSet):
    serializer_class = LigneDeCommandeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return LigneDeCommande.objects.filter(commande__user=self.request.user)