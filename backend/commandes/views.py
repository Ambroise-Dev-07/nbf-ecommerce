from rest_framework import viewsets, permissions
from .models import Panier, LignePanier, Commande, LigneDeCommande
from .serializers import PanierSerializer, LignePanierSerializer, CommandeSerializer, LigneDeCommandeSerializer
from rest_framework.exceptions import ValidationError
from .models import Panier
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, Count
from catalogue.models import Produit
from utilisateurs.models import User

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



class StatistiquesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role_user != 'admin':
            return Response({'detail': 'Accès réservé aux administrateurs.'}, status=403)

        total_produits = Produit.objects.count()
        total_clients = User.objects.filter(role_user='client').count()
        total_commandes = Commande.objects.count()
        chiffre_affaires = Commande.objects.filter(statut_comm='confirmee').aggregate(
            total=Sum('montant_total_comm')
        )['total'] or 0

        commandes_par_statut = list(
            Commande.objects.values('statut_comm').annotate(total=Count('id_comm'))
        )

        top_produits = list(
            LigneDeCommande.objects.values('produit__nom_prod').annotate(
                quantite_vendue=Sum('quantite_ligne_comm')
            ).order_by('-quantite_vendue')[:5]
        )

        return Response({
            'total_produits': total_produits,
            'total_clients': total_clients,
            'total_commandes': total_commandes,
            'chiffre_affaires': chiffre_affaires,
            'commandes_par_statut': commandes_par_statut,
            'top_produits': top_produits,
        })