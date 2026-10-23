from django.db import transaction
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from commandes.models import Commande

from .models import Paiement
from .serializers import PaiementSerializer


class PaiementViewSet(viewsets.ModelViewSet):
    serializer_class = PaiementSerializer
    permission_classes = [permissions.IsAuthenticated]
    # Un paiement ne se modifie ni ne se supprime depuis l'API.
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        queryset = Paiement.objects.select_related('commande', 'commande__user')
        if getattr(self.request.user, 'role_user', None) == 'admin':
            return queryset
        return queryset.filter(commande__user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phone_number = request.data.get('phone_number')
        if not phone_number:
            raise ValidationError(
                {'phone_number': "Le numéro de téléphone est obligatoire."}
            )

        commande_id = serializer.validated_data['commande'].pk

        with transaction.atomic():
            # Verrouille la commande : deux demandes simultanées ne peuvent
            # pas créer deux paiements pour la même commande.
            commande = Commande.objects.select_for_update().get(pk=commande_id)

            if commande.user_id != request.user.id:
                raise PermissionDenied("Cette commande ne vous appartient pas.")
            if commande.statut_comm == 'annulee':
                raise ValidationError("Impossible de payer une commande annulée.")
            if commande.paiements.filter(
                statut_paie__in=['en_attente', 'valide']
            ).exists():
                raise ValidationError(
                    "Un paiement est déjà en cours ou validé pour cette commande."
                )
            if commande.montant_total_comm <= 0:
                raise ValidationError(
                    "Le montant de la commande doit être supérieur à zéro."
                )

            paiement = Paiement.objects.create(
                commande=commande,
                montant_paie=commande.montant_total_comm,
                methode_paie=serializer.validated_data['methode_paie'],
                statut_paie='en_attente',
            )
            # Appel HTTP externe (hors verrou ideal, mais le paiement doit
            # exister avant l'envoi pour servir d'identifiant PayGate).
            paiement.initier_paiement(phone_number)

        if paiement.statut_paie == 'echoue':
            return Response(
                {
                    'detail': "Le paiement a été refusé par l'opérateur.",
                    'paiement': self.get_serializer(paiement).data,
                },
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        return Response(
            self.get_serializer(paiement).data, status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'])
    def verifier(self, request, pk=None):
        """Interroge PayGate et met à jour le statut du paiement."""
        paiement = self.get_object()
        paiement.rafraichir_statut()
        paiement.refresh_from_db()
        return Response(self.get_serializer(paiement).data)
