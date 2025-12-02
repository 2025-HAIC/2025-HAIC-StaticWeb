import React, { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import BoardSVG from './BoardSVG.jsx';
import { createInitialGameState, playMove, isLineClaimed } from '../logic/gameUtils.js';

function PvP() {
  const [peer, setPeer] = useState(null);
  const connRef = useRef(null);
  const [peerId, setPeerId] = useState('');
  const [remoteId, setRemoteId] = useState('');
  const [status, setStatus] = useState('idle');
  const [isHost, setIsHost] = useState(false);
  const [myPlayer, setMyPlayer] = useState(null);
  const [gameState, setGameState] = useState(() => createInitialGameState(5, 5));
  const [violation, setViolation] = useState(null);
  const [pendingRequest, setPendingRequest] = useState(false);
  const remotePeerIdRef = useRef(null);
  const [logs, setLogs] = useState([]);
  const logsRef = useRef([]);
  const [useCustomSignaling, setUseCustomSignaling] = useState(false);
  const [signalingHost, setSignalingHost] = useState('');
  const [signalingPort, setSignalingPort] = useState('');
  const [signalingPath, setSignalingPath] = useState('/peerjs');
  const [signalingSecure, setSignalingSecure] = useState(false);

  const addLog = (txt) => {
    const entry = `${new Date().toISOString()} - ${txt}`;
    logsRef.current = [...logsRef.current.slice(-499), entry];
    setLogs(logsRef.current);
    console.log('[PvP LOG]', entry);
  };

  const generateHaicId = () => {
    const n = Math.floor(Math.random() * 1_000_000);
    return `haic-${String(n).padStart(6, '0')}`;
  };

  const clearLogs = () => { logsRef.current = []; setLogs([]); };

  const sendMessage = (msg) => {
    addLog(`OUT ${JSON.stringify(msg)}`);
    try {
      if (connRef.current && connRef.current.send) {
        connRef.current.send(msg);
      } else {
        addLog('OUT ERROR: no active DataConnection');
      }
    } catch (err) {
      addLog('OUT ERROR: ' + (err && err.message ? err.message : String(err)));
      console.error(err);
    }
  };

  useEffect(() => {
    return () => {
      if (peer) peer.destroy();
    };
  }, [peer]);

  const createMatch = () => {
    if (peer) peer.destroy();
    const myId = generateHaicId();
    addLog(`[host] generating peer id ${myId}`);
    const baseIce = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:stun.services.mozilla.com' },
      { urls: 'stun:stun.stunprotocol.org:3478' }
    ];
    const pOptions = { debug: 2, config: { iceServers: baseIce } };
    if (useCustomSignaling && signalingHost) {
      pOptions.host = signalingHost;
      if (signalingPort) pOptions.port = Number(signalingPort);
      if (signalingPath) pOptions.path = signalingPath;
      pOptions.secure = !!signalingSecure;
      addLog(`[host] using custom signaling ${signalingHost}:${signalingPort}${signalingPath} secure=${signalingSecure}`);
    }
    const p = new Peer(myId, pOptions);
    setPeer(p);
    setIsHost(true);
    setMyPlayer(0);
    setStatus('waiting');

    p.on('open', (id) => {
      setPeerId(id);
      setStatus('waiting');
    });

    p.on('connection', (c) => {
      addLog(`[host] incoming connection from ${c.peer}`);
      connRef.current = c;
      remotePeerIdRef.current = c.peer;
      // immediate diagnostic of incoming connection object on host
      try {
        addLog(`[host] incoming conn initial: open=${!!c.open} peer=${c.peer} provider=${!!c.provider}`);
      } catch (e) {
        addLog('[host] incoming conn inspect failed: ' + (e && e.message ? e.message : String(e)));
      }
      // when a peer connects, wait for the DataConnection to open
      let hostChecks = 0;
      const hostPoll = setInterval(() => {
        hostChecks += 1;
        try { addLog(`[host] conn poll #${hostChecks}: open=${!!c.open}`); } catch (e) { addLog('[host] conn poll inspect failed: ' + (e && e.message ? e.message : String(e))); }
        if (c.open) { addLog('[host] conn became open during poll'); clearInterval(hostPoll); }
        else if (hostChecks >= 20) { addLog('[host] conn poll timeout (no open within 10s)'); clearInterval(hostPoll); }
      }, 500);
      c.on('open', () => {
        addLog(`[host] data connection open with ${c.peer}`);
        setStatus('connected');
        // send current authoritative state
        sendMessage({ type: 'init', state: gameState, hostPlayer: 0 });
        addLog('[host] SENT init state to client');
      });
      c.on('data', handleRemoteMessage);
      c.on('error', (err) => {
        addLog('[host] connection error: ' + (err && err.message ? err.message : String(err)));
        console.error('[host] connection error', err);
        setStatus('error');
      });
      c.on('close', () => { addLog('[host] connection closed'); setStatus('disconnected'); connRef.current = null; });
    });

    p.on('error', (err) => {
      console.error('Peer error', err);
      setStatus('error');
    });
  };

  const joinMatch = () => {
    if (!remoteId) return;
    if (peer) peer.destroy();
    const myId = generateHaicId();
    addLog(`[client] generating peer id ${myId}`);
    const baseIce = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:stun.services.mozilla.com' },
      { urls: 'stun:stun.stunprotocol.org:3478' }
    ];
    const pOptions = { debug: 2, config: { iceServers: baseIce } };
    if (useCustomSignaling && signalingHost) {
      pOptions.host = signalingHost;
      if (signalingPort) pOptions.port = Number(signalingPort);
      if (signalingPath) pOptions.path = signalingPath;
      pOptions.secure = !!signalingSecure;
      addLog(`[client] using custom signaling ${signalingHost}:${signalingPort}${signalingPath} secure=${signalingSecure}`);
    }
    const p = new Peer(myId, pOptions);
    setPeer(p);
    setIsHost(false);
    setMyPlayer(1);
    setStatus('connecting');

    p.on('open', (id) => {
      setPeerId(id);
      addLog(`[peer] local peer open: ${id}`);
      const c = p.connect(remoteId);
      addLog(`[client] connecting to ${remoteId}`);
      connRef.current = c;
      // immediate diagnostic of connection object
      try {
        addLog(`[client] conn initial: open=${!!c.open} peer=${c.peer} provider=${!!c.provider}`);
      } catch (e) {
        addLog('[client] conn initial inspect failed: ' + (e && e.message ? e.message : String(e)));
      }
      // poll the connection.open state for up to 10 seconds to help debug stuck connections
      let checks = 0;
      const poll = setInterval(() => {
        checks += 1;
        try {
          addLog(`[client] conn poll #${checks}: open=${!!c.open} bufferedAmount=${c.bufferedAmount || 0}`);
        } catch (e) {
          addLog('[client] conn poll inspect failed: ' + (e && e.message ? e.message : String(e)));
        }
        if (c.open) {
          addLog('[client] conn became open during poll');
          clearInterval(poll);
        } else if (checks >= 20) {
          addLog('[client] conn poll timeout (no open event within 10s)');
          clearInterval(poll);
        }
      }, 500);
      c.on('open', () => {
        setStatus('connected');
        addLog(`[client] data connection open to ${remoteId}`);
        // tell host who we are and what player index we expect (host assigns 0, client will be 1)
        sendMessage({ type: 'hello', from: id, requestedPlayer: 1 });
        addLog('[client] SENT hello to host');
      });
      c.on('error', (err) => { addLog('[client] connection error: ' + (err && err.message ? err.message : String(err))); console.error('[client] connection error', err); setStatus('error'); });
      c.on('data', handleRemoteMessage);
      c.on('close', () => { addLog('[client] connection closed'); setStatus('disconnected'); connRef.current = null; });
    });

    p.on('error', (err) => { addLog('[peer] error: ' + (err && err.message ? err.message : String(err))); console.error('Peer error', err); setStatus('error'); });
    p.on('disconnected', () => { addLog('[peer] disconnected'); setStatus('disconnected'); });
    p.on('close', () => { addLog('[peer] closed'); setStatus('disconnected'); });
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      addLog(`Copied to clipboard: ${text}`);
    } catch (e) {
      addLog('Clipboard copy failed: ' + (e && e.message ? e.message : String(e)));
    }
  };

  const canPlay = () => {
    // must be connected, not pending, and it must be this client's turn
    if (status !== 'connected') return false;
    if (pendingRequest) return false;
    if (myPlayer === null) return false;
    return gameState.currentPlayer === myPlayer && !gameState.isFinished;
  };

  const handleLineClick = (dir, x, y) => {
    if (!canPlay()) {
      addLog(`CLICK IGNORED dir=${dir} x=${x} y=${y} canPlay=${canPlay()}`);
      return;
    }
    applyLocalMove(dir, x, y);
  };

  const handleRemoteMessage = (msg) => {
    addLog('IN ' + JSON.stringify(msg));
    if (!msg || !msg.type) return;
    if (msg.type === 'init') {
      // initialize local state to the provided state and accept host as player 0
      if (msg.state) {
        setGameState(msg.state);
      }
      // host tells who is hostPlayer; client should already set myPlayer to 1 when joining
      if (msg.hostPlayer !== undefined) {
        // noop for now
      }
    } else if (msg.type === 'hello') {
      // host receives hello from a connecting client
      // msg.from contains remote peer id
      if (isHost) {
        remotePeerIdRef.current = msg.from || msg.peerId || connRef.current?.peer;
      }
    } else if (msg.type === 'request-move') {
      // only host should process requests
      if (!isHost) return;
      const move = msg.move;
      // verify it's the turn of the requesting player
      if (gameState.currentPlayer !== move.player) {
        // invalid: not this player's turn
        sendMessage({ type: 'violation', move, reason: 'not-your-turn', winner: 1 - move.player });
        return;
      }
      // validate bounds/occupied on host-side using current authoritative state
      const dir = move.dir === 'h' || move.dir === 0 || move.dir === '0' ? 'h' : 'v';
      const valid = validateMoveOnBoard(gameState, move, dir);
      if (!valid) {
        sendMessage({ type: 'violation', move, reason: 'invalid-move', winner: 1 - move.player });
        return;
      }
      // apply move on host authoritative state
      const newState = playMove(gameState, move.dir, move.x, move.y);
      setGameState(newState);
      // broadcast applied move and new state to peer
  sendMessage({ type: 'move-apply', move, state: newState });
    } else if (msg.type === 'move-apply') {
      // host or client receives the authoritative move application
      if (msg.state) {
        setGameState(msg.state);
      } else if (msg.move) {
        // fallback: apply move locally
        setGameState((prev) => playMove(prev, msg.move.dir, msg.move.x, msg.move.y));
      }
      // clear any pending request if present
      setPendingRequest(false);
    } else if (msg.type === 'violation') {
      setViolation({ move: msg.move, reason: msg.reason, winner: msg.winner });
      setPendingRequest(false);
    } else if (msg.type === 'reset') {
      setGameState(createInitialGameState(5,5));
      setViolation(null);
      setPendingRequest(false);
    }
  };

  // helper to validate move against a provided board state (doesn't mutate)
  const validateMoveOnBoard = (boardState, move, dir) => {
    const x = move.x; const y = move.y;
    if (dir === 'h') {
      if (x < 0 || x >= boardState.sizeX || y < 0 || y > boardState.sizeY) return false;
      if (isLineClaimed(boardState, 'h', x, y)) return false;
    } else {
      if (x < 0 || x > boardState.sizeX || y < 0 || y >= boardState.sizeY) return false;
      if (isLineClaimed(boardState, 'v', x, y)) return false;
    }
    return true;
  };

  // wrapper to call playMove and maintain API: playMove(state, dir, x, y)
  const applyLocalMove = (dir, x, y) => {
    // If we're the host, act as authoritative and apply immediately, then broadcast
    const move = { dir, x, y, player: myPlayer };
    if (isHost) {
      // verify it's our turn
      if (gameState.currentPlayer !== myPlayer) {
        setViolation({ move, reason: 'not-your-turn' });
        return;
      }
      // validate against authoritative board
      const valid = validateMoveOnBoard(gameState, move, dir);
      if (!valid) {
        setViolation({ move, reason: 'local-invalid' });
        // notify client
        sendMessage({ type: 'violation', move, reason: 'local-invalid', winner: 1 - myPlayer });
        return;
      }
  const newState = playMove(gameState, dir, x, y);
  setGameState(newState);
  // broadcast authoritative application
  sendMessage({ type: 'move-apply', move, state: newState });
      return;
    }

    // If we're a client, send a request to host and wait for approval
    if (!connRef.current) {
      setViolation({ move, reason: 'no-connection' });
      return;
    }
    // simple client-side pre-check to avoid obvious bad requests
    const preCheck = validateMoveOnBoard(gameState, move, dir);
    if (!preCheck) {
      setViolation({ move, reason: 'local-invalid' });
      return;
    }
    setPendingRequest(true);
    sendMessage({ type: 'request-move', move });
  };

  const resetGame = () => {
    setGameState(createInitialGameState(5,5));
    setViolation(null);
    sendMessage({ type: 'reset' });
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h3>Peer-to-Peer PvP</h3>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div>
          <button type="button" onClick={createMatch}>매치 생성</button>
          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {peerId ? (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div>내 ID: <code style={{ background: '#222', color: '#fff', padding: '0.1rem 0.3rem', borderRadius: 4 }}>{peerId}</code></div>
                    <button type="button" onClick={() => copyToClipboard(peerId)}>복사</button>
                  </div>
                ) : null}
                <div style={{ marginLeft: '0.5rem' }}>역할: <strong>{isHost ? '호스트' : (myPlayer !== null ? `클라이언트 (플레이어 ${myPlayer+1})` : '미정')}</strong></div>
                <div style={{ marginLeft: 'auto' }}>
                  <span style={{ padding: '0.15rem 0.5rem', borderRadius: 6, background: status === 'connected' ? '#2ecc71' : status === 'error' ? '#e74c3c' : '#888', color: '#fff' }}>{status}</span>
                  {pendingRequest ? (<span style={{ marginLeft: '0.5rem', color: '#f39c12' }}>요청 대기중…</span>) : null}
                </div>
              </div>
        </div>
        <div>
          <input placeholder="상대 ID" value={remoteId} onChange={(e) => setRemoteId(e.target.value)} />
          <div style={{ marginTop: '0.5rem' }}>
            <button type="button" onClick={joinMatch}>매치 참여</button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <BoardSVG
          sizeX={gameState.sizeX}
          sizeY={gameState.sizeY}
          lines={gameState.lines}
          boxes={gameState.boxes}
          onLineClick={(dir, x, y) => handleLineClick(dir, x, y)}
          attemptedLine={violation ? { type: violation.move.dir === 'h' || violation.move.dir === 0 ? 'h' : 'v', x: violation.move.x, y: violation.move.y } : null}
        />
      </div>

      <div style={{ marginTop: '1rem', padding: '0.5rem', borderTop: '1px solid #333' }}>
        <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input type="checkbox" checked={useCustomSignaling} onChange={(e) => setUseCustomSignaling(e.target.checked)} />
          <strong>커스텀 Signaling 서버 사용</strong>
        </label>
        {useCustomSignaling ? (
          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input placeholder="host (예: example.com)" value={signalingHost} onChange={(e) => setSignalingHost(e.target.value)} />
            <input placeholder="port (예: 9000)" style={{ width: '6rem' }} value={signalingPort} onChange={(e) => setSignalingPort(e.target.value)} />
            <input placeholder="path (예: /peerjs)" style={{ width: '10rem' }} value={signalingPath} onChange={(e) => setSignalingPath(e.target.value)} />
            <label style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}><input type="checkbox" checked={signalingSecure} onChange={(e) => setSignalingSecure(e.target.checked)} /> HTTPS</label>
          </div>
        ) : (
          <div style={{ marginTop: '0.5rem', color: '#999' }}>기본 PeerJS signaling 서버 사용 (테스트용). 커스텀 서버가 필요한 경우 체크하세요.</div>
        )}
      </div>

      <div style={{ marginTop: '1rem' }}>
        {violation ? (
          <div style={{ color: 'var(--violation-line)', fontWeight: 800 }}>
            규칙 위반 발생: 플레이어 {violation.move.player + 1}의 이동 ({violation.move.x}, {violation.move.y}) — {violation.reason}
          </div>
        ) : null}
      </div>

      <div style={{ marginTop: '1rem' }}>
        <button type="button" onClick={resetGame}>다시 시작 (네트워크 동기화)</button>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <strong>디버그 로그</strong>
          <button type="button" onClick={clearLogs}>지우기</button>
          <button type="button" onClick={async () => {
            try {
              await navigator.clipboard.writeText(logs.join('\n'));
              addLog('Logs copied to clipboard');
            } catch (e) {
              addLog('Copy to clipboard failed: ' + (e && e.message ? e.message : String(e)));
            }
          }}>복사</button>
        </div>
        <div style={{ marginTop: '0.5rem', maxHeight: '200px', overflow: 'auto', background: '#111', color: '#eee', padding: '0.5rem', borderRadius: '4px' }}>
          <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{logs.length ? logs.join('\n') : '로그가 없습니다.'}</pre>
        </div>
      </div>
    </div>
  );
}

export default PvP;
