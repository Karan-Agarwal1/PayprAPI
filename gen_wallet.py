from algosdk import account, mnemonic

private_key, address = account.generate_account()
mnemonic_phrase = mnemonic.from_private_key(private_key)

print("=" * 60)
print("   PayPerAPI Algorand Testnet Wallet")
print("=" * 60)
print(f"\n  Address  : {address}")
print(f"\n  Mnemonic : {mnemonic_phrase}")
print("\n" + "=" * 60)
print("  SAVE THESE - never share your mnemonic!")
print("=" * 60)
