
// Convert iso date to readable date
export function convertReadableDate(isoDate: string | Date): string {
    // if isoDate is null or not date, return
    if (!isoDate || isNaN(new Date(isoDate).getTime())) {
        return isoDate as string;
    }
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });
}

export function convertActiveDate(isoDate: string): string {
    // if isoDate is null or not date, return
    if (!isoDate || isNaN(new Date(isoDate).getTime())) {
        return isoDate;
    }
    const date = new Date(isoDate);
    const diff = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (diff < 300) {
        return 'Active now';
    } else if (diff < 3600) {
        return Math.floor(diff / 60) + 'm ago';
    } else if (diff < 86400) {
        return Math.floor(diff / 3600) + 'h ago';
    } else if (diff < 604800) {
        return Math.floor(diff / 86400) + 'd ago';
    }
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });
}