import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import { ArrowLeft, Star, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { getFriendlyErrorMessage } from "../utils/errorUtils";

export default function SessionDetails() {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [feedbackData, setFeedbackData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [overallScore, setOverallScore] = useState(0);

    useEffect(() => {
        fetchSessionDetails();
    }, [sessionId]);

    const fetchSessionDetails = async () => {
        try {
            const res = await api.get(`/session/${sessionId}`);
            const answers = res.data.answers || [];

            setFeedbackData(answers);

            // Calculate overall score from stored scores
            let totalScore = 0;
            let count = 0;
            answers.forEach(item => {
                const scores = item.scores || {};
                const vals = Object.values(scores);
                if (vals.length > 0) {
                    totalScore += vals.reduce((a, b) => a + b, 0) / vals.length;
                    count++;
                }
            });

            if (count > 0) {
                setOverallScore(Math.round((totalScore / count) * 20));
            }

        } catch (err) {
            console.error(err);
            setError(getFriendlyErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-900 text-white p-8 flex flex-col items-center justify-center">
                <div className="text-red-400 mb-4">{error}</div>
                <button onClick={() => navigate("/analytics")} className="text-blue-400 hover:underline">Back to Analytics</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <header className="flex items-center gap-4">
                    <button onClick={() => navigate("/analytics")} className="p-2 hover:bg-slate-800 rounded-full transition">
                        <ArrowLeft />
                    </button>
                    <h1 className="text-3xl font-bold">Session Details</h1>
                </header>

                <div className="text-center space-y-4">
                    <div className="inline-block px-8 py-4 bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl">
                        <span className="block text-sm text-slate-400 uppercase tracking-wider mb-1">Overall Score</span>
                        <span className={`text-5xl font-extrabold ${overallScore >= 80 ? 'text-green-400' : overallScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                            {overallScore}
                        </span>
                    </div>
                </div>

                <div className="space-y-6">
                    {feedbackData.map((item, idx) => (
                        <FeedbackDetailCard key={idx} index={idx} item={item} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function FeedbackDetailCard({ index, item }) {
    const [isOpen, setIsOpen] = useState(false);

    // Safety check for legacy data or incomplete saves
    const scores = item.scores || {};
    const summary = item.feedback_summary || item.summary || "No summary available.";
    const flags = item.flags || [];

    const vals = Object.values(scores);
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
                        {flags.length > 0 && (
                            <span className="flex items-center gap-1 text-red-400">
                                <AlertTriangle size={14} /> {flags.length} Flags
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
                        <p className="text-slate-200 leading-relaxed">{summary}</p>
                    </div>

                    {flags.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-red-400 text-sm uppercase mb-2 flex items-center gap-2">
                                <AlertTriangle size={14} /> Attention Needed
                            </h4>
                            <ul className="space-y-1">
                                {flags.map((f, i) => (
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
                            {Object.entries(scores).map(([k, v]) => (
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
