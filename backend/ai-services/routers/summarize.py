"""Summarization router — intelligent text summarization."""
import uuid
import re
import logging
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from models.schemas import SummarizationRequest, SummarizationResponse
from middleware.payment_guard import require_payment

logger = logging.getLogger("marketplace.summarize")
router = APIRouter()


def _extractive_summarize(text: str, max_sentences: int) -> str:
    """Simple extractive summarization using sentence scoring."""
    # Clean text
    text = re.sub(r'\s+', ' ', text).strip()
    sentences = re.split(r'(?<=[.!?])\s+', text)

    if len(sentences) <= max_sentences:
        return text

    # Score sentences by word frequency
    words = re.findall(r'\w+', text.lower())
    word_freq: dict = {}
    for word in words:
        if len(word) > 3:  # ignore short words
            word_freq[word] = word_freq.get(word, 0) + 1

    scores = []
    for i, sent in enumerate(sentences):
        score = 0
        sent_words = re.findall(r'\w+', sent.lower())
        for word in sent_words:
            score += word_freq.get(word, 0)
        # Boost first and last sentences
        if i == 0 or i == len(sentences) - 1:
            score *= 1.5
        scores.append((score, i, sent))

    # Pick top sentences, maintain order
    top = sorted(scores, reverse=True)[:max_sentences]
    top = sorted(top, key=lambda x: x[1])
    return " ".join(s[2] for s in top)


def _bullet_summarize(text: str, max_sentences: int) -> str:
    """Return bullet point summary."""
    summary = _extractive_summarize(text, max_sentences)
    sentences = re.split(r'(?<=[.!?])\s+', summary)
    return "\n".join(f"• {s.strip()}" for s in sentences if s.strip())


@router.post("")
async def summarize_text(request: Request, body: SummarizationRequest):
    """
    Summarize text with configurable styles.
    Requires X-Payment header with valid Algorand TX ID.
    """
    payment_result = await require_payment(request, "/api/summarize")

    original_words = len(body.text.split())

    try:
        if body.style == "bullet":
            summary = _bullet_summarize(body.text, body.max_sentences)
        elif body.style == "detailed":
            summary = _extractive_summarize(body.text, min(body.max_sentences + 2, 10))
        else:  # concise
            summary = _extractive_summarize(body.text, body.max_sentences)

        summary_words = len(summary.split())
        compression = round(1 - (summary_words / max(original_words, 1)), 2)

        logger.info(f"Summarization | style={body.style} | compression={compression:.0%}")

        return SummarizationResponse(
            original_text=body.text[:200] + "..." if len(body.text) > 200 else body.text,
            summary=summary,
            original_word_count=original_words,
            summary_word_count=summary_words,
            compression_ratio=compression,
            style=body.style,
            request_id=payment_result.get("tx_id") or uuid.uuid4().hex,
        )

    except Exception as e:
        logger.error(f"Summarization error: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Summarization failed", "detail": str(e)},
        )
