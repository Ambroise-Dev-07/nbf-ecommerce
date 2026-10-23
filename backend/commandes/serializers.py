from rest_framework import serializers

from catalogue.models import Produit
from catalogue.serializers import ProduitSerializer

from .models import Commande, LigneDeCommande, LignePanier, Panier


class LignePanierSerializer(serializers.ModelSerializer):
    produit = ProduitSerializer(read_only=True)
    produit_id = serializers.PrimaryKeyRelatedField(
        queryset=Produit.objects.all(), source='produit', write_only=True
    )

    class Meta:
        model = LignePanier
        fields = '__all__'

    def validate(self, attrs):
        request = self.context.get('request')

        panier = attrs.get('panier') or getattr(self.instance, 'panier', None)
        if panier is not None and request is not None and panier.user_id != request.user.id:
            raise serializers.ValidationError(
                "Ce panier n'appartient pas à l'utilisateur connecté."
            )

        produit = attrs.get('produit') or getattr(self.instance, 'produit', None)
        quantite = attrs.get(
            'quantite_ligne_pan',
            getattr(self.instance, 'quantite_ligne_pan', 1),
        )
        if produit is not None and quantite > produit.stock_prod:
            raise serializers.ValidationError(
                f"Stock insuffisant pour {produit.nom_prod} "
                f"(disponible : {produit.stock_prod})."
            )
        return attrs


class PanierSerializer(serializers.ModelSerializer):
    lignes = LignePanierSerializer(many=True, read_only=True)

    class Meta:
        model = Panier
        fields = '__all__'
        read_only_fields = ['user', 'date_creation_pan']


class LigneDeCommandeSerializer(serializers.ModelSerializer):
    produit = ProduitSerializer(read_only=True)

    class Meta:
        model = LigneDeCommande
        fields = '__all__'
        read_only_fields = [
            'commande',
            'quantite_ligne_comm',
            'prix_unitaire',
        ]


class CommandeSerializer(serializers.ModelSerializer):
    """Sérialiseur côté client : le statut et le montant sont en lecture seule."""

    lignes = LigneDeCommandeSerializer(many=True, read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Commande
        fields = '__all__'
        read_only_fields = [
            'user',
            'date_commande',
            'montant_total_comm',
            'statut_comm',
        ]


class CommandeAdminSerializer(CommandeSerializer):
    """Sérialiseur côté admin : seul le statut reste modifiable."""

    class Meta(CommandeSerializer.Meta):
        read_only_fields = ['user', 'date_commande', 'montant_total_comm']
