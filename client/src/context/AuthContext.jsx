
// import {
//   createContext,
//   useContext,
//   useEffect,
//   useState
// } from "react";

// import api from "../services/api";

// const AuthContext = createContext(null);

// export const AuthProvider = ({ children }) => {
//   const [staff, setStaff] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // Verify existing login session
//   useEffect(() => {
//     const verifySession = async () => {
//       const token = sessionStorage.getItem("bikeledger_token");

//       if (!token) {
//         setLoading(false);
//         return;
//       }

//       try {
//         const response = await api.get("/auth/me");
//         setStaff(response.data.staff);
//       } catch (error) {
//         sessionStorage.removeItem("bikeledger_token");
//         setStaff(null);
//       } finally {
//         setLoading(false);
//       }
//     };

//     verifySession();
//   }, []);

//   // Login function
//   const login = async (email, password) => {
//     const response = await api.post("/auth/login", {
//       email,
//       password
//     });

//     sessionStorage.setItem(
//       "bikeledger_token",
//       response.data.token
//     );

//     setStaff(response.data.staff);

//     return response.data;
//   };

//   // Logout function
//   const logout = () => {
//     sessionStorage.removeItem("bikeledger_token");
//     setStaff(null);
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         staff,
//         loading,
//         login,
//         logout,
//         isAuthenticated: Boolean(staff)
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);

//   if (!context) {
//     throw new Error(
//       "useAuth must be used inside AuthProvider"
//     );
//   }

//   return context;
// };

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import { auth, db } from "../firebase";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load and verify the staff profile from Firestore
  const loadStaffProfile = async (user) => {
    const staffRef = doc(db, "staff", user.uid);
    const staffSnap = await getDoc(staffRef);

    if (!staffSnap.exists()) {
      throw new Error("Staff profile not found.");
    }

    const staffData = staffSnap.data();

    if (staffData.active !== true) {
      throw new Error("Your staff account is inactive.");
    }

    return {
      id: user.uid,
      name: staffData.name,
      email: user.email,
      role: staffData.role,
    };
  };

  // Monitor Firebase authentication session
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        try {
          if (user) {
            const profile = await loadStaffProfile(user);
            setStaff(profile);
          } else {
            setStaff(null);
          }
        } catch (error) {
          await signOut(auth);
          setStaff(null);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  // Firebase login
  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

    try {
      const profile = await loadStaffProfile(result.user);
      setStaff(profile);
      return profile;
    } catch (error) {
      await signOut(auth);
      throw error;
    }
  };

  // Firebase logout
  const logout = async () => {
    await signOut(auth);
    setStaff(null);
  };

  return (
    <AuthContext.Provider
      value={{
        staff,
        loading,
        login,
        logout,
        isAuthenticated: Boolean(staff),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};

