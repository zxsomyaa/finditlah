import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";

import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
  Navigate,
} from "react-router-dom";

import PageNotFound from "./lib/PageNotFound";
import { AuthProvider } from "@/lib/AuthContext";

import { ThemeProvider } from "next-themes";
import { AnimatePresence, motion } from "framer-motion";

import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

// Pages
import Home from "@/pages/Home";
import PostItem from "@/pages/PostItem";
import EditPost from "@/pages/EditPost";
import ItemDetail from "@/pages/ItemDetail";
import MapView from "@/pages/MapView";
import Chats from "@/pages/Chats";
import ChatRoom from "@/pages/ChatRoom";
import Profile from "@/pages/Profile";
import Rewards from "@/pages/Rewards";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import AdminDashboard from "@/pages/AdminDashboard";
import ResetPassword from "@/pages/ResetPassword";

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const pageTransition = { duration: 0.2, ease: "easeInOut" };

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
        style={{ width: "100%" }}
      >
        <Routes location={location}>
          {/* AUTH */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* PROTECTED APP */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/map" element={<MapView />} />

              <Route path="/post" element={<PostItem />} />
              <Route path="/posts" element={<Navigate to="/post" replace />} />
              <Route path="/edit-post/:id" element={<EditPost />} />

              <Route path="/chats" element={<Chats />} />
              <Route path="/chat/:conversationId" element={<ChatRoom />} />

              <Route path="/profile" element={<Profile />} />
              <Route path="/rewards" element={<Rewards />} />
              <Route path="/item/:id" element={<ItemDetail />} />
            </Route>
          </Route>

          {/* ADMIN */}
          <Route path="/admin" element={<AdminDashboard />} />

          {/* 404 */}
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AnimatedRoutes />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}