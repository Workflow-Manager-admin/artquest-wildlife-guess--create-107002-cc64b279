import React from "react";
import DrawingCard from "./DrawingCard";
import "./DrawingDashboard.css";

/**
 * PUBLIC_INTERFACE
 * Dashboard that displays all drawings, leader on top, animated card grid.
 *
 * Props:
 *   - data: array of drawing objects { ownerName, imgURL, prompt, leaderScore, wrongGuesses, ... }
 *   - user: current user object
 *   - myName: display name of current user
 *   - loading: boolean for dashboard loading spinner state
 *   - onGuess: (drawingId, guess) => Promise<void>
 */
function DrawingDashboard({ data, user, myName, loading, onGuess }) {
  if (loading) {
    return (
      <div className="dashboard-loader">
        <div className="spinner"></div>
        <span>Loading dashboard...</span>
      </div>
    );
  }

  // The leading drawing (most correct guesses) comes first
  const [leader, ...rest] = data;

  return (
    <section className="dashboard-container">
      {!!leader && (
        <div className="leading-card-outer">
          <h3 className="section-header">
            🏆 Leaderboard Drawing
          </h3>
          <DrawingCard
            key={leader.id}
            drawing={leader}
            user={user}
            myName={myName}
            isLeader
            onGuess={onGuess}
          />
        </div>
      )}
      <div className="dashboard-grid">
        {rest.map((drawing, idx) => (
          <DrawingCard
            key={drawing.id}
            drawing={drawing}
            user={user}
            myName={myName}
            onGuess={onGuess}
            animationIndex={idx}
          />
        ))}
      </div>
    </section>
  );
}

export default DrawingDashboard;
