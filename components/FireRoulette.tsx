'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, PhoneOff, Flame, Search, LogIn } from 'lucide-react';
import { db, auth, signInWithGoogle, onAuthStateChanged } from '@/lib/firebase';
import { User } from 'firebase/auth';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  limit,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';

type AppState = 'IDLE' | 'SEARCHING' | 'CONNECTED';

export default function FireRoulette() {
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const roomIdRef = useRef<string | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const configuration = {
    iceServers: [
      {
        urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
      },
    ],
    iceCandidatePoolSize: 10,
  };

  const hangUp = async () => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    remoteStreamRef.current?.getTracks().forEach((track) => track.stop());

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (roomIdRef.current) {
      try {
        const roomDoc = doc(db, 'rooms', roomIdRef.current);
        await deleteDoc(roomDoc);
      } catch (e) {
        console.error('Error deleting room:', e);
      }
      roomIdRef.current = null;
    }

    setAppState('IDLE');
    setIsMuted(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthChecking(false);
    });

    return () => {
      unsubscribe();
      hangUp();
    };
  }, []);

  const handleLogin = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Ошибка авторизации: ' + err.message);
    }
  };

  const startSearch = async () => {
    setError(null);
    setAppState('SEARCHING');

    try {
      // Get local media
      const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      localStreamRef.current = stream;

      // Check for waiting rooms
      const roomsRef = collection(db, 'rooms');
      const q = query(roomsRef, where('status', '==', 'waiting'), limit(1));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Join existing room
        const roomDoc = querySnapshot.docs[0];
        await joinRoomById(roomDoc.id);
      } else {
        // Create new room
        await createRoom();
      }
    } catch (err: any) {
      console.error('Error starting search:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Пожалуйста, разрешите доступ к микрофону в настройках браузера.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('Микрофон не найден. Подключите микрофон и попробуйте снова.');
      } else {
        setError('Ошибка подключения: ' + err.message);
      }
      setAppState('IDLE');
    }
  };

  const createRoom = async () => {
    const roomsRef = collection(db, 'rooms');
    const roomDoc = doc(roomsRef);
    roomIdRef.current = roomDoc.id;

    const peerConnection = new RTCPeerConnection(configuration);
    peerConnectionRef.current = peerConnection;

    registerPeerConnectionListeners(peerConnection);

    localStreamRef.current?.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStreamRef.current!);
    });

    // Collect ICE candidates
    const callerCandidatesCollection = collection(roomDoc, 'callerCandidates');
    peerConnection.addEventListener('icecandidate', (event) => {
      if (!event.candidate) return;
      addDoc(callerCandidatesCollection, event.candidate.toJSON());
    });

    // Create offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    const roomWithOffer = {
      offer: {
        type: offer.type,
        sdp: offer.sdp,
      },
      createdAt: serverTimestamp(),
      status: 'waiting',
    };
    await setDoc(roomDoc, roomWithOffer);

    // Listen for remote answer
    onSnapshot(roomDoc, (snapshot) => {
      const data = snapshot.data();
      if (!peerConnection.currentRemoteDescription && data && data.answer) {
        const rtcSessionDescription = new RTCSessionDescription(data.answer);
        peerConnection.setRemoteDescription(rtcSessionDescription);
        setAppState('CONNECTED');
      }
    });

    // Listen for remote ICE candidates
    const calleeCandidatesCollection = collection(roomDoc, 'calleeCandidates');
    onSnapshot(calleeCandidatesCollection, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          let data = change.doc.data();
          peerConnection.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
  };

  const joinRoomById = async (roomId: string) => {
    roomIdRef.current = roomId;
    const roomDoc = doc(db, 'rooms', roomId);

    // Update status to connected so no one else joins
    await updateDoc(roomDoc, { status: 'connected' });

    const peerConnection = new RTCPeerConnection(configuration);
    peerConnectionRef.current = peerConnection;

    registerPeerConnectionListeners(peerConnection);

    localStreamRef.current?.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStreamRef.current!);
    });

    // Collect ICE candidates
    const calleeCandidatesCollection = collection(roomDoc, 'calleeCandidates');
    peerConnection.addEventListener('icecandidate', (event) => {
      if (!event.candidate) return;
      addDoc(calleeCandidatesCollection, event.candidate.toJSON());
    });

    // Get offer
    const roomSnapshot = await getDoc(roomDoc);
    const roomData = roomSnapshot.data();
    if (!roomData || !roomData.offer) {
      setError('Room offer not found');
      setAppState('IDLE');
      return;
    }

    const offer = roomData.offer;
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    // Create answer
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    const roomWithAnswer = {
      answer: {
        type: answer.type,
        sdp: answer.sdp,
      },
    };
    await updateDoc(roomDoc, roomWithAnswer);

    // Listen for remote ICE candidates
    const callerCandidatesCollection = collection(roomDoc, 'callerCandidates');
    onSnapshot(callerCandidatesCollection, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          let data = change.doc.data();
          peerConnection.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });

    setAppState('CONNECTED');
  };

  const registerPeerConnectionListeners = (peerConnection: RTCPeerConnection) => {
    peerConnection.addEventListener('track', (event) => {
      const [remoteStream] = event.streams;
      remoteStreamRef.current = remoteStream;
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
      }
    });

    peerConnection.addEventListener('connectionstatechange', () => {
      if (peerConnection.connectionState === 'disconnected' || peerConnection.connectionState === 'failed') {
        hangUp();
      }
    });
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-md mx-auto p-6">
      <audio ref={remoteAudioRef} autoPlay />

      <AnimatePresence mode="wait">
        {appState === 'IDLE' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center gap-8 w-full"
          >
            <div className="relative w-48 h-48 flex items-center justify-center rounded-full bg-neutral-900/50 border border-orange-500/20 shadow-[0_0_40px_rgba(249,115,22,0.1)]">
              <Flame className="w-20 h-20 text-orange-500/50" />
            </div>
            
            {isAuthChecking ? (
              <div className="w-full py-4 text-center text-neutral-400">Загрузка...</div>
            ) : (
              <button
                onClick={user ? startSearch : handleLogin}
                className="group relative w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl font-bold text-lg overflow-hidden transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(239,68,68,0.4)] active:scale-95"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                {user ? <Search className="w-6 h-6 relative z-10" /> : <LogIn className="w-6 h-6 relative z-10" />}
                <span className="relative z-10">{user ? 'Начать поиск' : 'Войти через Google'}</span>
              </button>
            )}
            
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          </motion.div>
        )}

        {appState === 'SEARCHING' && (
          <motion.div
            key="searching"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-8 w-full"
          >
            {/* Smooth Fire Animation */}
            <div className="relative w-64 h-64 flex items-center justify-center">
              {/* Static glow instead of animating blur which causes lag */}
              <div className="absolute inset-0 rounded-full bg-orange-500/20 blur-2xl" />
              
              {/* Gently pulsing glow */}
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.8, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-8 rounded-full bg-red-500/30 blur-xl"
              />

              <motion.div
                animate={{ scale: [1, 1.05, 1], rotate: [0, 3, -3, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10 text-orange-500 drop-shadow-[0_0_20px_rgba(249,115,22,0.6)]"
              >
                <Flame className="w-32 h-32 fill-orange-500" />
              </motion.div>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <h3 className="text-2xl font-bold text-white tracking-tight">Поиск собеседника...</h3>
              <p className="text-neutral-400">Пожалуйста, подождите</p>
            </div>

            <button
              onClick={hangUp}
              className="px-8 py-3 bg-neutral-800 text-neutral-300 rounded-xl font-medium transition-colors hover:bg-neutral-700 hover:text-white"
            >
              Отмена
            </button>
          </motion.div>
        )}

        {appState === 'CONNECTED' && (
          <motion.div
            key="connected"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-12 w-full"
          >
            <div className="relative w-48 h-48 flex items-center justify-center">
              {/* Smooth pulsing rings for microphone */}
              <motion.div
                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                className="absolute inset-0 rounded-full border-2 border-emerald-500/50"
              />
              <motion.div
                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 1 }}
                className="absolute inset-0 rounded-full border-2 border-emerald-500/50"
              />
              {/* Static glow */}
              <div className="absolute inset-4 rounded-full bg-emerald-500/20 blur-xl" />
              
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.4)] relative z-10">
                <Mic className="w-12 h-12 text-white" />
              </div>
            </div>

            <h3 className="text-2xl font-bold text-white tracking-tight">Собеседник найден!</h3>

            <div className="flex items-center gap-4 w-full">
              <button
                onClick={toggleMute}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold transition-all ${
                  isMuted 
                    ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20' 
                    : 'bg-neutral-800 text-white hover:bg-neutral-700'
                }`}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                {isMuted ? 'Включить' : 'Отключить'}
              </button>
              
              <button
                onClick={hangUp}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-red-600 text-white rounded-2xl font-semibold transition-all hover:bg-red-700 hover:shadow-[0_0_20px_rgba(220,38,38,0.4)]"
              >
                <PhoneOff className="w-5 h-5" />
                Завершить
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
