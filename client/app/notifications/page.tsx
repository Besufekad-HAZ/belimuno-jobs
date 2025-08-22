'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCircle, Clock, Trash2, Filter, Search, User, Briefcase, DollarSign, AlertTriangle, Eye } from 'lucide-react';
import { getStoredUser } from '@/lib/auth';
import { notificationsAPI } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionButton?: {
    text: string;
    url: string;
    action: string;
  };
  sender?: {
    _id: string;
    name: string;
    profile?: {
      avatar?: string;
    };
  };
  relatedJob?: {
    _id: string;
    title: string;
  };
  relatedUser?: {
    _id: string;
    name: string;
  };
}

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ total: 0, unread: 0 });
  const router = useRouter();

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await notificationsAPI.getAll();
      let fetchedNotifications = response.data?.data || [];

      // Apply filters
      if (filter === 'unread') {
        fetchedNotifications = fetchedNotifications.filter((n: Notification) => !n.isRead);
      } else if (filter === 'read') {
        fetchedNotifications = fetchedNotifications.filter((n: Notification) => n.isRead);
      }

      if (typeFilter !== 'all') {
        fetchedNotifications = fetchedNotifications.filter((n: Notification) => n.type === typeFilter);
      }

      if (searchQuery) {
        fetchedNotifications = fetchedNotifications.filter((n: Notification) =>
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.message.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setNotifications(fetchedNotifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, typeFilter, searchQuery]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await notificationsAPI.getStats();
      setStats(response.data?.data || { total: 0, unread: 0 });
    } catch (error) {
      console.error('Failed to fetch notification stats:', error);
    }
  }, []);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.push('/login');
      return;
    }
    fetchNotifications();
    fetchStats();
  }, [router, fetchNotifications, fetchStats]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
      );
      fetchStats();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      fetchStats();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await notificationsAPI.delete(notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      fetchStats();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'job_posted':
      case 'job_application':
      case 'job_assigned':
      case 'job_completed':
        return <Briefcase className="h-5 w-5" />;
      case 'payment_received':
      case 'payment_processed':
        return <DollarSign className="h-5 w-5" />;
      case 'review_received':
        return <CheckCircle className="h-5 w-5" />;
      case 'dispute_raised':
      case 'dispute_resolved':
        return <AlertTriangle className="h-5 w-5" />;
      case 'profile_verified':
        return <User className="h-5 w-5" />;
      case 'deadline_reminder':
        return <Clock className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'high':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'medium':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'low':
        return 'bg-gray-100 border-gray-300 text-gray-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getTypeDisplayName = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const uniqueTypes = Array.from(new Set(notifications.map(n => n.type)));

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div className="flex items-center space-x-3 mb-4 sm:mb-0">
            <Bell className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600">Stay updated with your latest activities</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Badge variant="info" className="px-3 py-1">
                Total: {stats.total}
              </Badge>
              <Badge variant="danger" className="px-3 py-1">
                Unread: {stats.unread}
              </Badge>
            </div>
            {stats.unread > 0 && (
              <Button
                onClick={handleMarkAllAsRead}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Mark All Read</span>
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center space-x-1">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Status:</span>
              </div>

              {(['all', 'unread', 'read'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filter === status
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}

              <div className="border-l border-gray-300 pl-2 ml-2">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-1 rounded-full text-sm border border-gray-300 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  {uniqueTypes.map(type => (
                    <option key={type} value={type}>
                      {getTypeDisplayName(type)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Notifications List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : notifications.length === 0 ? (
          <Card className="p-12 text-center">
            <Bell className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No notifications found</h3>
            <p className="text-gray-600">
              {filter === 'unread' ? 'You have no unread notifications.' :
               searchQuery ? 'No notifications match your search.' :
               'You have no notifications yet.'}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card
                key={notification._id}
                className={`p-6 transition-all duration-200 hover:shadow-md ${
                  !notification.isRead ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  <div className={`flex-shrink-0 p-3 rounded-full ${getPriorityColor(notification.priority)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className={`text-lg font-semibold ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h3>
                          <Badge
                            variant={notification.priority === 'urgent' ? 'danger' : notification.priority === 'high' ? 'warning' : 'info'}
                            size="sm"
                          >
                            {notification.priority}
                          </Badge>
                          <Badge variant="secondary" size="sm">
                            {getTypeDisplayName(notification.type)}
                          </Badge>
                        </div>

                        <p className="text-gray-600 mb-3 leading-relaxed">
                          {notification.message}
                        </p>

                        {/* Related entities */}
                        {(notification.relatedJob || notification.relatedUser || notification.sender) && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {notification.relatedJob && (
                              <div className="bg-gray-100 px-3 py-1 rounded-full flex items-center space-x-1">
                                <Briefcase className="h-3 w-3 text-gray-600" />
                                <span className="text-sm text-gray-700">Job: {notification.relatedJob.title}</span>
                              </div>
                            )}
                            {notification.relatedUser && (
                              <div className="bg-gray-100 px-3 py-1 rounded-full flex items-center space-x-1">
                                <User className="h-3 w-3 text-gray-600" />
                                <span className="text-sm text-gray-700">User: {notification.relatedUser.name}</span>
                              </div>
                            )}
                            {notification.sender && (
                              <div className="bg-gray-100 px-3 py-1 rounded-full flex items-center space-x-1">
                                <User className="h-3 w-3 text-gray-600" />
                                <span className="text-sm text-gray-700">From: {notification.sender.name}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Action button */}
                        {notification.actionButton && (
                          <div className="mb-3">
                            <Button
                              onClick={() => window.location.href = notification.actionButton!.url}
                              variant="primary"
                              size="sm"
                            >
                              {notification.actionButton.text}
                            </Button>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </span>
                          {notification.isRead && notification.readAt && (
                            <span className="flex items-center space-x-1">
                              <Eye className="h-3 w-3" />
                              <span>Read {formatDistanceToNow(new Date(notification.readAt), { addSuffix: true })}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 ml-4">
                        {!notification.isRead ? (
                          <Button
                            onClick={() => handleMarkAsRead(notification._id)}
                            variant="outline"
                            size="sm"
                            className="flex items-center space-x-1"
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span>Mark Read</span>
                          </Button>
                        ) : (
                          <div className="flex items-center space-x-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Read</span>
                          </div>
                        )}

                        <Button
                          onClick={() => handleDeleteNotification(notification._id)}
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-1 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
