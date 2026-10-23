from rest_framework import serializers

from .models import Paiement


class PaiementSerializer(serializers.ModelSerializer):
    """Le montant et le statut sont calculés côté serveur, jamais par le client."""

    class Meta:
        model = Paiement
        fields = '__all__'
        read_only_fields = [
            'montant_paie',
            'statut_paie',
            'reference_transaction',
            'date_paiement',
        ]
