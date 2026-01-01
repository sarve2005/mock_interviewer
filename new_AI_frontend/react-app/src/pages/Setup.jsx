import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Sliders, Play, FileText, CheckCircle } from "lucide-react";
import api from "../api";
import { getFriendlyErrorMessage } from "../utils/errorUtils";

export default function Setup() {
    const [file, setFile] = useState(null);
    const [mode, setMode] = useState("technical");
    const [numQuestions, setNumQuestions] = useState(5);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleStart = async () => {
        if (!file) {
            setError("Please upload a resume.");
            return;
        }
        setError("");
        setLoading(true);

        try {
            // 1. Upload Resume
            const formData = new FormData();
            formData.append("file", file);

            await api.post("/upload-resume", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            // 2. Start Interview
            const res = await api.post("/start-interview", {
                mode,
                num_questions: numQuestions,
            });

            localStorage.setItem("session_id", res.data.session_id);
            localStorage.setItem("total_questions", numQuestions);
            navigate("/interview");

        } catch (err) {
            console.error(err);
            setError(getFriendlyErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8">
            <div className="max-w-2xl mx-auto">
                <header className="mb-12 text-center">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-4">
                        AI Interview Setup
                    </h1>
                    <p className="text-slate-400">Configure your session settings below</p>
                </header>

                <div className="space-y-8">
                    {error && (
                        <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-xl text-red-300 flex items-center gap-3">
                            <span className="text-xl">⚠️</span> {error}
                        </div>
                    )}

                    {/* Section 1: Resume Upload */}
                    <section className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <FileText className="text-blue-400" /> Upload Resume
                        </h2>
                        <div className="relative border-2 border-dashed border-slate-600 rounded-xl p-8 transition hover:border-blue-500 hover:bg-slate-700/30 group text-center cursor-pointer">
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="flex flex-col items-center justify-center gap-3">
                                {file ? (
                                    <>
                                        <CheckCircle className="w-12 h-12 text-green-400" />
                                        <p className="font-medium text-green-300">{file.name}</p>
                                        <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-12 h-12 text-slate-500 group-hover:text-blue-400 transition" />
                                        <p className="text-slate-300 font-medium">Click to upload PDF</p>
                                        <p className="text-sm text-slate-500">Max size 10MB</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Configuration */}
                    <section className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <Sliders className="text-indigo-400" /> Configuration
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-3">Interview Mode</label>
                                <div className="grid grid-cols-2 gap-4">
                                    {['technical', 'behavioral'].map((m) => (
                                        <button
                                            key={m}
                                            onClick={() => setMode(m)}
                                            className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition capitalize
                        ${mode === m
                                                    ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-500/20'
                                                    : 'bg-slate-900 border-slate-700 hover:border-slate-600'
                                                }`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-3">
                                    Number of Questions: <span className="text-white">{numQuestions}</span>
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    value={numQuestions}
                                    onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                                <div className="flex justify-between text-xs text-slate-500 mt-2">
                                    <span>1</span>
                                    <span>5</span>
                                    <span>10</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <button
                        onClick={handleStart}
                        disabled={loading}
                        className={`w-full py-4 text-lg font-bold rounded-xl shadow-xl flex items-center justify-center gap-3 transition transform hover:scale-[1.02]
              ${loading
                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20'
                            }`}
                    >
                        {loading ? (
                            <>Processing...</>
                        ) : (
                            <>Start Interview <Play size={20} fill="currentColor" /></>
                        )}
                    </button>
                    <p className="text-center text-sm text-slate-500 mt-4">
                        Note: Starting the interview involves generating custom questions and may take 20-30 seconds.
                    </p>
                </div>
            </div>
        </div>
    );
}
