from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import RegisterSerializer


class ConnexionView(TokenObtainPairView):
    """Connexion JWT avec limitation du nombre de tentatives."""

    throttle_scope = 'login'


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_scope = 'register'


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'telephone_user': user.telephone_user,
            'adresse_user': user.adresse_user,
            'role_user': user.role_user,
        })
