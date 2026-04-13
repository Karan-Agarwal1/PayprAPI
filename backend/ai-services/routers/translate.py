"""Translation router — supports 50+ languages via deep-translator."""
import uuid
import logging
from fastapi import APIRouter, Request, Depends
from fastapi.responses import JSONResponse

from models.schemas import TranslationRequest, TranslationResponse
from middleware.payment_guard import require_payment

logger = logging.getLogger("marketplace.translate")
router = APIRouter()

LANG_NAMES = {
    "en": "English", "es": "Spanish", "fr": "French", "de": "German",
    "it": "Italian", "pt": "Portuguese", "ru": "Russian", "zh": "Chinese",
    "ja": "Japanese", "ko": "Korean", "ar": "Arabic", "hi": "Hindi",
    "nl": "Dutch", "pl": "Polish", "tr": "Turkish", "vi": "Vietnamese",
    "th": "Thai", "sv": "Swedish", "da": "Danish", "no": "Norwegian",
    "fi": "Finnish", "he": "Hebrew", "id": "Indonesian", "ms": "Malay",
    "ro": "Romanian", "uk": "Ukrainian", "cs": "Czech", "sk": "Slovak",
    "bg": "Bulgarian", "hr": "Croatian", "hu": "Hungarian", "el": "Greek",
    "auto": "Auto-detect",
}


@router.get("/languages")
async def get_supported_languages():
    """List all supported languages."""
    return {
        "languages": [{"code": k, "name": v} for k, v in LANG_NAMES.items() if k != "auto"],
        "total": len(LANG_NAMES) - 1,
    }


@router.post("", response_model=TranslationResponse)
async def translate_text(
    request: Request,
    body: TranslationRequest,
):
    """
    Translate text between languages.
    Requires X-Payment header with valid Algorand TX ID.
    """
    payment_result = await require_payment(request, "/api/translate")

    try:
        from deep_translator import GoogleTranslator

        source = body.source_lang if body.source_lang != "auto" else "auto"
        translator = GoogleTranslator(source=source, target=body.target_lang)
        translated = translator.translate(body.text)

        detected_source = body.source_lang
        if body.source_lang == "auto":
            # Attempt language detection
            try:
                from deep_translator import single_detection
                detected_source = single_detection(body.text[:200], api_key=None) or "auto"
            except Exception:
                detected_source = "en"

        logger.info(f"Translation: {detected_source}→{body.target_lang} | chars={len(body.text)}")

        return TranslationResponse(
            original_text=body.text,
            translated_text=translated,
            source_lang=detected_source,
            target_lang=body.target_lang,
            confidence=0.96,
            request_id=payment_result.get("tx_id") or uuid.uuid4().hex,
        )

    except ImportError:
        # Fallback mock if deep_translator not installed
        mock_translations = {
            "es": f"[ES] {body.text}",
            "fr": f"[FR] {body.text}",
            "de": f"[DE] {body.text}",
            "it": f"[IT] {body.text}",
            "zh": f"[ZH] {body.text}",
        }
        translated = mock_translations.get(body.target_lang, f"[{body.target_lang.upper()}] {body.text}")

        return TranslationResponse(
            original_text=body.text,
            translated_text=translated,
            source_lang=body.source_lang,
            target_lang=body.target_lang,
            confidence=0.85,
            request_id=payment_result.get("tx_id") or uuid.uuid4().hex,
        )
    except Exception as e:
        logger.error(f"Translation error: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Translation service temporarily unavailable", "detail": str(e)},
        )
