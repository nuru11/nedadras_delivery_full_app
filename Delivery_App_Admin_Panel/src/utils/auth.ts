// export const getToken = () => {
//   return localStorage.getItem("auth_token");
// };

// export const isAuthenticated = () => {
//   return !!getToken();
// };

// export const logout = () => {
//   localStorage.removeItem("auth_token");
//   localStorage.removeItem("auth_user");
// };



export const getToken = () => localStorage.getItem("auth_token");

export const isTokenExpired = (token: string) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1])); // decode JWT
    const exp = payload.exp * 1000; // convert to ms
    return Date.now() > exp;
  } catch (err) {
    console.error("Error checking token expiration:", err);
    return true; // token invalid → treat as expired
  }
};

export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;

  if (isTokenExpired(token)) {
    logout();
    return false;
  }

  return true;
};

export const logout = () => {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
};
