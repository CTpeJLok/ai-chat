from django.contrib import admin

from . import models


@admin.register(models.Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = [
        "pk",
        "name",
    ]


class EmbeddingInline(admin.StackedInline):
    model = models.Embedding
    extra = 0


@admin.register(models.Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = [
        "pk",
        "organization",
        "name",
        "mime",
    ]

    inlines = [EmbeddingInline]


@admin.register(models.Embedding)
class EmbeddingAdmin(admin.ModelAdmin):
    list_display = [
        "document",
        "pk",
    ]


@admin.register(models.Chat)
class ChatAdmin(admin.ModelAdmin):
    list_display = [
        "pk",
        "created_at",
    ]


@admin.register(models.Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = [
        "pk",
        "chat",
        "created_at",
        "role",
    ]
