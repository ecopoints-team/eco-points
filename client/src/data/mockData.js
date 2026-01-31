// ============================================================================
// ECOPOINTS - CENTRALIZED MOCK DATA
// Multi-Tenant Location-Based Access Control
// Phase 2.1 Update: Enhanced data structures with departments, areas, and pricing
// ============================================================================

// ============================================================================
// SEEDED RANDOM GENERATOR (Consistent SSR/Hydration)
// ============================================================================
function createSeededRandom(seed) {
    return function () {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

const seededRandom = createSeededRandom(12345);
const getRandomElement = (arr) => arr[Math.floor(seededRandom() * arr.length)];
const getRandomInt = (min, max) => Math.floor(seededRandom() * (max - min + 1)) + min;
const getRandomDate = (start, end) => new Date(start.getTime() + seededRandom() * (end.getTime() - start.getTime()));
const getRandomBoolean = (probability = 0.5) => seededRandom() < probability;

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
        totalPoints: 89650,
        joinDate: '2024-06-15',
        status: 'Active',
        ranking: 1
    }
];

// ============================================================================
// DEPARTMENTS (College Courses & SHS Strands)
// ============================================================================
export const DEPARTMENTS = [
    // SHS Strands
    { id: 'STEM', name: 'Science, Technology, Engineering, and Mathematics', abbreviation: 'STEM', type: 'shs_strand' },
    { id: 'ABM', name: 'Accountancy, Business, and Management', abbreviation: 'ABM', type: 'shs_strand' },
    { id: 'HUMSS', name: 'Humanities and Social Sciences', abbreviation: 'HUMSS', type: 'shs_strand' },
    { id: 'GAS', name: 'General Academic Strand', abbreviation: 'GAS', type: 'shs_strand' },
    { id: 'HE', name: 'Home Economics', abbreviation: 'H.E', type: 'shs_strand' },
    { id: 'ICT', name: 'Information Communication Technology', abbreviation: 'ICT', type: 'shs_strand' },
    { id: 'IA', name: 'Industrial Arts', abbreviation: 'I.A', type: 'shs_strand' },

    // College Departments
    { id: 'BSN', name: 'Bachelor of Science in Nursing', abbreviation: 'BSN', type: 'college' },
    { id: 'BEED', name: 'Bachelor of Elementary Education Major in General Education', abbreviation: 'BEED', type: 'college' },
    { id: 'BEED-SPED', name: 'Bachelor of Elementary Education (SPED)', abbreviation: 'BEED-SPED', type: 'college' },
    { id: 'BPED', name: 'Bachelor of Physical Education', abbreviation: 'BPEd', type: 'college' },
    { id: 'BSED-ENG', name: 'Bachelor of Secondary Education - Major in English', abbreviation: 'BSEd-English', type: 'college' },
    { id: 'BSED-MATH', name: 'Bachelor of Secondary Education - Major in Mathematics', abbreviation: 'BSEd-Math', type: 'college' },
    { id: 'BSED-FIL', name: 'Bachelor of Secondary Education - Major in Filipino', abbreviation: 'BSEd-Filipino', type: 'college' },
    { id: 'BSED-SCI', name: 'Bachelor of Secondary Education - Major in Science', abbreviation: 'BSEd-Science', type: 'college' },
    { id: 'BSED-SS', name: 'Bachelor of Secondary Education - Major in Social Studies', abbreviation: 'BSEd-SocStud', type: 'college' },
    { id: 'BSED-VE', name: 'Bachelor of Secondary Education - Major in Values Education', abbreviation: 'BSEd-ValEd', type: 'college' },
    { id: 'BSBA-MM', name: 'Bachelor of Science in Business Administration - Major in Marketing Management', abbreviation: 'BSBA-MM', type: 'college' },
    { id: 'BSBA-FM', name: 'Bachelor of Science in Business Administration - Major in Financial Management', abbreviation: 'BSBA-FM', type: 'college' },
    { id: 'BSAIS', name: 'Bachelor of Science in Accounting Information System', abbreviation: 'BSAIS', type: 'college' },
    { id: 'BSIT', name: 'Bachelor of Science in Information Technology', abbreviation: 'BSIT', type: 'college' },
    { id: 'BSCS', name: 'Bachelor of Science in Computer Science', abbreviation: 'BSCS', type: 'college' },
    { id: 'BSHM', name: 'Bachelor of Science in Hospitality Management', abbreviation: 'BSHM', type: 'college' },
    { id: 'BSTM', name: 'Bachelor of Science in Tourism Management', abbreviation: 'BSTM', type: 'college' },
    { id: 'BSCrim', name: 'Bachelor of Science in Criminology', abbreviation: 'BSCrim', type: 'college' },
    { id: 'AB-EL', name: 'Bachelor of Arts in English Language', abbreviation: 'AB-EL', type: 'college' },
    { id: 'AB-Psych', name: 'Bachelor of Arts in Psychology', abbreviation: 'AB-Psych', type: 'college' },
    { id: 'AB-PolSci', name: 'Bachelor of Arts in Political Science', abbreviation: 'AB-PolSci', type: 'college' },
    { id: 'DM', name: 'Diploma in Midwifery', abbreviation: 'DM', type: 'college' }
];

export const SHS_STRANDS = DEPARTMENTS.filter(d => d.type === 'shs_strand');
export const COLLEGE_DEPARTMENTS = DEPARTMENTS.filter(d => d.type === 'college');

// ============================================================================
// AREAS (Within Locations)
// ============================================================================
export const AREAS = [
    { id: 'AREA-001', name: 'Main Gate', locationId: 'LOC-001' },
    { id: 'AREA-002', name: 'Canteen', locationId: 'LOC-001' },
    { id: 'AREA-003', name: 'Library', locationId: 'LOC-001' },
    { id: 'AREA-004', name: 'Gymnasium', locationId: 'LOC-001' },
    { id: 'AREA-005', name: 'Nursing Building', locationId: 'LOC-001' },
    { id: 'AREA-006', name: 'Education Building', locationId: 'LOC-001' },
    { id: 'AREA-007', name: 'IT Building', locationId: 'LOC-001' },
    { id: 'AREA-008', name: 'Administration Building', locationId: 'LOC-001' }
];

// ============================================================================
// BOTTLE PRICING (Points Basis)
// ============================================================================
export const BOTTLE_PRICING = {
    small: { volumeRange: [290, 350], volumeLabel: '290-350ml', withLabel: 5, noLabel: 3 },
    medium: { volumeRange: [351, 500], volumeLabel: '351-500ml', withLabel: 8, noLabel: 5 },
    large: { volumeRange: [750, 1000], volumeLabel: '750-1000ml', withLabel: 10, noLabel: 7 },
    invalid: { volumeRange: [1001, 2000], volumeLabel: '1001-2000ml', points: 0, rejected: true }
};

export const BOTTLE_BRANDS = [
    'Coca-Cola', 'Pepsi', 'Sprite', 'Royal', 'Mountain Dew', 'C2', 'Nestea',
    'Gatorade', 'Pocari Sweat', 'Nature Spring', 'Summit', 'Wilkins', 'Absolute'
];

export const BOTTLE_VOLUMES = [350, 500, 750, 1000, 1500];

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
// ADMIN USERS (15 Total)
// ============================================================================
export const ADMIN_USERS = [
    // SUPER ADMINS (2)
    {
        id: 'ADM-SUPER-001',
        name: 'System Administrator',
        email: 'superadmin@ecopoints.com',
        role: 'super_admin',
        duty: 'System Management',
        locationId: null,
        avatar: 'SA',
        status: 'Online',
        accountHealth: 'Active',
        lastLogin: new Date().toISOString(),
        permissions: { dashboard: { view: true, edit: true }, users: { view: true, edit: true, delete: true, create: true }, machines: { view: true, edit: true, delete: true, create: true }, rewards: { view: true, edit: true, delete: true, create: true }, logs: { view: true, export: true, delete: false }, settings: { view: true, edit: true } }
    },
    {
        id: 'ADM-SUPER-002',
        name: 'Chief Technology Officer',
        email: 'cto@ecopoints.com',
        role: 'super_admin',
        duty: 'Technical Oversight',
        locationId: null,
        avatar: 'CT',
        status: 'Offline',
        accountHealth: 'Active',
        lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        permissions: { dashboard: { view: true, edit: true }, users: { view: true, edit: true, delete: true, create: true }, machines: { view: true, edit: true, delete: true, create: true }, rewards: { view: true, edit: true, delete: true, create: true }, logs: { view: true, export: true, delete: false }, settings: { view: true, edit: true } }
    },

    // HEAD ADMINS (3)
    { id: 'ADM-AU-01', name: 'Maria Santos', email: 'head@arellano.edu.ph', role: 'head_admin', duty: 'Campus Administration', locationId: 'LOC-001', avatar: 'MS', status: 'Online', accountHealth: 'Active', lastLogin: new Date().toISOString(), permissions: ROLES.head_admin },
    { id: 'ADM-AU-02', name: 'Roberto Garcia', email: 'rgarcia@arellano.edu.ph', role: 'head_admin', duty: 'Operations Management', locationId: 'LOC-001', avatar: 'RG', status: 'Online', accountHealth: 'Active', lastLogin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), permissions: ROLES.head_admin },
    { id: 'ADM-AU-03', name: 'Elena Cruz', email: 'ecruz@arellano.edu.ph', role: 'head_admin', duty: 'Student Affairs', locationId: 'LOC-001', avatar: 'EC', status: 'Offline', accountHealth: 'Active', lastLogin: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), permissions: ROLES.head_admin },

    // AUDITORS (3)
    { id: 'ADM-AU-04', name: 'Juan Dela Cruz', email: 'auditor@arellano.edu.ph', role: 'auditor', duty: 'Financial Audit', locationId: 'LOC-001', avatar: 'JD', status: 'Online', accountHealth: 'Active', lastLogin: new Date().toISOString(), permissions: ROLES.auditor },
    { id: 'ADM-AU-05', name: 'Angela Reyes', email: 'areyes@arellano.edu.ph', role: 'auditor', duty: 'Compliance Audit', locationId: 'LOC-001', avatar: 'AR', status: 'Offline', accountHealth: 'Active', lastLogin: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), permissions: ROLES.auditor },
    { id: 'ADM-AU-06', name: 'Mark Gonzales', email: 'mgonzales@arellano.edu.ph', role: 'auditor', duty: 'Operations Audit', locationId: 'LOC-001', avatar: 'MG', status: 'Offline', accountHealth: 'Inactive', lastLogin: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(), permissions: ROLES.auditor },

    // INVENTORY OFFICERS (3)
    { id: 'ADM-AU-07', name: 'Ana Lim', email: 'inventory@arellano.edu.ph', role: 'inventory_officer', duty: 'Rewards Management', locationId: 'LOC-001', avatar: 'AL', status: 'Online', accountHealth: 'Active', lastLogin: new Date().toISOString(), permissions: ROLES.inventory_officer },
    { id: 'ADM-AU-08', name: 'Patricia Tan', email: 'ptan@arellano.edu.ph', role: 'inventory_officer', duty: 'Stock Control', locationId: 'LOC-001', avatar: 'PT', status: 'Offline', accountHealth: 'Active', lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), permissions: ROLES.inventory_officer },
    { id: 'ADM-AU-09', name: 'Jose Mendoza', email: 'jmendoza@arellano.edu.ph', role: 'inventory_officer', duty: 'Procurement', locationId: 'LOC-001', avatar: 'JM', status: 'Offline', accountHealth: 'Active', lastLogin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), permissions: ROLES.inventory_officer },

    // TECHNICIANS (4)
    { id: 'ADM-AU-10', name: 'Carlos Reyes', email: 'tech@arellano.edu.ph', role: 'technician', duty: 'Machine Maintenance', locationId: 'LOC-001', avatar: 'CR', status: 'Online', accountHealth: 'Active', lastLogin: new Date().toISOString(), permissions: ROLES.technician },
    { id: 'ADM-AU-11', name: 'Miguel Santos', email: 'msantos@arellano.edu.ph', role: 'technician', duty: 'Hardware Support', locationId: 'LOC-001', avatar: 'MS', status: 'Online', accountHealth: 'Active', lastLogin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), permissions: ROLES.technician },
    { id: 'ADM-AU-12', name: 'Fernando Lopez', email: 'flopez@arellano.edu.ph', role: 'technician', duty: 'Software Support', locationId: 'LOC-001', avatar: 'FL', status: 'Offline', accountHealth: 'Active', lastLogin: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), permissions: ROLES.technician },
    { id: 'ADM-AU-13', name: 'David Villanueva', email: 'dvillanueva@arellano.edu.ph', role: 'technician', duty: 'Network Support', locationId: 'LOC-001', avatar: 'DV', status: 'Offline', accountHealth: 'Inactive', lastLogin: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(), permissions: ROLES.technician }
];

// ============================================================================
// MACHINES (RVMs)
// ============================================================================
export const MACHINES = [
    { id: 'RVM-AU-01', name: 'Main Gate RVM', locationId: 'LOC-001', areaId: 'AREA-001', area: 'Main Gate', status: 'Online', bottlesCollected: 4520, totalPoints: 22600, lastMaintenance: '2025-01-20' },
    { id: 'RVM-AU-02', name: 'Canteen RVM-A', locationId: 'LOC-001', areaId: 'AREA-002', area: 'Canteen', status: 'Online', bottlesCollected: 3850, totalPoints: 19250, lastMaintenance: '2025-01-22' },
    { id: 'RVM-AU-03', name: 'Canteen RVM-B', locationId: 'LOC-001', areaId: 'AREA-002', area: 'Canteen', status: 'Online', bottlesCollected: 2800, totalPoints: 14000, lastMaintenance: '2025-01-23' },
    { id: 'RVM-AU-04', name: 'Library RVM', locationId: 'LOC-001', areaId: 'AREA-003', area: 'Library', status: 'Online', bottlesCollected: 2100, totalPoints: 10500, lastMaintenance: '2025-01-15' },
    { id: 'RVM-AU-05', name: 'Gym RVM', locationId: 'LOC-001', areaId: 'AREA-004', area: 'Gymnasium', status: 'Maintenance', bottlesCollected: 3100, totalPoints: 15500, lastMaintenance: '2025-01-25' },
    { id: 'RVM-AU-06', name: 'Nursing Bldg RVM', locationId: 'LOC-001', areaId: 'AREA-005', area: 'Nursing Building', status: 'Online', bottlesCollected: 1850, totalPoints: 9250, lastMaintenance: '2025-01-18' }
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
// NAME DATA
// ============================================================================
const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Miguel', 'Ana', 'Juan', 'Maria', 'Carlos', 'Sofia', 'Luis', 'Andrea', 'Jose', 'Isabella', 'Mark', 'Angela', 'Daniel', 'Christine', 'Paul', 'Katherine', 'Steven', 'Rachel', 'Kevin', 'Nicole'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Santos', 'Reyes', 'Cruz', 'Dela Cruz', 'Villanueva', 'Mendoza', 'Torres', 'Flores', 'Rivera', 'Ramos'];
const sections = ['A', 'B', 'C', 'D'];
const yearLevels = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

// ============================================================================
// USERS GENERATION (200 Users: Students, Faculty, Staff)
// ============================================================================
const generateUsers = (count) => {
    const users = [];
    const baseDate = new Date('2024-06-01');
    const endDate = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (let i = 0; i < count; i++) {
        const firstName = getRandomElement(firstNames);
        const lastName = getRandomElement(lastNames);

        // Role distribution: 80% Student, 12% Faculty, 8% Staff
        const roleRoll = seededRandom();
        let role, educationLevel, strand, department, yearLevel, section;

        if (roleRoll < 0.80) {
            role = 'Student';
            // 40% SHS, 60% College for students
            if (seededRandom() < 0.4) {
                educationLevel = 'shs';
                strand = getRandomElement(SHS_STRANDS).id;
                department = null;
                yearLevel = seededRandom() < 0.5 ? 'Grade 11' : 'Grade 12';
            } else {
                educationLevel = 'college';
                strand = null;
                department = getRandomElement(COLLEGE_DEPARTMENTS).id;
                yearLevel = getRandomElement(yearLevels);
            }
            section = getRandomElement(sections);
        } else if (roleRoll < 0.92) {
            role = 'Faculty';
            educationLevel = null;
            strand = null;
            department = getRandomElement(COLLEGE_DEPARTMENTS).id;
            yearLevel = null;
            section = null;
        } else {
            role = 'Staff';
            educationLevel = null;
            strand = null;
            department = null;
            yearLevel = null;
            section = null;
        }

        const joinDate = getRandomDate(baseDate, endDate);
        const lastActive = getRandomDate(
            new Date(Math.max(joinDate.getTime(), thirtyDaysAgo.getTime() - 45 * 24 * 60 * 60 * 1000)),
            endDate
        );

        // Determine account health based on last activity
        const daysSinceActive = Math.floor((endDate - lastActive) / (1000 * 60 * 60 * 24));
        const accountHealth = daysSinceActive > 30 ? 'Inactive' : 'Active';

        // Online status - 15% chance of being online during "business hours"
        const status = getRandomBoolean(0.15) ? 'Online' : 'Offline';

        users.push({
            id: `USR-${String(20240000 + i).padStart(8, '0')}`,
            name: `${firstName} ${lastName}`,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(' ', '')}@arellano.edu.ph`,
            role: role,
            educationLevel: educationLevel,
            strand: strand,
            department: department,
            yearLevel: yearLevel,
            section: section,
            locationId: 'LOC-001',
            status: status,
            accountHealth: accountHealth,
            points: getRandomInt(0, 5000),
            joinDate: joinDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
            joinDateObj: joinDate,
            lastActive: lastActive.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
            lastActiveObj: lastActive,
            avatar: `${firstName[0]}${lastName[0]}`
        });
    }
    return users;
};

export const USERS = generateUsers(200);

// ============================================================================
// BOTTLE LOGS GENERATION (With new pricing logic)
// ============================================================================
const getPointsForBottle = (volume, hasLabel) => {
    if (volume >= 290 && volume <= 350) {
        return hasLabel ? BOTTLE_PRICING.small.withLabel : BOTTLE_PRICING.small.noLabel;
    } else if (volume >= 351 && volume <= 500) {
        return hasLabel ? BOTTLE_PRICING.medium.withLabel : BOTTLE_PRICING.medium.noLabel;
    } else if (volume >= 750 && volume <= 1000) {
        return hasLabel ? BOTTLE_PRICING.large.withLabel : BOTTLE_PRICING.large.noLabel;
    } else if (volume >= 1001) {
        return 0; // Rejected
    }
    return 0;
};

const getSizeCategory = (volume) => {
    if (volume >= 290 && volume <= 350) return 'Small';
    if (volume >= 351 && volume <= 500) return 'Medium';
    if (volume >= 750 && volume <= 1000) return 'Large';
    if (volume >= 1001) return 'Invalid';
    return 'Unknown';
};

const generateBottleLogs = () => {
    const logs = [];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    const conditions = ['With Label', 'No Label', 'Crushed', 'Rejected'];

    for (let i = 0; i < 500; i++) {
        const user = getRandomElement(USERS);
        const machine = getRandomElement(MACHINES);
        const area = AREAS.find(a => a.id === machine.areaId);
        const brand = getRandomElement(BOTTLE_BRANDS);
        const volume = getRandomElement(BOTTLE_VOLUMES);
        const condition = getRandomElement(conditions);
        const logDate = getRandomDate(startDate, endDate);

        const isRejected = condition === 'Rejected' || condition === 'Crushed' || volume >= 1001;
        const hasLabel = condition === 'With Label';
        const points = isRejected ? 0 : getPointsForBottle(volume, hasLabel);
        const status = isRejected ? 'Rejected' : 'Accepted';

        logs.push({
            id: `LOG-B-${String(10000 + i).padStart(6, '0')}`,
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            machineId: machine.id,
            machineName: machine.name,
            locationId: machine.locationId,
            locationName: 'Arellano University',
            areaId: machine.areaId,
            area: area?.name || machine.area,
            bottleType: `${volume}ml PET`,
            sizeCategory: getSizeCategory(volume),
            brand: brand,
            volume: volume,
            condition: condition,
            pointsAwarded: points,
            timestamp: logDate.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }),
            timestampObj: logDate,
            status: status
        });
    }
    return logs.sort((a, b) => b.timestampObj - a.timestampObj);
};

export const BOTTLE_LOGS = generateBottleLogs();

// ============================================================================
// MACHINE LOGS GENERATION
// ============================================================================
const generateMachineLogs = () => {
    const logs = [];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 60);

    const issues = ['Sensor Error', 'Bin Full', 'Network Offline', 'Printer Jam', 'Software Update', 'Routine Checkup', 'Motor Failure', 'Display Error'];
    const technicians = ADMIN_USERS.filter(u => u.role === 'technician' || u.role === 'head_admin');

    for (let i = 0; i < 50; i++) {
        const machine = getRandomElement(MACHINES);
        const area = AREAS.find(a => a.id === machine.areaId);
        const technician = getRandomElement(technicians);
        const issue = getRandomElement(issues);
        const logDate = getRandomDate(startDate, endDate);
        const resolved = getRandomBoolean(0.8);

        logs.push({
            id: `LOG-M-${String(5000 + i).padStart(5, '0')}`,
            machineId: machine.id,
            machineName: machine.name,
            locationId: machine.locationId,
            areaId: machine.areaId,
            area: area?.name || machine.area,
            technicianId: technician.id,
            technician: technician.name,
            issue: issue,
            cost: getRandomInt(0, 2500),
            resolved: resolved,
            status: resolved ? 'Resolved' : 'Pending',
            notes: resolved ? 'Issue fixed successfully' : 'Awaiting parts/review',
            timestamp: logDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            timestampObj: logDate
        });
    }
    return logs.sort((a, b) => b.timestampObj - a.timestampObj);
};

export const MACHINE_LOGS = generateMachineLogs();

// ============================================================================
// ADMIN LOGS GENERATION
// ============================================================================
const generateAdminLogs = () => {
    const logs = [];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 14);

    const actions = [
        { action: 'User Created', category: 'Users' },
        { action: 'User Updated', category: 'Users' },
        { action: 'User Suspended', category: 'Users' },
        { action: 'Reward Added', category: 'Rewards' },
        { action: 'Reward Stock Updated', category: 'Rewards' },
        { action: 'Machine Maintained', category: 'Machines' },
        { action: 'Machine Status Changed', category: 'Machines' },
        { action: 'Settings Changed', category: 'Settings' },
        { action: 'Exported Logs', category: 'Logs' },
        { action: 'Points Adjusted', category: 'Users' }
    ];

    for (let i = 0; i < 100; i++) {
        const admin = getRandomElement(ADMIN_USERS);
        const actionData = getRandomElement(actions);
        const logDate = getRandomDate(startDate, endDate);
        const area = getRandomElement(AREAS);

        let target = '-';
        if (actionData.category === 'Users') target = getRandomElement(USERS).id;
        if (actionData.category === 'Rewards') target = getRandomElement(REWARDS).sku;
        if (actionData.category === 'Machines') target = getRandomElement(MACHINES).name;

        logs.push({
            id: `LOG-A-${String(8000 + i).padStart(5, '0')}`,
            adminId: admin.id,
            adminName: admin.name,
            adminRole: ROLES[admin.role]?.name || admin.role,
            duty: admin.duty || 'General',
            locationId: admin.locationId,
            locationName: admin.locationId ? 'Arellano University' : 'All Locations',
            areaId: area.id,
            area: area.name,
            action: actionData.action,
            target: target,
            category: actionData.category,
            notes: `${actionData.action} performed successfully`,
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
export const getDepartmentById = (id) => DEPARTMENTS.find(d => d.id === id);
export const getDepartmentName = (id) => getDepartmentById(id)?.abbreviation || getDepartmentById(id)?.name || id;
export const getAreaById = (id) => AREAS.find(a => a.id === id);
export const getAreaName = (id) => getAreaById(id)?.name || id;
export const filterByLocation = (data, id) => !id ? data : data.filter(item => item.locationId === id);
export const getMachinesByLocation = (id) => filterByLocation(MACHINES, id);
export const getRewardsByLocation = (id) => filterByLocation(REWARDS, id);
export const getUsersByLocation = (id) => filterByLocation(USERS, id);
export const hasPermission = (user, module, action) => user?.permissions?.[module]?.[action] || false;
export const isSuperAdmin = (user) => user?.role === 'super_admin';

// Statistics helpers
export const getOnlineUsersCount = () => USERS.filter(u => u.status === 'Online').length;
export const getActiveUsersCount = () => USERS.filter(u => u.accountHealth === 'Active').length;
export const getInactiveUsersCount = () => USERS.filter(u => u.accountHealth === 'Inactive').length;
export const getStudentsCount = () => USERS.filter(u => u.role === 'Student').length;
export const getFacultyCount = () => USERS.filter(u => u.role === 'Faculty').length;
export const getStaffCount = () => USERS.filter(u => u.role === 'Staff').length;
export const getAcceptedBottlesCount = () => BOTTLE_LOGS.filter(l => l.status === 'Accepted').length;
export const getRejectedBottlesCount = () => BOTTLE_LOGS.filter(l => l.status === 'Rejected').length;
export const getTotalPointsAwarded = () => BOTTLE_LOGS.reduce((sum, l) => sum + l.pointsAwarded, 0);
