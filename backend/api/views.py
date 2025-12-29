import base64
import json

from django.db.models import Min
from django.http import HttpResponse, StreamingHttpResponse
from django.tasks.base import sync_to_async
from pgvector.django import L2Distance
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from main_app import models, serializers
from main_app.llm import get_answer, get_embedding, preprocess


class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = models.Organization.objects.all()
    serializer_class = serializers.OrganizationSerializer

    @action(detail=True)
    def chats(self, request, *args, **kwargs) -> Response:
        organization = self.get_object()
        chats = organization.chats.all()
        serializer = serializers.ChatSerializer(chats, many=True)
        result = serializer.data
        return Response(result)

    @action(detail=True)
    def documents(self, request, *args, **kwargs) -> Response:
        organization = self.get_object()
        chats = organization.documents.all()
        serializer = serializers.DocumentSerializer(chats, many=True)
        result = serializer.data
        return Response(result)


class DocumentViewSet(viewsets.ModelViewSet):
    queryset = models.Document.objects.all()
    serializer_class = serializers.DocumentSerializer

    @action(detail=True)
    def download(self, request, *args, **kwargs) -> HttpResponse:
        document = self.get_object()

        b64 = document.b64.split(";base64,")[1]
        file_bytes = base64.b64decode(b64)

        response = HttpResponse(file_bytes, content_type=document.mime)
        response["Content-Disposition"] = f'attachment; filename="{document.name}"'
        return response


class ChatViewSet(viewsets.ModelViewSet):
    queryset = models.Chat.objects.all()
    serializer_class = serializers.ChatSerializer

    @action(detail=True)
    def messages(self, request, *args, **kwargs) -> Response:
        chat = self.get_object()
        messages = chat.messages.all()
        serializer = serializers.MessageSerializer(messages, many=True)
        result = serializer.data
        return Response(result)

    async def _message(self, chat: models.Chat, sources: list[list[str]]):
        messages: list[models.Message] = await sync_to_async(list)(chat.messages.all())

        messages_list = []

        messages_list.append(
            {
                "role": "system",
                "content": """
Ты — интеллектуальный ассистент, который отвечает на вопросы пользователя, используя предоставленные источники информации.

Правила работы:
1. Вопрос пользователя всегда нужно отвечать только на основе предоставленных источников.
2. Не добавляй информацию, которой нет в источниках.
3. Если ответ на вопрос не содержится в источниках, честно скажи: «По предоставленным данным ответа нет».
4. Всегда указывай, из какого источника взята информация (например, 'Источник 1', 'Источник 2').
5. Структурируй ответ понятно: краткий ответ + при необходимости развернутое пояснение.

Формат запроса к тебе:
Вопрос: <вопрос пользователя>
Источники:
[1] <текст источника 1>
[2] <текст источника 2>
...

Формат ответа:
Ответ: <краткий ответ>
Пояснение: <подробное объяснение на основе источников>
Источники: [1], [2]
""",
            }
        )

        for i in messages:
            messages_list.append({"role": i.role, "content": i.text})

        messages_list[-1][
            "content"
        ] += f"""
Источники:
{[f'[{i + 1}] {j}' for i, j in enumerate(sources)]}
"""

        answer_text = ""

        async for chunk in get_answer(messages_list):
            yield chunk

            if chunk.startswith("data: "):
                data = json.loads(chunk[len("data: ") :])
                answer_text += data.get("text", "")

        await models.Message.objects.acreate(
            chat=chat,
            role=models.Message.ROLE_ASSISTANT,
            text=answer_text,
        )

    def get_sources(
        self, organization: models.Organization, text: str
    ) -> list[list[str]]:
        text = preprocess(text)
        embedding = get_embedding(text)

        embeddings = models.Embedding.objects.annotate(
            distance=L2Distance("vector", embedding)
        ).filter(document__organization=organization)

        document_ids = (
            embeddings.values("document_id", "document__name")
            .annotate(min_distance=Min("distance"))
            .order_by("min_distance")
        )

        for i in document_ids[:5]:
            print("SOURCE", i["document_id"], i["min_distance"], i["document__name"])

        document_ids = [i["document_id"] for i in document_ids[:5]]

        document_texts = models.Document.objects.filter(
            pk__in=document_ids
        ).values_list("text", flat=True)

        result = []
        for i in document_texts[:5]:
            result.append(i.replace("\n", " "))

        return list(result)

    @action(detail=True, methods=["post"])
    def message(self, request, *args, **kwargs) -> StreamingHttpResponse:
        chat = self.get_object()

        models.Message.objects.create(
            chat=chat,
            role=models.Message.ROLE_USER,
            text=request.data["text"],
        )

        organization = chat.organization

        sources: list[list[str]] = self.get_sources(organization, request.data["text"])

        async def event():
            async for chunk in self._message(chat, sources):
                yield chunk.encode("utf-8")

        return StreamingHttpResponse(
            event(),
            content_type="text/event-stream",
        )
