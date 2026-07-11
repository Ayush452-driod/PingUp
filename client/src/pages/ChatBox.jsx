import React, { useEffect, useState, useRef } from "react";
import { ImageIcon, SendHorizontal } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios.js";
import {
  addMessages,
  resetMessages,
  fetchMessages,
} from "../features/messages/messagesSlice";
import toast from "react-hot-toast";

const ChatBox = () => {
  const { messages } = useSelector((state) => state.messages);
  const { connections } = useSelector((state) => state.connections);

  const { userId } = useParams();
  const { getToken, userId: currentUserId } = useAuth();

  const dispatch = useDispatch();

  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [user, setUser] = useState(null);

  const messagesEndRef = useRef(null);

  // Fetch messages
  const fetchUserMessages = async () => {
    try {
      const token = await getToken();
      dispatch(fetchMessages({ token, userId }));
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // Send message
  const sendMessage = async () => {
    try {
      if (!text.trim() && !image) return;

      const token = await getToken();

      const formData = new FormData();
      formData.append("to_user_id", userId);
      formData.append("text", text);

      if (image) {
        formData.append("image", image);
      }

      const { data } = await api.post("/api/message/send", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (data.success) {
        setText("");
        setImage(null);

        dispatch(addMessages(data.message));
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // Load messages whenever user changes
  useEffect(() => {
    fetchUserMessages();

    return () => {
      dispatch(resetMessages());
    };
  }, [userId, dispatch]);

  // Find selected user
  useEffect(() => {
    if (connections.length > 0) {
      const selectedUser = connections.find(
        (connection) => connection._id === userId
      );

      setUser(selectedUser || null);
    }
  }, [connections, userId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  if (!user) return null;

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div
        className="flex items-center gap-2 p-2 md:px-10 xl:pl-42
      bg-linear-to-r from-indigo-50 to-purple-50
      border-b border-gray-300"
      >
        <img
          src={user.profile_picture}
          alt={user.fullname}
          className="size-8 rounded-full"
        />

        <div>
          <p className="font-medium">
            {user.fullname || user.full_name}
          </p>

          <p className="text-sm text-gray-500 -mt-1.5">
            @{user.username}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 md:px-10">
        <div className="space-y-4 max-w-4xl mx-auto">
          {[...messages]
            .sort(
              (a, b) =>
                new Date(a.createdAt) - new Date(b.createdAt)
            )
            .map((message, index) => {
              const isOwnMessage =
                message.from_user_id === currentUserId;

              return (
                <div
                  key={message._id || index}
                  className={`flex flex-col ${
                    isOwnMessage ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`p-2 text-sm max-w-sm rounded-lg shadow ${
                      isOwnMessage
                        ? "bg-indigo-500 text-white rounded-br-none"
                        : "bg-white text-slate-700 rounded-bl-none"
                    }`}
                  >
                    {message.message_type === "image" && (
                      <img
                        src={message.media_url}
                        alt=""
                        className="w-full max-w-sm rounded-lg mb-2"
                      />
                    )}

                    {message.text && <p>{message.text}</p>}
                  </div>
                </div>
              );
            })}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="px-4">
        <div
          className="flex items-center gap-3 pl-5 p-1.5
        bg-white w-full max-w-xl mx-auto
        border border-gray-200 shadow rounded-full mb-5"
        >
          <input
            type="text"
            className="flex-1 outline-none text-slate-700"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && sendMessage()
            }
          />

          <label htmlFor="image" className="cursor-pointer">
            {image ? (
              <img
                src={URL.createObjectURL(image)}
                alt=""
                className="h-8 rounded"
              />
            ) : (
              <ImageIcon className="size-7 text-gray-400" />
            )}

            <input
              type="file"
              id="image"
              hidden
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])}
            />
          </label>

          <button
            onClick={sendMessage}
            className="bg-linear-to-br from-indigo-500 to-purple-600
            hover:from-indigo-700 hover:to-purple-800
            active:scale-95 text-white p-2 rounded-full"
          >
            <SendHorizontal size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;