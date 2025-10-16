import { useEffect, useState } from "react";
import { X, Trash2, Edit } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, orderBy, query, doc, deleteDoc, updateDoc } from "firebase/firestore";

interface ChatSidebarProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onSelectChat: (chat: { id: string; symptoms: string; diagnosis: string; type: string; createdAt: string; imageData?: string; imageName?: string; }) => void;
}

export function ChatSidebar({ open, onClose, userId, onSelectChat }: ChatSidebarProps) {
  const [chats, setChats] = useState<any[]>([]);
  const [editChatId, setEditChatId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!open || !userId) return;

    setIsLoading(true);

    const userDiagnosisRef = collection(db, `users/${userId}/diagnosis`);
    const q = query(userDiagnosisRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const userChats = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            symptoms: data.symptoms || "",
            diagnosis: data.answer || "",
            createdAt: data.createdAt
              ? data.createdAt.toDate().toLocaleString()
              : "Unknown time",
            type: data.type || "text",
            imageData: data.imageData || null,
            imageName: data.imageName || null,
          }
        });
        setChats(userChats);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching user diagnosis:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [open, userId]);

  if (!open) return null;

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, `users/${userId}/diagnosis`, id));
      if (editChatId === id) {
        setEditChatId(null);
        setEditText("");
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  const handleEdit = (chat: any) => {
    setEditChatId(chat.id);
    setEditText(chat.symptoms);
  };

  const handleSaveEdit = async () => {
    if (!editChatId) return;
    try {
      const chatRef = doc(db, `users/${userId}/diagnosis`, editChatId);
      await updateDoc(chatRef, {
        symptoms: editText,
      });
      setEditChatId(null);
      setEditText("");
    } catch (error) {
      console.error("Error updating chat:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-80 bg-gray-900 h-full flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
          <span className="ml-14 text-lg font-bold text-white">Diagnosis History</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-2 rounded transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <svg
                className="animate-spin h-8 w-8 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            </div>
          ) : chats.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              <div className="text-2xl mb-2">📋</div>
              <div className="text-lg font-medium">No diagnosis history</div>
              <div className="text-sm opacity-60">Your medical consultations will appear here</div>
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                className="bg-gray-800/80 border border-gray-700 rounded-lg p-4 space-y-2 text-white hover:shadow-lg transition-all duration-200 hover:bg-gray-800/100 group cursor-pointer"
                onClick={() => (editChatId === chat.id ? undefined : onSelectChat(chat))}
              >
                {editChatId === chat.id ? (
                  <>
                    <textarea
                      className="w-full p-2 rounded bg-gray-700 text-white resize-none"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={2}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveEdit();
                        }}
                        className="bg-blue-600 hover:bg-blue-700 py-1 px-3 rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditChatId(null);
                          setEditText("");
                        }}
                        className="bg-gray-600 hover:bg-gray-700 py-1 px-3 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      className="font-semibold text-sm line-clamp-2 mb-1"
                      title="Click to view full chat"
                    >
                      {chat.symptoms}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{chat.createdAt}</div>
                    <div className="flex space-x-3 mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(chat);
                        }}
                        className="text-gray-400 hover:text-white"
                        aria-label="Edit chat"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(chat.id);
                        }}
                        className="text-gray-400 hover:text-white"
                        aria-label="Delete chat"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
