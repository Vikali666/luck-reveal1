// src/hooks/useFirestore.js
import { useState, useEffect } from 'react';
import {
    collection,
    query,
    orderBy,
    limit,
    onSnapshot
} from "firebase/firestore";
import { db, CHAT_PATH } from '../firebase';

export function useChatListener() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);

        const q = query(
            collection(db, CHAT_PATH),
                        orderBy("createdAt", "desc"),
                        limit(50)
        );

        const unsubscribe = onSnapshot(q,
                                       (snapshot) => {
                                           const docs = snapshot.docs.map(doc => ({
                                               id: doc.id,
                                               ...doc.data(),
                                                                                  timestamp: doc.data().createdAt?.toDate?.() || new Date()
                                           }));
                                           // Ordenar ascendente para chat
                                           setMessages(docs.reverse());
                                           setError(null);
                                           setLoading(false);
                                       },
                                       (err) => {
                                           console.error("Firestore error:", err);
                                           setError(err.message);
                                           setLoading(false);
                                       }
        );

        return () => unsubscribe();
    }, []);

    return { messages, loading, error };
}
