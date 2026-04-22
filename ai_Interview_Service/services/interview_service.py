import uuid
from sqlalchemy.orm import Session
from models.interview import Answer, InterviewSessionDB, InteriewStatusEnum


def create_session(db: Session) -> InterviewSessionDB:
    session_id = str(uuid.uuid4())

    interview_session = InterviewSessionDB(
        session_id=session_id,
        questions=[],
        status=InteriewStatusEnum.IN_PROGRESS,
        answers=[],
        current_index=0,
        intro_text=""
    )

    db.add(interview_session)
    db.commit()
    db.refresh(interview_session)
    return interview_session


def get_session(session_id: str, db: Session) -> InterviewSessionDB:
    session = db.query(InterviewSessionDB).filter(
        InterviewSessionDB.session_id == session_id
    ).first()
    return session


def save_answer(answer: str | None, skip: bool, session: InterviewSessionDB, db: Session):
    question = session.questions[session.current_index]

    new_answer = Answer(
        question=question,
        answer=None if skip else answer,
        skip=skip
    )

    
    updated_answers = list(session.answers) + [new_answer.model_dump()]
    session.answers = updated_answers
    session.current_index += 1

    if session.current_index == len(session.questions):
        session.status = InteriewStatusEnum.COMPLETED

    db.commit()
    db.refresh(session)