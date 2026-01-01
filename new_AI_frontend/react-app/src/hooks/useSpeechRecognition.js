import { useState, useEffect, useRef } from "react";

export default function useSpeechRecognition() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [interimTranscript, setInterimTranscript] = useState("");
    const recognitionRef = useRef(null);

    useEffect(() => {
        if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
            console.warn("Browser does not support speech recognition.");
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();

        const recognition = recognitionRef.current;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event) => {
            let final = "";
            let interim = "";

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final += event.results[i][0].transcript;
                } else {
                    interim += event.results[i][0].transcript;
                }
            }

            if (final) {
                setTranscript((prev) => prev + (prev ? " " : "") + final);
            }
            setInterimTranscript(interim);
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        return () => {
            if (recognition) {
                recognition.stop();
            }
        };
    }, []);

    const startListening = () => {
        if (recognitionRef.current && !isListening) {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (error) {
                console.error("Failed to start recognition:", error);
            }
        }
    };

    const stopListening = () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    const resetTranscript = () => {
        setTranscript("");
        setInterimTranscript("");
    };

    return {
        isListening,
        transcript,
        interimTranscript,
        startListening,
        stopListening,
        resetTranscript,
        setTranscript // Allow manual edits to sync back
    };
}
