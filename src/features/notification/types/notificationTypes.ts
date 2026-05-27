export type EventType = 'LEAVE_APPLIED' | 'LEAVE_APPROVED' | 'LEAVE_REJECTED' | 'MEETING_REQUIRED' | 'LEAVE_CANCELLED' | 'LOW_LEAVE_BALANCE' | 'PENDING_LEAVE_REMINDER';

export type Channel = 'EMAIL' | 'SMS' | 'IN_APP';

export type NotificationStatus = 'READ' | 'UNREAD'; 

export interface NotificationResponse {
    id: number;
    userId: number;
    eventType: EventType;
    message: string;
    channel: Channel;
    notificationStatus: NotificationStatus;
    createdAt: string; 
}

export interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
    last: boolean;
}


export interface Notification {

  id: number;

  type: 'success' | 'info' | 'error' | 'default';

  title: string;

  desc: string;

  time: string;

  unread: boolean;

  category: 'Personal' | 'Team' | 'System' | 'All';

}