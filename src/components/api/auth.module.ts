class Auth {
  /**
   * De-authenticate a user.
   * @description Removes a token from localStorage.
   */
  static deAuthenticateUser(): void {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("organization");
    } catch (error) {
      console.error("Error while de-authenticating user:", error);
    }
  }

  static storeUser(user: any): void {
    try {
      localStorage.setItem("user", JSON.stringify(user));
    } catch (error) {
      console.error("Error while storing user data:", error);
    }
  }

  static authenticateUser(data: { accessToken: string; data: any }): void {
    try {
      const { accessToken, data: userData } = data;
      console.log(accessToken);
      localStorage.setItem("token", accessToken);
      localStorage.setItem("user", JSON.stringify(userData));
      //  CrossDomainStorage.sendMessage(data);
    } catch (error) {
      console.error("Error while authenticating user:", error);
    }
  }

  /**
   * Check if a user is authenticated.
   * @returns {boolean} True if a token is saved in Local Storage, false otherwise.
   */
  static isUserAuthenticated(): boolean {
    try {
      const token = localStorage.getItem("token");

      return Boolean(token);
    } catch (error) {
      console.error("Error while checking user authentication:", error);
      return false;
    }
  }

  /**
   * Retrieve token from local storage.
   * @returns {string | boolean} User token if available, false otherwise.
   */
  static getToken(): string | boolean {
    try {
      const token = localStorage.getItem("token");
      return token || false;
    } catch (error) {
      console.error("Error while retrieving token:", error);
      return false;
    }
  }
}

export default Auth;
