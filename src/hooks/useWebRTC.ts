'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useDatabase, useUser } from '@/firebase';
import { ref, onValue, off, set, remove, onDisconnect } from 'firebase/database';

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
  const database = useDatabase();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Record<string, PeerData>>({});
  const peerConnectionsRef = useRef<Record<string, RTCPeerConnection>>({});
  const [isMuted, setIsMuted] = useState(true);
  const [speakingPeerId, setSpeakingPeerId] = useState<string | null>(null);
  const speakingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to get or create a peer connection
  const getOrCreatePeerConnection = useCallback((peerId: string): RTCPeerConnection => {
    if (peerConnectionsRef.current[peerId]) {
      return peerConnectionsRef.current[peerId];
    }
    
    console.log(`[WebRTC] Creating new peer connection for: ${peerId}`);
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current[peerId] = pc;

    // Add local tracks to the new connection
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    // Handle incoming remote tracks
    pc.ontrack = event => {
      console.log(`[WebRTC] Received track from ${peerId}`);
      setPeers(prev => ({
        ...prev,
        [peerId]: { connection: pc, stream: event.streams[0] },
      }));
    };
    
    // Handle ICE candidates
    pc.onicecandidate = event => {
      if (event.candidate && currentUserId) {
        const candidateRef = ref(database, `webrtcSignals/${roomId}/${peerId}/${currentUserId}/candidates`);
        set(candidateRef, event.candidate.toJSON());
      }
    };
    
    return pc;
  }, [localStream, roomId, currentUserId, database]);
  
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
  }, []); // Empty dependency array is correct here.

  // Listen for other users joining/leaving to initiate/close connections
  useEffect(() => {
    if (!database || !roomId || !localStream || !currentUserId) return;

    const participantsRef = ref(database, `voiceRooms/${roomId}/participants`);

    const handleParticipantChange = (snapshot: any) => {
        const participants = snapshot.val() || {};
        const peerIds = Object.keys(participants);
        
        // Create connections for new peers
        peerIds.forEach(peerId => {
            if (peerId !== currentUserId && !peerConnectionsRef.current[peerId]) {
                 const pc = getOrCreatePeerConnection(peerId);
                 // The creator of the connection (the one who joined later) creates the offer
                 pc.createOffer()
                    .then(offer => pc.setLocalDescription(offer))
                    .then(() => {
                        const offerRef = ref(database, `webrtcSignals/${roomId}/${peerId}/${currentUserId}/offer`);
                        set(offerRef, { sdp: pc.localDescription?.sdp, type: pc.localDescription?.type });
                    })
                    .catch(e => console.error(`[WebRTC] Error creating offer for ${peerId}:`, e));
            }
        });

        // Clean up connections for peers who left
        Object.keys(peerConnectionsRef.current).forEach(peerId => {
            if (!peerIds.includes(peerId)) {
                peerConnectionsRef.current[peerId]?.close();
                delete peerConnectionsRef.current[peerId];
                setPeers(prev => {
                    const newPeers = { ...prev };
                    delete newPeers[peerId];
                    return newPeers;
                });
                // Also clean up their signaling path
                const signalPath = ref(database, `webrtcSignals/${roomId}/${currentUserId}/${peerId}`);
                remove(signalPath);
            }
        });
    };

    onValue(participantsRef, handleParticipantChange);

    return () => {
      off(participantsRef);
    };
  }, [database, roomId, localStream, currentUserId, getOrCreatePeerConnection]);


  // Listen for signals (offers, answers, candidates) directed at the current user
  useEffect(() => {
    if (!database || !roomId || !currentUserId || !localStream) return;

    const mySignalsRef = ref(database, `webrtcSignals/${roomId}/${currentUserId}`);

    const onSignal = (snapshot: any) => {
        const allSignalsForMe = snapshot.val();
        if (!allSignalsForMe) return;

        Object.keys(allSignalsForMe).forEach(async (peerId) => {
            const peerConnection = getOrCreatePeerConnection(peerId);
            const signalData = allSignalsForMe[peerId];

            try {
                // Handle Offer
                if (signalData.offer && peerConnection.signalingState === "stable") {
                    console.log(`[WebRTC] Received offer from ${peerId}`);
                    await peerConnection.setRemoteDescription(new RTCSessionDescription(signalData.offer));
                    const answer = await peerConnection.createAnswer();
                    await peerConnection.setLocalDescription(answer);

                    const answerRef = ref(database, `webrtcSignals/${roomId}/${peerId}/${currentUserId}/answer`);
                    await set(answerRef, { sdp: answer.sdp, type: answer.type });
                }

                // Handle Answer
                if (signalData.answer && peerConnection.signalingState === "have-local-offer") {
                    console.log(`[WebRTC] Received answer from ${peerId}`);
                    await peerConnection.setRemoteDescription(new RTCSessionDescription(signalData.answer));
                }

                // Handle ICE Candidate
                if (signalData.candidates && peerConnection.remoteDescription) { // Only add candidates after remote description is set
                    console.log(`[WebRTC] Received ICE candidate from ${peerId}`);
                    await peerConnection.addIceCandidate(new RTCIceCandidate(signalData.candidates));
                }
            } catch (error) {
                console.error(`[WebRTC] Error processing signal from ${peerId}:`, error);
            }
        });
    };

    onValue(mySignalsRef, onSignal);
    
    // Set up cleanup for when the current user disconnects
    const disconnectRef = onDisconnect(mySignalsRef);
    disconnectRef.remove();

    return () => {
      off(mySignalsRef);
      // Clean up all peer connections and their signaling channels on unmount
      Object.keys(peerConnectionsRef.current).forEach(peerId => {
          peerConnectionsRef.current[peerId]?.close();
          const signalPath = ref(database, `webrtcSignals/${roomId}/${currentUserId}/${peerId}`);
          remove(signalPath);
          const theirSignalPath = ref(database, `webrtcSignals/${roomId}/${peerId}/${currentUserId}`);
          remove(theirSignalPath);
      });
      peerConnectionsRef.current = {};
    };
  }, [database, roomId, currentUserId, localStream, getOrCreatePeerConnection]);


    // Speaking detection (no changes needed here)
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
        return () => {
          clearInterval(interval);
          audioContext.close();
        };

    }, [localStream, isMuted, currentUserId]);


  const toggleMute = useCallback(() => {
    if (!localStream) return;
    const newMutedState = !isMuted;
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !newMutedState;
    });
    setIsMuted(newMutedState);
  }, [localStream, isMuted]);
  
  return { localStream, peers, isMuted, toggleMute, speakingPeerId };
}
