import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { ArrowLeft, Clock, Award, FileText } from "lucide-react";
import { getFriendlyErrorMessage } from "../utils/errorUtils";

export default function Analytics() {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await api.get("/analytics");
                setHistory(res.data.history);
            } catch (err) {
                console.error(err);
                setError(getFriendlyErrorMessage(err));
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    // Helper to calculate average scores
    const calculateAvgScore = (answers) => {
        if (!answers || answers.length === 0) return 0;
        let total = 0;
        let count = 0;
        answers.forEach(ans => {
            if (ans.scores) {
                // Average of the 5 dimensions
                const sum = Object.values(ans.scores).reduce((a, b) => a + b, 0);
                total += (sum / 5);
                count++;
            }
        });
        return count === 0 ? 0 : (total / count).toFixed(1);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white p-6">
            <div className="max-w-4xl mx-auto">
                <header className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate("/")} className="p-2 hover:bg-slate-800 rounded-full transition">
                        <ArrowLeft />
                    </button>
                    <h1 className="text-3xl font-bold">Performance Analytics</h1>
                </header>

                {error && (
                    <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-xl text-red-300 mb-6">
                        {error}
                    </div>
                )}

                {!loading && !error && history.length === 0 && (
                    <div className="text-center text-slate-400 py-12">
                        <p>No interview history found. Start a new interview!</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {history.map((session) => {
                        const avgScore = calculateAvgScore(session.answers);
                        const date = new Date(session.created_at).toLocaleDateString();
                        const time = new Date(session.created_at).toLocaleTimeString();

                        return (
                            <div
                                key={session.id}
                                onClick={() => navigate(`/analytics/${session.id}`)}
                                className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-blue-500 transition shadow-lg cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg capitalize flex items-center gap-2">
                                            {session.mode} Interview
                                        </h3>
                                    </div>
                                    <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">{date}</span>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-400 flex items-center gap-2"><Clock size={16} /> Date</span>
                                        <span>{date} {time}</span>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-400 flex items-center gap-2"><FileText size={16} /> Questions</span>
                                        <span>{session.questions.length}</span>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-400 flex items-center gap-2"><Award size={16} /> Avg Score</span>
                                        <span className={`font-bold ${parseFloat(avgScore) > 3.5 ? 'text-green-400' : 'text-yellow-400'}`}>
                                            {avgScore > 0 ? avgScore : "N/A"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
