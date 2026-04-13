"""Sentiment analysis router — multi-dimensional emotion detection."""
import uuid
import math
import logging
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from models.schemas import SentimentRequest, SentimentResponse, EmotionScores
from middleware.payment_guard import require_payment

logger = logging.getLogger("marketplace.sentiment")
router = APIRouter()


def _analyze_sentiment(text: str):
    """
    Multi-approach sentiment analysis.
    Uses TextBlob if available, falls back to lexicon-based approach.
    """
    try:
        from textblob import TextBlob
        blob = TextBlob(text)
        polarity = blob.sentiment.polarity
        subjectivity = blob.sentiment.subjectivity
        return polarity, subjectivity
    except ImportError:
        pass

    # Lexicon-based fallback
    positive_words = {
        "amazing", "great", "excellent", "wonderful", "fantastic", "love", "loved",
        "best", "good", "happy", "joy", "excited", "brilliant", "perfect", "awesome",
        "outstanding", "superb", "incredible", "beautiful", "positive", "helpful",
    }
    negative_words = {
        "terrible", "awful", "horrible", "hate", "hated", "worst", "bad", "sad",
        "disappointed", "frustrating", "broken", "failed", "wrong", "poor", "terrible",
        "disgusting", "annoying", "useless", "negative", "harmful", "waste",
    }

    words = text.lower().split()
    pos = sum(1 for w in words if w.strip(".,!?") in positive_words)
    neg = sum(1 for w in words if w.strip(".,!?") in negative_words)
    total = max(len(words), 1)

    polarity = (pos - neg) / total * 5
    polarity = max(-1.0, min(1.0, polarity))
    subjectivity = (pos + neg) / total * 3
    subjectivity = max(0.0, min(1.0, subjectivity))
    return polarity, subjectivity


def _generate_emotions(polarity: float, subjectivity: float) -> EmotionScores:
    """Generate pseudo-emotion scores from polarity/subjectivity."""
    # Map polarity to emotions
    joy = max(0.0, polarity) * subjectivity
    sadness = max(0.0, -polarity) * subjectivity
    anger = max(0.0, -polarity) * (1 - subjectivity) * 0.7
    fear = abs(polarity) * (1 - subjectivity) * 0.3
    surprise = (1 - abs(polarity)) * 0.4
    disgust = max(0.0, -polarity) * (1 - subjectivity) * 0.5

    # Normalize
    total = joy + sadness + anger + fear + surprise + disgust + 0.001

    return EmotionScores(
        joy=round(joy / total, 3),
        sadness=round(sadness / total, 3),
        anger=round(anger / total, 3),
        fear=round(fear / total, 3),
        surprise=round(surprise / total, 3),
        disgust=round(disgust / total, 3),
    )


@router.post("")
async def analyze_sentiment(request: Request, body: SentimentRequest):
    """
    Analyze text sentiment with emotion breakdown.
    Requires X-Payment header with valid Algorand TX ID.
    """
    payment_result = await require_payment(request, "/api/sentiment")

    try:
        polarity, subjectivity = _analyze_sentiment(body.text)

        # Determine sentiment label
        if polarity >= 0.05:
            sentiment = "positive"
        elif polarity <= -0.05:
            sentiment = "negative"
        else:
            sentiment = "neutral"

        # Confidence based on distance from neutral
        confidence = min(0.99, 0.5 + abs(polarity) * 0.5)

        emotions = _generate_emotions(polarity, subjectivity) if body.granular else None

        logger.info(f"Sentiment: {sentiment} | polarity={polarity:.3f} | conf={confidence:.3f}")

        return SentimentResponse(
            text=body.text[:200] + "..." if len(body.text) > 200 else body.text,
            sentiment=sentiment,
            confidence=round(confidence, 3),
            polarity=round(polarity, 3),
            subjectivity=round(subjectivity, 3),
            emotions=emotions,
            request_id=payment_result.get("tx_id") or uuid.uuid4().hex,
        )

    except Exception as e:
        logger.error(f"Sentiment error: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Sentiment analysis failed", "detail": str(e)},
        )
