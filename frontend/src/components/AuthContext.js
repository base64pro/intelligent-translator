import React, { createContext, useContext, useState, useEffect } from 'react';
import { setAuthToken, getCurrentUser } from '../apiClient'; // Import apiClient functions

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('authToken'));
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Effect to set Axios default header and fetch user on token change
    useEffect(() => {
        const initializeAuth = async () => {
            if (token) {
                setAuthToken(token);
                try {
                    const currentUser = await getCurrentUser(); // Fetch user data
                    setUser(currentUser);
                } catch (error) {
                    console.error('Failed to fetch current user:', error);
                    // If fetching user fails, token might be invalid/expired, so clear it
                    setToken(null);
                    localStorage.removeItem('authToken');
                    setAuthToken(null);
                }
            } else {
                setAuthToken(null); // Ensure no token is set in headers if none exists
                setUser(null);
            }
            setLoading(false); // Authentication initialization is complete
        };

        initializeAuth();
    }, [token]); // Rerun when token changes

    const login = (newToken) => {
        setToken(newToken);
        localStorage.setItem('authToken', newToken);
        // User data will be fetched by the useEffect hook after token is set
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('authToken');
        // Clear the Authorization header in Axios
        setAuthToken(null);
    };

    const isAuthenticated = !!token; // Simple check if a token exists

    // If loading, you might want to render a loading spinner or null
    if (loading) {
        return <div>Loading authentication...</div>; // Or a more sophisticated loading component
    }

    return (
        <AuthContext.Provider value={{ token, user, isAuthenticated, login, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);