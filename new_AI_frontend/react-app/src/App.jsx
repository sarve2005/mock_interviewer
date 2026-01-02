import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import PrivateRoute from "./components/PrivateRoute";

// Lazy loading components
const Login = lazy(() => import("./pages/Login"));
const Setup = lazy(() => import("./pages/Setup"));
const Interview = lazy(() => import("./pages/Interview"));
const Feedback = lazy(() => import("./pages/Feedback"));
const Analytics = lazy(() => import("./pages/Analytics"));
const SessionDetails = lazy(() => import("./pages/SessionDetails"));

function App() {
  return (
    <Router>
      <AuthProvider>
        <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Setup />
                </PrivateRoute>
              }
            />
            <Route
              path="/interview"
              element={
                <PrivateRoute>
                  <Interview />
                </PrivateRoute>
              }
            />
            <Route
              path="/feedback"
              element={
                <PrivateRoute>
                  <Feedback />
                </PrivateRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <PrivateRoute>
                  <Analytics />
                </PrivateRoute>
              }
            />
            <Route
              path="/analytics/:sessionId"
              element={
                <PrivateRoute>
                  <SessionDetails />
                </PrivateRoute>
              }
            />
          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
}

export default App;
