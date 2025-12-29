from rest_framework import serializers

from . import models


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Organization
        fields = "__all__"


class DocumentSerializer(serializers.ModelSerializer):
    b64 = serializers.CharField(write_only=True)

    class Meta:
        model = models.Document
        fields = "__all__"


class MessageSerializer(serializers.ModelSerializer):
    role_name = serializers.ReadOnlyField(source="get_role_display")

    class Meta:
        model = models.Message
        fields = "__all__"


class ChatSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Chat
        fields = "__all__"
