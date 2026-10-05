import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/react";

import PageNotFound from "./lib/PageNotFound";
import { AuthProvider } from "@/lib/AuthContext";
import { SiteProvider } from "@/lib/SiteContext";
import SiteLayout from "@/components/site/SiteLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

// Pages
import Landing from "@/pages/Landing";
import LostFound from "@/pages/LostFound";
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
import ThriftBrowse from "@/pages/thrift/ThriftBrowse";
import ListingDetail from "@/pages/thrift/ListingDetail";
import SellItem from "@/pages/thrift/SellItem";
import Orders from "@/pages/thrift/Orders";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        {/* PUBLIC — anyone can browse */}
        <Route path="/" element={<Landing />} />
        <Route path="/lost" element={<LostFound />} />
        <Route path="/item/:id" element={<ItemDetail />} />
        <Route path="/thrift" element={<ThriftBrowse />} />
        <Route path="/thrift/:id" element={<ListingDetail />} />
        <Route path="/map" element={<MapView />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* NEEDS AN ACCOUNT */}
        <Route element={<ProtectedRoute />}>
          <Route path="/post" element={<PostItem />} />
          <Route path="/posts" element={<Navigate to="/post" replace />} />
          <Route path="/edit-post/:id" element={<EditPost />} />
          <Route path="/sell" element={<SellItem />} />
          <Route path="/sell/:id/edit" element={<SellItem />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/chats" element={<Chats />} />
          <Route path="/chat/:conversationId" element={<ChatRoom />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/rewards" element={<Rewards />} />
        </Route>
      </Route>

      {/* ADMIN */}
      <Route path="/admin" element={<AdminDashboard />} />

      {/* 404 */}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider attribute="class" forcedTheme="light" defaultTheme="light">
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <SiteProvider>
            <Router>
              <ScrollToTop />
              <AppRoutes />
            </Router>
          </SiteProvider>
          <Toaster />
          <Analytics />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
