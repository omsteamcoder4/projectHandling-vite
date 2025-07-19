"use client"
import { useState, useEffect } from "react"
import axios from "axios"
import { useAuth } from "../context/AuthContex"
import { motion, AnimatePresence } from "framer-motion"
import {
  FiUsers,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiUser,
  FiLock,
  FiShield,
  FiSave,
  FiSearch,
  FiFilter,
} from "react-icons/fi"

const UserManagement = () => {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "user",
  })

  useEffect(() => {
    if (user?.role === "admin") {
      fetchUsers()
    }
  }, [user])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, roleFilter])

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/users`)
      setUsers(response.data)
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = users.filter((user) => user.username.toLowerCase().includes(searchTerm.toLowerCase()))
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }
    setFilteredUsers(filtered)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingUser) {
        const updateData = {
          username: formData.username,
          role: formData.role,
        }
        if (formData.password.trim()) {
          updateData.password = formData.password
        }
        await axios.put(`${import.meta.env.VITE_API_BASE_URL}/users/${editingUser._id}`, updateData)
      } else {
        if (!formData.password.trim()) {
          alert("Password is required for new users")
          return
        }
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/users`, formData)
      }
      fetchUsers()
      setShowModal(false)
      resetForm()
    } catch (error) {
      alert(error.response?.data?.message || "Operation failed")
    }
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setFormData({
      username: user.username,
      password: "",
      role: user.role,
    })
    setShowModal(true)
  }

  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/users/${userId}`)
        fetchUsers()
      } catch (error) {
        alert("Failed to delete user")
      }
    }
  }

  const resetForm = () => {
    setFormData({ username: "", password: "", role: "user" })
    setEditingUser(null)
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white p-8 rounded-2xl shadow-xl"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiShield className="text-red-500 text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Admin access required to view this page.</p>
        </motion.div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-4 md:p-6 mb-6 border border-gray-100"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <FiUsers className="text-white text-lg md:text-xl" />
              </div>
              <div>
                <h1 className="text-xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                  User Management
                </h1>
                <p className="text-gray-600 text-xs md:text-sm">Manage system users and permissions</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2 md:px-6 md:py-3 rounded-xl font-medium shadow-lg flex items-center gap-2 transition-all duration-200 text-sm md:text-base"
            >
              <FiPlus size={16} />
              <span>Add User</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-md p-3 md:p-4 mb-6 border border-gray-100"
        >
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 md:py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm md:text-base"
              />
            </div>
            <div className="relative">
              <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="pl-10 pr-8 py-2 md:py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none cursor-pointer w-full sm:w-auto text-sm md:text-base"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 hidden sm:table-header-group">
                <tr>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-4 md:px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <AnimatePresence>
                  {filteredUsers.map((user, index) => (
                    <motion.tr
                      key={user._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors duration-200 block sm:table-row"
                    >
                      {/* Mobile View */}
                      <td className="px-4 py-3 block sm:hidden">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${
                                  user.role === "admin" ? "bg-red-100" : "bg-indigo-100"
                                }`}
                              >
                                <FiUser className={`${user.role === "admin" ? "text-red-600" : "text-indigo-600"}`} />
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900">{user.username}</div>
                                <div className="text-xs text-gray-500">ID: {user._id.slice(-8)}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleEdit(user)}
                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Edit user"
                              >
                                <FiEdit2 size={14} />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleDelete(user._id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete user"
                              >
                                <FiTrash2 size={14} />
                              </motion.button>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                                user.role === "admin" ? "bg-red-100 text-red-800" : "bg-indigo-100 text-indigo-800"
                              }`}
                            >
                              {user.role === "admin" ? <FiShield size={10} /> : <FiUser size={10} />}
                              {user.role.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-600">
                              {new Date(user.createdAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Desktop View */}
                      <td className="px-4 md:px-6 py-3 whitespace-nowrap hidden sm:table-cell">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${
                              user.role === "admin" ? "bg-red-100" : "bg-indigo-100"
                            }`}
                          >
                            <FiUser className={`${user.role === "admin" ? "text-red-600" : "text-indigo-600"}`} />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{user.username}</div>
                            <div className="text-xs text-gray-500">ID: {user._id.slice(-8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-3 whitespace-nowrap hidden sm:table-cell">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                            user.role === "admin" ? "bg-red-100 text-red-800" : "bg-indigo-100 text-indigo-800"
                          }`}
                        >
                          {user.role === "admin" ? <FiShield size={12} /> : <FiUser size={12} />}
                          {user.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-3 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell">
                        {new Date(user.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-4 md:px-6 py-3 whitespace-nowrap text-right hidden sm:table-cell">
                        <div className="flex items-center justify-end gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleEdit(user)}
                            className="p-1.5 md:p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit user"
                          >
                            <FiEdit2 size={14} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDelete(user._id)}
                            className="p-1.5 md:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete user"
                          >
                            <FiTrash2 size={14} />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 md:py-12">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                <FiUsers className="text-gray-400 text-xl md:text-2xl" />
              </div>
              <h3 className="text-base md:text-lg font-semibold text-gray-600 mb-1 md:mb-2">No users found</h3>
              <p className="text-gray-500 text-sm md:text-base">
                {searchTerm || roleFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Create your first user to get started"}
              </p>
            </div>
          )}
        </motion.div>

        {/* User Modal */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto overflow-hidden max-h-[90vh] overflow-y-auto"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 md:px-6 py-3 md:py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                      <FiUser className="text-white/80" />
                      {editingUser ? "Edit User" : "Add User"}
                    </h3>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setShowModal(false)
                        resetForm()
                      }}
                      className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors"
                    >
                      <FiX size={18} />
                    </motion.button>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 md:space-y-5">
                  {/* Username */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <FiUser className="text-indigo-500" size={14} />
                      Username
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:bg-gray-100 text-sm md:text-base"
                      placeholder="Enter username..."
                      required
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <FiLock className="text-indigo-500" size={14} />
                      Password{" "}
                      {editingUser && <span className="text-xs text-gray-500">(leave blank to keep current)</span>}
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:bg-gray-100 text-sm md:text-base"
                      placeholder={editingUser ? "Leave blank to keep current" : "Enter password..."}
                      required={!editingUser}
                    />
                  </div>

                  {/* Role */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <FiShield className="text-indigo-500" size={14} />
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:bg-gray-100 appearance-none cursor-pointer text-sm md:text-base"
                    >
                      <option value="user">👤 User</option>
                      <option value="admin">🛡️ Admin</option>
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 md:gap-3 pt-3 md:pt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => {
                        setShowModal(false)
                        resetForm()
                      }}
                      className="flex-1 px-3 md:px-4 py-2 md:py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors duration-200 text-sm md:text-base"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="flex-1 px-3 md:px-4 py-2 md:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm md:text-base"
                    >
                      <FiSave size={14} />
                      {editingUser ? "Update" : "Create"}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default UserManagement
