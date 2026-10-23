from rest_framework.routers import DefaultRouter
from .views import PanierViewSet, LignePanierViewSet, CommandeViewSet, LigneDeCommandeViewSet, StatistiquesView
from django.urls import path

router = DefaultRouter()
router.register('paniers', PanierViewSet, basename='panier')
router.register('lignes-panier', LignePanierViewSet, basename='lignepanier')
router.register('commandes', CommandeViewSet, basename='commande')
router.register('lignes-commande', LigneDeCommandeViewSet, basename='lignedecommande')

urlpatterns = router.urls + [
    path('statistiques/', StatistiquesView.as_view(), name='statistiques'),
]