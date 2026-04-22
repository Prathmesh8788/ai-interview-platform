from enum import Enum
from typing import Optional
from pydantic import BaseModel
from sqlalchemy import Column, String, Integer, JSON
from database import Base


class InteriewStatusEnum(str, Enum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class Answer(BaseModel):
    question: str
    answer: Optional[str]
    skip: bool = False



class InterviewSessionDB(Base):
    __tablename__ = "interview_sessions"

    session_id = Column(String, primary_key=True, index=True)
    questions = Column(JSON, default=[])
    status = Column(String, default=InteriewStatusEnum.IN_PROGRESS)
    answers = Column(JSON, default=[])
    current_index = Column(Integer, default=0)
    intro_text = Column(String, default="")



class InterviewSession(BaseModel):
    session_id: str
    questions: list[str] = []
    status: InteriewStatusEnum = InteriewStatusEnum.IN_PROGRESS
    answers: list[Answer] = []
    current_index: int = 0
    introText: str = ""

    class Config:
        from_attributes = True