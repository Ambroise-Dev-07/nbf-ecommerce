from django.contrib import admin

from .models import Paiement


@admin.register(Paiement)
class PaiementAdmin(admin.ModelAdmin):
    list_display = (
        'id_paie',
        'commande',
        'montant_paie',
        'methode_paie',
        'statut_paie',
        'date_paiement',
    )
    list_filter = ('statut_paie', 'methode_paie')
    search_fields = ('reference_transaction', 'commande__user__username')
    actions = ['marquer_valide', 'marquer_echoue']

    @admin.action(description="Marquer les paiements sélectionnés comme validés")
    def marquer_valide(self, request, queryset):
        for paiement in queryset:
            paiement.confirmer_paiement()

    @admin.action(description="Marquer les paiements sélectionnés comme échoués")
    def marquer_echoue(self, request, queryset):
        queryset.update(statut_paie='echoue')
