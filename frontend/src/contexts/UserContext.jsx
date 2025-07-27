import React, { createContext, useState, useEffect } from "react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch("/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUserId(data.user_id); // adjust key as per your API response
        }
      } catch (err) {
        setUserId(null);
      }
    }
    fetchUserInfo();
  }, []);

  return (
    <UserContext.Provider value={{ userId, setUserId }}>
      {children}
    </UserContext.Provider>
  );
};
