import React, { useEffect, useState, useRef } from "react";
import "./App.css";
import { auth, db, storage } from "./firebase";
import {
  signInAnonymously,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  setDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  runTransaction,
  increment,
} from "firebase/firestore";
import {
  ref as fbRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import DrawingDashboard from "./components/DrawingDashboard";
import AddDrawingModal from "./components/AddDrawingModal";
import DrawingCanvasModal from "./components/DrawingCanvasModal";

/**
 * PUBLIC_INTERFACE
 * The main SPA controller for DoodleFinder.
 * Manages authentication, dashboard, drawing/guessing flows, user state, and all UI overlays.
 */

function App() {
  /** Theme, auth, modals, and real-time state management **/
  const [theme, setTheme] = useState("light");
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [usernameModal, setUsernameModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCanvasModal, setShowCanvasModal] = useState(false);
  const [spinPrompt, setSpinPrompt] = useState("");
  const [dashboardData, setDashboardData] = useState([]);
  const [loading, setLoading] = useState(true);

  /** Spin wheel prompts (for new drawing submissions) **/
  const PROMPTS = [
    "Penguin", "Peacock", "Tiger", "Cobra", "Frog",
    "Parrot", "Crocodile", "Flamingo", "Lion", "Rabbit",
    "Bear", "Owl", "Starfish", "Chameleon", "Bat",
    "Rhino", "Kangaroo", "Wolf", "Butterfly", "Eagle"
  ];

  // Effect: Theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Effect: Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Get username if set, else force entry
        if (firebaseUser.displayName) setUsername(firebaseUser.displayName);
        else setUsernameModal(true);
      } else setUser(null);
    });
    return () => unsub();
  }, []);

  // Effect: Dashboard real-time listener
  useEffect(() => {
    const q = query(
      collection(db, "drawings"),
      orderBy("leaderScore", "desc"),
      orderBy("created", "asc")
    );
    const unsub = onSnapshot(q, async (snapshot) => {
      let dash = [];
      snapshot.forEach((doc) => dash.push({ id: doc.id, ...doc.data() }));
      setDashboardData(dash);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Username authentication (username as displayName, sign in anonymously)
  async function handleUsernameSubmit(e) {
    e.preventDefault();
    if (!username || username.trim().length < 3) return;
    // Sign in if not already
    if (!user) {
      await signInAnonymously(auth);
    }
    // Set username as displayName
    await updateProfile(auth.currentUser, {
      displayName: username.trim(),
    });
    setUsernameModal(false);
  }

  // PUBLIC_INTERFACE
  function toggleTheme() {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  }

  /*** Add Drawing (Spin wheel -> Drawing Canvas -> Save Flow) ***/
  function openAddDrawingModal() {
    setSpinPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
    setShowAddModal(true);
  }
  function closeAddDrawingModal() {
    setShowAddModal(false);
  }
  function openDrawingCanvasModal() {
    setShowAddModal(false);
    setShowCanvasModal(true);
  }
  function closeDrawingCanvasModal() {
    setShowCanvasModal(false);
  }

  // Save drawing to Firebase (storage + Firestore doc)
  async function handleDrawingSubmit({ imgBlob }) {
    // Save image to storage, then update Firestore
    try {
      const imgId = `${user.uid}_${Date.now()}`;
      const imgRef = fbRef(storage, `drawings/${imgId}.png`);
      await uploadBytes(imgRef, imgBlob);
      const imgURL = await getDownloadURL(imgRef);

      const docRef = await addDoc(collection(db, "drawings"), {
        owner: user.uid,
        ownerName: username,
        imgURL,
        prompt: spinPrompt,
        guesses: [],
        wrongGuesses: [],
        correctGuesses: [],
        leaderScore: 0,
        created: serverTimestamp(),
      });
      // Modal close, redraw
      setShowCanvasModal(false);
    } catch (err) {
      alert("Failed to save drawing. Please try again!");
    }
  }

  // PUBLIC_INTERFACE
  function handleGuessSubmit(drawingId, guess) {
    // Save guess for a given drawing (checks, real-time sync)
    return runTransaction(db, async (transaction) => {
      const docRef = doc(db, "drawings", drawingId);
      const docSnap = await transaction.get(docRef);
      if (!docSnap.exists()) throw new Error("Drawing not found");
      const data = docSnap.data() || {};
      // Only one guess per player per drawing
      if (
        data.guesses?.some(
          (g) => g.uid === user.uid
        )
      ) throw new Error("You have already guessed!");
      const correct = guess.trim().toLowerCase() === data.prompt?.toLowerCase();
      const guesses = [...(data.guesses || []), { guess, uid: user.uid, name: username, correct }];
      let wrongGuesses = data.wrongGuesses || [];
      let correctGuesses = data.correctGuesses || [];
      let leaderScore = data.leaderScore || 0;
      if (correct) {
        correctGuesses.push({ guess, uid: user.uid, name: username });
        leaderScore += 1;
      } else {
        wrongGuesses.push({ guess, name: username });
      }
      transaction.update(docRef, {
        guesses,
        wrongGuesses,
        correctGuesses,
        leaderScore,
      });
    });
  }

  // If not authenticated or no username yet, show modal
  return (
    <div className="App">
      <header className="main-navbar">
        <span className="logo-text">🦜 DoodleFinder</span>
        <button className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
      </header>
      {/* Username Modal */}
      {(usernameModal || !user || !username) && (
        <div className="modal username-modal">
          <div className="modal-inner">
            <h2>Welcome!</h2>
            <form onSubmit={handleUsernameSubmit}>
              <label>
                Choose your username:
                <input
                  type="text"
                  value={username}
                  autoFocus
                  minLength={3}
                  pattern="^[a-zA-Z0-9_ ]{3,16}$"
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. DoodleQueen"
                  maxLength={16}
                  required
                />
              </label>
              <button type="submit" className="btn-accent">Enter</button>
            </form>
          </div>
        </div>
      )}

      {/* Main Dashboard */}
      {(!usernameModal && user?.uid && username) && (
        <main>
          <DrawingDashboard
            data={dashboardData}
            user={user}
            myName={username}
            loading={loading}
            onGuess={handleGuessSubmit}
          />

          {/* Floating Add Drawing Button */}
          <button
            className="btn-float-add"
            onClick={openAddDrawingModal}
            aria-label="Add Your Drawing"
          >
            <span role="img" aria-label="paint">🎨</span> Add Your Drawing
          </button>
        </main>
      )}

      {/* Animated Add Drawing Modal (spin wheel) */}
      {showAddModal && (
        <AddDrawingModal
          prompt={spinPrompt}
          onSpin={() => setSpinPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)])}
          onStart={openDrawingCanvasModal}
          onClose={closeAddDrawingModal}
        />
      )}

      {/* Drawing Canvas (to draw and submit art) */}
      {showCanvasModal && (
        <DrawingCanvasModal
          prompt={spinPrompt}
          timerSec={45}
          onSubmit={handleDrawingSubmit}
          onClose={closeDrawingCanvasModal}
        />
      )}
      <footer className="app-footer">
        <span>ArtQuest: Wildlife Guess &middot; Built with ❤️</span>
      </footer>
    </div>
  );
}

export default App;
