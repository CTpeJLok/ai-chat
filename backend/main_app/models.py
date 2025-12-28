import base64
import uuid

from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from pgvector.django import VectorField

from main_app.llm import get_embedding, preprocess, split_text


class Organization(models.Model):
    name = models.CharField(
        max_length=255,
        verbose_name="Название",
    )

    documents: models.QuerySet["Document"]
    chats: models.QuerySet["Chat"]

    def __str__(self):
        return f"{self.name}"

    class Meta:
        verbose_name = "Организация"
        verbose_name_plural = "Организации"
        ordering = ["name"]
        db_table = "organization"


class Document(models.Model):
    organization = models.ForeignKey(
        to=Organization,
        on_delete=models.CASCADE,
        related_name="documents",
        verbose_name="Организация",
    )

    name = models.CharField(
        max_length=255,
        verbose_name="Название",
    )

    b64 = models.TextField(
        null=True,
        blank=True,
        verbose_name="Файл",
    )

    mime = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name="Тип файл",
    )

    is_embeddings_complete = models.BooleanField(
        default=False,
        verbose_name="Векторы получены",
    )

    text = models.TextField(
        null=True,
        blank=True,
        verbose_name="Текст",
    )

    embeddings: models.QuerySet["Embedding"]

    def __str__(self):
        return f"{self.organization} :: {self.name}"

    class Meta:
        verbose_name = "Документ"
        verbose_name_plural = "Документы"
        ordering = ["name"]
        db_table = "document"


class Embedding(models.Model):
    document = models.ForeignKey(
        to=Document,
        on_delete=models.CASCADE,
        related_name="embeddings",
        verbose_name="Документ",
    )

    text = models.TextField(
        null=True,
        blank=True,
        verbose_name="Текст",
    )

    vector = VectorField(
        dimensions=1536,
        null=True,
        blank=True,
        verbose_name="Вектор",
    )

    def __str__(self):
        return f"{self.document}"

    class Meta:
        verbose_name = "Вектор"
        verbose_name_plural = "Векторы"
        ordering = ["document"]
        db_table = "embedding"


class Chat(models.Model):
    organization = models.ForeignKey(
        to=Organization,
        on_delete=models.CASCADE,
        related_name="chats",
        verbose_name="Организация",
    )

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        verbose_name="ID",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Создан",
    )

    messages: models.QuerySet["Message"]

    def __str__(self):
        return f"{self.pk}"

    class Meta:
        verbose_name = "Чат"
        verbose_name_plural = "Чаты"
        ordering = ["-created_at"]
        db_table = "chat"


class Message(models.Model):
    ROLE_UNKNOWN = "unknown"
    ROLE_USER = "user"
    ROLE_ASSISTANT = "assistant"
    ROLE_CHOICES = [
        (ROLE_UNKNOWN, "Неизвестно"),
        (ROLE_USER, "Пользователь"),
        (ROLE_ASSISTANT, "Модель"),
    ]

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Создан",
    )

    chat = models.ForeignKey(
        to=Chat,
        on_delete=models.CASCADE,
        related_name="messages",
        verbose_name="Чат",
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default=ROLE_UNKNOWN,
        verbose_name="Роль",
    )

    text = models.TextField(
        null=True,
        blank=True,
        verbose_name="Текст",
    )

    def __str__(self):
        return f"{self.chat} :: {self.pk}"

    class Meta:
        verbose_name = "Сообщение"
        verbose_name_plural = "Сообщения"
        ordering = ["chat", "-pk"]
        db_table = "message"


@receiver(post_save, sender=Document)
def process_embedding(sender, instance, created, **kwargs):
    if not created:
        return

    try:
        # file name
        name_text = instance.name
        name_embedding = get_embedding(name_text)

        Embedding.objects.create(
            document=instance, text=name_text, vector=name_embedding
        )

        # file content
        b64: str = instance.b64.split(";base64,")[1]
        file_bytes: bytes = base64.b64decode(b64)

        text: str = ""
        if instance.mime == "application/pdf":
            text = ""
        else:
            text = file_bytes.decode("utf-8")

        instance.text = text

        text = preprocess(text)
        texts: list[str] = split_text(text)

        for i in texts:
            embedding = get_embedding(i)
            Embedding.objects.create(document=instance, text=i, vector=embedding)

        instance.is_embeddings_complete = True
        instance.save()
    except Exception as e:
        print(f"Embedding error: {str(e)}")
