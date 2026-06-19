from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from app.main import app
from app.database.database import db

QUERY = """
SELECT m.true_label, s.final_label
FROM sentiment_manual_labels m
JOIN sentiment_results s ON s.post_id = m.post_id
WHERE s.final_label IS NOT NULL;
"""

with app.app_context():
    rows = db.session.execute(db.text(QUERY)).fetchall()

true_labels = [row.true_label for row in rows]
predicted_labels = [row.final_label for row in rows]

labels = ["positive", "negative", "neutral"]

print("Total labelled samples:", len(rows))
print("Accuracy:", accuracy_score(true_labels, predicted_labels))

print("\nClassification report:")
print(classification_report(
    true_labels,
    predicted_labels,
    labels=labels,
    zero_division=0
))

print("\nConfusion matrix:")
print("Labels:", labels)
print(confusion_matrix(
    true_labels,
    predicted_labels,
    labels=labels
))