import { useEffect, useState } from "react";
import { APP_CONSTANT } from "../util/constant";
import StartInterview from "../components/StartInterview";
import { submitAPI, reportAPI, endInterviewAPI } from "../services/interview";
import { playAudio } from "../util/audio";
import Interview from "../components/Interview";
import { useSpeechToText } from "../hooks/useSpeechToText";
import Report from "../components/Report";
import "../assets/css/InterviewPage.css";

const InterviewPage = () => {

    const [sessionId, setSessionId] = useState(null);
    const [status, setStatus] = useState(APP_CONSTANT.IDLE);
    const [question, setQuestion] = useState("");
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);

    const onAutoSubmit = async (finalText) => {
        stopListening();

        if(!finalText.trim()) {
            return;
        }

        // submit 
        const payload = {
            "session_id": sessionId,
            "answer": finalText,
            "skip": false
        }
        const data = await submitAPI(payload);

        if (!data) {
            setError ("Submission failed. Please try again.");
            return;
        }

        if(data.interviewEnded) {
            // Report generate
            finshInterview();
        } else {
            //  next question
            setQuestion(data.nextQuestion);
            setStatus(APP_CONSTANT.ASKING);
        }
    }

    const { startListening, stopListening } = useSpeechToText(onAutoSubmit);

    const finshInterview = async () => {
        setLoading(true);
        setStatus(APP_CONSTANT.COMPLETED);
        //  report endpoint
        const data = await reportAPI(sessionId);

        if(!data) {
            return;
        }

        setReport(data.result)
        setLoading(false);

    }

    const endInterview = async () => {
        
        stopListening();

        
        await endInterviewAPI(sessionId);
        await finshInterview();
    }

    const skipQuestion = async () => {
        //  skipQuestion
        stopListening();

        // submit 
        const payload = {
            "session_id": sessionId,
            "answer": "",
            "skip": true
        }
        const data = await submitAPI(payload);

        if(data.interviewEnded) {
            // Report generate
            finshInterview();
        } else {
            //  next question
            setQuestion(data.nextQuestion);
            setStatus(APP_CONSTANT.ASKING);
        }
    }

    useEffect(() => {
        if(status === APP_CONSTANT.ASKING) {
            playAudio(question, () => {
                setStatus(APP_CONSTANT.LISTENING);

                startListening();
            })
        }
    }, [status, question]);

    const startInterview = async (data, session_id) => {
        setLoading(true);

        
        setSessionId(session_id);
        setQuestion(data.firstQuestion);

        setStatus(APP_CONSTANT.INTRO)

        
        const introText = data.introText;
        playAudio(introText, () => {
            setLoading(false);
            setStatus(APP_CONSTANT.ASKING)
        });
    }

    return <>

        {loading && <div className="loader"></div>}

        { status === APP_CONSTANT.IDLE && <StartInterview onClick={startInterview}/> }

        { (status === APP_CONSTANT.ASKING || status === APP_CONSTANT.LISTENING) && <Interview skipQuestion={skipQuestion} endInterview={endInterview} state={status}/> } 

        { status === APP_CONSTANT.COMPLETED && <Report report={report}/> }
    </>
}

export default InterviewPage;