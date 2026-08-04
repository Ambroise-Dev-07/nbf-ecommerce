from rest_framework.routers import DefaultRouter
from .views import CategorieViewSet, MarqueViewSet, ProduitViewSet

router = DefaultRouter()
router.register('categories', CategorieViewSet)
router.register('marques', MarqueViewSet)
router.register('produits', ProduitViewSet)

urlpatterns = router.urls