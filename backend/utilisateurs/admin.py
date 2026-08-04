from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Infos supplémentaires', {'fields': ('telephone_user', 'adresse_user', 'role_user')}),
    )

admin.site.register(User, CustomUserAdmin)