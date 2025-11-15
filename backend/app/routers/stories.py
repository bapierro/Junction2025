from __future__ import annotations

import json
import textwrap
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, UploadFile, status
from sqlalchemy import select, func
from sqlmodel import Session

from ..database import get_session
from ..models import ModerationStatus, Reaction, ReactionType, Report, Story, Visibility
from ..schemas import (
    ReactionRequest,
    ReactionResponse,
    ReactionSummary,
    ReportCreate,
    SimilarStory,
    SimilarStoriesResponse,
    StoryDetail,
    StoryRead,
    StoryUpdate,
    TranscriptStoryRequest,
    TranscriptionResponse,
)
from ..services.elevenlabs import get_elevenlabs_service
from ..services.openai_story import get_openai_story_service
from ..services.security import hash_client_token, make_share_token, record_consent
from ..services.storage import ensure_storage_root, resolve_audio_path, save_audio_file

router = APIRouter(prefix="/stories", tags=["stories"])


def _parse_tags(raw: Optional[str]) -> List[str]:
    if not raw:
        return []
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, list):
            return [str(tag).strip() for tag in parsed if str(tag).strip()]
    except json.JSONDecodeError:
        pass
    return [tag.strip() for tag in raw.split(",") if tag.strip()]


@router.post("", response_model=StoryDetail, status_code=status.HTTP_201_CREATED)
async def create_story(
    audio: UploadFile = File(...),
    age_range: Optional[str] = Form(default=None),
    city: Optional[str] = Form(default=None),
    tags: Optional[str] = Form(default=None),
    title: Optional[str] = Form(default=None),
    session: Session = Depends(get_session),
) -> StoryDetail:
    ensure_storage_root()
    filename = save_audio_file(audio)
    story = Story(
        title=title or "Untitled Story",
        audio_url=filename,
        age_range=age_range,
        city=city,
        tags=_parse_tags(tags),
        share_token=make_share_token(),
    )
    session.add(story)
    session.commit()
    session.refresh(story)
    return StoryDetail.model_validate(story)


@router.post("/from-transcript", response_model=StoryDetail, status_code=status.HTTP_201_CREATED)
async def create_story_from_transcript(
    payload: TranscriptStoryRequest,
    session: Session = Depends(get_session),
    openai_story_service=Depends(get_openai_story_service),
) -> StoryDetail:
    transcript = (payload.transcript or "").strip()
    if not transcript:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Transcript is required")

    try:
        story_text = await openai_story_service.generate_story(transcript)
    except ValueError as exc:  # validation failures surface to client
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - upstream errors
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Unable to generate story") from exc

    abstract = textwrap.shorten(story_text, width=200, placeholder="...") if story_text else None
    story = Story(
        title=(payload.title or "Untitled Story").strip() or "Untitled Story",
        text=story_text,
        raw_transcript=transcript,
        abstract=abstract,
        age_range=payload.age_range,
        city=payload.city,
        tags=payload.tags or [],
        audio_url="live-agent",
        share_token=make_share_token(),
    )
    session.add(story)
    session.commit()
    session.refresh(story)
    return StoryDetail.model_validate(story)


@router.post("/{story_id}/transcribe", response_model=TranscriptionResponse)
async def transcribe_story(
    story_id: int,
    session: Session = Depends(get_session),
    elevenlabs_service=Depends(get_elevenlabs_service),
) -> TranscriptionResponse:
    story = session.get(Story, story_id)
    if not story:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found")
    audio_path = resolve_audio_path(story.audio_url)
    if not audio_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audio not found")
    result = await elevenlabs_service.transcribe_audio(audio_path)
    story.text = result["text"]
    story.raw_transcript = result["raw_transcript"]
    story.title = story.title or result["title"]
    story.abstract = result["abstract"]
    session.add(story)
    session.commit()
    session.refresh(story)
    return TranscriptionResponse(
        id=story.id,
        text=story.text,
        raw_transcript=story.raw_transcript,
        title=story.title,
        abstract=story.abstract,
    )


@router.put("/{story_id}", response_model=StoryDetail)
async def update_story(
    story_id: int,
    payload: StoryUpdate,
    session: Session = Depends(get_session),
) -> StoryDetail:
    story = session.get(Story, story_id)
    if not story:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "tags" in update_data and update_data["tags"] is not None:
        story.tags = update_data["tags"]
    if payload.visibility:
        story.visibility = payload.visibility
        if story.visibility in {Visibility.link, Visibility.private, Visibility.public_anon} and not story.share_token:
            story.share_token = make_share_token()
    for field in ["title", "text", "abstract", "age_range", "city", "consent_choice"]:
        value = update_data.get(field)
        if value is not None:
            setattr(story, field, value)
    if payload.consent_choice:
        story.consent_timestamp = record_consent(payload.consent_choice)

    session.add(story)
    session.commit()
    session.refresh(story)
    return StoryDetail.model_validate(story)


@router.get("/public", response_model=List[StoryRead])
def get_public_stories(
    tag: Optional[str] = None,
    page: int = 1,
    size: int = 20,
    session: Session = Depends(get_session),
) -> List[StoryRead]:
    query = (
        select(Story)
        .where(Story.visibility == Visibility.public_anon)
        .where(Story.moderation_status == ModerationStatus.ok)
        .order_by(Story.created_at.desc())
    )
    stories = session.exec(query).scalars().all()
    filtered = stories
    if tag:
        filtered = [story for story in stories if tag in (story.tags or [])]
    start = (page - 1) * size
    end = start + size
    return [StoryRead.model_validate(story) for story in filtered[start:end]]


@router.get("/{story_id}", response_model=StoryDetail)
def get_story(
    story_id: int,
    token: Optional[str] = None,
    session: Session = Depends(get_session),
) -> StoryDetail:
    story = session.get(Story, story_id)
    if not story:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found")

    if story.visibility in {Visibility.private, Visibility.link}:
        if token != story.share_token:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Story is restricted")

    return StoryDetail.model_validate(story)


@router.get("/{story_id}/similar", response_model=SimilarStoriesResponse)
def similar_stories(story_id: int, session: Session = Depends(get_session)) -> SimilarStoriesResponse:
    story = session.get(Story, story_id)
    if not story:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found")
    if not story.tags:
        return SimilarStoriesResponse(stories=[])

    public_stories = session.exec(
        select(Story).where(
            Story.visibility == Visibility.public_anon,
            Story.moderation_status == ModerationStatus.ok,
            Story.id != story_id,
        )
    ).scalars().all()
    matches: List[Story] = []
    for candidate in public_stories:
        if set(candidate.tags or []).intersection(set(story.tags or [])):
            matches.append(candidate)
    similar_payload = [
        SimilarStory(id=candidate.id, title=candidate.title, abstract=candidate.abstract, tags=candidate.tags or [])
        for candidate in matches[:5]
    ]
    return SimilarStoriesResponse(stories=similar_payload)


def _reaction_counts(session: Session, story_id: int) -> ReactionSummary:
    summary = ReactionSummary()
    result = session.exec(
        select(Reaction.type, func.count(Reaction.id)).where(Reaction.story_id == story_id).group_by(Reaction.type)
    )
    for reaction_type, count in result:
        setattr(summary, reaction_type.value, count)
    return summary


@router.post("/{story_id}/react", response_model=ReactionResponse)
def react_to_story(
    story_id: int,
    payload: ReactionRequest,
    session: Session = Depends(get_session),
) -> ReactionResponse:
    story = session.get(Story, story_id)
    if not story:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found")

    client_hash = hash_client_token(payload.client_token)
    existing = session.exec(
        select(Reaction).where(
            Reaction.story_id == story_id,
            Reaction.client_hash == client_hash,
            Reaction.type == payload.type,
        )
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Reaction already recorded")

    reaction = Reaction(story_id=story_id, type=payload.type, client_hash=client_hash)
    session.add(reaction)
    session.commit()
    summary = _reaction_counts(session, story_id)
    return ReactionResponse(story_id=story_id, reactions=summary)


@router.post("/{story_id}/report", status_code=status.HTTP_202_ACCEPTED)
def report_story(
    story_id: int,
    payload: ReportCreate,
    session: Session = Depends(get_session),
) -> dict:
    story = session.get(Story, story_id)
    if not story:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found")
    client_hash = hash_client_token(payload.client_token)
    report = Report(story_id=story_id, reason=payload.reason, client_hash=client_hash)
    session.add(report)
    if story.moderation_status == ModerationStatus.ok:
        story.moderation_status = ModerationStatus.flagged
        session.add(story)
    session.commit()
    return {"status": "reported"}
