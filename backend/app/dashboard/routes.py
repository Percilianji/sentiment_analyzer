from collections import Counter, defaultdict
from datetime import datetime

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import func

from app.database.database import db
from app.database.models import Post, SentimentResult, Summary, Topic, University
from app.auth.decorators import admin_required
from app.nlp.topic_classifier import DEFAULT_TOPIC_KEYWORDS


dashboard_bp = Blueprint("dashboard", __name__)


def percentage(part, total):
    if not total:
        return 0

    return round((part / total) * 100)


def clean_topic(topic):
    topic = (topic or "").strip()

    if not topic or topic.lower() == "unknown":
        return None

    return topic.title()


def unique_topics(topics):
    seen = set()
    cleaned_topics = []

    for topic in topics:
        cleaned_topic = clean_topic(topic)

        if not cleaned_topic or cleaned_topic.lower() in seen:
            continue

        seen.add(cleaned_topic.lower())
        cleaned_topics.append(cleaned_topic)

    return cleaned_topics


def display_topic(topic):
    topic = clean_topic(topic)

    if not topic:
        return None

    return topic.title()


def weekday_label(value):
    if not value:
        return None

    if isinstance(value, str):
        try:
            value = datetime.fromisoformat(value)
        except ValueError:
            return None

    return value.strftime("%a")


@dashboard_bp.route("/overview", methods=["GET"])
@jwt_required()
def overview():
    universities = University.query.filter_by(active=True).order_by(University.name.asc()).all()

    if not universities:
        universities = University.query.order_by(University.name.asc()).all()

    university_ids = [university.id for university in universities]

    if not university_ids:
        return jsonify({
            "universities": [],
            "top_topics": [],
            "weak_topics": [],
            "recent_items": [],
            "totals": {
                "active_universities": 0,
                "posts": 0,
                "sentiment_results": 0,
            },
        })

    sentiment_rows = db.session.query(Post, SentimentResult).join(
        SentimentResult,
        SentimentResult.post_id == Post.id,
    ).filter(
        Post.university_id.in_(university_ids),
        Post.is_deleted.is_(False),
        SentimentResult.final_label.isnot(None),
    ).all()
    post_ids = [post.id for post, _ in sentiment_rows]
    summaries_by_post_id = {
        summary.post_id: summary.summary_text
        for summary in Summary.query.filter(Summary.post_id.in_(post_ids)).all()
    } if post_ids else {}

    by_university = defaultdict(list)
    topic_counts = defaultdict(Counter)
    topic_positive_counts = defaultdict(Counter)
    topic_label_counts = defaultdict(lambda: defaultdict(Counter))
    topic_trend_counts = defaultdict(lambda: defaultdict(lambda: defaultdict(Counter)))

    for post, sentiment in sentiment_rows:
        by_university[post.university_id].append((post, sentiment))

        topic = clean_topic(post.topic)

        if not topic:
            continue

        topic_counts[post.university_id][topic] += 1
        topic_label_counts[post.university_id][topic][sentiment.final_label] += 1
        day = weekday_label(post.post_date or sentiment.post_date or sentiment.classified_at)

        if day:
            topic_trend_counts[post.university_id][topic][day][sentiment.final_label] += 1

        if sentiment.final_label == "positive":
            topic_positive_counts[post.university_id][topic] += 1

    university_cards = []
    top_topics = []
    weak_topics = []
    configured_topics = unique_topics(
        topic.name for topic in Topic.query.order_by(Topic.name.asc()).all()
    )
    default_topics = unique_topics(display_topic(topic) for topic in DEFAULT_TOPIC_KEYWORDS.keys())
    observed_topics = unique_topics(
        topic for university_topics in topic_counts.values() for topic in university_topics.keys()
    )
    dashboard_topics = unique_topics(configured_topics + default_topics + observed_topics)
    week_days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    for university in universities:
        rows = by_university[university.id]
        total = len(rows)
        labels = Counter(sentiment.final_label for _, sentiment in rows)
        topics = topic_counts[university.id]

        topic_items = []
        counted_topic_items = []

        for topic in dashboard_topics:
            count = topics[topic]
            topic_labels = topic_label_counts[university.id][topic]
            positive_percent = percentage(topic_positive_counts[university.id][topic], count)
            negative_count = sum(
                1
                for post, sentiment in by_university[university.id]
                if clean_topic(post.topic) == topic and sentiment.final_label == "negative"
            )
            trend = []

            for day in week_days:
                day_labels = topic_trend_counts[university.id][topic][day]
                day_total = sum(day_labels.values())
                trend.append({
                    "day": day,
                    "positive_percent": percentage(day_labels["positive"], day_total),
                    "negative_percent": percentage(day_labels["negative"], day_total),
                    "neutral_percent": percentage(day_labels["neutral"], day_total),
                    "items": day_total,
                })
            topic_recent_items = []

            for post, sentiment in sorted(
                by_university[university.id],
                key=lambda item: item[1].classified_at or datetime.min,
                reverse=True,
            ):
                if clean_topic(post.topic) != topic:
                    continue

                topic_recent_items.append({
                    "post_id": post.id,
                    "university_id": post.university_id,
                    "university": university.name,
                    "author": post.author or "Unknown",
                    "source": post.source or post.source_type,
                    "source_type": post.source_type,
                    "url": post.url,
                    "post_date": post.post_date.isoformat() if post.post_date else None,
                    "classified_at": sentiment.classified_at.isoformat() if sentiment.classified_at else None,
                    "topic": topic,
                    "label": sentiment.final_label,
                    "is_event": sentiment.is_event,
                    "summary": summaries_by_post_id.get(post.id) or post.content[:180],
                    "content": post.content,
                })

                if len(topic_recent_items) == 10:
                    break

            topic_items.append({
                "university": university.name,
                "topic": topic,
                "positive_percent": positive_percent,
                "negative_percent": percentage(negative_count, count),
                "neutral_percent": percentage(topic_labels["neutral"], count),
                "items": count,
                "trend": trend,
                "recent_items": topic_recent_items,
            })

            if count:
                counted_topic_items.append(topic_items[-1])

        university_cards.append({
            "id": university.id,
            "name": university.name,
            "items": total,
            "sentiment_index": university.sentiment_index or 0,
            "positive_percent": percentage(labels["positive"], total),
            "negative_percent": percentage(labels["negative"], total),
            "neutral_percent": percentage(labels["neutral"], total),
            "topics": sorted(topic_items, key=lambda item: item["items"], reverse=True),
        })

        if counted_topic_items:
            top_topics.append(
                sorted(
                    counted_topic_items,
                    key=lambda item: (item["positive_percent"], item["items"]),
                    reverse=True,
                )[0]
            )
            weak_topics.append(
                sorted(
                    counted_topic_items,
                    key=lambda item: (item["positive_percent"], -item["negative_percent"], -item["items"]),
                )[0]
            )

    recent_rows = db.session.query(Post, SentimentResult, Summary).join(
        SentimentResult,
        SentimentResult.post_id == Post.id,
    ).outerjoin(
        Summary,
        Summary.post_id == Post.id,
    ).filter(
        Post.university_id.in_(university_ids),
        Post.is_deleted.is_(False),
        SentimentResult.final_label.isnot(None),
    ).order_by(
        SentimentResult.classified_at.desc()
    ).limit(80).all()

    recent_items = []

    for post, sentiment, summary in recent_rows:
        recent_items.append({
            "post_id": post.id,
            "university_id": post.university_id,
            "university": next(
                (university.name for university in universities if university.id == post.university_id),
                "Unknown",
            ),
            "author": post.author or "Unknown",
            "source": post.source or post.source_type,
            "source_type": post.source_type,
            "url": post.url,
            "post_date": post.post_date.isoformat() if post.post_date else None,
            "classified_at": sentiment.classified_at.isoformat() if sentiment.classified_at else None,
            "topic": clean_topic(post.topic) or "Unclassified",
            "label": sentiment.final_label,
            "is_event": sentiment.is_event,
            "summary": summary.summary_text if summary else post.content[:180],
            "content": post.content,
        })

    total_posts = db.session.query(func.count(Post.id)).filter(
        Post.university_id.in_(university_ids),
        Post.is_deleted.is_(False),
    ).scalar() or 0

    return jsonify({
        "universities": university_cards,
        "top_topics": top_topics,
        "weak_topics": weak_topics,
        "recent_items": recent_items,
        "totals": {
            "active_universities": len(universities),
            "posts": total_posts,
            "sentiment_results": len(sentiment_rows),
        },
    })


@dashboard_bp.route("/posts/<int:post_id>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_post(post_id):
    post = Post.query.get(post_id)

    if not post or post.is_deleted:
        return jsonify({"message": "Post not found"}), 404

    post.is_deleted = True
    db.session.commit()

    return jsonify({"message": "Post removed"})
