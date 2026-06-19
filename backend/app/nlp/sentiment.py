from datetime import datetime
import os
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

from app.database.database import db
from app.database.models import Post, CleanedText, SentimentResult, University

analyzer = SentimentIntensityAnalyzer()
xlm_pipeline = None

XLM_MODEL_NAME = os.getenv(
    "SENTIMENT_XLM_MODEL",
    "cardiffnlp/twitter-xlm-roberta-base-sentiment",
)
FALLBACK_XLM_MODEL_NAME = os.getenv(
    "SENTIMENT_FALLBACK_MODEL",
    "nlptown/bert-base-multilingual-uncased-sentiment",
)
XLM_LABEL_MAP = {
    "label_0": "negative",
    "label_1": "neutral",
    "label_2": "positive",
    "negative": "negative",
    "neutral": "neutral",
    "positive": "positive",
    "1 star": "negative",
    "2 stars": "negative",
    "3 stars": "neutral",
    "4 stars": "positive",
    "5 stars": "positive",
}

EVENT_KEYWORDS = [
    "election", "announcement", "inauguration", "policy", "protest",
    "launch", "strike", "award", "appointment", "resignation",
    "scandal", "ceremony", "agreement", "funding", "grant",
    "accreditation", "ranking", "closure",
]

def run_vader(text: str) -> float:
    return analyzer.polarity_scores(text)["compound"]

def vader_label(vader_score: float) -> str:
    if vader_score >= 0.05:
        return "positive"
    if vader_score <= -0.05:
        return "negative"
    return "neutral"

def get_xlm_pipeline():
    global xlm_pipeline

    if xlm_pipeline is None:
        try:
            from transformers import (
                AutoModelForSequenceClassification,
                AutoTokenizer,
                pipeline,
            )
        except ImportError as exc:
            raise RuntimeError(
                "XLM-RoBERTa requires transformers, torch, and sentencepiece. "
                "Install them with: pip install transformers torch sentencepiece"
            ) from exc

        try:
            tokenizer = AutoTokenizer.from_pretrained(
                XLM_MODEL_NAME,
                use_fast=True,
            )
            model = AutoModelForSequenceClassification.from_pretrained(
                XLM_MODEL_NAME,
                use_safetensors=False,
            )
        except Exception:
            tokenizer = AutoTokenizer.from_pretrained(
                FALLBACK_XLM_MODEL_NAME,
                use_fast=True,
            )
            model = AutoModelForSequenceClassification.from_pretrained(
                FALLBACK_XLM_MODEL_NAME,
                use_safetensors=False,
            )

        xlm_pipeline = pipeline(
            "sentiment-analysis",
            model=model,
            tokenizer=tokenizer,
        )

    return xlm_pipeline

def run_xlm(text: str) -> str:
    classifier = get_xlm_pipeline()
    result = classifier(
        text,
        truncation=True,
        max_length=512,
    )[0]
    raw_label = result["label"].lower()

    return XLM_LABEL_MAP.get(raw_label, raw_label)

def resolve_label(vader_score: float, xlm_label: str | None = None) -> str:
    label = vader_label(vader_score)

    if not xlm_label:
        return label

    if xlm_label == label:
        return xlm_label

    if label == "neutral":
        return xlm_label

    if xlm_label == "neutral":
        return label

    return xlm_label

def detect_event(text: str) -> bool:
    text_lower = text.lower()
    return any(keyword in text_lower for keyword in EVENT_KEYWORDS)

def compute_sentiment_index(university_id: int) -> float:
    university = University.query.get(university_id)

    if not university:
        return 0.0

    results = SentimentResult.query.join(
        Post,
        SentimentResult.post_id == Post.id
    ).filter(
        Post.university_id == university_id,
        Post.is_deleted.is_(False),
        SentimentResult.final_label.isnot(None),
    ).all()

    total = len(results)

    if total == 0:
        university.sentiment_index = 0.0
        db.session.commit()
        return university.sentiment_index

    positive = sum(1 for result in results if result.final_label == "positive")
    negative = sum(1 for result in results if result.final_label == "negative")

    index = (((positive - negative) / total) + 1) * 50
    university.sentiment_index = round(max(0, min(100, index)), 2)

    db.session.commit()

    return university.sentiment_index

def process_sentiment(post_id: int, use_xlm: bool = True):
    post = Post.query.get(post_id)
    cleaned = CleanedText.query.filter_by(post_id=post_id).first()

    if not post or not cleaned:
        return None

    score = run_vader(cleaned.cleaned_content)
    try:
        xlm_label = run_xlm(cleaned.cleaned_content) if use_xlm else None
    except Exception as exc:
        print(f"XLM failed for post {post_id}; using VADER only: {exc}")
        xlm_label = None

    label = resolve_label(score, xlm_label)
    is_event = detect_event(cleaned.cleaned_content)

    existing = SentimentResult.query.filter_by(post_id=post_id).first()

    if existing:
        existing.vader_score = score
        existing.xlm_label = xlm_label
        existing.final_label = label
        existing.is_event = is_event
        existing.classified_at = datetime.utcnow()
    else:
        db.session.add(SentimentResult(
            post_id=post_id,
            vader_score=score,
            xlm_label=xlm_label,
            final_label=label,
            is_event=is_event,
            classified_at=datetime.utcnow()
        ))

    db.session.commit()

    return {
        "label": label,
        "university_id": post.university_id,
        "is_event": is_event,
    }

def process_all_sentiments(use_xlm: bool = True):
    cleaned_records = CleanedText.query.all()
    count = 0
    university_ids = set()

    for cleaned in cleaned_records:
        result = process_sentiment(cleaned.post_id, use_xlm)
        if result:
            count += 1
            university_ids.add(result["university_id"])

    for university_id in university_ids:
        compute_sentiment_index(university_id)

    return count
