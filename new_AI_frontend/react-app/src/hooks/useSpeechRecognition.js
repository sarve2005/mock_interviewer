import { useState, useRef, useEffect, useCallback } from "react";

export default function useSpeechRecognition({ onResult }) {
    // isListening = intended state (UI says "Listening")
    const [isListening, setIsListening] = useState(false);

    // isEngineRunning = actual engine state
    // We don't necessarily expose this, but we track it for restart logic

    const [interimTranscript, setInterimTranscript] = useState("");

    const recognitionRef = useRef(null);
    const onResultRef = useRef(onResult);
    const intendedStateRef = useRef(false); // Helper to track intent inside callbacks

    // Update ref when callback changes 
    useEffect(() => {
        onResultRef.current = onResult;
    }, [onResult]);

    useEffect(() => {
        if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
            console.warn("Browser does not support speech recognition.");
        }
    }, []);

    const startEngine = useCallback(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
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

            if (final && onResultRef.current) {
                // Add a space logic can be handled here or in parent, 
                // but usually the engine handles spacing reasonably well or we just send raw text
                onResultRef.current(final);
            }
            setInterimTranscript(interim);
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error", event.error);
            // On error (like no-speech), we might want to let onend handle the restart
            // or if it's 'not-allowed', we should definitely stop.
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                intendedStateRef.current = false;
                setIsListening(false);
            }
        };

        recognition.onend = () => {
            // Engine stopped. Check if we *wanted* it to stop.
            if (intendedStateRef.current) {
                // We want to keep listening, so restart!
                // console.log("Engine ended unexpectedly, restarting...");
                try {
                    recognition.start();
                } catch (e) {
                    // Start failed within onend (sometimes restricted), try recreating
                    startEngine();
                }
            } else {
                // We intended to stop, so just clean up UI
                setIsListening(false);
                setInterimTranscript("");
            }
        };

        try {
            recognition.start();
            recognitionRef.current = recognition;
        } catch (error) {
            console.error("Failed to start recognition:", error);
            intendedStateRef.current = false;
            setIsListening(false);
        }
    }, []);

    const startListening = useCallback(() => {
        if (intendedStateRef.current) return; // Already meant to be listening

        intendedStateRef.current = true;
        setIsListening(true);
        startEngine();
    }, [startEngine]);

    const stopListening = useCallback(() => {
        intendedStateRef.current = false; // Signal intent to stop
        setIsListening(false);
        setInterimTranscript("");

        if (recognitionRef.current) {
            recognitionRef.current.stop();
            // We don't nullify immediately, onend will fire
        }
    }, []);

    return {
        isListening,
        interimTranscript,
        startListening,
        stopListening
    };
}
