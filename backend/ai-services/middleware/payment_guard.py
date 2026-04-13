"""
X402 Payment Guard Middleware
Validates X-Payment header before granting AI service access.
"""
import os
import uuid
import logging
from typing import Optional
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse

from services.algorand import algorand_service

logger = logging.getLogger("marketplace.payment_guard")


ENDPOINT_PRICES = {
    "/api/translate": 0.001,
    "/api/summarize": 0.002,
    "/api/sentiment": 0.001,
    "/api/image/generate": 0.005,
}


async def require_payment(request: Request, endpoint: str) -> dict:
    """
    X402 Payment Guard.
    - If no X-Payment header → return 402 with payment instructions
    - If X-Payment present → verify on Algorand → proceed or reject
    """
    # If Gateway already verified this request, fast-path it
    if request.headers.get("x-payment-verified") == "true":
        return {"verified": True, "tx_id": request.headers.get("x-payment-tx-id")}

    payment_header = request.headers.get("X-Payment") or request.headers.get("x-payment")
    amount = ENDPOINT_PRICES.get(endpoint, 0.001)
    memo = f"{endpoint}:{uuid.uuid4().hex[:8]}"

    if not payment_header:
        instructions = algorand_service.get_payment_instructions(endpoint, amount, memo)
        raise HTTPException(
            status_code=402,
            detail=instructions,
            headers={"X-402-Version": "1"},
        )

    # Parse payment header: format is "txid:<TRANSACTION_ID>"
    parts = payment_header.strip().split(":")
    if len(parts) < 2 or parts[0].lower() != "txid":
        raise HTTPException(
            status_code=400,
            detail={"error": "Invalid X-Payment format. Use: X-Payment: txid:<ALGORAND_TX_ID>"},
        )

    tx_id = ":".join(parts[1:]).strip()
    recipient = os.getenv("PROVIDER_WALLET_ADDRESS", "TESTPROVIDERWALLETADDRESSHERE7EXAMPLE")

    result = await algorand_service.verify_payment(
        tx_id=tx_id,
        expected_amount=amount,
        recipient=recipient,
        endpoint=endpoint,
    )

    if not result.get("verified"):
        raise HTTPException(
            status_code=402,
            detail={
                "error": "Payment verification failed",
                "reason": result.get("error"),
                "tx_id": tx_id,
            },
        )

    logger.info(f"✓ Payment verified | tx={tx_id} | endpoint={endpoint} | amount={amount} ALGO")
    return result
