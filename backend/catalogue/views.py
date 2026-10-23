from rest_framework import permissions, viewsets

from .models import Categorie, Marque, Produit
from .serializers import CategorieSerializer, MarqueSerializer, ProduitSerializer


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return (
            request.user.is_authenticated
            and request.user.role_user == 'admin'
        )


class CategorieViewSet(viewsets.ModelViewSet):
    queryset = Categorie.objects.all().order_by('nom_cat')
    serializer_class = CategorieSerializer
    permission_classes = [IsAdminOrReadOnly]


class MarqueViewSet(viewsets.ModelViewSet):
    queryset = Marque.objects.all().order_by('nom_marq')
    serializer_class = MarqueSerializer
    permission_classes = [IsAdminOrReadOnly]


class ProduitViewSet(viewsets.ModelViewSet):
    serializer_class = ProduitSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        queryset = Produit.objects.select_related(
            'categorie', 'marque'
        ).order_by('nom_prod')

        categorie = self.request.query_params.get('categorie')
        marque = self.request.query_params.get('marque')
        recherche = self.request.query_params.get('recherche')

        if categorie:
            queryset = queryset.filter(categorie_id=categorie)
        if marque:
            queryset = queryset.filter(marque_id=marque)
        if recherche:
            queryset = queryset.filter(nom_prod__icontains=recherche)
        return queryset
