import pandas as pd
from pathlib import Path
import sys

from exception import CustomException
from logger import logging


# ---------------------------------------------------------
# PROJECT PATHS
# ---------------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parent.parent
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"


# ---------------------------------------------------------
# LOAD CLEAN DATA
# ---------------------------------------------------------

def load_data():

    transactions = pd.read_csv(
        PROCESSED_DIR / "upi_transactions_clean.csv",
        dtype=str
    )

    kyc = pd.read_csv(
        PROCESSED_DIR / "kyc_clean.csv",
        dtype=str
    )

    merchants = pd.read_csv(
        PROCESSED_DIR / "merchants_clean.csv",
        dtype=str
    )

    chargebacks = pd.read_csv(
        PROCESSED_DIR / "chargebacks_clean.csv",
        dtype=str
    )

    return transactions, kyc, merchants, chargebacks


# ---------------------------------------------------------
# MAIN VALIDATION
# ---------------------------------------------------------

def validate_data():

    try:

        logging.info("Starting relationship validation.")

        transactions, kyc, merchants, chargebacks = load_data()

        # -------------------------------------------------
        # MASTER ID SETS
        # -------------------------------------------------

        kyc_users = set(kyc["user_id"].dropna())

        merchant_ids = set(merchants["merchant_id"].dropna())

        transaction_ids = set(transactions["txn_id"].dropna())

        # -------------------------------------------------
        # FOREIGN KEY CHECKS
        # -------------------------------------------------

        txn_user_missing = transactions["user_id"].isna()

        txn_user_unmatched = (
            transactions["user_id"].notna()
            & ~transactions["user_id"].isin(kyc_users)
        )

        txn_merchant_missing = transactions["merchant_id"].isna()

        txn_merchant_unmatched = (
            transactions["merchant_id"].notna()
            & ~transactions["merchant_id"].isin(merchant_ids)
        )

        cb_txn_missing = chargebacks["txn_id"].isna()

        cb_txn_unmatched = (
            chargebacks["txn_id"].notna()
            & ~chargebacks["txn_id"].isin(transaction_ids)
        )

        cb_user_missing = chargebacks["user_id"].isna()

        cb_user_unmatched = (
            chargebacks["user_id"].notna()
            & ~chargebacks["user_id"].isin(kyc_users)
        )

        cb_merchant_missing = chargebacks["merchant_id"].isna()

        cb_merchant_unmatched = (
            chargebacks["merchant_id"].notna()
            & ~chargebacks["merchant_id"].isin(merchant_ids)
        )

        # -------------------------------------------------
        # ENTITY DUPLICATES
        # -------------------------------------------------

        duplicate_kyc_users = kyc["user_id"].duplicated(
            keep=False
        )

        duplicate_merchants = merchants["merchant_id"].duplicated(
            keep=False
        )

        # -------------------------------------------------
        # TIMELINE CHECKS
        # -------------------------------------------------

        chargebacks["transaction_timestamp"] = pd.to_datetime(
            chargebacks["transaction_timestamp"],
            errors="coerce"
        )

        chargebacks["reported_timestamp"] = pd.to_datetime(
            chargebacks["reported_timestamp"],
            errors="coerce"
        )

        chargebacks["bank_response_timestamp"] = pd.to_datetime(
            chargebacks["bank_response_timestamp"],
            errors="coerce"
        )

        reported_before_transaction = (
            chargebacks["reported_timestamp"]
            < chargebacks["transaction_timestamp"]
        )

        bank_before_report = (
            chargebacks["bank_response_timestamp"]
            < chargebacks["reported_timestamp"]
        )

        # -------------------------------------------------
        # CREATE DATA QUALITY REPORT
        # -------------------------------------------------

        report = pd.DataFrame({

            "check": [
                "Transaction user_id missing",
                "Transaction user_id unmatched",
                "Transaction merchant_id missing",
                "Transaction merchant_id unmatched",
                "Chargeback txn_id missing",
                "Chargeback txn_id unmatched",
                "Chargeback user_id missing",
                "Chargeback user_id unmatched",
                "Chargeback merchant_id missing",
                "Chargeback merchant_id unmatched",
                "Repeated KYC user_id",
                "Repeated merchant_id",
                "Reported before transaction",
                "Bank response before report"
            ],

            "count": [
                txn_user_missing.sum(),
                txn_user_unmatched.sum(),
                txn_merchant_missing.sum(),
                txn_merchant_unmatched.sum(),
                cb_txn_missing.sum(),
                cb_txn_unmatched.sum(),
                cb_user_missing.sum(),
                cb_user_unmatched.sum(),
                cb_merchant_missing.sum(),
                cb_merchant_unmatched.sum(),
                duplicate_kyc_users.sum(),
                duplicate_merchants.sum(),
                reported_before_transaction.sum(),
                bank_before_report.sum()
            ]
        })

        # -------------------------------------------------
        # SAVE REPORT
        # -------------------------------------------------

        output_file = PROCESSED_DIR / "data_quality_report.csv"

        report.to_csv(
            output_file,
            index=False
        )

        # -------------------------------------------------
        # DISPLAY RESULTS
        # -------------------------------------------------

        print("\n" + "=" * 65)
        print("DATA QUALITY VALIDATION")
        print("=" * 65)

        print("\nFOREIGN KEY VALIDATION")
        print("-" * 65)

        print(
            "Transaction user_id   - missing   :",
            txn_user_missing.sum()
        )

        print(
            "Transaction user_id   - unmatched :",
            txn_user_unmatched.sum()
        )

        print(
            "Transaction merchant  - missing   :",
            txn_merchant_missing.sum()
        )

        print(
            "Transaction merchant  - unmatched :",
            txn_merchant_unmatched.sum()
        )

        print(
            "Chargeback txn_id     - missing   :",
            cb_txn_missing.sum()
        )

        print(
            "Chargeback txn_id     - unmatched :",
            cb_txn_unmatched.sum()
        )

        print(
            "Chargeback user_id    - missing   :",
            cb_user_missing.sum()
        )

        print(
            "Chargeback user_id    - unmatched :",
            cb_user_unmatched.sum()
        )

        print(
            "Chargeback merchant   - missing   :",
            cb_merchant_missing.sum()
        )

        print(
            "Chargeback merchant   - unmatched :",
            cb_merchant_unmatched.sum()
        )

        print("\nENTITY CONSISTENCY")
        print("-" * 65)

        print(
            "Repeated KYC user_id  :",
            duplicate_kyc_users.sum()
        )

        print(
            "Repeated merchant_id  :",
            duplicate_merchants.sum()
        )

        print("\nTIMELINE VALIDATION")
        print("-" * 65)

        print(
            "Reported before transaction :",
            reported_before_transaction.sum()
        )

        print(
            "Bank response before report :",
            bank_before_report.sum()
        )

        print("\n" + "=" * 65)
        print("VALIDATION COMPLETE")
        print("=" * 65)

        print(
            "\nData quality report saved to:",
            output_file
        )

        logging.info("Relationship validation completed successfully.")

    except Exception as error:

        logging.error("Relationship validation failed.")

        raise CustomException(error, sys)


# ---------------------------------------------------------
# RUN
# ---------------------------------------------------------

if __name__ == "__main__":
    validate_data()