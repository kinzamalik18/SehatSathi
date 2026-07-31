"""
SehatSaathi — Classifier Training Script
Trains a LogisticRegression head on top of frozen multilingual sentence embeddings.

Can be run locally or uploaded to Google Colab.

Outputs:
  - classifier_head.joblib -> Place this in backend/models/
"""

import os
import pandas as pd
from sentence_transformers import SentenceTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
import joblib

EMBEDDING_MODEL_NAME = "intfloat/multilingual-e5-small"
OUTPUT_MODEL_PATH = "classifier_head.joblib"


def train():
    # 1. Load dataset
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(script_dir, "dataset.csv")

    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Dataset not found at {csv_path}")

    print(f"Loading training dataset from {csv_path}...")
    df = pd.read_csv(csv_path)
    print(f"Loaded {len(df)} rows.")

    # 2. Load multilingual sentence embedder
    print(f"Loading embedding model '{EMBEDDING_MODEL_NAME}'...")
    embedder = SentenceTransformer(EMBEDDING_MODEL_NAME)

    # 3. Generate embeddings for symptom texts
    # e5 models perform best when prefixed with 'passage: ' for text embeddings
    texts = [f"passage: {t}" for t in df["text"].tolist()]
    print("Generating sentence embeddings...")
    X = embedder.encode(texts, show_progress_bar=True)
    y = df["urgency_level"]

    # 4. Train / test split (stratified by urgency class)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )

    # 5. Fit Logistic Regression classifier head
    # class_weight='balanced' ensures emergency cases are heavily weighted
    print("Training LogisticRegression classifier head...")
    clf = LogisticRegression(max_iter=1000, class_weight="balanced", C=1.0)
    clf.fit(X_train, y_train)

    # 6. Evaluate on test set
    y_pred = clf.predict(X_test)
    print("\n" + "=" * 50)
    print("CLASSIFICATION REPORT (Test Set)")
    print("=" * 50)
    print(classification_report(y_test, y_pred))

    print("\nCONFUSION MATRIX:")
    labels = list(set(y))
    cm = confusion_matrix(y_test, y_pred, labels=labels)
    cm_df = pd.DataFrame(cm, index=labels, columns=labels)
    print(cm_df)

    # 7. Save trained classifier head artifact
    output_dir = os.path.join(script_dir, "..", "backend", "models")
    os.makedirs(output_dir, exist_ok=True)
    model_dest = os.path.join(output_dir, OUTPUT_MODEL_PATH)

    joblib.dump(clf, model_dest)
    print(f"\nModel saved successfully to: {model_dest}")
    print("Place this file in backend/models/ on your deployment server.")


if __name__ == "__main__":
    train()
