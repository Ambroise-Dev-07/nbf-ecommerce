from decimal import Decimal

from django.db import transaction
from django.db.models import Count, Sum
from rest_framework import permissions, status, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from catalogue.models import Produit
from utilisateurs.models import User

from .models import Commande, LigneDeCommande, LignePanier, Panier
from .serializers import (
    CommandeAdminSerializer,
    CommandeSerializer,
    LigneDeCommandeSerializer,
    LignePanierSerializer,
    PanierSerializer,
)


class PanierViewSet(viewsets.ModelViewSet):
    serializer_class = PanierSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Panier.objects.filter(user=self.request.user).prefetch_related(
            'lignes__produit__categorie',
            'lignes__produit__marque',
        )

    def create(self, request, *args, **kwargs):
        """Retourne le panier de l'utilisateur (créé si nécessaire)."""
        panier, cree = Panier.objects.get_or_create(user=request.user)
        return Response(
            self.get_serializer(panier).data,
            status=status.HTTP_201_CREATED if cree else status.HTTP_200_OK,
        )


class LignePanierViewSet(viewsets.ModelViewSet):
    serializer_class = LignePanierSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return LignePanier.objects.filter(
            panier__user=self.request.user
        ).select_related('produit', 'produit__categorie', 'produit__marque')

    def create(self, request, *args, **kwargs):
        """Ajoute une ligne au panier en fusionnant avec une ligne existante."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        panier = serializer.validated_data['panier']
        produit = serializer.validated_data['produit']
        quantite = serializer.validated_data.get('quantite_ligne_pan', 1)

        ligne = panier.lignes.filter(produit=produit).first()
        if ligne is None:
            ligne = serializer.save()
            http_status = status.HTTP_201_CREATED
        else:
            nouvelle_quantite = ligne.quantite_ligne_pan + quantite
            if nouvelle_quantite > produit.stock_prod:
                raise ValidationError(
                    f"Stock insuffisant pour {produit.nom_prod} "
                    f"(disponible : {produit.stock_prod})."
                )
            ligne.quantite_ligne_pan = nouvelle_quantite
            ligne.save(update_fields=['quantite_ligne_pan'])
            http_status = status.HTTP_200_OK

        return Response(self.get_serializer(ligne).data, status=http_status)


class PeutModifierQueAdmin(permissions.BasePermission):
    """Lecture ouverte au propriétaire, écriture réservée aux administrateurs."""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return getattr(request.user, 'role_user', None) == 'admin'


class CommandeViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, PeutModifierQueAdmin]

    def get_serializer_class(self):
        if getattr(self.request.user, 'role_user', None) == 'admin':
            return CommandeAdminSerializer
        return CommandeSerializer

    def get_queryset(self):
        queryset = Commande.objects.select_related('user').prefetch_related(
            'lignes__produit__categorie',
            'lignes__produit__marque',
        )
        if getattr(self.request.user, 'role_user', None) == 'admin':
            return queryset
        return queryset.filter(user=self.request.user)

    @transaction.atomic
    def perform_create(self, serializer):
        try:
            panier = Panier.objects.get(user=self.request.user)
        except Panier.DoesNotExist:
            raise ValidationError("Aucun panier trouvé.")

        lignes_panier = list(panier.lignes.select_related('produit'))
        if not lignes_panier:
            raise ValidationError("Le panier est vide.")

        produits = {
            produit.id_prod: produit
            for produit in Produit.objects.select_for_update().filter(
                id_prod__in=[ligne.produit_id for ligne in lignes_panier]
            )
        }

        for ligne in lignes_panier:
            produit = produits[ligne.produit_id]
            if ligne.quantite_ligne_pan > produit.stock_prod:
                raise ValidationError(
                    f"Stock insuffisant pour {produit.nom_prod}."
                )

        commande = serializer.save(user=self.request.user, montant_total_comm=0)

        total = Decimal('0')
        for ligne in lignes_panier:
            produit = produits[ligne.produit_id]
            LigneDeCommande.objects.create(
                commande=commande,
                produit=produit,
                quantite_ligne_comm=ligne.quantite_ligne_pan,
                prix_unitaire=produit.prix_prod,
            )
            total += ligne.quantite_ligne_pan * produit.prix_prod

            produit.stock_prod -= ligne.quantite_ligne_pan
            produit.save(update_fields=['stock_prod'])

        commande.montant_total_comm = total
        commande.save(update_fields=['montant_total_comm'])

        panier.lignes.all().delete()


class LigneDeCommandeViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = LigneDeCommandeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = LigneDeCommande.objects.select_related(
            'produit', 'produit__categorie', 'produit__marque'
        )
        if getattr(self.request.user, 'role_user', None) == 'admin':
            return queryset
        return queryset.filter(commande__user=self.request.user)


class StatistiquesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role_user != 'admin':
            return Response(
                {'detail': 'Accès réservé aux administrateurs.'}, status=403
            )

        total_produits = Produit.objects.count()
        total_clients = User.objects.filter(role_user='client').count()
        total_commandes = Commande.objects.count()
        chiffre_affaires = Commande.objects.filter(
            statut_comm='confirmee'
        ).aggregate(total=Sum('montant_total_comm'))['total'] or 0

        commandes_par_statut = list(
            Commande.objects.values('statut_comm').annotate(total=Count('id_comm'))
        )

        top_produits = list(
            LigneDeCommande.objects.values('produit__nom_prod')
            .annotate(quantite_vendue=Sum('quantite_ligne_comm'))
            .order_by('-quantite_vendue')[:5]
        )

        return Response({
            'total_produits': total_produits,
            'total_clients': total_clients,
            'total_commandes': total_commandes,
            'chiffre_affaires': chiffre_affaires,
            'commandes_par_statut': commandes_par_statut,
            'top_produits': top_produits,
        })
