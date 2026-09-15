import pandas as pd
import numpy as np

print("=== VERIFYING PROCESSED DATA (data/processed/) ===\n")

# 1. UPI Transactions Clean
upi = pd.read_csv('data/processed/upi_transactions_clean.csv')
total_upi_vol = upi['amount'].sum()
print(f"1. UPI TRANSACTIONS (CLEAN): {len(upi):,} rows")
print(f"   - Total Processed Volume: Rs. {total_upi_vol:,.2f} ({total_upi_vol/1e7:.2f} Cr)")
print(f"   - Mean Amount: Rs. {upi['amount'].mean():,.2f}")
print(f"   - Status Breakdown: {upi['status'].value_counts().to_dict()}")

# 2. Chargebacks Clean
cb = pd.read_csv('data/processed/chargebacks_clean.csv')
total_cb_amt = cb['disputed_amount'].sum()
print(f"\n2. CHARGEBACKS (CLEAN): {len(cb):,} rows")
print(f"   - Total Disputed Amount: Rs. {total_cb_amt:,.2f} ({total_cb_amt/1e5:.2f} Lakh)")
print(f"   - Resolution Status Counts: {cb['resolution_status'].value_counts().to_dict()}")
res_amt = cb.groupby('resolution_status')['disputed_amount'].sum().to_dict()
for status, amt in res_amt.items():
    print(f"     * {status}: Rs. {amt:,.2f} ({amt/1e5:.2f} Lakh)")
print(f"   - Channels Intake: {cb['channel'].value_counts().to_dict()}")
print(f"   - Severity Levels: {cb['severity'].value_counts().to_dict()}")

# 3. Merchants Clean
m = pd.read_csv('data/processed/merchants_clean.csv')
print(f"\n3. MERCHANTS (CLEAN): {len(m):,} rows")
print(f"   - Merchant Status Counts: {m['merchant_status'].value_counts().to_dict()}")
print(f"   - Active Merchants: {len(m[m['merchant_status'] == 'ACTIVE']):,} / {len(m):,}")

# 4. KYC Clean
kyc = pd.read_csv('data/processed/kyc_clean.csv')
print(f"\n4. KYC (CLEAN): {len(kyc):,} rows")
print(f"   - KYC Status: {kyc['kyc_status'].value_counts().to_dict()}")
print(f"   - Risk Segments: {kyc['risk_segment'].value_counts().to_dict()}")
passed_kyc = len(kyc[kyc['kyc_status'].str.upper().isin(['VERIFIED', 'COMPLETED', 'PASSED'])])
print(f"   - KYC Verified Count: {passed_kyc:,} ({passed_kyc/len(kyc)*100:.1f}%)")

# 5. Chargeback Transaction Summary
cb_sum = pd.read_csv('data/processed/chargeback_transaction_summary.csv')
print(f"\n5. CHARGEBACK TRANSACTION SUMMARY: {len(cb_sum):,} flagged transactions")
print(f"   - Total Disputed Amount: Rs. {cb_sum['chargeback_amount'].sum():,.2f}")
