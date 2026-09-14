import json
from pathlib import Path
import sys
import pandas as pd
from exception import CustomException
from logger import logging

PROJECT_ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = PROJECT_ROOT / "data" / "raw"
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"

# Make sure the processed-data folder exists.
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

def convert_chargebacks_json_to_csv():

    try:
        logging.info("Starting chargebacks JSON to CSV conversion.")

        json_file = RAW_DIR / "track1_chargebacks.json"
        csv_file = PROCESSED_DIR / "track1_chargebacks.csv"

        # Read the original JSON file.
        with open(json_file, "r", encoding="utf-8") as file:
            chargebacks_data = json.load(file)

        logging.info(
            f"Read {len(chargebacks_data):,} chargeback records."
        )

        # Convert JSON records into a DataFrame.
        chargebacks = pd.DataFrame(chargebacks_data)

        # Save the CSV.
        chargebacks.to_csv(csv_file, index=False)

        logging.info(
            f"Chargebacks CSV created: {csv_file}"
        )

        print(
            f"JSON records read: {len(chargebacks_data):,}"
        )

        print(
            f"CSV rows written: {len(chargebacks):,}"
        )

        print(
            f"CSV columns written: {len(chargebacks.columns)}"
        )

        print(f"Output: {csv_file}")

    except Exception as error:
        logging.exception(
            "Chargebacks JSON to CSV conversion failed."
        )

        raise CustomException(error, sys)


if __name__ == "__main__":
    convert_chargebacks_json_to_csv()