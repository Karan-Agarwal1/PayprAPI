"""Algorand blockchain service for payment verification."""
import os
import logging
import hashlib
import time
from typing import Optional, Dict, Any

logger = logging.getLogger("marketplace.algorand")

SIMULATION_MODE = os.getenv("SIMULATION_MODE", "true").lower() == "true"

# Track processed transactions to prevent replay attacks
_processed_txs: Dict[str, float] = {}


class AlgorandService:
    """
    Algorand payment verification service.
    Supports both simulation mode (for development) and real testnet verification.
    """

    def __init__(self):
        self.network = os.getenv("ALGORAND_NETWORK", "testnet")
        self.algod_url = os.getenv("ALGORAND_ALGOD_URL", "https://testnet-api.algonode.cloud")
        self.indexer_url = os.getenv("ALGORAND_INDEXER_URL", "https://testnet-idx.algonode.cloud")
        self.algod_token = os.getenv("ALGORAND_ALGOD_TOKEN", "")
        self.simulation_mode = SIMULATION_MODE
        self._client = None

        if not self.simulation_mode:
            self._init_client()

        logger.info(
            f"AlgorandService initialized | mode={'SIMULATION' if self.simulation_mode else 'REAL'} | network={self.network}"
        )

    def _init_client(self):
        """Initialize real Algorand client."""
        try:
            from algosdk.v2client import algod
            self._client = algod.AlgodClient(self.algod_token, self.algod_url)
            logger.info("Algorand algod client connected")
        except Exception as e:
            logger.error(f"Failed to init Algorand client: {e}")
            self.simulation_mode = True

    async def verify_payment(
        self,
        tx_id: str,
        expected_amount: float,
        recipient: str,
        endpoint: str,
    ) -> Dict[str, Any]:
        """
        Verify an Algorand payment transaction.
        Returns verification result with status and details.
        """
        # Replay attack prevention
        if tx_id in _processed_txs:
            return {
                "verified": False,
                "error": "Transaction already used (replay attack prevented)",
                "tx_id": tx_id,
            }

        if self.simulation_mode:
            result = await self._simulate_verify(tx_id, expected_amount, recipient)
        else:
            result = await self._real_verify(tx_id, expected_amount, recipient)

        # Mark as processed if verified
        if result.get("verified"):
            _processed_txs[tx_id] = time.time()

        return result

    async def _simulate_verify(
        self, tx_id: str, expected_amount: float, recipient: str
    ) -> Dict[str, Any]:
        """
        Simulation mode: validate transaction format and return success.
        TX IDs starting with 'FAIL' will simulate failed payments.
        """
        await _async_sleep(0.1)  # Simulate network latency

        if tx_id.upper().startswith("FAIL"):
            return {
                "verified": False,
                "error": "Simulated payment failure",
                "tx_id": tx_id,
            }

        # Validate TX ID format (Algorand TX IDs are 52 chars base32)
        if len(tx_id) < 10:
            return {
                "verified": False,
                "error": "Invalid transaction ID format",
                "tx_id": tx_id,
            }

        # Simulate dynamic sender address from TX hash
        sender_hash = hashlib.md5(tx_id.encode()).hexdigest()[:16].upper()

        return {
            "verified": True,
            "tx_id": tx_id,
            "amount": expected_amount,
            "sender": f"ALGO{sender_hash}SIMULATED",
            "recipient": recipient,
            "network": self.network,
            "block": int(time.time() * 1000) % 99999999,
            "simulation": True,
        }

    async def _real_verify(
        self, tx_id: str, expected_amount: float, recipient: str
    ) -> Dict[str, Any]:
        """Real Algorand testnet verification via algod/indexer."""
        try:
            import httpx
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(
                    f"{self.indexer_url}/v2/transactions/{tx_id}",
                    headers={"Accept": "application/json"},
                )
                if resp.status_code != 200:
                    return {"verified": False, "error": f"Transaction not found: {tx_id}", "tx_id": tx_id}

                tx = resp.json().get("transaction", {})
                payment = tx.get("payment-transaction", {})
                actual_amount = payment.get("amount", 0) / 1_000_000  # microALGO → ALGO

                if tx.get("payment-transaction", {}).get("receiver") != recipient:
                    return {"verified": False, "error": "Wrong recipient", "tx_id": tx_id}

                if actual_amount < expected_amount * 0.99:  # 1% tolerance
                    return {
                        "verified": False,
                        "error": f"Insufficient payment: got {actual_amount} ALGO, need {expected_amount} ALGO",
                        "tx_id": tx_id,
                    }

                return {
                    "verified": True,
                    "tx_id": tx_id,
                    "amount": actual_amount,
                    "sender": tx.get("sender"),
                    "recipient": recipient,
                    "network": self.network,
                    "block": tx.get("confirmed-round"),
                    "simulation": False,
                }
        except Exception as e:
            logger.error(f"Algorand verification error: {e}")
            return {"verified": False, "error": str(e), "tx_id": tx_id}

    def get_payment_instructions(
        self,
        endpoint: str,
        amount: float,
        memo: str,
    ) -> Dict[str, Any]:
        """Return X402-compliant payment instructions."""
        recipient = os.getenv("PROVIDER_WALLET_ADDRESS", "TESTPROVIDERWALLETADDRESSHERE7EXAMPLE")
        return {
            "x402Version": 1,
            "error": "Payment Required",
            "accepts": [
                {
                    "scheme": "algorand",
                    "network": self.network,
                    "amount": str(amount),
                    "currency": "ALGO",
                    "recipient": recipient,
                    "memo": memo,
                }
            ],
            "memo": memo,
            "endpoint": endpoint,
        }


async def _async_sleep(seconds: float):
    """Async sleep helper."""
    import asyncio
    await asyncio.sleep(seconds)


# Singleton instance
algorand_service = AlgorandService()
