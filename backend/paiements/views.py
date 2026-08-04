from rest_framework import viewsets, permissions
from .models import Paiement
from .serializers import PaiementSerializer


class PaiementViewSet(viewsets.ModelViewSet):
    serializer_class = PaiementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Paiement.objects.filter(commande__user=self.request.user)

    def perform_create(self, serializer):
        phone_number = self.request.data.get('phone_number')
        paiement = serializer.save()
        paiement.initier_paiement(phone_number)