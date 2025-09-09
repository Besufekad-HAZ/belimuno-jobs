"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Bell,
  X,
  Check,
  Trash2,
  Clock,
  User,
  Briefcase,
  DollarSign,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { notificationsAPI } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  priority: "low" | "medium" | "high" | "urgent";
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

interface NotificationDropdownProps {
  unreadCount: number;
  onNotificationUpdate: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  unreadCount,
  onNotificationUpdate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await notificationsAPI.getAll();
      const fetchedNotifications = response.data?.data || [];

      const filteredNotifications =
        filter === "unread"
          ? fetchedNotifications.filter((n: Notification) => !n.isRead)
          : fetchedNotifications;

      setNotifications(filteredNotifications);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n,
        ),
      );
      onNotificationUpdate();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          isRead: true,
          readAt: new Date().toISOString(),
        })),
      );
      onNotificationUpdate();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await notificationsAPI.delete(notificationId);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      onNotificationUpdate();
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "job_posted":
      case "job_application":
      case "job_assigned":
      case "job_completed":
        return <Briefcase className="h-4 w-4" />;
      case "payment_received":
      case "payment_processed":
        return <DollarSign className="h-4 w-4" />;
      case "review_received":
        return <CheckCircle className="h-4 w-4" />;
      case "dispute_raised":
      case "dispute_resolved":
        return <AlertTriangle className="h-4 w-4" />;
      case "profile_verified":
        return <User className="h-4 w-4" />;
      case "deadline_reminder":
        return <Clock className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 border-red-300 text-red-800";
      case "high":
        return "bg-orange-100 border-orange-300 text-orange-800";
      case "medium":
        return "bg-blue-100 border-blue-300 text-blue-800";
      case "low":
        return "bg-gray-100 border-gray-300 text-gray-800";
      default:
        return "bg-gray-100 border-gray-300 text-gray-800";
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }

    if (notification.actionButton?.url) {
      window.location.href = notification.actionButton.url;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-cyan-100 hover:text-white transition-colors duration-200"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>

          {/* Filter and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 border-b border-gray-100 bg-gray-50 gap-2">
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md ${
                  filter === "all"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md ${
                  filter === "unread"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Unread
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">
                  {filter === "unread"
                    ? "No unread notifications"
                    : "No notifications yet"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-3 sm:p-4 hover:bg-gray-50 transition-colors duration-150 cursor-pointer ${
                      !notification.isRead
                        ? "bg-blue-50 border-l-4 border-blue-500"
                        : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      {/* Icon */}
                      <div
                        className={`flex-shrink-0 p-1.5 sm:p-2 rounded-full ${getPriorityColor(notification.priority)}`}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-xs sm:text-sm font-medium ${!notification.isRead ? "text-gray-900" : "text-gray-700"} line-clamp-1`}
                            >
                              {notification.title}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">
                              {notification.message}
                            </p>

                            {/* Related entities */}
                            {(notification.relatedJob ||
                              notification.relatedUser) && (
                              <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-2">
                                {notification.relatedJob && (
                                  <span className="bg-gray-100 text-gray-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs">
                                    Job: {notification.relatedJob.title}
                                  </span>
                                )}
                                {notification.relatedUser && (
                                  <span className="bg-gray-100 text-gray-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs">
                                    User: {notification.relatedUser.name}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Action button */}
                            {notification.actionButton && (
                              <button className="mt-2 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">
                                {notification.actionButton.text}
                              </button>
                            )}

                            <p className="text-xs text-gray-500 mt-2">
                              {formatDistanceToNow(
                                new Date(notification.createdAt),
                                { addSuffix: true },
                              )}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-1 self-start sm:self-auto">
                            {!notification.isRead && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification._id);
                                }}
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Mark as read"
                              >
                                <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNotification(notification._id);
                              }}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete notification"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-200 p-3 bg-gray-50">
              <button
                onClick={() => {
                  setIsOpen(false);
                  window.location.href = "/notifications";
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
