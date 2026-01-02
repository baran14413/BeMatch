'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useDatabase, useUser } from '@/firebase';
import { ref, onValue, off, set, onDisconnect, remove } from 'firebase/database';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

interface PeerData {
  connection: RTCPeerConnection;
  stream: MediaStream;
}

export function useWebRTC(roomId: string, currentUserId?: string) {
  const { user } = useUser();
  const database = useDatabase();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Record<string, PeerData>>({});
  const peerConnectionsRef = useRef<Record<string, RTCPeerConnection>>({});
  const [isMuted, setIsMuted] = useState(true);
  const [speakingPeerId, setSpeakingPeerId] = useState<string | null>(null);
  const speakingIntervalRef = useRef<NodeJS.Timeout | null>(null);


  const handleNewPeer = useCallback(async (peerId: string) => {
    if (peerId === currentUserId || !localStream || !database || peerConnectionsRef.current[peerId]) {
      return;
    }
    
    console.log(`[WebRTC] Creating offer for new peer: ${peerId}`);
    const peerConnection = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current[peerId] = peerConnection;

    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.onicecandidate = event => {
      if (event.candidate) {
        const signalRef = ref(database, `webrtcSignals/${roomId}/${peerId}/${currentUserId}/candidates`);
        set(signalRef, event.candidate.toJSON());
      }
    };

    peerConnection.ontrack = event => {
      setPeers(prev => ({
        ...prev,
        [peerId]: { connection: peerConnection, stream: event.streams[0] },
      }));
    };
    
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    const signalRef = ref(database, `webrtcSignals/${roomId}/${peerId}/${currentUserId}/offer`);
    await set(signalRef, { sdp: offer.sdp, type: offer.type });

  }, [currentUserId, localStream, roomId, database]);


  // Initialize user media
  useEffect(() => {
    const startMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        stream.getAudioTracks().forEach(track => track.enabled = !isMuted);
        setLocalStream(stream);
      } catch (error) {
        console.error("Error accessing media devices.", error);
      }
    };
    startMedia();
    return () => {
        localStream?.getTracks().forEach(track => track.stop());
    }
  }, [isMuted]);

  // Listen for other users in the room
  useEffect(() => {
    if (!database || !roomId || !localStream || !currentUserId) return;

    const roomRef = ref(database, `webrtcSignals/${roomId}`);
    const onNewUser = (snapshot: any) => {
      const usersInRoom = snapshot.val();
      if (usersInRoom) {
        Object.keys(usersInRoom).forEach(peerId => {
          if (peerId !== currentUserId) {
            handleNewPeer(peerId);
          }
        });
      }
    };

    onValue(roomRef, onNewUser);

    return () => {
      off(roomRef, 'value', onNewUser);
    };
  }, [database, roomId, localStream, currentUserId, handleNewPeer]);


  // Listen for signals (offers, answers, candidates)
  useEffect(() => {
    if (!database || !roomId || !currentUserId) return;

    const mySignalsRef = ref(database, `webrtcSignals/${roomId}/${currentUserId}`);

    const onSignal = (snapshot: any) => {
        const signals = snapshot.val();
        if(!signals) return;

        Object.keys(signals).forEach(async (peerId) => {
            if (peerId === currentUserId) return;
            
            const peerConnection = peerConnectionsRef.current[peerId] || new RTCPeerConnection(ICE_SERVERS);
            if (!peerConnectionsRef.current[peerId]) {
                 peerConnectionsRef.current[peerId] = peerConnection;
                 localStream?.getTracks().forEach(track => peerConnection.addTrack(track, localStream!));
                 peerConnection.ontrack = event => {
                    setPeers(prev => ({
                        ...prev,
                        [peerId]: { connection: peerConnection, stream: event.streams[0] },
                    }));
                };
            }

            const signalData = signals[peerId];

            if (signalData.offer && peerConnection.signalingState === "stable") {
                console.log(`[WebRTC] Received offer from ${peerId}`);
                await peerConnection.setRemoteDescription(new RTCSessionDescription(signalData.offer));
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);

                const answerRef = ref(database, `webrtcSignals/${roomId}/${peerId}/${currentUserId}/answer`);
                set(answerRef, { sdp: answer.sdp, type: answer.type });
            }

            if (signalData.answer && peerConnection.signalingState === "have-local-offer") {
                console.log(`[WebRTC] Received answer from ${peerId}`);
                await peerConnection.setRemoteDescription(new RTCSessionDescription(signalData.answer));
            }

            if (signalData.candidates && peerConnection.signalingState !== "closed") {
                console.log(`[WebRTC] Received ICE candidate from ${peerId}`);
                await peerConnection.addIceCandidate(new RTCIceCandidate(signalData.candidates));
            }
        });
    };

    onValue(mySignalsRef, onSignal);

    // Cleanup on disconnect
    onDisconnect(mySignalsRef).remove();

    return () => {
      off(mySignalsRef, 'value', onSignal);
      // Clean up all peer connections on unmount
      Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
      peerConnectionsRef.current = {};
    };
  }, [database, roomId, currentUserId, localStream]);

    // Speaking detection
    useEffect(() => {
        if (!localStream) return;
        
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(localStream);
        source.connect(analyser);

        analyser.fftSize = 512;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkSpeaking = () => {
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
            if (average > 30 && !isMuted) { // Threshold for speaking
                setSpeakingPeerId(currentUserId!);
                if (speakingIntervalRef.current) clearTimeout(speakingIntervalRef.current);
                speakingIntervalRef.current = setTimeout(() => setSpeakingPeerId(null), 1000);
            }
        };

        const interval = setInterval(checkSpeaking, 100);
        return () => clearInterval(interval);

    }, [localStream, isMuted, currentUserId]);


  const toggleMute = () => {
      if (localStream) {
          localStream.getAudioTracks().forEach(track => {
              track.enabled = !track.enabled;
          });
          setIsMuted(prev => !prev);
      }
  };
  
  return { localStream, peers, isMuted, toggleMute, speakingPeerId };
}
