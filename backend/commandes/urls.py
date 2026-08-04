from rest_framework.routers import DefaultRouter
from .views import PanierViewSet, LignePanierViewSet, CommandeViewSet, LigneDeCommandeViewSet

router = DefaultRouter()
router.register('paniers', PanierViewSet, basename='panier')
router.register('lignes-panier', LignePanierViewSet, basename='lignepanier')
router.register('commandes', CommandeViewSet, basename='commande')
router.register('lignes-commande', LigneDeCommandeViewSet, basename='lignedecommande')

urlpatterns = router.urls