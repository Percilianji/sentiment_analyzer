import os
import re

from app.database.database import db
from app.database.models import Post, SentimentResult, Summary, University


class SummarizerService:

    @staticmethod
    def clean_preview(text, limit=180):
        if not text:
            return "No feedback text was available."

        text = re.sub(r"\s+", " ", text).strip()

        if len(text) <= limit:
            return text

        return text[:limit].rsplit(" ", 1)[0] + "..."

    @staticmethod
    def is_readable_standalone(text):
        if not text:
            return False

        text = re.sub(r"\s+", " ", text).strip()
        words = text.split()

        if len(words) < 4 or len(words) > 35:
            return False

        if re.search(r"https?://|www\.|#|@\w+", text, re.IGNORECASE):
            return False

        alpha_chars = len(re.findall(r"[A-Za-z]", text))
        if alpha_chars < max(10, len(text) * 0.55):
            return False

        return True

    @staticmethod
    def fallback_summary(post, sentiment, reason=None):
        topic = post.topic or "general feedback"

        if SummarizerService.is_readable_standalone(post.content):
            summary = SummarizerService.clean_preview(post.content, limit=240)
        else:
            preview = SummarizerService.clean_preview(post.content, limit=220)
            summary = f"{preview}"

        if sentiment.is_event and topic == "general feedback":
            summary += " This appears to relate to an institutional update or event."

        return summary

    @staticmethod
    def client():
        api_key = os.getenv("OPENAI_API_KEY")

        if not api_key:
            raise RuntimeError("OPENAI_API_KEY is not configured in .env")

        try:
            from openai import OpenAI
        except ImportError as exc:
            raise RuntimeError(
                "openai is not installed. Install it with: pip install openai"
            ) from exc

        return OpenAI(api_key=api_key)

    @staticmethod
    def summarise_text(post, sentiment):
        try:
            client = SummarizerService.client()

            if SummarizerService.is_readable_standalone(post.content):
                return SummarizerService.clean_preview(post.content, limit=240)

            prompt = f"""
Summarise this university feedback in one concise, natural sentence for a dashboard.

University post/review:
{post.content[:2500]}

Topic: {post.topic or "Unknown"}
Sentiment: {sentiment.final_label or "Unknown"}
Event related: {"yes" if sentiment.is_event else "no"}

Focus on the practical insight a university administrator should understand.
Do not begin with phrases like "Feedback is", "The feedback is", "This post is", or "The sentiment is".
Do not mention the sentiment label unless it is necessary for the sentence to make sense.
"""

            response = client.responses.create(
                model=os.getenv("OPENAI_MODEL", "gpt-5.5"),
                input=prompt,
                max_output_tokens=120,
            )

            return response.output_text.strip()
        except Exception as exc:
            return SummarizerService.fallback_summary(post, sentiment, str(exc))

    @staticmethod
    def run_summarisation(university_id, limit=10, regenerate=False):
        university = University.query.get(university_id)

        if not university:
            raise RuntimeError("University not found")

        query = db.session.query(Post, SentimentResult).join(
            SentimentResult,
            SentimentResult.post_id == Post.id,
        ).filter(
            Post.university_id == university_id,
            Post.is_deleted.is_(False),
            SentimentResult.final_label.isnot(None),
        )

        if regenerate:
            Summary.query.filter(
                Summary.post_id.in_(
                    db.session.query(Post.id).filter(
                        Post.university_id == university_id,
                        Post.is_deleted.is_(False),
                    )
                )
            ).delete(synchronize_session=False)
            db.session.commit()
        else:
            query = query.outerjoin(
                Summary,
                Summary.post_id == Post.id,
            ).filter(
                Summary.id.is_(None),
            )

        rows = query.order_by(
            SentimentResult.classified_at.desc()
        ).limit(limit).all()

        saved = 0
        fallback_count = 0

        for post, sentiment in rows:
            summary_text = SummarizerService.summarise_text(post, sentiment)

            if "Generated locally because AI summarisation was unavailable." in summary_text:
                fallback_count += 1

            db.session.add(Summary(
                post_id=post.id,
                summary_text=summary_text,
            ))
            saved += 1

        db.session.commit()

        return {
            "university": university.name,
            "summaries_created": saved,
            "fallback_summaries": fallback_count,
            "items_considered": len(rows),
        }

    @staticmethod
    def run_active_summarisation(limit=10, regenerate=False):
        universities = University.query.filter_by(active=True).all()
        summary = {}

        for university in universities:
            try:
                summary[university.name] = SummarizerService.run_summarisation(
                    university.id,
                    limit,
                    regenerate,
                )
            except Exception as exc:
                summary[university.name] = {
                    "error": str(exc)
                }

        return summary
