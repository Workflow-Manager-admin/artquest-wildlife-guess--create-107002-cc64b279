import React, { useRef, useEffect, useState } from "react";
import "./DrawingCanvasModal.css";

/**
 * PUBLIC_INTERFACE
 * Drawing Canvas Modal with timer and submit function.
 *
 * Props:
 *   - prompt: string (what to draw)
 *   - timerSec: number (seconds for timer)
 *   - onSubmit: ({imgBlob}) => void
 *   - onClose: () => void
 */
function DrawingCanvasModal({ prompt, timerSec, onSubmit, onClose }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [timer, setTimer] = useState(timerSec);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Timer animation
  useEffect(() => {
    if (submitted) return;
    if (timer <= 0) {
      setDrawing(false);
      return;
    }
    const t = setTimeout(() => setTimer(timer - 1), 1000);
    return () => clearTimeout(t);
  }, [timer, submitted]);

  // Drawing logic (mouse+touch)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let isDrawing = false, lastX, lastY;

    function draw(x, y) {
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#0e1513";
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    }

    function start(e) {
      isDrawing = true;
      ctx.beginPath();
      if (e.touches) {
        const rect = canvas.getBoundingClientRect();
        lastX = e.touches[0].clientX - rect.left;
        lastY = e.touches[0].clientY - rect.top;
      } else {
        lastX = e.nativeEvent.offsetX;
        lastY = e.nativeEvent.offsetY;
      }
      ctx.moveTo(lastX, lastY);
    }
    function move(e) {
      if (!isDrawing) return;
      let x, y;
      if (e.touches) {
        const rect = canvas.getBoundingClientRect();
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
      } else {
        x = e.nativeEvent.offsetX;
        y = e.nativeEvent.offsetY;
      }
      draw(x, y);
    }
    function stop() {
      isDrawing = false;
      ctx.beginPath();
    }

    // Mouse events
    canvas.onmousedown = start;
    canvas.onmousemove = move;
    canvas.onmouseup = stop;
    canvas.onmouseleave = stop;

    // Touch events
    canvas.ontouchstart = (e) => { start(e); };
    canvas.ontouchmove = (e) => { move(e); e.preventDefault(); };
    canvas.ontouchend = stop;
    canvas.ontouchcancel = stop;
    return () => {
      canvas.onmousedown = canvas.onmousemove = canvas.onmouseup = canvas.onmouseleave = null;
      canvas.ontouchstart = canvas.ontouchmove = canvas.ontouchend = canvas.ontouchcancel = null;
    };
  }, []);

  // Timer ring animation
  const timerPct = Math.max(timer / timerSec, 0);
  const ringColor = timerPct < 0.2 ? "#d32f2f"
    : timerPct < 0.4 ? "#fbc02d"
    : "#0e1513";

  async function handleFinish() {
    if (submitted) return;
    try {
      const canvas = canvasRef.current;
      // Downscale for performance
      canvas.toBlob(
        async (blob) => {
          setSubmitted(true);
          await onSubmit({ imgBlob: blob });
        },
        "image/png", 0.85
      );
    } catch (err) {
      setError("Failed to process drawing. Try again!");
    }
  }

  // If timer expired: auto-submit
  useEffect(() => { if (timer <= 0 && !submitted) handleFinish(); }, [timer, submitted]);

  return (
    <div className="modal drawing-canvas-modal">
      <div className="modal-inner">
        <button className="close-btn" onClick={onClose} aria-label="Cancel">✖️</button>
        <h2>
          <span role="img" aria-label="paint">🖌️</span> Draw: <em>{prompt}</em>
        </h2>
        <div className="timer-outer">
          <svg viewBox="0 0 44 44" className="timer-svg">
            <circle
              className="timer-bg"
              cx="22" cy="22" r="20"
              fill="none" stroke="#eee" strokeWidth="3"
            />
            <circle
              className="timer-ring"
              cx="22" cy="22" r="20"
              fill="none"
              stroke={ringColor}
              strokeWidth="3"
              strokeDasharray={2 * Math.PI * 20}
              strokeDashoffset={2 * Math.PI * 20 * (1 - timerPct)}
              style={{ transition: "stroke-dashoffset 1s linear, stroke .5s" }}
            />
            <text x="22" y="26" textAnchor="middle" fontSize="14" fill={ringColor}>{timer}</text>
          </svg>
        </div>
        <div className="canvas-out">
          <canvas
            ref={canvasRef}
            width={280}
            height={230}
            className="drawing-canvas"
            style={{
              touchAction: "none",
              backgroundColor: "#fcfcfc",
              border: "2px solid #eee",
              borderRadius: "20px"
            }}
          />
        </div>
        <div className="canvas-actions">
          <button
            className="btn-accent"
            onClick={handleFinish}
            disabled={submitted || timer <= 0}
          >
            {submitted ? "Saving..." : "Finish & Submit"}
          </button>
          <button className="btn-outline" onClick={onClose} disabled={submitted}>
            Cancel
          </button>
        </div>
        {error && <span className="error-text">{error}</span>}
      </div>
    </div>
  );
}
export default DrawingCanvasModal;
