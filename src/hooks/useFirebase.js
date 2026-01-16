import { useState, useEffect } from 'react';
import {
    onAuthStateChanged,
    signInAnonymously
} from "firebase/auth";
import { auth } from '../firebase';

export function useAuth() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!isMounted) return;

            try {
                if (!user) {
                    const cred = await signInAnonymously(auth);
                    if (isMounted) setUser(cred.user);
                } else {
                    setUser(user);
                }
                setError(null);
            } catch (err) {
                console.error("Auth error:", err);
                if (isMounted) {
                    setError(err.message || "Error de autenticación");
                    // Si falla auth, crear usuario local temporal
                    setUser({
                        uid: `temp_${Date.now()}`,
                            isAnonymous: true
                    });
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, []);

    return { user, loading, error };
}
