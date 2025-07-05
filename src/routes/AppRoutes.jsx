import {
  createBrowserRouter,
  RouterProvider,
  Route,
  createRoutesFromElements,
  Navigate,
} from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import NotFound from "../pages/NotFound";
import Contact from "../pages/Contact";
import Projects from "../pages/Projects";
import Gallery from "../pages/Gallery";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import ProtectedRoute from "../components/ProtectedRoute";
import AddProject from "../pages/AddProject";
import ShareUpload from "../components/ShareUpload";
import UserManagement from "../components/UserManagement";
import { AuthProvider } from "../context/AuthContex";
import ProjectView from "../pages/ProjectView";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Signup />} />
      <Route path="/share/:token" element={<ShareUpload />} />
      
      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<MainLayout />} />
        <Route path="contact" element={<Contact />} />
        <Route path="projects" element={<Projects />} />
        <Route path="gallery" element={<Gallery />} />
        <Route path="add-user" element={<UserManagement />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="add-project" element={<AddProject />} />
        <Route path="projects/:id" element={<ProjectView />} />
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