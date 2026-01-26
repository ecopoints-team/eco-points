// ============================================================================
// ECOPOINTS - CENTRALIZED MOCK DATA
// Multi-Tenant Location-Based Access Control
// This file will serve as the template for database seeding
// ============================================================================

// ============================================================================
// LOCATIONS (Deployment Sites)
// ============================================================================
export const LOCATIONS = [
    {
        id: 'LOC-001',
        name: 'School A',
        fullName: 'San Beda University - Quezon City',
        city: 'Quezon City',
        address: '123 Education Ave, Quezon City',
        contactPerson: 'Dr. Maria Santos',
        contactEmail: 'admin@schoola.edu.ph',
        contactPhone: '+63 2 8123 4567',
        machineCount: 3,
        userCount: 156,
        totalBottlesCollected: 8350,
        joinDate: '2024-06-15',
        status: 'Active',
        ranking: 1
    },
    {
        id: 'LOC-002',
        name: 'School B',
        fullName: 'De La Salle University - Makati',
        city: 'Makati City',
        address: '456 Green Street, Makati City',
        contactPerson: 'Prof. Juan Dela Cruz',
        contactEmail: 'admin@schoolb.edu.ph',
        contactPhone: '+63 2 8765 4321',
        machineCount: 2,
        userCount: 89,
        totalBottlesCollected: 4210,
        joinDate: '2024-08-20',
        status: 'Active',
        ranking: 2
    }
];

// ============================================================================
// ADMIN USERS (7 Test Accounts)
// ============================================================================
export const ADMIN_USERS = [
    // SUPER ADMIN - Global Access
    {
        id: 'ADM-SUPER-001',
        name: 'System Administrator',
        email: 'superadmin@ecopoints.com',
        role: 'super_admin',
        locationId: null, // null = access to ALL locations
        avatar: 'SA',
        status: 'Active',
        lastLogin: '2025-01-23 08:30',
        permissions: {
            dashboard: { view: true, edit: true },
            users: { view: true, edit: true, delete: true, create: true },
            machines: { view: true, edit: true, delete: true, create: true },
            rewards: { view: true, edit: true, delete: true, create: true },
            logs: { view: true, export: true, delete: false },
            settings: { view: true, edit: true },
            locations: { view: true, edit: true, delete: true, create: true }
        }
    },

    // SCHOOL A - Head Admin
    {
        id: 'ADM-A-001',
        name: 'Maria Santos',
        email: 'headadmin.schoola@ecopoints.com',
        role: 'head_admin',
        locationId: 'LOC-001',
        avatar: 'MS',
        status: 'Active',
        lastLogin: '2025-01-23 07:45',
        permissions: {
            dashboard: { view: true, edit: true },
            users: { view: true, edit: true, delete: true, create: true },
            machines: { view: true, edit: true, delete: true, create: true },
            rewards: { view: true, edit: true, delete: true, create: true },
            logs: { view: true, export: true, delete: false },
            settings: { view: true, edit: true },
            locations: { view: false, edit: false, delete: false, create: false }
        }
    },

    // SCHOOL A - Auditor
    {
        id: 'ADM-A-002',
        name: 'Carlos Reyes',
        email: 'auditor.schoola@ecopoints.com',
        role: 'auditor',
        locationId: 'LOC-001',
        avatar: 'CR',
        status: 'Active',
        lastLogin: '2025-01-22 16:30',
        permissions: {
            dashboard: { view: true, edit: false },
            users: { view: true, edit: false, delete: false, create: false },
            machines: { view: true, edit: false, delete: false, create: false },
            rewards: { view: true, edit: false, delete: false, create: false },
            logs: { view: true, export: true, delete: false },
            settings: { view: false, edit: false },
            locations: { view: false, edit: false, delete: false, create: false }
        }
    },

    // SCHOOL A - Inventory Officer
    {
        id: 'ADM-A-003',
        name: 'Ana Lim',
        email: 'inventory.schoola@ecopoints.com',
        role: 'inventory_officer',
        locationId: 'LOC-001',
        avatar: 'AL',
        status: 'Active',
        lastLogin: '2025-01-23 06:15',
        permissions: {
            dashboard: { view: true, edit: false },
            users: { view: false, edit: false, delete: false, create: false },
            machines: { view: false, edit: false, delete: false, create: false },
            rewards: { view: true, edit: true, delete: false, create: true },
            logs: { view: true, export: false, delete: false },
            settings: { view: false, edit: false },
            locations: { view: false, edit: false, delete: false, create: false }
        }
    },

    // SCHOOL B - Head Admin
    {
        id: 'ADM-B-001',
        name: 'Juan Dela Cruz',
        email: 'headadmin.schoolb@ecopoints.com',
        role: 'head_admin',
        locationId: 'LOC-002',
        avatar: 'JD',
        status: 'Active',
        lastLogin: '2025-01-22 14:00',
        permissions: {
            dashboard: { view: true, edit: true },
            users: { view: true, edit: true, delete: true, create: true },
            machines: { view: true, edit: true, delete: true, create: true },
            rewards: { view: true, edit: true, delete: true, create: true },
            logs: { view: true, export: true, delete: false },
            settings: { view: true, edit: true },
            locations: { view: false, edit: false, delete: false, create: false }
        }
    },

    // SCHOOL B - Auditor
    {
        id: 'ADM-B-002',
        name: 'Patricia Tan',
        email: 'auditor.schoolb@ecopoints.com',
        role: 'auditor',
        locationId: 'LOC-002',
        avatar: 'PT',
        status: 'Active',
        lastLogin: '2025-01-21 11:30',
        permissions: {
            dashboard: { view: true, edit: false },
            users: { view: true, edit: false, delete: false, create: false },
            machines: { view: true, edit: false, delete: false, create: false },
            rewards: { view: true, edit: false, delete: false, create: false },
            logs: { view: true, export: true, delete: false },
            settings: { view: false, edit: false },
            locations: { view: false, edit: false, delete: false, create: false }
        }
    },

    // SCHOOL B - Inventory Officer
    {
        id: 'ADM-B-003',
        name: 'Roberto Garcia',
        email: 'inventory.schoolb@ecopoints.com',
        role: 'inventory_officer',
        locationId: 'LOC-002',
        avatar: 'RG',
        status: 'Active',
        lastLogin: '2025-01-23 05:45',
        permissions: {
            dashboard: { view: true, edit: false },
            users: { view: false, edit: false, delete: false, create: false },
            machines: { view: false, edit: false, delete: false, create: false },
            rewards: { view: true, edit: true, delete: false, create: true },
            logs: { view: true, export: false, delete: false },
            settings: { view: false, edit: false },
            locations: { view: false, edit: false, delete: false, create: false }
        }
    }
];

// ============================================================================
// MACHINES (RVMs) - Location Scoped
// ============================================================================
export const MACHINES = [
    // SCHOOL A - 3 Machines
    {
        id: 'RVM-001',
        name: 'Cafeteria RVM',
        locationId: 'LOC-001',
        location: 'Main Cafeteria, Exit Area',
        status: 'Online',
        bottlesCollected: 3100,
        lastSync: '1 min ago',
        fillLevel: 45,
        installedDate: '2024-06-20',
        maintenanceLogs: [
            { id: 1, date: '2025-01-20', technician: 'John Smith', issue: 'Routine Checkup', cost: 0, resolved: true },
            { id: 2, date: '2025-01-10', technician: 'Maria Garcia', issue: 'Sensor Calibration', cost: 150, resolved: true },
        ]
    },
    {
        id: 'RVM-002',
        name: 'Library RVM',
        locationId: 'LOC-001',
        location: 'University Library, Entrance',
        status: 'Online',
        bottlesCollected: 2450,
        lastSync: '3 mins ago',
        fillLevel: 35,
        installedDate: '2024-06-25',
        maintenanceLogs: [
            { id: 1, date: '2025-01-15', technician: 'Carlos Reyes', issue: 'Coin Dispenser Fix', cost: 200, resolved: true },
        ]
    },
    {
        id: 'RVM-003',
        name: 'Gymnasium RVM',
        locationId: 'LOC-001',
        location: 'Sports Complex, Main Lobby',
        status: 'Full',
        bottlesCollected: 2800,
        lastSync: '30 secs ago',
        fillLevel: 95,
        installedDate: '2024-07-10',
        maintenanceLogs: [
            { id: 1, date: '2025-01-18', technician: 'Anna Torres', issue: 'Bin Sensor Replaced', cost: 120, resolved: true },
        ]
    },

    // SCHOOL B - 2 Machines
    {
        id: 'RVM-004',
        name: 'Main Lobby RVM',
        locationId: 'LOC-002',
        location: 'Administration Building, Ground Floor',
        status: 'Online',
        bottlesCollected: 2100,
        lastSync: '2 mins ago',
        fillLevel: 55,
        installedDate: '2024-08-25',
        maintenanceLogs: [
            { id: 1, date: '2025-01-12', technician: 'John Smith', issue: 'Software Update', cost: 0, resolved: true },
        ]
    },
    {
        id: 'RVM-005',
        name: 'Canteen RVM',
        locationId: 'LOC-002',
        location: 'Student Canteen, Near Exit',
        status: 'Maintenance',
        bottlesCollected: 2110,
        lastSync: '2 hours ago',
        fillLevel: 60,
        installedDate: '2024-09-01',
        maintenanceLogs: [
            { id: 1, date: '2025-01-22', technician: 'Roberto Garcia', issue: 'Motor Failure - Awaiting Parts', cost: 0, resolved: false },
            { id: 2, date: '2025-01-05', technician: 'Carlos Reyes', issue: 'Belt Replacement', cost: 180, resolved: true },
        ]
    }
];

// ============================================================================
// REWARDS - Location Scoped
// ============================================================================
export const REWARDS = [
    // SCHOOL A Rewards
    { id: 'RWD-A-001', name: 'School A Eco Tote Bag', description: 'Canvas tote with School A logo', pointsCost: 500, stock: 45, category: 'Merchandise', locationId: 'LOC-001', sku: 'SA-BAG-001', dispensed: 127 },
    { id: 'RWD-A-002', name: 'Cafeteria Voucher', description: '₱50 School A cafeteria credit', pointsCost: 150, stock: 100, category: 'Vouchers', locationId: 'LOC-001', sku: 'SA-VCH-001', dispensed: 245 },
    { id: 'RWD-A-003', name: 'Reusable Water Bottle', description: 'Stainless steel 500ml bottle', pointsCost: 800, stock: 8, category: 'Merchandise', locationId: 'LOC-001', sku: 'SA-BTL-001', dispensed: 89 },
    { id: 'RWD-A-004', name: 'Eco Notebook', description: 'Recycled paper notebook', pointsCost: 200, stock: 0, category: 'Merchandise', locationId: 'LOC-001', sku: 'SA-NTB-001', dispensed: 156 },
    { id: 'RWD-A-005', name: 'Library Print Credits', description: '50 pages free printing', pointsCost: 100, stock: 200, category: 'Vouchers', locationId: 'LOC-001', sku: 'SA-PRT-001', dispensed: 412 },

    // SCHOOL B Rewards
    { id: 'RWD-B-001', name: 'School B Eco Bag', description: 'Recyclable bag with School B branding', pointsCost: 450, stock: 32, category: 'Merchandise', locationId: 'LOC-002', sku: 'SB-BAG-001', dispensed: 78 },
    { id: 'RWD-B-002', name: 'Canteen Meal Voucher', description: '₱75 School B canteen credit', pointsCost: 200, stock: 75, category: 'Vouchers', locationId: 'LOC-002', sku: 'SB-VCH-001', dispensed: 189 },
    { id: 'RWD-B-003', name: 'Bamboo Straw Set', description: 'Set of 4 bamboo straws', pointsCost: 300, stock: 5, category: 'Merchandise', locationId: 'LOC-002', sku: 'SB-STR-001', dispensed: 67 },
    { id: 'RWD-B-004', name: 'Parking Pass (1 Day)', description: 'One-day campus parking', pointsCost: 500, stock: 20, category: 'Vouchers', locationId: 'LOC-002', sku: 'SB-PRK-001', dispensed: 34 },
];

// ============================================================================
// REGULAR USERS (Students/Staff) - Location Scoped
// ============================================================================
export const USERS = [
    // SCHOOL A Users
    { id: 'USR-A-001', name: 'Justin Ibale', email: 'justin.ibale@schoola.edu.ph', role: 'Student', status: 'Active', points: 2450, locationId: 'LOC-001', joinDate: 'Jan 5, 2025' },
    { id: 'USR-A-002', name: 'Jana Soriano', email: 'jana.soriano@schoola.edu.ph', role: 'Student', status: 'Active', points: 1890, locationId: 'LOC-001', joinDate: 'Jan 8, 2025' },
    { id: 'USR-A-003', name: 'Miguel Torres', email: 'miguel.torres@schoola.edu.ph', role: 'Student', status: 'Active', points: 3210, locationId: 'LOC-001', joinDate: 'Jan 10, 2025' },
    { id: 'USR-A-004', name: 'Anna Reyes', email: 'anna.reyes@schoola.edu.ph', role: 'Faculty', status: 'Active', points: 1560, locationId: 'LOC-001', joinDate: 'Jan 12, 2025' },
    { id: 'USR-A-005', name: 'Sarah Cruz', email: 'sarah.cruz@schoola.edu.ph', role: 'Student', status: 'Inactive', points: 890, locationId: 'LOC-001', joinDate: 'Jan 15, 2025' },
    { id: 'USR-A-006', name: 'Carlos Garcia', email: 'carlos.garcia@schoola.edu.ph', role: 'Student', status: 'Active', points: 2100, locationId: 'LOC-001', joinDate: 'Jan 18, 2025' },
    { id: 'USR-A-007', name: 'Mark Santos', email: 'mark.santos@schoola.edu.ph', role: 'Staff', status: 'Active', points: 4500, locationId: 'LOC-001', joinDate: 'Jan 20, 2025' },
    { id: 'USR-A-008', name: 'Lisa Mendoza', email: 'lisa.mendoza@schoola.edu.ph', role: 'Student', status: 'Active', points: 320, locationId: 'LOC-001', joinDate: 'Jan 22, 2025' },

    // SCHOOL B Users
    { id: 'USR-B-001', name: 'Ryan Tan', email: 'ryan.tan@schoolb.edu.ph', role: 'Student', status: 'Active', points: 1750, locationId: 'LOC-002', joinDate: 'Sep 1, 2024' },
    { id: 'USR-B-002', name: 'Maria Lopez', email: 'maria.lopez@schoolb.edu.ph', role: 'Student', status: 'Active', points: 2890, locationId: 'LOC-002', joinDate: 'Sep 5, 2024' },
    { id: 'USR-B-003', name: 'David Kim', email: 'david.kim@schoolb.edu.ph', role: 'Faculty', status: 'Active', points: 1200, locationId: 'LOC-002', joinDate: 'Sep 10, 2024' },
    { id: 'USR-B-004', name: 'Angela Lim', email: 'angela.lim@schoolb.edu.ph', role: 'Student', status: 'Active', points: 980, locationId: 'LOC-002', joinDate: 'Sep 15, 2024' },
    { id: 'USR-B-005', name: 'Patrick Ong', email: 'patrick.ong@schoolb.edu.ph', role: 'Student', status: 'Inactive', points: 450, locationId: 'LOC-002', joinDate: 'Sep 20, 2024' },
    { id: 'USR-B-006', name: 'Christina Wu', email: 'christina.wu@schoolb.edu.ph', role: 'Staff', status: 'Active', points: 3100, locationId: 'LOC-002', joinDate: 'Oct 1, 2024' },
];

// ============================================================================
// ROLE DEFINITIONS
// ============================================================================
export const ROLES = {
    super_admin: {
        name: 'Super Admin',
        description: 'Global access to all locations and features',
        color: 'red',
        scope: 'global'
    },
    head_admin: {
        name: 'Head Admin',
        description: 'Full access within assigned location',
        color: 'purple',
        scope: 'location'
    },
    auditor: {
        name: 'Auditor',
        description: 'View and export data within assigned location',
        color: 'blue',
        scope: 'location'
    },
    inventory_officer: {
        name: 'Inventory Officer',
        description: 'Manage rewards within assigned location',
        color: 'emerald',
        scope: 'location'
    },
    technician: {
        name: 'Technician',
        description: 'Manage machines and maintenance',
        color: 'amber',
        scope: 'location'
    }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get location by ID
 */
export const getLocationById = (locationId) => {
    return LOCATIONS.find(loc => loc.id === locationId);
};

/**
 * Get location name by ID
 */
export const getLocationName = (locationId) => {
    const location = getLocationById(locationId);
    return location ? location.name : 'All Locations';
};

/**
 * Filter data by location (returns all if locationId is null - Super Admin)
 */
export const filterByLocation = (data, locationId) => {
    if (!locationId) return data; // Super Admin sees all
    return data.filter(item => item.locationId === locationId);
};

/**
 * Get machines by location
 */
export const getMachinesByLocation = (locationId) => {
    return filterByLocation(MACHINES, locationId);
};

/**
 * Get rewards by location
 */
export const getRewardsByLocation = (locationId) => {
    return filterByLocation(REWARDS, locationId);
};

/**
 * Get users by location
 */
export const getUsersByLocation = (locationId) => {
    return filterByLocation(USERS, locationId);
};

/**
 * Check if user has permission for an action
 */
export const hasPermission = (user, module, action) => {
    if (!user || !user.permissions) return false;
    return user.permissions[module]?.[action] || false;
};

/**
 * Check if user is Super Admin
 */
export const isSuperAdmin = (user) => {
    return user?.role === 'super_admin';
};
