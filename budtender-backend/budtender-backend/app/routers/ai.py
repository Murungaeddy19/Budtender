import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from app.auth import get_current_user
import app.models as models

router = APIRouter(prefix="/ai", tags=["AI Budtender"])

ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"

# ⚠️ Replace with your actual Anthropic API key
# In production, load this from an environment variable:
# import os; ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
ANTHROPIC_API_KEY = "your-anthropic-api-key-here"

PRODUCTS_CONTEXT = """
Blue Dream (flower, recreational, THC:22%, CBD:1%, $45, effect: Euphoric & Creative)
CBD Relief Tincture (tincture, medical, THC:0.3%, CBD:25%, $65, effect: Calm & Pain Relief)
OG Kush (flower, recreational, THC:26%, CBD:0.5%, $55, effect: Relaxing & Sleepy)
1:1 Balance Capsules (capsule, medical, THC:10mg, CBD:10mg, $40, effect: Balanced & Therapeutic)
Mango Haze Vape (vape, recreational, THC:85%, CBD:2%, $50, effect: Uplifting & Focused)
Sleep & Restore Gummies (edible, medical, THC:5mg, CBD:15mg, $35, effect: Sedating & Restful)
Strawberry Cough (flower, recreational, THC:20%, CBD:0.8%, $48, effect: Social & Happy)
Pain Relief Balm (topical, medical, THC:100mg, CBD:200mg, $55, effect: Localized Relief)
Gelato #33 (flower, recreational, THC:25%, CBD:0.6%, $60, effect: Euphoric & Relaxed)
"""

SYSTEM_PROMPT = f"""You are a knowledgeable, friendly AI budtender at a cannabis dispensary called Budtender.
You help customers find the right cannabis products for their needs.
You have expertise in both recreational and medical cannabis use.
Be warm, professional, and helpful. Keep responses concise (2-4 sentences).
Reference specific products from our menu when relevant.

Our current menu:
{PRODUCTS_CONTEXT}"""


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]


class ChatResponse(BaseModel):
    reply: str


@router.post("/chat", response_model=ChatResponse)
async def ai_chat(
    request: ChatRequest,
    current_user: models.User = Depends(get_current_user),
):
    if not ANTHROPIC_API_KEY or ANTHROPIC_API_KEY == "your-anthropic-api-key-here":
        raise HTTPException(status_code=500, detail="Anthropic API key not configured")

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                ANTHROPIC_API_URL,
                headers={
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-sonnet-4-20250514",
                    "max_tokens": 1000,
                    "system": SYSTEM_PROMPT,
                    "messages": [m.dict() for m in request.messages],
                },
                timeout=30.0,
            )
            response.raise_for_status()
            data = response.json()
            reply = data["content"][0]["text"]
            return ChatResponse(reply=reply)

        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=502, detail=f"AI service error: {e.response.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
