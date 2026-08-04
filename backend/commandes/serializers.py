from rest_framework import serializers
from .models import Panier, LignePanier, Commande, LigneDeCommande
from catalogue.serializers import ProduitSerializer
from catalogue.models import Produit


class LignePanierSerializer(serializers.ModelSerializer):
    produit = ProduitSerializer(read_only=True)
    produit_id = serializers.PrimaryKeyRelatedField(
        queryset=Produit.objects.all(), source='produit', write_only=True
    )

    class Meta:
        model = LignePanier
        fields = '__all__'


class PanierSerializer(serializers.ModelSerializer):
    lignes = LignePanierSerializer(many=True, read_only=True)

    class Meta:
        model = Panier
        fields = '__all__'
        read_only_fields = ['user']



#  LigneDeCommande

class LigneDeCommandeSerializer(serializers.ModelSerializer):
    produit = ProduitSerializer(read_only=True)
    produit_id = serializers.PrimaryKeyRelatedField(
        queryset=Produit.objects.all(), source='produit', write_only=True
    )

    class Meta:
        model = LigneDeCommande
        fields = '__all__'


class CommandeSerializer(serializers.ModelSerializer):
    lignes = LigneDeCommandeSerializer(many=True, read_only=True)

    class Meta:
        model = Commande
        fields = '__all__'
        read_only_fields = ['user']