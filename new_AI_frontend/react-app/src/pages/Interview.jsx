import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import useSpeechRecognition from "../hooks/useSpeechRecognition";
import { Mic, Square, Play, Send, Volume2 } from "lucide-react";
import { getFriendlyErrorMessage } from "../utils/errorUtils";

export default function Interview() {
    const navigate = useNavigate();
    const sessionId = localStorage.getItem("session_id");
    const [question, setQuestion] = useState("");

    // We'll manage the answer via the hook's transcript + manual edits
    // However, the hook controls its own transcript state. 
    // To allow dual editing (typing + voice), we sync them.
    // For simplicity with this hook, we can just use the hook's transcript as the source of truth 
    // OR sync them in useEffect. Let's sync hook transcript to a local state if user types.
    // Actually, the hook provided `setTranscript`. We can just use the hook's values directly or wrap them.
    // Let's use a local state `answer` and keep it in sync.
    const [answer, setAnswer] = useState("");

    const [loading, setLoading] = useState(false);
    const [isQuestionLoading, setIsQuestionLoading] = useState(true);

    // Web Speech Hook
    const {
        isListening,
        transcript,
        interimTranscript,
        startListening,
        stopListening,
        resetTranscript,
        setTranscript: setHookTranscript
    } = useSpeechRecognition();

    const audioRef = useRef(null); // Kept if we need it, but mostly for TTS fallback if we used audio files

    // Sync hook transcript to local answer state
    useEffect(() => {
        // When transcript updates (from voice), update answer.
        // We need to be careful not to overwrite user typing if they are typing concurrently.
        // But usually voice writes to end.
        // Simplified: The UI will display `answer + interim`. 
        // Wait, the hook accumulates `transcript`.
        // Let's just use the hook's setTranscript as our main setter for 'answer'.
        setAnswer(transcript);
    }, [transcript]);

    const handleManualChange = (e) => {
        setAnswer(e.target.value);
        setHookTranscript(e.target.value);
    };

    // Fetch next question
    const fetchQuestion = async () => {
        setIsQuestionLoading(true);
        try {
            if (!sessionId) {
                navigate("/");
                return;
            }
            const res = await api.get(`/next-question/${sessionId}`);
            if (!res.data.question) {
                navigate("/feedback");
            } else {
                setQuestion(res.data.question);
                setAnswer("");
                setHookTranscript(""); // Reset voice transcript
                resetTranscript();

                // Slight delay to allow UI to settle before speaking
                setTimeout(() => playTts(res.data.question), 500);
            }
        } catch (err) {
            console.error(err);
            alert(getFriendlyErrorMessage(err));
        } finally {
            setIsQuestionLoading(false);
        }
    };

    // Browser TTS
    const playTts = (text) => {
        if (!("speechSynthesis" in window)) {
            console.warn("Browser does not support text-to-speech.");
            return;
        }
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        window.speechSynthesis.speak(utterance);
    };

    const handleSubmit = async () => {
        // Combine final transcript with any interim if valid, but usually we just take 'answer'
        // which is synced to 'transcript'.
        const finalAnswer = answer.trim();

        if (!finalAnswer) {
            alert("Please provide an answer.");
            return;
        }
        setLoading(true);
        try {
            await api.post("/submit-answer", {
                session_id: sessionId,
                question: question,
                answer: finalAnswer
            });
            fetchQuestion();
        } catch (err) {
            console.error(err);
            alert(getFriendlyErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestion();
        // Cleanup TTS on unmount
        return () => window.speechSynthesis.cancel();
    }, []);

    if (isQuestionLoading && !question) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white p-6 flex flex-col items-center">
            <div className="w-full max-w-3xl space-y-8">
                <header className="flex justify-between items-center text-slate-400 text-sm">
                    <span>Session: {sessionId?.slice(0, 8)}...</span>
                    <button onClick={() => navigate("/feedback")} className="hover:text-white transition">End Interview</button>
                </header>

                {/* Question Card */}
                <div className="bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    <h2 className="text-2xl font-bold mb-4">Current Question</h2>
                    <p className="text-lg text-slate-200 leading-relaxed mb-6">{question}</p>

                    <button
                        onClick={() => playTts(question)}
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition"
                    >
                        <Volume2 size={16} /> Replay Audio
                    </button>
                </div>

                {/* Answer Section */}
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-slate-300">Your Answer</h3>
                        {isListening && <span className="text-red-400 animate-pulse text-sm font-bold flex items-center gap-2">● Listening...</span>}
                    </div>

                    <div className="relative">
                        <textarea
                            className="w-full bg-slate-900 text-white p-4 rounded-xl border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none h-48 transition"
                            placeholder="Type your answer or use the microphone..."
                            value={answer + (isListening ? (answer ? " " : "") + interimTranscript : "")}
                            onChange={handleManualChange}
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={isListening ? stopListening : startListening}
                            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl fount-medium transition transform hover:scale-105
                ${isListening
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
                                    : 'bg-slate-700 text-white hover:bg-slate-600'
                                }`}
                        >
                            {isListening ? <><Square size={20} fill="currentColor" /> Stop</> : <><Mic size={20} /> Record Answer</>}
                        </button>

                        <div className="ml-auto">
                            <button
                                onClick={handleSubmit}
                                disabled={loading || isListening}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition transform hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Submitting..." : <>Submit <Send size={18} /></>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
