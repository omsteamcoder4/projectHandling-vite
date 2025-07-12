import {
  createBrowserRouter,
  RouterProvider,
  Route,
  createRoutesFromElements,
  Navigate,
} from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import NotFound from "../pages/NotFound";
import Projects from "../pages/Projects";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import ProtectedRoute from "../components/ProtectedRoute";
import ShareUpload from "../components/ShareUpload";
import UserManagement from "../components/UserManagement";
import { AuthProvider } from "../context/AuthContex";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* ── Public Routes ─────────────────────────────── */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Signup />} />
      <Route path="/share/:token" element={<ShareUpload />} />

      {/* ── Protected Routes ──────────────────────────── */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* index route → renders at "/" */}
        <Route index element={<Projects />} />

        {/* explicit route → renders at "/projects" */}
        <Route path="projects" element={<Projects />} />

        {/* other children */}
        <Route path="add-user" element={<UserManagement />} />
        <Route path="users" element={<UserManagement />} />
        {/* <Route path="projects/:id" element={<ProjectView />} /> */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </>
  )
);

const AppRoutes = () => {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
};

export default AppRoutes;