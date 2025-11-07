# PvP Postpone / Diagnostic Notes

Date: 2025-11-08

Summary
-------
We are temporarily disabling the PvP entry point while we document the current implementation, runtime diagnostics, and next steps required to make PvP reliable across networks.

Files touched
-------------
- `src/components/PvP.jsx` — new implementation added (host-authoritative flow, extensive debug logging, UI, STUN servers, optional custom signaling inputs).
- `src/components/ModeSelector.jsx` — PvP button was enabled earlier for testing; it has now been disabled again.

Current behavior
----------------
- PvP UI exists and can be built at `/src/components/PvP.jsx`.
- Implemented host-authoritative model: clients send `request-move`, host validates and broadcasts `move-apply`.
- Added an in-page debug log viewer capturing all IN/OUT messages and connection events.
- Peer IDs are now generated in the format `haic-XXXXXX`.
- Multiple public STUN servers are configured when creating Peer instances.

Observed issues (from debug run)
--------------------------------
- When attempting to connect two local tabs/machines, DataConnection objects are created on both sides but never transition to `open`.
- Example logs show polling `c.open` remains `false` for both host and client and a 10s timeout:
  - Client side: repeated `conn poll #N: open=false bufferedAmount=0` then `conn poll timeout (no open event within 10s)`.
  - Host side: similar `conn poll` entries and timeout.
- Signaling did reach the host process (host receives incoming connection with client peer id), but WebRTC `open` did not occur.

Likely root causes
------------------
1. ICE candidate exchange / NAT traversal issue
   - Even with STUN servers, some NATs/routers require a TURN relay to establish a data channel.
   - Without TURN, symmetric NATs or restrictive firewalls will fail to open the P2P data channel.
2. Signaling server connectivity or compatibility
   - The default PeerJS public server may be rate-limited, unreachable, or inappropriate for production use.
   - Using a custom PeerServer (self-hosted) with a proper domain and TLS may improve reliability.
3. Mixed-content / HTTPS requirement
   - If the clients are not both using secure contexts (https) or are cross-origin, browsers may block certain steps.
4. ID collisions or PeerJS internal errors
   - Low probability but possible; code should handle `id in use` errors and retry with a new id.

Immediate recommendations
-------------------------
- Short term (quick wins):
  1. Keep PvP button disabled in UI (done).
  2. Add automatic ID-retry on `id` conflicts (implement 2-3 attempts with backoff).
  3. Document and expose a configuration to use a custom PeerServer (we added UI for this) and provide scripts/readme for running `peerjs-server` locally for testing.
  4. Try tests with a known reachable PeerServer (self-hosted or a reliable public server) and with TURN servers if required.

- Mid term:
  1. Provision a TURN server (coturn) or use a managed TURN provider for robust NAT traversal.
  2. Harden signaling: host-authoritative confirmations, message sequencing (nonces), replay protection.
  3. Improve reconnection logic: handle host drop, reassign host or stop match cleanly.
  4. Add UI improvements: copy ID on create, better connection state UX, show ICE/signal errors to user.

- Long term (production-ready):
  1. Consider porting PvP to server-mediated matches (host as authoritative server or central game server) for security and reliability.
  2. Implement match-making, persistent sessions, and replay logging on server-side.

What to do next (actionable tasks)
----------------------------------
- Implement ID collision retry (2 attempts, regenerate `haic-` id, recreate Peer).
- Add optional TURN config (configurable via UI or environment) and test with a TURN server.
- Provide a small `docker-compose` recipe to run `peerjs-server` + optional coturn for dev testing; include instructions in README.
- If immediate testing needed, host a `peerjs-server` locally and point both peers at it using the PvP UI custom-signaling fields.

Notes
-----
- All PvP work, logs and experiments are saved in `src/components/PvP.jsx` and the page log viewer allows copying logs for analysis.
- For debugging connectivity, gather both clients' browser console logs (the in-page logs are helpful but pair them with console network/ICE logs in devtools).

State: PvP deferred
-------------------
PvP entry button in the mode selector has been disabled. We will resume PvP work after implementing the short-term recommendations above or when a reliable signaling/TURN solution is available.

