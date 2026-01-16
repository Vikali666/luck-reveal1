import { useEffect, useRef, useState, useCallback } from "react";
import "./App.css";
import { Capacitor } from "@capacitor/core";
import { AdMob, BannerAdSize, BannerAdPosition } from "@capacitor-community/admob";
import { LocalNotifications } from "@capacitor/local-notifications";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, CHAT_PATH } from "./firebase";
import { useAuth } from "./hooks/useFirebase";
import { useChatListener } from "./hooks/useFirestore";

// Componente de carga
const Loader = () => (
  <div className="loader-container">
  <div className="loader"></div>
  <p>Cargando Luck Reveal...</p>
  </div>
);

// Componente Splash
const SplashScreen = ({ onContinue }) => (
  <div className="splash">
  <div className="splash-card">
  <h1 className="title">Luck Reveal</h1>
  <p className="author">by: vikali182</p>
  <p className="quote">"La forma más auténtica de conectar"</p>
  <button className="btn-main" onClick={onContinue}>
  CONTINUAR
  </button>
  </div>
  </div>
);

// Componente Setup
const SetupScreen = ({
  nickname,
  setNickname,
  accepted,
  setAccepted,
  onRandomMatch,
  onGlobalChat,
  loading
}) => {
  const nicknameError = !nickname.trim() ? "Ingresa un apodo"
  : nickname.trim().length < 2 ? "Mínimo 2 caracteres"
  : nickname.trim().length > 20 ? "Máximo 20 caracteres"
  : null;

  return (
    <div className="setup">
    <div className="setup-card">
    <h2>Configura tu perfil</h2>

    <div className="input-group">
    <input
    type="text"
    placeholder="Tu apodo"
    value={nickname}
    onChange={(e) => setNickname(e.target.value.slice(0, 20))}
    className={nicknameError ? "input-error" : ""}
    disabled={loading}
    />
    <div className="char-counter">{nickname.length}/20</div>
    </div>

    {nicknameError && <div className="error-message">{nicknameError}</div>}

    <label className="checkbox-label">
    <input
    type="checkbox"
    checked={accepted}
    onChange={() => setAccepted(!accepted)}
    disabled={loading}
    />
    <span>Acepto las reglas de respeto y buena convivencia</span>
    </label>

    <div className="buttons-grid">
    <button
    className="btn-primary"
    onClick={onRandomMatch}
    disabled={!accepted || nicknameError || loading}
    >
    {loading ? "🔄" : "MODO AZAR 🍀"}
    </button>

    <button
    className="btn-secondary"
    onClick={onGlobalChat}
    disabled={!accepted || nicknameError || loading}
    >
    CHAT GLOBAL 🌎
    </button>

    <button
    className="btn-outline"
    onClick={() => window.history.back()}
    >
    VOLVER
    </button>
    </div>
    </div>
    </div>
  );
};

// Componente Chat
const ChatScreen = ({ nickname, onBack }) => {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);
  const { user } = useAuth();
  const { messages: chat, loading } = useChatListener();

  useEffect(() => {
    if (chat.length > 0) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chat.length]);

  const sendMessage = async () => {
    if (!message.trim() || !user || sending) return;

    const txt = message.trim();
    setSending(true);

    try {
      await addDoc(collection(db, CHAT_PATH), {
        text: txt,
        sender: nickname.trim(),
                   uid: user.uid,
                   createdAt: serverTimestamp()
      });
      setMessage("");
    } catch (error) {
      console.error("Error enviando:", error);
      alert("Error al enviar mensaje");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-container">
    <header className="chat-header">
    <button className="back-btn" onClick={onBack}>←</button>
    <h1>Chat Global 🌎</h1>
    <span className="user-badge">{nickname}</span>
    </header>

    <main className="chat-messages">
    {loading ? (
      <div className="chat-loading">Cargando mensajes...</div>
    ) : chat.length === 0 ? (
      <div className="empty-chat">
      <p>¡Sé el primero en saludar! 👋</p>
      <p>Los mensajes aparecerán aquí</p>
      </div>
    ) : (
      chat.map((msg) => (
        <div
        key={msg.id}
        className={`message ${msg.uid === user?.uid ? 'own' : 'other'}`}
        >
        <div className="message-header">
        <span className="sender">{msg.sender}</span>
        <span className="time">
        {msg.timestamp?.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })}
        </span>
        </div>
        <div className="message-content">{msg.text}</div>
        </div>
      ))
    )}
    <div ref={endRef} />
    </main>

    <footer className="chat-footer">
    <input
    type="text"
    value={message}
    onChange={(e) => setMessage(e.target.value)}
    onKeyPress={handleKeyPress}
    placeholder="Escribe un mensaje..."
    disabled={sending}
    maxLength={500}
    />
    <button
    onClick={sendMessage}
    disabled={!message.trim() || sending}
    className="send-btn"
    >
    {sending ? "..." : "➤"}
    </button>
    </footer>
    </div>
  );
};

// Componente Matching
const MatchingScreen = ({ nickname, onCancel }) => (
  <div className="matching">
  <div className="matching-card">
  <div className="spinner"></div>
  <h2>Buscando conexión</h2>
  <p>Buscando alguien especial para ti, <strong>{nickname}</strong>...</p>
  <button className="btn-cancel" onClick={onCancel}>
  Cancelar
  </button>
  </div>
  </div>
);

// Componente principal App
export default function App() {
  const [status, setStatus] = useState("splash");
  const [nickname, setNickname] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [matching, setMatching] = useState(false);
  const { user, loading: authLoading } = useAuth();

  // Inicializar plugins nativos
  useEffect(() => {
    const initNativePlugins = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          await LocalNotifications.requestPermissions();
          await AdMob.initialize();
          await AdMob.showBanner({
            adId: 'ca-app-pub-3940256099942544/6300978111',
            adSize: BannerAdSize.BANNER,
            position: BannerAdPosition.BOTTOM_CENTER,
            margin: 0
          });
        } catch (error) {
          console.warn("Error con plugins nativos:", error);
        }
      }
    };
    initNativePlugins();
  }, []);

  const handleRandomMatch = async () => {
    if (!user || !nickname.trim() || !accepted) return;

    setMatching(true);
    try {
      await addDoc(collection(db, "searching_users"), {
        uid: user.uid,
        nickname: nickname.trim(),
                   mode: "random",
                   status: "searching",
                   createdAt: serverTimestamp()
      });
      setStatus("matching");
    } catch (error) {
      console.error("Error matchmaking:", error);
      alert("Error al buscar match");
      setMatching(false);
    }
  };

  const handleGlobalChat = () => {
    if (!nickname.trim() || !accepted) return;
    setStatus("chat");
  };

  if (authLoading) {
    return <Loader />;
  }

  return (
    <div className="app">
    {status === "splash" && (
      <SplashScreen onContinue={() => setStatus("setup")} />
    )}

    {status === "setup" && (
      <SetupScreen
      nickname={nickname}
      setNickname={setNickname}
      accepted={accepted}
      setAccepted={setAccepted}
      onRandomMatch={handleRandomMatch}
      onGlobalChat={handleGlobalChat}
      loading={matching}
      />
    )}

    {status === "matching" && (
      <MatchingScreen
      nickname={nickname}
      onCancel={() => setStatus("setup")}
      />
    )}

    {status === "chat" && (
      <ChatScreen
      nickname={nickname}
      onBack={() => setStatus("setup")}
      />
    )}
    </div>
  );
}
