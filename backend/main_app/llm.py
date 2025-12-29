import json
import re

import aiohttp
import requests

from core.settings import OPENAI_TOKEN

HEADERS = {
    "Authorization": f"Bearer {OPENAI_TOKEN}",
}

URL = "https://api.proxyapi.ru/openai/v1"


def preprocess(text: str) -> str:
    text = text.replace("\n", " ").strip()
    text = re.sub(r"\s+", " ", text)
    return text


def split_text(text: str, chunk_size=128, overlap_size=32) -> list[str]:
    words = text.split()
    chunks = []
    current_chunk = ""
    for i in words:
        cur_str = current_chunk + " " + i
        if len(cur_str) >= chunk_size:
            if len(cur_str) > chunk_size + overlap_size:
                current_chunk = cur_str[: chunk_size + overlap_size]
                chunks.append(current_chunk)
                current_chunk = cur_str[chunk_size + overlap_size :]
                continue

            chunks.append(cur_str)
            current_chunk = ""
            continue

        current_chunk += (" " if len(current_chunk) > 0 else "") + i

    if current_chunk:
        chunks.append(current_chunk)

    return chunks


def get_embedding(text: str):
    response: requests.Response = requests.post(
        f"{URL}/embeddings",
        headers=HEADERS,
        json={
            "model": "text-embedding-3-small",
            "input": text,
        },
    )
    response.raise_for_status()
    data = response.json()

    embedding = data["data"][0]["embedding"]
    return embedding


async def get_answer(messages_list: list):
    async with aiohttp.TCPConnector() as conn:
        async with aiohttp.ClientSession(connector=conn) as session:
            async with session.post(
                f"{URL}/chat/completions",
                headers=HEADERS,
                json={
                    "model": "gpt-5",
                    "messages": messages_list,
                    "stream": True,
                },
            ) as r:
                async for line in r.content:
                    chunk = line.decode("utf-8").strip()
                    # print([chunk])

                    if not chunk:
                        continue

                    if chunk.startswith("data: "):
                        clean_line = chunk[len("data: ") :]
                        if clean_line == "[DONE]":
                            break

                        data = json.loads(clean_line)

                        choices = data["choices"]
                        if choices:
                            delta = choices[0]["delta"]
                            if "content" in delta:
                                yield f"data: {json.dumps({
                                    'text': delta['content']
                                })}\n\n"
