from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, ConfigDict

from .models import ModerationStatus, ReactionType, Visibility


class StoryBase(BaseModel):
    title: Optional[str] = None
    text: Optional[str] = None
    abstract: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    visibility: Optional[Visibility] = None
    age_range: Optional[str] = None
    city: Optional[str] = None
    consent_choice: Optional[str] = None


class StoryCreate(StoryBase):
    pass


class StoryUpdate(StoryBase):
    pass


class StoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    abstract: Optional[str]
    age_range: Optional[str]
    city: Optional[str]
    tags: List[str]
    visibility: Visibility
    created_at: datetime


class StoryDetail(StoryRead):
    text: str
    raw_transcript: str
    audio_url: str
    share_token: Optional[str]
    consent_choice: Optional[str]
    consent_timestamp: Optional[datetime]
    moderation_status: ModerationStatus


class TranscriptionResponse(BaseModel):
    id: int
    text: str
    raw_transcript: str
    title: str
    abstract: Optional[str]


class ReactionRequest(BaseModel):
    type: ReactionType
    client_token: str = Field(default="anonymous")


class ReactionSummary(BaseModel):
    heart: int = 0
    thanks: int = 0
    star: int = 0


class ReactionResponse(BaseModel):
    story_id: int
    reactions: ReactionSummary


class ReportCreate(BaseModel):
    reason: str = Field(min_length=3, max_length=500)
    client_token: str = Field(default="anonymous")


class ReportRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    story_id: int
    reason: str
    handled: bool
    created_at: datetime


class SimilarStory(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    abstract: Optional[str]
    tags: List[str]


class SimilarStoriesResponse(BaseModel):
    stories: List[SimilarStory]


class TranscriptStoryRequest(BaseModel):
    transcript: str = Field(min_length=1)
    title: Optional[str] = None
    age_range: Optional[str] = None
    city: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
