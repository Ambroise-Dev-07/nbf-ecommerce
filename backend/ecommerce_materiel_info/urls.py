from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import TokenRefreshView

from utilisateurs.views import ConnexionView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('catalogue.urls')),
    path('api/', include('commandes.urls')),
    path('api/', include('utilisateurs.urls')),
    path('api/', include('paiements.urls')),
    path('api/token/', ConnexionView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
