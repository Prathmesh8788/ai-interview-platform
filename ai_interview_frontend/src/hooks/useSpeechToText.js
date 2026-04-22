import { useEffect, useRef, useState } from "react";

export const useSpeechToText = (onSilence) => {
  const recognitionRef = useRef(null);  
  const slienceTimeRef = useRef(null);  
  const onSlienceRef = useRef(onSilence);
  const transcriptRef = useRef("");
  const [transcript, setTranscript] = useState("");

  useEffect(() => {
    onSlienceRef.current = onSilence;
  }, [onSilence]);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error("SpeechRecognition is not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;   
    recognition.lang = "en-US";
    recognition.interimResults = true;  

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }

      if (finalText) {
        setTranscript((prev) => (prev + " " + finalText).trim());
      }

      if (finalText || interimText) {
        resetSilenceTimer();
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "no speech"){
        recognition.stop();
        recognition.start();
        return;
      }
      console.error("SpeechRecognition error", event);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const resetSilenceTimer = () => {
    clearTimeout(slienceTimeRef.current);

    slienceTimeRef.current = setTimeout(() => {
      onSlienceRef.current(transcriptRef.current);
    }, 3000);
  };

  const stopListening = () => {
    if (recognitionRef.current) {   
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    clearTimeout(slienceTimeRef.current);
  };

  return {
    stopListening,
    resetSilenceTimer,
    startListening,
  };
};