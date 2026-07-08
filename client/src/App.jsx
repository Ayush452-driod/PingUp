import React from "react";
import { Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Feed from "./pages/Feed";
import Messages from "./pages/Messages";
import ChatBox from "./pages/ChatBox";
import Connections from "./pages/Connections";
import Discover from "./pages/Discover";
import Profile from "./pages/Profile";
import CreatePost from "./pages/CreatePost";
import Layout from "./pages/Layout";
import { useUser , useAuth } from "@clerk/clerk-react";
import Loading from "./components/Loading";
import {Toaster} from 'react-hot-toast';
import { useEffect } from "react";

function App() {
  const { isSignedIn, isLoaded, user } = useUser();
  const {getToken} = useAuth();

    useEffect(()=>{
      if(user){
        getToken().then((token)=>console.log(token));
      }
    },[user])

  if (!isLoaded) {
    return (
      <Loading/>
    )
  }

  return (
    <>
     <Toaster/>
    <Routes>
      <Route
        path="/"
        element={isSignedIn ? <Layout /> : <Login />}
      >
        <Route index element={<Feed />} />
        <Route path="messages" element={<Messages />} />
        <Route path="messages/:userId" element={<ChatBox />} />
        <Route path="connections" element={<Connections />} />
        <Route path="discover" element={<Discover />} />
        <Route path="profile" element={<Profile />} />
        <Route path="profile/:profileId" element={<Profile />} />
        <Route path="create-post" element={<CreatePost />} />
      </Route>
    </Routes>
    </>
   
  );
}

export default App;