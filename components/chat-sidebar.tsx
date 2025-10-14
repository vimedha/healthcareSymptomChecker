import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";

export function ChatSidebar({ open, onClose, userId }: { open: boolean; onClose: () => void; userId: string }) {
  const [chats, setChats] = useState<any[]>([]);

  useEffect(() => {
    if (!open) return;
    
    console.log("Opening sidebar, fetching all diagnosis records...");
    
    const diagnosisRef = collection(db, "diagnosis");
    const unsubscribe = onSnapshot(diagnosisRef, (snapshot) => {
      console.log("Total diagnosis records found:", snapshot.size);
      
      if (snapshot.empty) {
        console.log("No diagnosis documents found in collection");
      }
      
      // Map your actual document structure
      const allDiagnosis = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          symptoms: data.symptoms || "(no symptoms provided)",
          diagnosis: data.answer || "(no diagnosis)",
          createdAt: data.createdAt 
            ? data.createdAt.toDate().toLocaleDateString() 
            : "Unknown date",
          // Add other fields you want to display
        };
      });
      
      console.log("Loaded diagnosis entries:", allDiagnosis.length);
      setChats(allDiagnosis);
    }, (error) => {
      console.error("Error fetching diagnosis collection:", error);
    });
    
    return () => {
      console.log("Closing sidebar, unsubscribing...");
      unsubscribe();
    };
  }, [open]); // Only re-run when open state changes

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Sidebar */}
      <div className="relative z-10 w-80 bg-gray-900 h-full flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <span className="text-lg font-bold text-white">Diagnosis History</span>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {chats.length === 0 && (
            <div className="text-gray-500 text-center py-8">
              <div className="text-2xl mb-2">📋</div>
              <div className="text-lg font-medium">No diagnosis records</div>
              <div className="text-sm opacity-60">
                Your medical consultations will appear here
              </div>
            </div>
          )}
          
          {chats.map((chat) => (
            <div 
              key={chat.id} 
              className="bg-gray-800/80 border border-gray-700 rounded-lg p-4 space-y-2 text-white hover:bg-gray-800 transition-all duration-200 hover:shadow-lg"
            >
              {/* Symptoms (User Input) */}
              <div className="font-semibold text-sm line-clamp-2 mb-1">
                {chat.symptoms}
              </div>
              
              {/* Diagnosis Summary */}
              <div className="text-xs text-gray-300 leading-relaxed space-y-1">
                {chat.diagnosis.length > 150 ? (
                  <div className="line-clamp-3">
                    {chat.diagnosis.substring(0, 150)}...
                  </div>
                ) : (
                  <div>{chat.diagnosis}</div>
                )}
              </div>
              
              {/* Date */}
              <div className="text-xs text-gray-400">
                {chat.createdAt}
              </div>
              
              {/* View Full Details */}
              <div className="flex items-center space-x-2 pt-2">
                <span className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer underline">
                  View details →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
