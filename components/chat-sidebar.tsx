import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

export function ChatSidebar({ open, onClose, userId }: { open: boolean; onClose: () => void; userId: string }) {
  const [chats, setChats] = useState<any[]>([]);

  useEffect(() => {
    if (!open || !userId) return;
    
    console.log("Loading diagnosis history for user:", userId);
    
    // Query user's specific diagnosis subcollection
    const userDiagnosisRef = collection(db, `users/${userId}/diagnosis`);
    const q = query(userDiagnosisRef, orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userChats = snapshot.docs.map((doc) => ({
        id: doc.id,
        symptoms: doc.data().symptoms || "",
        diagnosis: doc.data().answer || "",
        createdAt: doc.data().createdAt 
          ? doc.data().createdAt.toDate().toLocaleString()
          : "Unknown time",
        type: doc.data().type || "text",
      }));
      
      setChats(userChats);
    }, (error) => {
      console.error("Error fetching user diagnosis:", error);
    });
    
    return () => unsubscribe();
  }, [open, userId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Sidebar - Increased z-index to be above everything */}
      <div className="relative z-50 w-80 bg-gray-900 h-full flex flex-col shadow-xl">
        {/* Header - Now with proper z-index and padding */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
          <span className="ml-14 text-lg font-bold text-white">Diagnosis History</span>

          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white p-2 rounded transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {chats.length === 0 && (
            <div className="text-gray-500 text-center py-8">
              <div className="text-2xl mb-2">📋</div>
              <div className="text-lg font-medium">No diagnosis history</div>
              <div className="text-sm opacity-60">Your medical consultations will appear here</div>
            </div>
          )}
          
          {chats.map(chat => (
            <div 
              key={chat.id} 
              className="bg-gray-800/80 border border-gray-700 rounded-lg p-4 space-y-2 text-white hover:shadow-lg transition-all duration-200 hover:bg-gray-800/100"
            >
              {/* Symptoms - Keep full content but limit height */}
              <div className="font-semibold text-sm line-clamp-1 mb-1"> {/* Changed from line-clamp-2 */}
                {chat.symptoms}
              </div>
              
              
              
              {/* Date */}
              <div className="text-xs text-gray-400 mt-1">
                {chat.createdAt}
              </div>
              
              {/* View Full Details */}
             
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
