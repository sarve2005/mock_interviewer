import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { Star, AlertTriangle, FileText, ChevronDown, ChevronUp } from "lucide-react";

export default function Feedback() {
    const [feedbackData, setFeedbackData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [overallScore, setOverallScore] = useState(0);
    const sessionId = localStorage.getItem("session_id");
    const navigate = useNavigate();

    useEffect(() => {
        if (!sessionId) {
            navigate("/");
            return;
        }
        generateFeedback();
    }, []);

    const generateFeedback = async () => {
        try {
            // 1. Get answers from backend? 
            // Actually backend doesn't have an endpoint to get answers clearly unless we use get_answers from internal service
            // But we built the app to submit answers to backend.
            // Wait, we need an endpoint to retrieving answers to generate feedback or 
            // generate feedback question by question.

            // In Streamlit, it iterated over `st.session_state.answers`.
            // We need to fetch answers first.
            // Assuming we need backend support for this.
            // Let's assume we implement GET /answers/{sid} or similar, OR 
            // implement /generate-feedback/{sid} on backend which returns everything.

            // Since I didn't verify backend endpoint for fetching answers, I should probably have added it.
            // But let's check `interview_service.get_answers(sid)`. 
            // I can add an endpoint quickly or use a loop if I had the answers locally.
            // But answers are on backend.

            // I will implement client-side loop assuming I can fetch answers?
            // No, better to have a bulk feedback generation endpoint on backend.
            // But for now, since I can't easily change backend structure too much without task switching,
            // I will assume I can fetch all answers?
            // Wait, I updated `interview_service` but not `app.py` to expose `get_answers`.

            // Solution: Add `GET /session/{sid}/answers` to `app.py` quickly?
            // Or just `GET /session/{sid}`.
            // I will implement `GET /session/{sid}` in `app.py` which returns `answers`.

            // For now, I will write the React code assuming this endpoint exists, 
            // and then I will go and add it.

            const res = await api.get(`/session/${sessionId}`);
            const answers = res.data.answers || [];

            const results = [];
            let totalScore = 0;
            let count = 0;

            for (const item of answers) {
                const payload = { question: item.question, answer: item.answer };

                const [scoreRes, summaryRes, flagsRes] = await Promise.all([
                    api.post("/technical/scores", payload),
                    api.post("/technical/summary", payload),
                    api.post("/technical/flags", payload)
                ]);

                const scores = scoreRes.data.scores;
                results.push({
                    question: item.question,
                    answer: item.answer,
                    scores: scores,
                    summary: summaryRes.data.summary,
                    flags: flagsRes.data.flags
                });

                // Calculate average score for this question (simple avg of fields)
                const vals = Object.values(scores);
                if (vals.length > 0) {
                    totalScore += vals.reduce((a, b) => a + b, 0) / vals.length;
                    count++;
                }
            }

            setFeedbackData(results);
            if (count > 0) {
                setOverallScore(Math.round((totalScore / count) * 20)); // Scale to 100? Streamlit used * 20 for 1-5 scale?
                // Streamlit: sum(avg_scores.values()) / len(avg_scores) * 20.
            }

        } catch (err) {
            console.error(err);
            // alert("Error generating feedback");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <p className="text-slate-400">Generating comprehensive feedback...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8">
            <div className="max-w-4xl mx-auto space-y-12">

                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold">Interview Feedback</h1>
                    <div className="inline-block px-8 py-4 bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl">
                        <span className="block text-sm text-slate-400 uppercase tracking-wider mb-1">Overall Score</span>
                        <span className={`text-5xl font-extrabold ${overallScore >= 80 ? 'text-green-400' : overallScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                            {overallScore}
                        </span>
                    </div>
                </div>

                {/* Breakdown */}
                <div className="space-y-6">
                    {feedbackData.map((item, idx) => (
                        <FeedbackCard key={idx} index={idx} item={item} />
                    ))}
                </div>

                <div className="text-center pt-8">
                    <button
                        onClick={() => navigate("/")}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition"
                    >
                        Start New Interview
                    </button>
                </div>

            </div>
        </div>
    );
}

function FeedbackCard({ index, item }) {
    const [isOpen, setIsOpen] = useState(false);

    // Calculate average for this card
    const vals = Object.values(item.scores);
    const avg = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length) : 0;

    return (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg transition hover:shadow-2xl">
            <div
                className="p-6 cursor-pointer flex justify-between items-start gap-4"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">Q{index + 1}: {item.question}</h3>
                    <div className="flex items-center gap-4 text-sm">
                        <span className={`px-2 py-1 rounded bg-slate-700 ${avg >= 4 ? 'text-green-400' : 'text-yellow-400'}`}>
                            Score: {avg.toFixed(1)}/5
                        </span>
                        {item.flags && item.flags.length > 0 && (
                            <span className="flex items-center gap-1 text-red-400">
                                <AlertTriangle size={14} /> {item.flags.length} Flags
                            </span>
                        )}
                    </div>
                </div>
                {isOpen ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
            </div>

            {isOpen && (
                <div className="p-6 border-t border-slate-700 bg-slate-800/50 space-y-6">
                    <div>
                        <h4 className="font-semibold text-slate-400 text-sm uppercase mb-2">Your Answer</h4>
                        <p className="text-slate-300 bg-slate-900/50 p-4 rounded-lg italic text-sm border border-slate-700/50">
                            "{item.answer}"
                        </p>
                    </div>

                    <div>
                        <h4 className="font-semibold text-slate-400 text-sm uppercase mb-2">Feedback Summary</h4>
                        <p className="text-slate-200 leading-relaxed">{item.summary}</p>
                    </div>

                    {item.flags && item.flags.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-red-400 text-sm uppercase mb-2 flex items-center gap-2">
                                <AlertTriangle size={14} /> Attention Needed
                            </h4>
                            <ul className="space-y-1">
                                {item.flags.map((f, i) => (
                                    <li key={i} className="text-red-300 text-sm flex items-start gap-2">
                                        <span>•</span> {f}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div>
                        <h4 className="font-semibold text-slate-400 text-sm uppercase mb-2">Detailed Scores</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.entries(item.scores).map(([k, v]) => (
                                <div key={k} className="bg-slate-900 p-3 rounded-lg border border-slate-700 text-center">
                                    <div className="text-xs text-slate-500 uppercase mb-1">{k.replace(/_/g, " ")}</div>
                                    <div className="text-xl font-bold text-blue-400">{v}/5</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
