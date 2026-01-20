import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import POList from "./pages/POList";
import Mapping from "./pages/Mapping";
import CustomerMapping from "./pages/CustomerMapping";
import MappingDashboard from "./pages/MappingDashboard";
import PendingVerification from "./pages/PendingVerification";
import Verification from "./pages/Verification";
import Export from "./pages/Export";
import ExportHistory from "./pages/ExportHistory";
import Users from "./pages/Users";
import Profile from "./pages/Profile";
import ActivityLog from "./pages/ActivityLog";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import WarehouseSettings from "./pages/WarehouseSettings";
import VehiclePositionSettings from "./pages/VehiclePositionSettings";
import TransportCodeSettings from "./pages/TransportCodeSettings";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
      <Route path="/po-list" element={<ProtectedRoute><POList /></ProtectedRoute>} />
      <Route path="/mapping" element={<ProtectedRoute><Mapping /></ProtectedRoute>} />
      <Route path="/customer-mapping" element={<ProtectedRoute><CustomerMapping /></ProtectedRoute>} />
      <Route path="/mapping-dashboard" element={<ProtectedRoute><MappingDashboard /></ProtectedRoute>} />
      <Route path="/verification" element={<ProtectedRoute><PendingVerification /></ProtectedRoute>} />
      <Route path="/verification/:id" element={<ProtectedRoute><Verification /></ProtectedRoute>} />
      <Route path="/export" element={<ProtectedRoute><Export /></ProtectedRoute>} />
      <Route path="/export-history" element={<ProtectedRoute><ExportHistory /></ProtectedRoute>} />
      <Route path="/activity-log" element={<ProtectedRoute><ActivityLog /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/settings/warehouses" element={<ProtectedRoute><WarehouseSettings /></ProtectedRoute>} />
      <Route path="/settings/vehicle-positions" element={<ProtectedRoute><VehiclePositionSettings /></ProtectedRoute>} />
      <Route path="/settings/transport-codes" element={<ProtectedRoute><TransportCodeSettings /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
