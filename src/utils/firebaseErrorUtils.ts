/**
 * Maps Firebase auth error codes to user-friendly messages.
 * @param error - The error object from Firebase
 * @returns A user-friendly error string
 */
export const getFriendlyFirebaseErrorMessage = (error: any): string => {
  if (!error) return "An unexpected error occurred. Please try again.";

  // Handle Firebase Auth errors
  const errorCode = error.code;
  const errorMessage = error.message;

  switch (errorCode) {
    case "auth/invalid-credential":
      return "Invalid email or password. Please try again.";
    case "auth/user-not-found":
      return "No account found with this email. Please sign up.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Please log in.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/popup-closed-by-user":
      return "Sign-in popup was closed. Please try again.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection and try again.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    default:
      // Fallback: If no specific code matches, try to use the message but clean it up if it looks like a raw firebase error
      if (errorMessage && errorMessage.includes("Firebase:")) {
        // If we really can't map it, return a generic message to avoid showing code
        return "Authentication failed. Please try again.";
      }
      return errorMessage || "An unexpected error occurred. Please try again.";
  }
};
