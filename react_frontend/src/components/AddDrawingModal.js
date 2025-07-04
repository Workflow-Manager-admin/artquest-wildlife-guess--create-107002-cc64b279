import React, { useState } from "react";
import "./AddDrawingModal.css";

/**
 * PUBLIC_INTERFACE
 * Shows a spin wheel animation for prompt selection, confirmation, and launch to drawing.
 *
 * Props:
 *   - prompt: current randomly picked prompt string
 *   - onSpin: function to pick a new random prompt
 *   - onStart: function to move to drawing canvas
 *   - onClose: function to dismiss modal
 */
function AddDrawingModal({ prompt, onSpin, onStart, onClose }) {
  const [spinning, setSpinning] = useState(false);

  function handleSpin() {
    setSpinning(true);
    setTimeout(() => {
      onSpin();
      setSpinning(false);
    }, 650); // stays spinning for animation duration
  }

  return (
    <div className="modal add-drawing-modal">
      <div className="modal-inner">
        <button className="close-btn" onClick={onClose} aria-label="Close">✖️</button>
        <h2>
          <span role="img" aria-label="spin">🎰</span> Spin for a Prompt
        </h2>
        <div className={`spin-wheel${spinning ? " spinning" : ""}`}>
          <span className="spin-text">{prompt}</span>
        </div>
        <button className="btn-spin" onClick={handleSpin} disabled={spinning}>
          {spinning ? "Spinning..." : "Spin Again"}
        </button>
        <button
          className="btn-accent btn-draw"
          onClick={onStart}
          disabled={spinning}
        >
          <span role="img" aria-label="paint">🎨</span> Start Drawing
        </button>
      </div>
    </div>
  );
}

export default AddDrawingModal;
