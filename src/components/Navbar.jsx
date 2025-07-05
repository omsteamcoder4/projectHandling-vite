import { Link, useNavigate, useLocation } from "react-router-dom";
import { Home, FolderPlus, Folder, UserPlus, LogOut, X, Menu } from "lucide-react";
import { useAuth } from "../context/AuthContex";
import { useEffect, useRef } from "react";

const Navbar = ({ isOpen, setIsOpen }) => {
  const toggleSidebar = () => setIsOpen(!isOpen);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const location = useLocation();
  const sidebarRef = useRef(null);

  const navItems = [
    { name: "Home", icon: <Home size={20} />, path: "/projects" },
    { name: "Projects", icon: <Folder size={20} />, path: "/projects" },
    { name: "Add User", icon: <UserPlus size={20} />, path: "/add-user" },
  ];

  // Close sidebar when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpen && sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Close sidebar when any nav item is clicked
  const handleNavItemClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-screen bg-white shadow-lg z-50 transition-all duration-300 ${
          isOpen ? "w-64" : "w-0 overflow-hidden"
        }`}
      >
        <div className="flex flex-col h-full p-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-xl font-bold text-gray-800">
              <span className="text-blue-600">Project</span>Management
            </h1>
            <button onClick={toggleSidebar} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1">
            <ul className="space-y-2">
              {navItems.map((item, index) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={index}>
                    <Link
                      to={item.path}
                      onClick={handleNavItemClick} // Add this line
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-gray-800 ${
                        isActive ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"
                      }`}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Sign Out Button */}
          <button
            onClick={handleLogout}
            className="mt-auto flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Hamburger Menu */}
      <button
        onClick={toggleSidebar}
        className={`fixed z-40 top-2 left-2 p-2 rounded-md  text-gray-800 ${
          isOpen ? "opacity-0" : "opacity-100"
        } transition-opacity`}
      >
        <Menu size={24} />
      </button>
    </>
  );
};

export default Navbar;