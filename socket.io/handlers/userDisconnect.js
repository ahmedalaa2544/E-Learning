import { asyncHandelerScoket } from "../utils/asyncHandelerScoket.js";
import _Socket from "../../DB/model/socket.model.js";
/**
 * Handles user disconnection by deleting associated socket records and updating user status.
 * @param {Object} socket - Socket object representing the connection.
 * @param {string} userId - ID of the user associated with the session.
 * @param {Object} user - User object containing session information.
 * @param {string} tokenId - ID of the token associated with the user's session.
 * @throws {Error} - Throws an error if there are issues with deleting socket records or updating user status.
 */
const userDisconnect = asyncHandelerScoket(
  async (io, socket, userId, user, tokenId) => {
    // Delete all socket records associated with the user and token
    await _Socket.deleteMany({ user: userId, token: tokenId });

    // Find online sockets for the user
    const onlineSockets = await _Socket.find({ user: userId });

    // Check if the user has no more online sockets
    if (onlineSockets.length === 0) {
      // Update user status to offline
      user.isOnline = false;
      await user.save();
      // Disconnect the socket if token verification fails
      socket.disconnect(true);
    }
  }
);

export default userDisconnect;
