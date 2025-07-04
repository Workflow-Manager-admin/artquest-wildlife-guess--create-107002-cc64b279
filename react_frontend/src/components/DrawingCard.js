import React, { useRef, useState } from "react";
import "./DrawingCard.css";

/**
 * PUBLIC_INTERFACE
 * Single drawing card with image, guess form, wrong guess list.
 * Props:
 *   - drawing: drawing object
 *   - user: firebase user
 *   - myName: displayName string
 *   - isLeader: bool
 *   - onGuess: function(drawingId, guess)
 *   - animationIndex: (optional, for staggered anim)
 */
function DrawingCard({
  drawing,
  user,
  myName,
  isLeader = false,
  onGuess,
  animationIndex = 0,
}) {
  const [guess, setGuess] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(
    drawing.guesses && drawing.guesses.some((g) => g.uid === user.uid)
  );
  const [waiting, setWaiting] = useState(false);
  const animDelay = animationIndex * 0.08;

  // Masked prompt - show as emoji hint (length)
  const promptMask =
    drawing.prompt && drawing.prompt.length
      ? "🦄 ".repeat(Math.max(1, Math.floor(drawing.prompt.length / 3)))
      : "🦄";

  // Wrong guesses display
  const wrongGuesses =
    drawing.wrongGuesses && drawing.wrongGuesses.length
      ? drawing.wrongGuesses.map((g, i) => (
          <span key={i} className="wrong-guess">
            ❌ {g.guess || g.name}
          </span>
        ))
      : <span className="no-wrong">No wrong guesses yet!</span>;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!guess || !guess.trim()) return;
    setWaiting(true);
    setError("");
    try {
      await onGuess(drawing.id, guess.trim());
      setSubmitted(true);
      setGuess("");
    } catch (err) {
      setError(err.message || "Failed!");
    } finally {
      setWaiting(false);
    }
  }

  const alreadyGuessed =
    drawing.guesses &&
    drawing.guesses.some((g) => g.uid === user.uid);

  return (
    <div className={`drawing-card${isLeader ? " leader" : ""}`}
      style={{ animationDelay: `${animDelay}s` }}
    >
      {isLeader && <div className="leader-badge">👑</div>}
      <img
        className="drawing-img"
        src={drawing.imgURL}
        alt="user drawing"
        loading="lazy"
      />
      <div className="drawing-meta">
        <span className="owner-name">👩‍🎨 {drawing.ownerName}</span>
        <span className="prompt-mask">
          <span role="presentation">{promptMask}</span>
        </span>
        <span className="score-bar">
          <b>{drawing.leaderScore || 0}</b> correct guess
          {drawing.leaderScore === 1 ? "" : "es"}
        </span>
      </div>

      <div className="guess-form-block">
        {alreadyGuessed ? (
          <span className="already-guessed" title="You already guessed">
            <span>✅ You've guessed!</span>
          </span>
        ) : (
          <form onSubmit={handleSubmit} className="guess-form">
            <input
              type="text"
              className="guess-input"
              value={guess}
              spellCheck={false}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Your guess..."
              minLength={1}
              maxLength={20}
              disabled={waiting}
              required
            />
            <button className="btn-guess" disabled={waiting}>
              Guess
            </button>
          </form>
        )}
        {!!error && <span className="error-text">{error}</span>}
      </div>
      <div className="guess-list">
        <strong>Wrong guesses:</strong>
        <div className="guess-chips">{wrongGuesses}</div>
      </div>
    </div>
  );
}

export default DrawingCard;
