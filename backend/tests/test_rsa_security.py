import pytest
from app.core.security import RSAKeyManager, create_access_token, decode_token

def test_rsa_key_generation_and_pem_export():
    pem = RSAKeyManager.get_public_pem()
    assert pem.startswith("-----BEGIN PUBLIC KEY-----")
    assert pem.strip().endswith("-----END PUBLIC KEY-----")

def test_rsa_encryption_and_decryption_cycle():
    sensitive_payload = "kiosk_terminal_42:txn_987654321:amount=1450.00"
    encrypted_b64 = RSAKeyManager.encrypt_payload(sensitive_payload)
    
    assert encrypted_b64 != sensitive_payload
    assert len(encrypted_b64) > 50

    decrypted = RSAKeyManager.decrypt_payload(encrypted_b64)
    assert decrypted == sensitive_payload

def test_rsa_payload_signing_and_verification():
    order_data = "OrderEase:order_id=987:total=520.00:status=PAID"
    signature_b64 = RSAKeyManager.sign_payload(order_data)
    
    assert len(signature_b64) > 50
    # Valid signature
    assert RSAKeyManager.verify_signature(order_data, signature_b64) is True
    # Tampered signature or data
    assert RSAKeyManager.verify_signature(order_data + "_tampered", signature_b64) is False

@pytest.mark.asyncio
async def test_rsa_public_key_api_endpoint(client):
    response = await client.get("/api/v1/auth/public-key")
    assert response.status_code == 200
    data = response.json()
    assert data["algorithm"] == "RSA-OAEP-256"
    assert data["key_size"] == "2048"
    assert "-----BEGIN PUBLIC KEY-----" in data["public_key"]

@pytest.mark.asyncio
async def test_rsa_decrypt_api_endpoint(client):
    secret_text = "kiosk_pin_verification_passcode_9912"
    encrypted = RSAKeyManager.encrypt_payload(secret_text)
    
    response = await client.post(
        "/api/v1/auth/decrypt-test",
        json={"encrypted_payload": encrypted}
    )
    assert response.status_code == 200
    assert response.json()["decrypted_data"] == secret_text

