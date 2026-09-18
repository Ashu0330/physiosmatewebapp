// ─── User Roles ──────────────────────────────────────────────────────────────

export const role = {
    patient: 1,
    doctor: 2,
    clinic: 3,
};

export const UserRoles = {
    patient: 'User',
    doctor: 'Practitioner',
    clinic: 'Clinic',
};

// ─── Visit / Consultation Types ───────────────────────────────────────────────

export const VisitMode = {
    InClinic: 'In-Clinic',
    VideoCall: 'Video Call',
    HomeVisit: 'Home Visit',
};

export const ConsultationType = {
    Initial: 'Initial Assessment',
    FollowUp: 'Follow-Up',
    Discharge: 'Discharge',
};

// ─── Appointment / Booking Status ────────────────────────────────────────────

export const AppointmentStatus = {
    Scheduled: 'Scheduled',
    InProgress: 'In-Progress',
    Completed: 'Completed',
    Cancelled: 'Cancelled',
};

// ─── Payment Status ───────────────────────────────────────────────────────────

export const PaymentStatus = {
    Paid: 'Paid',
    Pending: 'Pending',
    Partial: 'Partial',
    Waived: 'Waived',
};

// ─── Pain Severity ────────────────────────────────────────────────────────────

export const PainSeverity = {
    Mild: 'Mild',
    Moderate: 'Moderate',
    Severe: 'Severe',
};

// ─── Condition Severity ───────────────────────────────────────────────────────

export const ConditionSeverity = {
    Mild: 'Mild',
    Moderate: 'Moderate',
    Severe: 'Severe',
};

// ─── Patient Status ───────────────────────────────────────────────────────────

export const PatientStatus = {
    Active: 'Active',
    Inactive: 'Inactive',
    Hold: 'Hold',
};

// ─── Inquiry Priority ─────────────────────────────────────────────────────────

export const InquiryPriority = {
    High: 'High',
    Medium: 'Medium',
    Low: 'Low',
};

// ─── Inquiry Source ───────────────────────────────────────────────────────────

export const InquirySource = {
    WalkIn: 'Walk-in',
    Phone: 'Phone',
    WhatsApp: 'WhatsApp',
    Referral: 'Referral',
    Online: 'Online',
};

// ─── KPI Period Filters ───────────────────────────────────────────────────────

export const StatsPeriod = {
    Day: 'day',
    Week: 'week',
    Month: 'month',
    Lifetime: 'lifetime',
};

// ─── Default Fee ─────────────────────────────────────────────────────────────

export const DefaultFee = 500;

// ─── Pagination ───────────────────────────────────────────────────────────────

export const Pagination = {
    DefaultPageSize: 15,
    AllRecords: 2147483647,
};

// ─── Booking Reference Prefix ─────────────────────────────────────────────────

export const RefPrefix = {
    Booking: 'PHY',
    Patient: 'PT',
    Plan: 'PLN',
    Appointment: 'BKG',
};

// ─── Table Sort Helper ────────────────────────────────────────────────────────

export class TableSortHelper {
    currentSortColumn: string = '';
    currentSortDirection: 'asc' | 'desc' = 'asc';

    sort<T>(list: T[], column: string, dateColumns: string[] = ['createdDate', 'updatedDate']): T[] {
        if (this.currentSortColumn === column) {
            this.currentSortDirection = this.currentSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSortColumn = column;
            this.currentSortDirection = 'asc';
        }

        return [...list].sort((a: any, b: any) => {
            let va = a[column];
            let vb = b[column];

            if (va == null) return 1;
            if (vb == null) return -1;

            if (dateColumns.includes(column)) {
                return this.currentSortDirection === 'asc'
                    ? new Date(va).getTime() - new Date(vb).getTime()
                    : new Date(vb).getTime() - new Date(va).getTime();
            }

            if (typeof va === 'number') {
                return this.currentSortDirection === 'asc' ? va - vb : vb - va;
            }

            return this.currentSortDirection === 'asc'
                ? va.toString().localeCompare(vb.toString())
                : vb.toString().localeCompare(va.toString());
        });
    }

    getSortIcon(column: string): string {
        if (this.currentSortColumn !== column) return 'fa-sort';
        return this.currentSortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
    }
}

// ─── Date Helper ──────────────────────────────────────────────────────────────

export class DateHelper {
    /** Calculates age in years from a date string or Date object. */
    static calculateAge(dob: string | Date): number {
        if (!dob) return 0;
        const birth = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    }

    /** Formats a date to 'DD MMM YYYY' (e.g. 12 Sep 2026). */
    static formatDisplay(date: string | Date | null | undefined): string {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    }

    /** Returns today's date as 'YYYY-MM-DD' for date input default values. */
    static today(): string {
        return new Date().toISOString().substring(0, 10);
    }
}

// ─── Booking Reference Generator ─────────────────────────────────────────────

export class BookingHelper {
    /** Generates a unique reference like PHY-482917. */
    static generateRef(prefix: string = RefPrefix.Booking): string {
        const digits = Math.floor(100000 + Math.random() * 900000);
        return `${prefix}-${digits}`;
    }
}

// ─── Slug Helper ──────────────────────────────────────────────────────────────

export class SlugHelper {
    static create(name: string, id: number): string {
        if (!name) return `provider-${id}`;
        const clean = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        return `${clean}-${id}`;
    }

    static extractId(slug: string | null | undefined): number | null {
        if (!slug) return null;
        if (/^\d+$/.test(slug)) return parseInt(slug, 10);
        const match = slug.match(/-(\d+)$/);
        return match ? parseInt(match[1], 10) : null;
    }
}
