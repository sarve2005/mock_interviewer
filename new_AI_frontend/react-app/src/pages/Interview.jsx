import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import useAudioRecorder from "../hooks/useAudioRecorder";
import { Mic, Square, Play, Send, Volume2, Loader2 } from "lucide-react";
import { getFriendlyErrorMessage } from "../utils/errorUtils";

export default function Interview() {
    const navigate = useNavigate();
    const sessionId = localStorage.getItem("session_id");
    const [question, setQuestion] = useState("");

    const [answer, setAnswer] = useState("");

    const [loading, setLoading] = useState(false);
    const [isQuestionLoading, setIsQuestionLoading] = useState(true);
    const [isTranscribing, setIsTranscribing] = useState(false);

    const {
        isRecording,
        startRecording,
        stopRecording
    } = useAudioRecorder();

    const audioRef = useRef(null);

    const handleManualChange = (e) => {
        setAnswer(e.target.value);
    };

    const handleRecordToggle = async () => {
        if (isRecording) {
            // Stop and Transcribe
            const audioBlob = await stopRecording();
            if (audioBlob) {
                await transcribeAudio(audioBlob);
            }
        } else {
            // Start
            startRecording();
        }
    };

    const transcribeAudio = async (audioBlob) => {
        setIsTranscribing(true);
        try {
            const formData = new FormData();
            formData.append("file", audioBlob, "recording.webm");

            const res = await api.post("/transcribe", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            const text = res.data.text;
            if (text) {
                setAnswer((prev) => prev + (prev ? " " : "") + text);
            }
        } catch (err) {
            console.error(err);
            alert("Transcription failed. Please try again.");
        } finally {
            setIsTranscribing(false);
        }
    };

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

                setTimeout(() => playTts(res.data.question), 500);
            }
        } catch (err) {
            console.error(err);
            alert(getFriendlyErrorMessage(err));
        } finally {
            setIsQuestionLoading(false);
        }
    };

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


                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-slate-300">Your Answer</h3>
                        {isRecording && <span className="text-red-400 animate-pulse text-sm font-bold flex items-center gap-2">● Recording...</span>}
                    </div>

                    <div className="relative">
                        <textarea
                            className="w-full bg-slate-900 text-white p-4 rounded-xl border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none h-48 transition disabled:opacity-50"
                            placeholder="Type your answer or use the microphone..."
                            value={answer}
                            onChange={handleManualChange}
                            disabled={isTranscribing}
                        />
                        {isTranscribing && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 rounded-xl">
                                <div className="flex flex-col items-center gap-2 text-blue-400">
                                    <Loader2 className="animate-spin" size={32} />
                                    <span className="font-semibold">Processing Audio...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleRecordToggle}
                            disabled={isTranscribing}
                            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl fount-medium transition transform hover:scale-105
                ${isRecording
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
                                    : 'bg-slate-700 text-white hover:bg-slate-600'
                                }`}
                        >
                            {isRecording ? <><Square size={20} fill="currentColor" /> Stop</> : <><Mic size={20} /> Record Answer</>}
                        </button>

                        <div className="ml-auto">
                            <button
                                onClick={handleSubmit}
                                disabled={loading || isRecording || isTranscribing}
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
