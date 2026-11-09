import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, ShieldAlert, Users, MessageSquare, Activity, Cpu, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';

export default function AdminModal({ isOpen, onClose }) {
  const { idToken } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !idToken) return;

    setLoading(true);
    Promise.all([api.getAdminStats(idToken), api.getAdminUsers(idToken)])
      .then(([statsData, usersData]) => {
        setStats(statsData.stats);
        setUsers(usersData.users || []);
      })
      .catch((err) => {
        console.warn('Admin load error:', err.message);
      })
      .finally(() => setLoading(false));
  }, [isOpen, idToken]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="max-w-2xl w-full dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-3xl p-6 sm:p-7 dark:text-white text-slate-900 shadow-2xl relative max-h-[88vh] flex flex-col"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl bg-rose-600/20 text-rose-500 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <h2 className="text-xl font-bold dark:text-white text-slate-900">Tavi Admin Dashboard</h2>
        </div>
        <p className="text-xs dark:text-slate-400 text-slate-500 mb-6">
          System telemetry, user monitoring, and AI provider status.
        </p>

        {loading ? (
          <div className="text-center py-12 text-xs dark:text-slate-500 text-slate-400">Loading system metrics...</div>
        ) : (
          <div className="space-y-5 overflow-y-auto pr-1">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 dark:bg-slate-800/60 bg-slate-50 border dark:border-slate-700/60 border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between dark:text-slate-400 text-slate-500 mb-1">
                  <span className="text-[10px] uppercase font-bold">Total Users</span>
                  <Users className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <div className="text-xl font-extrabold dark:text-white text-slate-900">
                  {stats?.totalUsers ?? 1}
                </div>
              </div>

              <div className="p-3 dark:bg-slate-800/60 bg-slate-50 border dark:border-slate-700/60 border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between dark:text-slate-400 text-slate-500 mb-1">
                  <span className="text-[10px] uppercase font-bold">Chats</span>
                  <MessageSquare className="w-3.5 h-3.5 text-purple-500" />
                </div>
                <div className="text-xl font-extrabold dark:text-white text-slate-900">
                  {stats?.totalConversations ?? 0}
                </div>
              </div>

              <div className="p-3 dark:bg-slate-800/60 bg-slate-50 border dark:border-slate-700/60 border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between dark:text-slate-400 text-slate-500 mb-1">
                  <span className="text-[10px] uppercase font-bold">Messages</span>
                  <Activity className="w-3.5 h-3.5 text-cyan-500" />
                </div>
                <div className="text-xl font-extrabold dark:text-white text-slate-900">
                  {stats?.totalMessages ?? 0}
                </div>
              </div>

              <div className="p-3 dark:bg-slate-800/60 bg-slate-50 border dark:border-slate-700/60 border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between dark:text-slate-400 text-slate-500 mb-1">
                  <span className="text-[10px] uppercase font-bold">Health</span>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <div className="text-sm font-bold text-emerald-500 capitalize">
                  {stats?.systemHealth || 'Active'}
                </div>
              </div>
            </div>

            {/* Provider Status */}
            <div className="p-4 dark:bg-slate-800/40 bg-slate-50 border dark:border-slate-700/60 border-slate-200 rounded-2xl">
              <div className="flex items-center space-x-2 text-xs font-bold dark:text-slate-200 text-slate-800 mb-2">
                <Cpu className="w-4 h-4 text-cyan-500" />
                <span>Primary AI Engine Configuration</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs dark:text-slate-300 text-slate-700">
                <div>
                  <span className="dark:text-slate-500 text-slate-400">Provider:</span>{' '}
                  <span className="font-semibold">{stats?.providerStatus?.provider || 'Beam Cloud'}</span>
                </div>
                <div>
                  <span className="dark:text-slate-500 text-slate-400">Model:</span>{' '}
                  <span className="font-mono text-blue-500">{stats?.providerStatus?.model || 'beam:cloud'}</span>
                </div>
                <div>
                  <span className="dark:text-slate-500 text-slate-400">Endpoint:</span>{' '}
                  <span className="font-mono text-[11px] dark:text-slate-400 text-slate-500">{stats?.providerStatus?.host || 'https://ollama.com'}</span>
                </div>
                <div>
                  <span className="dark:text-slate-500 text-slate-400">Key Status:</span>{' '}
                  <span className={`font-semibold ${stats?.providerStatus?.hasKey ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {stats?.providerStatus?.hasKey ? 'Configured' : 'Dev / Fallback'}
                  </span>
                </div>
              </div>
            </div>

            {/* User Registry List */}
            <div>
              <div className="text-xs font-bold dark:text-slate-300 text-slate-700 mb-2">Active Users & Accounts</div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {users.map((u, i) => (
                  <div
                    key={u.firebaseUid || i}
                    className="flex items-center justify-between p-2.5 rounded-xl dark:bg-slate-800/50 bg-slate-50 border dark:border-slate-700/50 border-slate-200 text-xs"
                  >
                    <div>
                      <div className="font-semibold dark:text-white text-slate-900">{u.displayName || 'User'}</div>
                      <div className="text-[10px] dark:text-slate-400 text-slate-500">{u.email}</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full dark:bg-slate-700 dark:text-slate-300 bg-slate-200 text-slate-700 font-mono">
                      {u.role || 'user'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-6 py-2.5 rounded-xl dark:bg-slate-800 dark:hover:bg-slate-700 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors"
        >
          Close Dashboard
        </button>
      </motion.div>
    </div>
  );
}

