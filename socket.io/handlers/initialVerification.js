import jwt from "jsonwebtoken";
const { verify } = jwt;
import User from "../../DB/model/user.model.js";
import { asyncHandelerScoket } from "../utils/asyncHandelerScoket.js";

/**
 * Initialize socket configuration by verifying the provided access token and obtaining user details.
 * @param {Object} _ - Placeholder for the request object (unused).
 * @param {Object} socket - Socket object representing the connection.
 * @returns {Object} - Object containing user information and access token details.
 * @throws {Error} - Throws an error if the access token is invalid or if JWT verification fails.
 */
const initialSocketConfig = asyncHandelerScoket(async (_, socket) => {
  // Extract access token from socket handshake
  let { accessToken } = socket.handshake.auth;

  // Check if the access token is valid
  if (!accessToken?.startsWith(process.env.BEARER_TOKEN)) {
    // Return an error if the token is invalid
    throw new Error("Required a valid token");
  }

  // Extract payload from the access token
  accessToken = accessToken.split(process.env.BEARER_TOKEN)[1];
  const { id } = verify(
    accessToken,
    process.env.TOKEN_SIGNTURE,
    (err, decoded) => {
      if (err) {
        // Handle the JWT verification error (e.g., send an error response to the client)
        throw new Error("JWT verification failed");
      }

      return decoded;
    }
  );

  // Retrieve user details from the database based on the user ID
  const userPayload = await User.findById(id);

  // Return an object containing user information and access token details
  return {
    id,
    userPayload,
    accessToken,
  };
});

export default initialSocketConfig;
