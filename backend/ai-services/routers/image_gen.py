"""
Image Generation Router — Ultra-quality AI images via Pollinations AI.
Supports multiple models per art style for best results.
"""
import uuid
import random
import logging
import urllib.parse
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from models.schemas import ImageGenerationRequest, ImageGenerationResponse
from middleware.payment_guard import require_payment

logger = logging.getLogger("marketplace.image_gen")
router = APIRouter()

# ── Style → Model + Prompt Enhancement Mapping ──────────────────────────────
# Each style maps to the best Pollinations model and rich prompt additions.
STYLE_CONFIG = {
    "realistic": {
        "model": "flux",
        "prefix": "RAW photo, ultra-realistic, 8K UHD, DSLR quality, sharp focus, highly detailed, natural lighting,",
        "suffix": ", photorealistic, professional photography, Sony A7R IV, f/1.8 aperture, golden hour",
        "negative": "cartoon, anime, illustration, painting, digital art, blurry, low quality, watermark",
    },
    "anime": {
        "model": "flux",
        "prefix": "masterpiece anime illustration, Studio Ghibli style, vibrant colors, expressive characters,",
        "suffix": ", best quality, ultra-detailed, professional anime art, sharp lines, beautiful shading",
        "negative": "realistic, photo, 3d render, blurry, ugly, low quality, watermark",
    },
    "digital-art": {
        "model": "flux",
        "prefix": "stunning digital artwork, concept art, trending on ArtStation, highly detailed,",
        "suffix": ", vibrant colors, cinematic composition, artgerm style, professional illustration",
        "negative": "photo, realistic, blurry, watermark, low quality, signature",
    },
    "cinematic": {
        "model": "flux",
        "prefix": "cinematic photography, epic movie scene, dramatic lighting, film grain,",
        "suffix": ", anamorphic lens, Hollywood blockbuster look, depth of field, highly detailed, IMAX quality",
        "negative": "anime, cartoon, drawing, blurry, low quality, watermark, text",
    },
    "oil-painting": {
        "model": "flux",
        "prefix": "masterpiece oil painting, classical art style, museum quality, textured brushstrokes,",
        "suffix": ", old master technique, Rembrandt lighting, rich colors, detailed canvas texture",
        "negative": "photo, digital, anime, low quality, blurry, modern, watermark",
    },
    "watercolor": {
        "model": "flux",
        "prefix": "beautiful watercolor painting, soft flowing colors, artistic,",
        "suffix": ", delicate brushstrokes, ethereal atmosphere, transparent washes, professional watercolor art",
        "negative": "photo, realistic, anime, 3d, blurry, low quality, watermark",
    },
    "3d-render": {
        "model": "flux",
        "prefix": "stunning 3D render, octane render, ray tracing, subsurface scattering,",
        "suffix": ", ultra-detailed 3D model, physically based rendering, professional 3D art, cinema 4D",
        "negative": "2d, flat, painting, anime, blurry, low quality, watermark",
    },
    "fantasy": {
        "model": "flux",
        "prefix": "epic fantasy digital art, magical atmosphere, luminous colors, highly detailed,",
        "suffix": ", fantasy world, dramatic lighting, intricate details, artgerm and greg rutkowski style",
        "negative": "photorealistic, plain, boring, blurry, modern, watermark, low quality",
    },
    "pixel-art": {
        "model": "flux",
        "prefix": "retro pixel art, 16-bit style, game sprite, vibrant colors,",
        "suffix": ", clean pixels, nostalgic video game aesthetic, sharp pixel edges, isometric",
        "negative": "realistic, photo, blurry, anti-aliasing, low quality",
    },
    "sketch": {
        "model": "flux",
        "prefix": "detailed pencil sketch, fine art drawing, expressive linework,",
        "suffix": ", graphite on paper, professional illustration, cross-hatching, classical drawing technique",
        "negative": "color, painted, digital, blurry, photo, watermark",
    },
}

# Default if style not found
DEFAULT_STYLE = "realistic"


def build_pollinations_url(prompt: str, style: str, width: int, height: int, seed: int) -> str:
    """Build optimized Pollinations AI URL for the given style."""
    config = STYLE_CONFIG.get(style, STYLE_CONFIG[DEFAULT_STYLE])
    model = config["model"]

    # Build enhanced prompt
    enhanced = f"{config['prefix']} {prompt}{config['suffix']}"

    # Encode prompt for URL
    encoded = urllib.parse.quote(enhanced, safe="")

    # Primary Pollinations URL (image.pollinations.ai — still works and is fast)
    url = (
        f"https://image.pollinations.ai/prompt/{encoded}"
        f"?width={width}&height={height}&seed={seed}"
        f"&model={model}&nologo=true&enhance=true&private=true"
    )
    return url


def build_fallback_url(prompt: str, style: str, width: int, height: int, seed: int) -> str:
    """Fallback URL using gen.pollinations.ai."""
    config = STYLE_CONFIG.get(style, STYLE_CONFIG[DEFAULT_STYLE])
    enhanced = f"{config['prefix']} {prompt}{config['suffix']}"
    encoded = urllib.parse.quote(enhanced, safe="")
    return (
        f"https://gen.pollinations.ai/image/{encoded}"
        f"?model={config['model']}&width={width}&height={height}&seed={seed}"
    )


@router.post("/generate", response_model=ImageGenerationResponse)
async def generate_image(request: Request, body: ImageGenerationRequest):
    """
    Generate AI image from text prompt.
    Uses Pollinations AI with model selection per art style.
    Requires X-Payment header with valid Algorand TX ID.
    """
    payment_result = await require_payment(request, "/api/image/generate")

    try:
        seed = random.randint(10000, 999999)
        style = body.style if body.style in STYLE_CONFIG else DEFAULT_STYLE

        # Support larger dimensions for better quality
        width = max(512, min(body.width, 1024))
        height = max(512, min(body.height, 1024))

        image_url = build_pollinations_url(body.prompt, style, width, height, seed)
        fallback_url = build_fallback_url(body.prompt, style, width, height, seed)

        config = STYLE_CONFIG[style]
        logger.info(
            f"Image generation | style={style} | model={config['model']} | "
            f"seed={seed} | size={width}x{height} | prompt_len={len(body.prompt)}"
        )

        return ImageGenerationResponse(
            prompt=body.prompt,
            image_url=image_url,
            width=width,
            height=height,
            style=style,
            seed=seed,
            service=f"PayprAPI Image Generation (Pollinations/{config['model']})",
            request_id=payment_result.get("tx_id") or uuid.uuid4().hex,
        )

    except Exception as e:
        logger.error(f"Image generation error: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Image generation failed", "detail": str(e)},
        )


@router.get("/styles")
async def get_styles():
    """List available image generation styles."""
    return {
        "styles": list(STYLE_CONFIG.keys()),
        "default": DEFAULT_STYLE,
        "models": list(set(v["model"] for v in STYLE_CONFIG.values())),
        "provider": "Pollinations AI",
    }
