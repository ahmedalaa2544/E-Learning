import handleActiveSession from "./handlers/handleActiveSession.js";
import initialSocketConfig from "./handlers/initialVerification.js";
import userDisconnect from "./handlers/userDisconnect.js";
import { asyncHandelerScoket } from "../socket.io/utils/asyncHandelerScoket.js";

/**
 * Main socket event handler for managing user connections and handling various socket events.
 * @param {Object} io - Socket.IO instance.
 * @param {Object} socket - Socket object representing the connection.
 * @throws {Error} - Throws an error if there are issues with the initial socket configuration,
 *   handling the active session, or handling specific socket events.
 */
const socketMain = asyncHandelerScoket(async (io, socket) => {
  // Initialize socket configuration and retrieve user information
  const { id, userPayload, accessToken } = await initialSocketConfig(
    io,
    socket
  );

  // Handle the user's active session, get associated token ID
  const { tokenId } = await handleActiveSession(
    io,
    socket,
    id,
    userPayload,
    accessToken
  );

  /*




  // Example
  socket.emit("sendMessage", async (payload) =>
    sendMessage(socket, id, userPayload, payload)
  );



  */
  // Handle the "disconnect" event
  socket.on("disconnect", async (io, socket) => {
    // Handle user disconnection and perform cleanup actions
    userDisconnect(io, socket, id, userPayload, tokenId);
    // Perform additional cleanup or other actions when a user disconnects
  });
});

export default socketMain;
