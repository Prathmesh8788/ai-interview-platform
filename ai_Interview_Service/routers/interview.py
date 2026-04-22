from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from database import get_db
from models.interview import InteriewStatusEnum
from request_model.AnswerRequest import AnswerRequest
from response_model.AnswerResponse import AnswerResponse
from services.ai_service import generate_questions_intro, generate_report
from services.interview_service import create_session, get_session, save_answer
from util.util_file import extract_text, validate_file

router = APIRouter(
    prefix="/interview",
    tags=["Interview"]
)


@router.post("/generate-question")
async def generate_questions(
    job_title: str = Form(...),
    job_description: str = Form(...),
    resume: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    await validate_file(resume)
    resume_text = await extract_text(resume)

    resp = await generate_questions_intro(
        job_title=job_title,
        job_description=job_description,
        resume_text=resume_text
    )

    session = create_session(db)
    session.questions = resp.get("questions")
    session.intro_text = resp.get("introText")
    db.commit()
    db.refresh(session)

    return {"session_id": session.session_id}


@router.get("/start/{session_id}")
async def start_interview(session_id: str, db: Session = Depends(get_db)):
    session = get_session(session_id, db)
    if not session or session.status == InteriewStatusEnum.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview Session Not Found"
        )

    return {
        "introText": session.intro_text,
        "firstQuestion": session.questions[0]
    }


@router.post("/submit", response_model=AnswerResponse)
async def submit_answer(answerReq: AnswerRequest, db: Session = Depends(get_db)):
    session = get_session(answerReq.session_id, db)
    if not session or session.status == InteriewStatusEnum.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview Session Not Found"
        )

    save_answer(answerReq.answer, answerReq.skip, session, db)

    if session.status == InteriewStatusEnum.COMPLETED:
        return {"interviewEnded": True}

    return {
        "interviewEnded": False,
        "nextQuestion": session.questions[session.current_index]
    }


@router.post("/end/{session_id}")
async def end_interview(session_id: str, db: Session = Depends(get_db)):
    session = get_session(session_id, db)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview Session Not Found"
        )

    session.status = InteriewStatusEnum.COMPLETED
    db.commit()

    return {"interviewEnded": True}


@router.get("/report/{session_id}")
async def report(session_id: str, db: Session = Depends(get_db)):
    session = get_session(session_id, db)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview Session Not Found"
        )

    resp = await generate_report(session.answers)
    return {"result": resp}