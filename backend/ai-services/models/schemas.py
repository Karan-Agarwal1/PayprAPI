"""Pydantic models for AI service request/response schemas."""
from typing import Optional, List
from pydantic import BaseModel, Field


# ── Translation ──────────────────────────────────────────────────────────────
class TranslationRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000, description="Text to translate")
    source_lang: str = Field(default="auto", description="Source language code (e.g. 'en', 'auto')")
    target_lang: str = Field(default="es", description="Target language code (e.g. 'es', 'fr')")

class TranslationResponse(BaseModel):
    original_text: str
    translated_text: str
    source_lang: str
    target_lang: str
    confidence: float
    service: str = "PayprAPI Translation"
    request_id: str


# ── Summarization ────────────────────────────────────────────────────────────
class SummarizationRequest(BaseModel):
    text: str = Field(..., min_length=50, max_length=10000, description="Text to summarize")
    max_sentences: int = Field(default=3, ge=1, le=10, description="Max summary sentences")
    style: str = Field(default="concise", description="Summary style: concise | detailed | bullet")

class SummarizationResponse(BaseModel):
    original_text: str
    summary: str
    original_word_count: int
    summary_word_count: int
    compression_ratio: float
    style: str
    service: str = "PayprAPI Summarization"
    request_id: str


# ── Sentiment Analysis ───────────────────────────────────────────────────────
class SentimentRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000, description="Text to analyze")
    granular: bool = Field(default=True, description="Return granular emotion scores")

class EmotionScores(BaseModel):
    joy: float
    sadness: float
    anger: float
    fear: float
    surprise: float
    disgust: float

class SentimentResponse(BaseModel):
    text: str
    sentiment: str  # positive | negative | neutral
    confidence: float
    polarity: float  # -1.0 to 1.0
    subjectivity: float  # 0.0 to 1.0
    emotions: Optional[EmotionScores] = None
    service: str = "PayprAPI Sentiment Analysis"
    request_id: str


# ── Image Generation ─────────────────────────────────────────────────────────
class ImageGenerationRequest(BaseModel):
    prompt: str = Field(..., min_length=3, max_length=1500, description="Image generation prompt")
    style: str = Field(
        default="realistic",
        description="Style: realistic | anime | digital-art | cinematic | oil-painting | watercolor | 3d-render | fantasy | pixel-art | sketch"
    )
    width: int = Field(default=1024, ge=256, le=1280, description="Image width")
    height: int = Field(default=1024, ge=256, le=1280, description="Image height")
    negative_prompt: Optional[str] = Field(default=None, description="What to avoid in the image")

class ImageGenerationResponse(BaseModel):
    prompt: str
    image_url: str
    width: int
    height: int
    style: str
    seed: int
    service: str = "PayprAPI Image Generation"
    request_id: str


# ── Payment ──────────────────────────────────────────────────────────────────
class PaymentVerification(BaseModel):
    tx_id: str
    amount: float
    sender: str
    recipient: str
    network: str = "testnet"

class X402Response(BaseModel):
    """HTTP 402 Payment Required response body"""
    x402_version: int = 1
    error: str = "Payment Required"
    accepts: List[dict]
    memo: str
    endpoint: str
