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
        name: 'Arellano University',
        fullName: 'Arellano University - Andres Bonifacio Pasig Campus',
        city: 'Pasig City',
        address: 'Pag-asa St, Caniogan, Pasig',
        contactPerson: 'Admin Officer',
        contactEmail: 'admin@arellano.edu.ph',
        contactPhone: '+63 2 8734 7371',
        machineCount: 6,
        userCount: 200,
        totalBottlesCollected: 15420,
        joinDate: '2024-06-15',
        status: 'Active',
        ranking: 1
    }
];

// ============================================================================
// ROLE DEFINITIONS
// ============================================================================
export const ROLES = {
    super_admin: { name: 'Super Admin', description: 'Global access to all locations and features', color: 'red', scope: 'global' },
    head_admin: { name: 'Head Admin', description: 'Full access within assigned location', color: 'purple', scope: 'location' },
    auditor: { name: 'Auditor', description: 'View and export data within assigned location', color: 'blue', scope: 'location' },
    inventory_officer: { name: 'Inventory Officer', description: 'Manage rewards within assigned location', color: 'emerald', scope: 'location' },
    technician: { name: 'Technician', description: 'Manage machines and maintenance', color: 'amber', scope: 'location' }
};

// ============================================================================
// GENERATORS
// ============================================================================

const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Miguel', 'Ana', 'Juan', 'Maria', 'Carlos', 'Sofia', 'Luis', 'Andrea', 'Jose', 'Isabella'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
const schools = ['CAS', 'CITE', 'CBA', 'Nursing', 'Education', 'Hospitality'];

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// ============================================================================
// ADMIN USERS (System Access)
// ============================================================================
export const ADMIN_USERS = [
    // SUPER ADMIN - Global Access
    {
        id: 'ADM-SUPER-001',
        name: 'System Administrator',
        email: 'superadmin@ecopoints.com',
        role: 'super_admin',
        locationId: null,
        avatar: 'SA',
        status: 'Active',
        permissions: { dashboard: { view: true, edit: true }, users: { view: true, edit: true, delete: true, create: true }, machines: { view: true, edit: true, delete: true, create: true }, rewards: { view: true, edit: true, delete: true, create: true }, logs: { view: true, export: true, delete: false }, settings: { view: true, edit: true } }
    },
    // ARELLANO ADMINS
    { id: 'ADM-AU-01', name: 'Maria Santos', email: 'head@arellano.edu.ph', role: 'head_admin', locationId: 'LOC-001', avatar: 'MS', status: 'Active', permissions: ROLES.head_admin },
    { id: 'ADM-AU-02', name: 'Juan Dela Cruz', email: 'auditor@arellano.edu.ph', role: 'auditor', locationId: 'LOC-001', avatar: 'JD', status: 'Active', permissions: ROLES.auditor },
    { id: 'ADM-AU-03', name: 'Ana Lim', email: 'inventory@arellano.edu.ph', role: 'inventory_officer', locationId: 'LOC-001', avatar: 'AL', status: 'Active', permissions: ROLES.inventory_officer },
    { id: 'ADM-AU-04', name: 'Carlos Reyes', email: 'tech@arellano.edu.ph', role: 'technician', locationId: 'LOC-001', avatar: 'CR', status: 'Active', permissions: ROLES.technician },
];

// ============================================================================
// MACHINES (RVMs)
// ============================================================================
export const MACHINES = [
    { id: 'RVM-AU-01', name: 'Main Gate RVM', locationId: 'LOC-001', location: 'Main Gate', status: 'Online', bottlesCollected: 4520, lastMaintenance: '2025-01-20' },
    { id: 'RVM-AU-02', name: 'Canteen A RVM', locationId: 'LOC-001', location: 'Canteen A', status: 'Online', bottlesCollected: 3850, lastMaintenance: '2025-01-22' },
    { id: 'RVM-AU-03', name: 'Library RVM', locationId: 'LOC-001', location: 'Library Lobby', status: 'Online', bottlesCollected: 2100, lastMaintenance: '2025-01-15' },
    { id: 'RVM-AU-04', name: 'Gym RVM', locationId: 'LOC-001', location: 'Gymnasium', status: 'Maintenance', bottlesCollected: 3100, lastMaintenance: '2025-01-25' },
    { id: 'RVM-AU-05', name: 'Nursing Bldg RVM', locationId: 'LOC-001', location: 'Nursing Building', status: 'Online', bottlesCollected: 1850, lastMaintenance: '2025-01-18' },
];

// ============================================================================
// REWARDS
// ============================================================================
export const REWARDS = [
    { id: 'RWD-001', name: 'EcoPoints T-Shirt', sku: 'EP-TSHIRT-S', locationId: 'LOC-001', category: 'Merchandise', points: 500, stock: 45, status: 'Available' },
    { id: 'RWD-002', name: 'Metal Straw Set', sku: 'EP-STRAW', locationId: 'LOC-001', category: 'Sustainable', points: 150, stock: 120, status: 'Available' },
    { id: 'RWD-003', name: 'Bamboo Tumbler', sku: 'EP-TUMBLER', locationId: 'LOC-001', category: 'Sustainable', points: 800, stock: 20, status: 'Low Stock' },
    { id: 'RWD-004', name: 'Canvas Tote Bag', sku: 'EP-TOTE', locationId: 'LOC-001', category: 'Merchandise', points: 300, stock: 68, status: 'Available' },
    { id: 'RWD-005', name: 'School Supplies Kit', sku: 'EP-SCHOOL', locationId: 'LOC-001', category: 'Education', points: 200, stock: 200, status: 'Available' },
    { id: 'RWD-006', name: 'Canteen Voucher (P50)', sku: 'EP-VOUCHER-50', locationId: 'LOC-001', category: 'Voucher', points: 100, stock: 500, status: 'Available' },
    { id: 'RWD-007', name: 'Canteen Voucher (P100)', sku: 'EP-VOUCHER-100', locationId: 'LOC-001', category: 'Voucher', points: 200, stock: 350, status: 'Available' },
    { id: 'RWD-008', name: 'Priority Enrollment', sku: 'EP-PRIO', locationId: 'LOC-001', category: 'Education', points: 5000, stock: 10, status: 'Low Stock' },
    { id: 'RWD-009', name: 'Eco Notebook', sku: 'EP-NOTEBOOK', locationId: 'LOC-001', category: 'Sustainable', points: 120, stock: 150, status: 'Available' },
    { id: 'RWD-010', name: 'Laptop Sticker Pack', sku: 'EP-STICKER', locationId: 'LOC-001', category: 'Merchandise', points: 50, stock: 300, status: 'Available' },
];

// ============================================================================
// REGULAR USERS GENERATION
// ============================================================================
const generateUsers = (count) => {
    const users = [];
    const baseDate = new Date('2024-06-01');
    const endDate = new Date();

    for (let i = 0; i < count; i++) {
        const firstName = getRandomElement(firstNames);
        const lastName = getRandomElement(lastNames);
        const role = Math.random() > 0.1 ? 'Student' : (Math.random() > 0.5 ? 'Faculty' : 'Staff');
        const dept = getRandomElement(schools);

        users.push({
            id: `USR-${20240000 + i}`,
            name: `${firstName} ${lastName}`,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@arellano.edu.ph`,
            role: role,
            department: dept,
            locationId: 'LOC-001', // All Arellano
            status: Math.random() > 0.9 ? 'Inactive' : 'Active',
            points: getRandomInt(0, 5000),
            joinDate: getRandomDate(baseDate, endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
            avatar: `${firstName[0]}${lastName[0]}`
        });
    }
    return users;
};

export const USERS = generateUsers(200);

// ============================================================================
// LOGS GENERATION
// ============================================================================

// Bottle Logs
const generateBottleLogs = () => {
    const logs = [];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30); // Last 30 days

    const bottleTypes = ['350ml PET', '500ml PET', '1000ml PET', '1500ml PET'];
    const pointsMap = { '350ml PET': 3, '500ml PET': 5, '1000ml PET': 10, '1500ml PET': 15 };
    const conditions = ['Perfect', 'Good', 'Crushed', 'Rejected'];

    // Generate ~500 logs
    for (let i = 0; i < 500; i++) {
        const user = getRandomElement(USERS);
        const machine = getRandomElement(MACHINES);
        const type = getRandomElement(bottleTypes);
        const condition = getRandomElement(conditions);
        const logDate = getRandomDate(startDate, endDate);

        // Simulating rejection
        const isRejected = condition === 'Rejected';
        const points = isRejected ? 0 : pointsMap[type];
        const status = isRejected ? 'Failed' : 'Completed';

        logs.push({
            id: `LOG-B-${10000 + i}`,
            userId: user.id,
            userName: user.name,
            machineId: machine.id,
            machineName: machine.name,
            locationId: machine.locationId,
            locationName: "Arellano University",
            bottleType: type,
            condition: condition,
            pointsAwarded: points,
            timestamp: logDate.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }),
            timestampObj: logDate, // For sorting if needed
            status: status
        });
    }
    return logs.sort((a, b) => b.timestampObj - a.timestampObj);
};

export const BOTTLE_LOGS = generateBottleLogs();

// Machine Logs
const generateMachineLogs = () => {
    const logs = [];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 60);

    const issues = ['Sensor Error', 'Bin Full', 'Network Offline', 'Printer Jam', 'Software Update', 'Routine Checkup'];
    const technicians = ADMIN_USERS.filter(u => u.role === 'technician' || u.role === 'head_admin');

    for (let i = 0; i < 50; i++) {
        const machine = getRandomElement(MACHINES);
        const technician = getRandomElement(technicians);
        const issue = getRandomElement(issues);
        const logDate = getRandomDate(startDate, endDate);
        const resolved = Math.random() > 0.2; // 80% resolved

        logs.push({
            id: `LOG-M-${5000 + i}`,
            machineId: machine.id,
            machineName: machine.name,
            locationId: machine.locationId,
            technician: technician.name,
            issue: issue,
            cost: getRandomInt(0, 1500),
            resolved: resolved,
            status: resolved ? 'Resolved' : 'Pending',
            timestamp: logDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            timestampObj: logDate
        });
    }
    return logs.sort((a, b) => b.timestampObj - a.timestampObj);
};

export const MACHINE_LOGS = generateMachineLogs();

// Admin Logs
const generateAdminLogs = () => {
    const logs = [];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 14); // Last 2 weeks

    const actions = [
        { action: 'User Created', category: 'Users' },
        { action: 'User Updated', category: 'Users' },
        { action: 'User Suspended', category: 'Users' },
        { action: 'Reward Added', category: 'Rewards' },
        { action: 'Reward Stock Updated', category: 'Rewards' },
        { action: 'Machine Maintained', category: 'Machines' },
        { action: 'Settings Changed', category: 'Settings' },
        { action: 'Exported Logs', category: 'Logs' }
    ];

    for (let i = 0; i < 80; i++) {
        const admin = getRandomElement(ADMIN_USERS);
        const actionData = getRandomElement(actions);
        const logDate = getRandomDate(startDate, endDate);

        let target = '-';
        if (actionData.category === 'Users') target = getRandomElement(USERS).id;
        if (actionData.category === 'Rewards') target = getRandomElement(REWARDS).sku;
        if (actionData.category === 'Machines') target = getRandomElement(MACHINES).name;

        logs.push({
            id: `LOG-A-${8000 + i}`,
            adminName: admin.name,
            adminRole: ROLES[admin.role]?.name || admin.role,
            locationId: admin.locationId,
            action: actionData.action,
            target: target,
            category: actionData.category,
            timestamp: logDate.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }),
            timestampObj: logDate,
            status: 'Success'
        });
    }
    return logs.sort((a, b) => b.timestampObj - a.timestampObj);
};

export const ADMIN_LOGS = generateAdminLogs();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
export const getLocationById = (id) => LOCATIONS.find(l => l.id === id);
export const getLocationName = (id) => getLocationById(id)?.name || 'All Locations';
export const filterByLocation = (data, id) => !id ? data : data.filter(item => item.locationId === id);
export const getMachinesByLocation = (id) => filterByLocation(MACHINES, id);
export const getRewardsByLocation = (id) => filterByLocation(REWARDS, id);
export const getUsersByLocation = (id) => filterByLocation(USERS, id);
export const hasPermission = (user, module, action) => user?.permissions?.[module]?.[action] || false;
export const isSuperAdmin = (user) => user?.role === 'super_admin';
