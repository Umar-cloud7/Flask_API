import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../App';
import StatCard from '../components/StatCard';
import TaskForm from '../components/TaskForm';
import TaskCard from '../components/TaskCard';
import { LogOut, CheckCircle2, Clock, PlayCircle, ListFilter, RefreshCw, Layers, AlertCircle } from 'lucide-react';

const TaskPage = ({ user, onLogout }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [notification, setNotification] = useState(null);

  // Helper for authenticated requests
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const showFeedback = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/tasks`, getAuthHeaders());
      const loadedTasks = Array.isArray(res.data) ? res.data : res.data.tasks || [];
      setTasks(loadedTasks);
    } catch (err) {
      console.error('Failed to load tasks:', err);
      if (err.response?.status === 401) {
        onLogout();
      } else {
        showFeedback('Could not fetch tasks from server.', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [onLogout]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreateTask = async (taskData) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/tasks`, taskData, getAuthHeaders());
      const created = res.data.task || res.data;
      
      // Update local state immediately & close modal
      setTasks((prev) => [created, ...prev]);
      setShowCreateModal(false);
      showFeedback(`Task "${created.title || 'New Task'}" created successfully!`, 'success');
      
      // Re-sync with backend
      fetchTasks();
    } catch (err) {
      console.error('Task creation failed:', err);
      const msg = err.response?.data?.message || 'Failed to create task. Check API connection.';
      showFeedback(msg, 'error');
      if (err.response?.status === 401) {
        onLogout();
      }
    }
  };

  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      await axios.patch(`${API_BASE_URL}/tasks/${taskId}`, { status: newStatus }, getAuthHeaders());
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId || t._id === taskId ? { ...t, status: newStatus } : t))
      );
      showFeedback('Task status updated.', 'success');
    } catch (err) {
      console.error('Status update failed:', err);
      showFeedback('Failed to update status.', 'error');
    }
  };

  const handlePriorityUpdate = async (taskId, newPriority) => {
    try {
      await axios.patch(`${API_BASE_URL}/tasks/${taskId}`, { priority: newPriority }, getAuthHeaders());
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId || t._id === taskId ? { ...t, priority: newPriority } : t))
      );
      showFeedback('Priority updated.', 'success');
    } catch (err) {
      console.error('Priority update failed:', err);
      showFeedback('Failed to update priority.', 'error');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task permanently?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/tasks/${taskId}`, getAuthHeaders());
      setTasks((prev) => prev.filter((t) => t.id !== taskId && t._id !== taskId));
      showFeedback('Task deleted.', 'success');
    } catch (err) {
      console.error('Delete failed:', err);
      showFeedback('Failed to delete task.', 'error');
    }
  };

  // Metrics calculation
  const totalCount = tasks.length;
  const pendingCount = tasks.filter((t) => t.status === 'PENDING').length;
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredTasks = tasks.filter((task) => {
    const statusMatch = filterStatus === 'ALL' || task.status === filterStatus;
    const priorityMatch = filterPriority === 'ALL' || task.priority === filterPriority;
    return statusMatch && priorityMatch;
  });

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px 60px' }}>
      {/* Feedback Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 100,
          background: notification.type === 'success' ? '#065f46' : '#991b1b',
          color: '#fff', padding: '14px 20px', borderRadius: '12px',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: '600'
        }}>
          {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 24px', background: 'rgba(17, 24, 39, 0.7)', backdropFilter: 'blur(12px)',
        borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#6366f1', padding: '8px', borderRadius: '10px' }}>
            <Layers size={22} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', lineHeight: 1.2 }}>TaskFlow Workspace</h2>
            <span style={{ fontSize: '13px', color: '#9ca3af' }}>Active User: {user?.name || user?.email || 'User'}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px',
            background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px', color: '#f87171', fontWeight: '600', fontSize: '14px', cursor: 'pointer'
          }}
        >
          <LogOut size={16} /> Logout
        </button>
      </header>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <StatCard title="Total Tasks" value={totalCount} subtitle="All items recorded" icon={<Layers color="#818cf8" size={24} />} color="indigo" />
        <StatCard title="Pending" value={pendingCount} subtitle="Awaiting action" icon={<Clock color="#f59e0b" size={24} />} color="amber" />
        <StatCard title="In Progress" value={inProgressCount} subtitle="Currently active" icon={<PlayCircle color="#3b82f6" size={24} />} color="blue" />
        <StatCard title="Completed" value={completedCount} subtitle={`${completionRate}% overall rate`} icon={<CheckCircle2 color="#10b981" size={24} />} color="emerald" />
      </div>

      {/* Action Controls & Filtering */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center',
        gap: '16px', marginBottom: '24px', background: '#111827', padding: '16px 20px', borderRadius: '14px',
        border: '1px solid #1f2937'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9ca3af', fontSize: '14px' }}>
            <ListFilter size={18} /> Filters:
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', padding: '8px 12px', fontSize: '13px' }}
          >
            <option value="ALL">Status: All</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            style={{ background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', padding: '8px 12px', fontSize: '13px' }}
          >
            <option value="ALL">Priority: All</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={fetchTasks}
            title="Refresh list"
            style={{ background: '#1f2937', border: '1px solid #374151', color: '#9ca3af', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}
          >
            <RefreshCw size={16} />
          </button>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            style={{
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', border: 'none',
              padding: '10px 18px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer'
            }}
          >
            + Create Task
          </button>
        </div>
      </div>

      {/* Task Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#6b7280' }}>
          <p>Loading workspace tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px', background: '#111827', borderRadius: '16px',
          border: '1px dashed #374151'
        }}>
          <p style={{ fontSize: '16px', color: '#9ca3af', marginBottom: '16px' }}>No tasks found matching your filter criteria.</p>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
          >
            Add New Task
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id || task._id}
              task={task}
              onStatusChange={handleStatusUpdate}
              onPriorityChange={handlePriorityUpdate}
              onDelete={handleDeleteTask}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <TaskForm onSubmit={handleCreateTask} onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
};

export default TaskPage;