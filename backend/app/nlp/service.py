from app.database.database import db
from app.database.models import Post, Topic, CleanedText
from app.nlp.preprocessing import TextPreprocessor
from app.nlp.topic_classifier import TopicClassifier


class NLPService:

    @staticmethod
    def process_post(post_id):

        post = Post.query.get(post_id)

        if not post:
            return None

        source = (post.source or "").lower()
        source_type = (post.source_type or "").lower()
        is_apify_source = source.startswith("apify_")
        is_user_generated = source_type in ("social", "review")

        #  STEP 1: JUNK FILTER
        min_chars = 12 if is_user_generated or is_apify_source else 50
        min_words = 2 if is_user_generated or is_apify_source else 5

        if TextPreprocessor.is_junk(
            post.content,
            min_chars=min_chars,
            min_words=min_words
        ):
            print(f"Skipping junk post {post_id}")
            return None

        #  STEP 2: CLEAN TEXT
        # Imported social/review data is already tied to a university. Requiring the
        # university name inside every post drops useful comments like "great campus".
        require_relevance = not (is_user_generated or is_apify_source)
        require_signal = is_user_generated or is_apify_source

        cleaned = TextPreprocessor.clean_text(
            post.content,
            require_relevance=require_relevance,
            require_opinion=False,
            require_signal=require_signal,
        )

        if not cleaned:
            return None

        #  STEP 3: UPSERT CLEANED TEXT
        existing = CleanedText.query.filter_by(post_id=post_id).first()

        if existing:
            existing.cleaned_content = cleaned
            existing.source_type = post.source_type
        else:
            db.session.add(CleanedText(
                post_id=post_id,
                cleaned_content=cleaned,
                source_type=post.source_type
            ))

        db.session.commit()

        return cleaned

    # -------------------------
    # BATCH PROCESSING
    # -------------------------
    @staticmethod
    def process_unprocessed_posts():

        post_ids = Post.query.with_entities(Post.id)\
            .outerjoin(CleanedText)\
            .filter(CleanedText.id.is_(None))\
            .all()

        count = 0

        for post_id, in post_ids:
            try:
                NLPService.process_post(post_id)
                count += 1
            except Exception as e:
                print(f"Error processing post {post_id}: {e}")

        return count

    @staticmethod
    def process_all_posts():

        post_ids = Post.query.with_entities(Post.id).all()

        count = 0

        for post_id, in post_ids:
            try:
                cleaned = NLPService.process_post(post_id)
                if cleaned:
                    count += 1
            except Exception as e:
                print(f"Error processing post {post_id}: {e}")

        return count
    
    @staticmethod
    def process_topic(post_id):

        post = Post.query.get(post_id)

        if not post:
            return None

        cleaned = CleanedText.query.filter_by(
            post_id=post_id
        ).first()

        if not cleaned:
            return None

        topics = Topic.query.all()

        if not topics:
            return None

        topic_name = TopicClassifier.classify(
            cleaned.cleaned_content,
            topics
        )

        # store result inside Post (we add field logically)
        post.topic = topic_name

        db.session.commit()

        return topic_name

    @staticmethod
    def process_all_topics():

        cleaned_records = CleanedText.query.all()

        count = 0

        for cleaned in cleaned_records:
            NLPService.process_topic(cleaned.post_id)
            count += 1

        return count
