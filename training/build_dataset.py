"""
SehatSaathi — Build Dataset Script
Inspects, validates, and prints class distribution of dataset.csv.
Run this before training to ensure balanced, clean training data.
"""

import os
import pandas as pd


def inspect_dataset(csv_path: str = "dataset.csv") -> pd.DataFrame:
    """Load and print summary of the training dataset."""
    if not os.path.exists(csv_path):
        # Fallback path if run from root directory
        csv_path = os.path.join(os.path.dirname(__file__), "dataset.csv")

    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Dataset CSV not found at '{csv_path}'")

    df = pd.read_csv(csv_path)
    print("=" * 50)
    print("SehatSaathi Training Dataset Summary")
    print("=" * 50)
    print(f"Total Rows: {len(df)}")
    print("\nClass Distribution:")
    counts = df["urgency_level"].value_counts()
    for label, count in counts.items():
        percentage = (count / len(df)) * 100
        print(f"  - {label:<12}: {count:>4} rows ({percentage:.1f}%)")

    print("\nMissing values:")
    print(df.isnull().sum())

    print("\nSample Rows:")
    print(df.head(5))
    print("=" * 50)

    return df


if __name__ == "__main__":
    inspect_dataset()
