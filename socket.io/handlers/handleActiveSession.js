import _Socket from "../../DB/model/socket.model.js";
import * as socket from "socket.io";
import Token from "../../DB/model/token.model.js";
import { asyncHandelerScoket } from "../utils/asyncHandelerScoket.js";

/**
 * Handle the user's active session by managing socket connections and updating user and socket records.
 * @param {Object} io - Socket.IO instance.
 * @param {Object} socket - Socket object representing the connection.
 * @param {string} userId - ID of the user associated with the session.
 * @param {Object} user - User object containing session information.
 * @param {string} accessToken - Access token associated with the user's session.
 * @returns {Promise<string>} - Returns a promise that resolves with the ID of the associated token.
 * @throws {Error} - Throws an error if the token is invalid or if there are issues with socket and user updates.
 */
const handleActiveSession = (io, socket, userId, user, accessToken) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Find the token associated with the provided access token
      const token = await Token.findOne({ token: accessToken });

      // Check if the token is valid
      if (!token || !token.valid) {
        throw new Error("Token is not valid");
      }

      // Check if the user is currently marked as offline
      if (user.isOnline === false) {
        // Update user status to online
        user.isOnline = true;

        // Create a new socket record
        const _socket = new _Socket({
          user: userId,
          socketId: socket.id,
          token: token._id,
        });

        // Save user and socket records
        await user.save();
        await _socket.save();
      } else {
        // Check if the user has a previous socket record
        const prevSocketId = await _Socket.findOne({
          user: userId,
          token: token._id,
        });

        if (prevSocketId) {
          // Disconnect the previous socket
          io.sockets.sockets.get(prevSocketId)?.disconnect(true);

          // Update the socket ID in the socket record
          await _Socket.updateOne(
            { user: userId, token: token._id },
            { socketId: socket.id }
          );

          // Save user record
          await user.save();
        } else {
          // If no previous socket record exists, create a new socket record
          const _socket = new _Socket({
            user: userId,
            socketId: socket.id,
            token: token._id,
          });

          // Save the new socket record
          await _socket.save();
        }
      }

      // Log the token ID and resolve the promise with the token ID
      console.log(`Token ID from handleActiveSession: ${token._id}`);
      resolve({ tokenId: token._id });
    } catch (error) {
      // Handle any errors, log the error, and reject the promise with the error
      console.error(`Error in handleActiveSession: ${error.message}`);
      reject(error);
    }
  });
};

export default handleActiveSession;
