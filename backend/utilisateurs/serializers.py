from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'password',
            'first_name',
            'last_name',
            'telephone_user',
            'adresse_user',
        ]

    def validate_username(self, value):
        return value.strip()

    def validate_email(self, value):
        email = (value or '').strip().lower()
        if email and User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                "Un compte utilise déjà cette adresse email."
            )
        return email

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages))
        return value

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            telephone_user=validated_data.get('telephone_user', ''),
            adresse_user=validated_data.get('adresse_user', ''),
        )
