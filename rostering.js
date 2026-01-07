import React, { useState, useCallback, useMemo } from 'react';
import { AlertCircle, CheckCircle, Clock, Users } from 'lucide-react';

/**
 * Constants for the rostering algorithm configuration.
 * MINUTES_PER_STAFF: Average task minutes a single staff member can handle per day.
 * DAYS_OF_WEEK: Short day names used throughout the application.
 * ROLE_TYPES: Available staff role categories.
 */
const MINUTES_PER_STAFF = 400;
const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ROLE_TYPES = ['Sup', 'HK', 'HM', 'CA'];


const [staffData, setStaffData] = useState({});
const [isLoading, setIsLoading] = useState(true);
const [loadError, setLoadError] = useState(null);

const loadStaffData = async () => {
  try {
    setIsLoading(true);
    setLoadError(null);
    const response = await fetch('/staff-data.json');
    if (!response.ok) {
      throw new Error(`Failed to load staff data: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    if (
      !data.staff ||
      typeof data.staff !== 'object' ||
      Array.isArray(data.staff) ||
      Object.keys(data.staff).length === 0
    ) {
      throw new Error('Invalid staff data format');
    }
    setStaffData(data.staff);
  } catch (error) {
    setLoadError(error.message);
    console.error('Error loading staff data:', error);
  } finally {
    setIsLoading(false);
  }
};

useEffect(() => {
loadStaffData();
}, []);

const [algorithmSteps] = useState([
“Step 1: Analyze Workload Patterns”,
“Step 2: Identify Critical Coverage Days”,
“Step 3: Assign Essential Roles”,
“Step 4: Balance Workload Distribution”,
“Step 5: Optimize Staff Utilization”,
“Step 6: Generate Final Roster”
]);

const [rosterOutput, setRosterOutput] = useState(null);

const runAlgorithm = () => {
if (isLoading || Object.keys(staffData).length === 0) {
  console.warn('Cannot run algorithm: Staff data is still loading or not available');
  return;
}

const days = [‘Mon’, ‘Tue’, ‘Wed’, ‘Thu’, ‘Fri’, ‘Sat’, ‘Sun’];
const workloadByDay = [
{ day: ‘Mon’, workload: workloadData.monday, priority: ‘High’ },
{ day: ‘Tue’, workload: workloadData.tuesday, priority: ‘High’ },
{ day: ‘Wed’, workload: workloadData.wednesday, priority: ‘Medium’ },
{ day: ‘Thu’, workload: workloadData.thursday, priority: ‘Low’ },
{ day: ‘Fri’, workload: workloadData.friday, priority: ‘Critical’ },
{ day: ‘Sat’, workload: workloadData.saturday, priority: ‘High’ },
{ day: ‘Sun’, workload: workloadData.sunday, priority: ‘Critical’ }
];


// Step 1: Calculate required staff per day (assuming 400 minutes per staff member)
const requiredStaff = workloadByDay.map(d => ({
  ...d,
  staffNeeded: Math.ceil(d.workload / 400)
}));

// Step 2: Assign Housekeeping first
const roster = {};
days.forEach(day => {
  roster[day] = { HK: [], Sup: [], HM: [], CA: [], total: 0 };
});

  const dayMapping = {
    Mon: 'monday',
    Tue: 'tuesday',
    Wed: 'wednesday',
    Thu: 'thursday',
    Fri: 'friday',
    Sat: 'saturday',
    Sun: 'sunday'
  };

// Step 3: Priority HK roles based on workload priority
const sortedDays = requiredStaff.sort((a, b) => b.workload - a.workload);

/**
 * Initializes an empty roster structure for all days.
 * @returns {Object} Empty roster object with arrays for each role type
 */
const initializeRoster = () => {
  const roster = {};
  DAYS_OF_WEEK.forEach(day => {
    roster[day] = { HK: [], Sup: [], HM: [], CA: [], total: 0 };
  });
  return roster;
};

/**
 * Checks if a staff member is already assigned on any day.
 * @param {Object} roster - Current roster state
 * @param {string} staffName - Name of the staff member to check
 * @returns {boolean} True if staff is already assigned somewhere
 */
const isStaffAssignedAnywhere = (roster, staffName) => {
  return Object.values(roster).some(dayRoster =>
    ROLE_TYPES.some(role => dayRoster[role]?.includes(staffName))
  );
};

/**
 * Checks if a staff member is already assigned on a specific day.
 * @param {Object} dayRoster - Roster for a specific day
 * @param {string} staffName - Name of the staff member to check
 * @returns {boolean} True if staff is assigned on this day
 */
const isStaffAssignedOnDay = (dayRoster, staffName) => {
  return ROLE_TYPES.some(role => dayRoster[role]?.includes(staffName));
};

/**
 * Assigns staff members of a specific role type to the roster.
 * @param {Object} roster - Current roster state (will be mutated)
 * @param {Object} staffData - Staff information object
 * @param {string} roleType - Role to assign (HK, Sup, HM, CA)
 * @param {Array} sortedDays - Days sorted by priority
 * @param {Object} options - Assignment options
 * @param {boolean} options.allowMultiplePerDay - Whether to allow multiple staff per day
 * @param {boolean} options.checkGlobalAssignment - Whether to check if staff is assigned elsewhere
 */
const assignStaffByRole = (roster, staffData, roleType, sortedDays, options = {}) => {
  const { allowMultiplePerDay = false, checkGlobalAssignment = true } = options;

// Step 6: Fill remaining roles
Object.entries(staffData).forEach(([name, staff]) => {
  if (staff.primary === 'CA') {
    staff.availability.forEach(day => {
      if (roster[day][staff.primary].length < 1 && !Object.values(roster[day]).flat().includes(name)) {
        roster[day][staff.primary].push(name);
        roster[day].total++;
      }
    });
  }
});

setRosterOutput({ roster, requiredStaff });


      // Skip if day quota is met (unless multiple allowed and still need staff)
      const currentCount = roster[day][roleType].length;
      if (!allowMultiplePerDay && currentCount >= 1) return;
      if (allowMultiplePerDay && roster[day].total >= staffNeeded) return;

      // Skip if staff already assigned (globally or on this day based on options)
      if (checkGlobalAssignment && isStaffAssignedAnywhere(roster, name)) return;
      if (!checkGlobalAssignment && isStaffAssignedOnDay(roster[day], name)) return;

      // Assign staff to role
      roster[day][roleType].push(name);
      roster[day].total++;
    });
  });
};

/**
 * Main rostering algorithm that generates staff assignments.
 * Algorithm phases:
 * 1. Calculate required staff per day based on workload
 * 2. Sort days by priority and workload (highest first)
 * 3. Assign Housekeepers (HK) first - they form the bulk of staff
 * 4. Assign Supervisors (Sup) for oversight
 * 5. Assign Housemen (HM) for specialized tasks
 * 6. Assign Common Area (CA) staff for shared spaces
 *
 * @param {Object} workloadData - Workload minutes for each day
 * @param {Object} staffData - Staff information and availability
 * @returns {Object} Generated roster and staff requirements
 */
const generateRoster = (workloadData, staffData) => {
  // Step 1: Calculate required staff per day
  const requiredStaff = calculateRequiredStaff(workloadData);


const analysis = [];
Object.entries(rosterOutput.roster).forEach(([day, staff]) => {
  const required = rosterOutput.requiredStaff.find(d => d.day === day);
  const status = staff.total >= required.staffNeeded ? 'optimal' : 'understaffed';
  analysis.push({
    day,
    assigned: staff.total,
    required: required.staffNeeded,
    status,
    gap: required.staffNeeded - staff.total
  });
});
return analysis;


  // Step 7: Assign Common Area staff
  assignStaffByRole(roster, staffData, 'CA', sortedDays, {
    allowMultiplePerDay: false,
    checkGlobalAssignment: false
  });

  return { roster, requiredStaff };
};

if (isLoading) {
return (
  <div className="max-w-6xl mx-auto p-6 bg-white text-center">
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Hospitality Rostering Algorithm</h1>
      <p className="text-gray-600">Loading staff data...</p>
    </div>
    <div className="animate-pulse flex justify-center">
      <div className="h-8 w-8 bg-blue-500 rounded-full"></div>
    </div>
  </div>
);
}

if (loadError) {
return (
  <div className="max-w-6xl mx-auto p-6 bg-white">
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Hospitality Rostering Algorithm</h1>
    </div>
    <div className="bg-red-50 border-2 border-red-200 p-6 rounded-lg">
      <div className="flex items-center mb-4">
        <AlertCircle className="mr-2 text-red-500" size={24} />
        <h2 className="text-xl font-semibold text-red-700">Error Loading Staff Data</h2>
      </div>
      <p className="text-red-600">{loadError}</p>
      <button
        onClick={loadStaffData}
        className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
      >
        Retry
      </button>
    </div>
  </div>
);
}

return (
<div className="max-w-6xl mx-auto p-6 bg-white">
<div className="mb-8">
<h1 className="text-3xl font-bold text-gray-900 mb-2">Hospitality Rostering Algorithm</h1>
<p className="text-gray-600">Intelligent staff scheduling based on workload, availability, and operational requirements</p>
</div>

  {/* Algorithm Steps */}
  <div className="mb-8">
    <h2 className="text-xl font-semibold mb-4 flex items-center">
      <Clock className="mr-2" size={20} />
      Algorithm Process
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {algorithmSteps.map((step, index) => (
        <div
          key={index}
          className={`p-4 rounded-lg border-2 transition-all ${
            index <= currentStep
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-gray-50'
          }`}
        >
          <div className="flex items-center">
            {index <= currentStep ? (
              <CheckCircle className="mr-2 text-blue-500" size={16} />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-gray-300 mr-2"></div>
            )}
            <span className={`text-sm ${index <= currentStep ? 'text-blue-700' : 'text-gray-500'}`}>
              {step}
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
));

AlgorithmStep.displayName = 'AlgorithmStep';

/**
 * WorkloadInput Component - Input field for daily workload minutes.
 * Uses React.memo to optimize re-renders when other days change.
 */
const WorkloadInput = React.memo(({ day, minutes, onChange }) => {
  const handleChange = useCallback((e) => {
    const value = parseInt(e.target.value, 10);
    onChange(day, isNaN(value) ? 0 : value);
  }, [day, onChange]);

  const displayDay = day.charAt(0).toUpperCase() + day.slice(1);

  return (
    <div className="bg-gray-50 p-4 rounded-lg min-w-0">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {displayDay}
      </label>
      <input
        type="number"
        value={minutes}
        onChange={handleChange}
        min={0}
        className="w-full p-2 border border-gray-300 rounded-md text-sm"
        aria-label={`Workload minutes for ${displayDay}`}
      />
    </div>
  );
});

WorkloadInput.displayName = 'WorkloadInput';

/**
 * RosterTable Component - Displays the generated roster in a table format.
 * Memoized for performance when roster data hasn't changed.
 */
const RosterTable = React.memo(({ roster, requiredStaff }) => (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse border border-gray-300">
      <thead>
        <tr className="bg-gray-100">
          <th className="border border-gray-300 p-3 text-left">Day</th>
          <th className="border border-gray-300 p-3 text-left">Supervisor</th>
          <th className="border border-gray-300 p-3 text-left">Housekeeping</th>
          <th className="border border-gray-300 p-3 text-left">Houseman</th>
          <th className="border border-gray-300 p-3 text-left">Common Area</th>
          <th className="border border-gray-300 p-3 text-center">Total Staff</th>
          <th className="border border-gray-300 p-3 text-center">Required</th>
          <th className="border border-gray-300 p-3 text-left">Status</th>
        </tr>
      </thead>
      <tbody>
        {DAYS_OF_WEEK.map(day => {
          const staff = roster[day];
          const required = requiredStaff.find(d => d.day === day);
          const staffNeeded = required?.staffNeeded ?? 0;
          const gap = staffNeeded - staff.total;
          const isOptimal = gap <= 0;

          return (
            <tr key={day} className="hover:bg-gray-50">
              <td className="border border-gray-300 p-3 font-medium">{day}</td>
              <td className="border border-gray-300 p-3">{staff.Sup.join(', ') || 'None'}</td>
              <td className="border border-gray-300 p-3">{staff.HK.join(', ') || 'None'}</td>
              <td className="border border-gray-300 p-3">{staff.HM.join(', ') || 'None'}</td>
              <td className="border border-gray-300 p-3">{staff.CA.join(', ') || 'None'}</td>
              <td className="border border-gray-300 p-3 text-center font-semibold">{staff.total}</td>
              <td className="border border-gray-300 p-3 text-center">{staffNeeded}</td>
              <td className="border border-gray-300 p-3">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isOptimal ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {isOptimal ? 'Optimal' : `Gap: ${gap}`}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
));

RosterTable.displayName = 'RosterTable';

/**
 * AnalysisCard Component - Displays analysis for a single day.
 * Memoized for render performance.
 */
const AnalysisCard = React.memo(({ analysis }) => {
  const isOptimal = analysis.status === 'optimal';

  return (
    <div
      className={`p-4 rounded-lg border-2 ${
        isOptimal ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
      }`}
    >
      <h3 className="font-semibold text-lg mb-2">{analysis.day}</h3>
      <div className="space-y-1 text-sm">
        <div>Assigned: {analysis.assigned} staff</div>
        <div>Required: {analysis.required} staff</div>
        {analysis.gap > 0 && (
          <div className="text-red-600 font-medium">Shortage: {analysis.gap} staff</div>
        )}
      </div>
    </div>
  );
});

AnalysisCard.displayName = 'AnalysisCard';

/**
 * RosteringAlgorithm Component - Main component for the hospitality rostering system.
 * Manages state for workload data, algorithm execution progress, and roster output.
 */
const RosteringAlgorithm = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [workloadData, setWorkloadData] = useState(DEFAULT_WORKLOAD_DATA);
  const [rosterOutput, setRosterOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  // Memoize staff data to prevent unnecessary recalculations
  const staffData = useMemo(() => DEFAULT_STAFF_DATA, []);

  /**
   * Handler for updating workload data for a specific day.
   * Uses useCallback to maintain reference stability for child components.
   */
  const handleWorkloadChange = useCallback((day, value) => {
    setWorkloadData(prev => ({ ...prev, [day]: value }));
  }, []);

  /**
   * Executes the rostering algorithm.
   * Wrapped in useCallback for stable reference.
   */
  const runAlgorithm = useCallback(() => {
    const result = generateRoster(workloadData, staffData);
    setRosterOutput(result);
  }, [workloadData, staffData]);

  /**
   * Handles the algorithm execution with visual step progression.
   * Animates through each step before generating the final roster.
   * Uses recursive setTimeout pattern for cleaner state management.
   */
  const handleRunAlgorithm = useCallback(() => {
    if (isRunning) return;

    setIsRunning(true);
    setCurrentStep(0);
    setRosterOutput(null);

    const animateSteps = (currentStepIndex) => {
      if (currentStepIndex < ALGORITHM_STEPS.length - 1) {
        setTimeout(() => {
          setCurrentStep(currentStepIndex + 1);
          animateSteps(currentStepIndex + 1);
        }, 800);
      } else {
        setTimeout(() => {
          runAlgorithm();
          setIsRunning(false);
        }, 500);
      }
    };

    animateSteps(0);
  }, [isRunning, runAlgorithm]);

  // Memoize roster analysis to prevent recalculation on unrelated state changes
  const rosterAnalysis = useMemo(
    () => generateRosterAnalysis(rosterOutput),
    [rosterOutput]
  );

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      {/* Header Section */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Hospitality Rostering Algorithm
        </h1>
        <p className="text-gray-600">
          Intelligent staff scheduling based on workload, availability, and operational requirements
        </p>
      </header>

      {/* Algorithm Steps Progress */}
      <section className="mb-8" aria-label="Algorithm Progress">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Clock className="mr-2 flex-shrink-0" size={20} />
          Algorithm Process
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALGORITHM_STEPS.map((step, index) => (
            <AlgorithmStep
              key={step}
              step={step}
              index={index}
              isActive={index <= currentStep}
            />
          ))}
        </div>
      </section>

      {/* Workload Input Section */}
      <section className="mb-8" aria-label="Workload Configuration">
        <h2 className="text-xl font-semibold mb-4">Weekly Workload (Task Minutes)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {Object.entries(workloadData).map(([day, minutes]) => (
            <WorkloadInput
              key={day}
              day={day}
              minutes={minutes}
              onChange={handleWorkloadChange}
            />
          ))}
        </div>
      </section>

      {/* Run Algorithm Button */}
      <div className="mb-8 text-center">
        <button
          onClick={handleRunAlgorithm}
          disabled={isRunning}
          className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
            isRunning
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
          aria-busy={isRunning}
        >
          {isRunning ? 'Running...' : 'Run Rostering Algorithm'}
        </button>
      </div>
    </div>
  )}

  {/* Algorithm Logic Explanation */}
  <div className="bg-blue-50 p-6 rounded-lg">
    <h3 className="text-lg font-semibold mb-4">Algorithm Logic</h3>
    <div className="space-y-3 text-sm">
      <div><strong>1. Workload Analysis:</strong> Calculates required staff based on 300 task minutes per person</div>
      <div><strong>2. Priority Assignment:</strong> Critical days (Friday/Sunday) get priority staffing</div>
      <div><strong>3. Supervisor Coverage:</strong> Ensures at least one supervisor per day when available</div>
      <div><strong>4. Skill Matching:</strong> Assigns staff based on primary roles and cross-training</div>
      <div><strong>5. Availability Filtering:</strong> Only assigns staff who are available on specific days</div>
      <div><strong>6. Optimization:</strong> Balances workload distribution and minimizes gaps</div>
    </div>
  </div>
</div>


      {/* Roster Output Table */}
      {rosterOutput && (
        <section className="mb-8" aria-label="Generated Roster">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Users className="mr-2 flex-shrink-0" size={20} />
            Generated Roster
          </h2>
          <RosterTable
            roster={rosterOutput.roster}
            requiredStaff={rosterOutput.requiredStaff}
          />
        </section>
      )}

      {/* Analysis Summary */}
      {rosterAnalysis && (
        <section className="mb-8" aria-label="Roster Analysis">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <AlertCircle className="mr-2 flex-shrink-0" size={20} />
            Roster Analysis
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {rosterAnalysis.map(analysis => (
              <AnalysisCard key={analysis.day} analysis={analysis} />
            ))}
          </div>
        </section>
      )}

      {/* Algorithm Logic Explanation */}
      <section className="bg-blue-50 p-6 rounded-lg" aria-label="Algorithm Explanation">
        <h3 className="text-lg font-semibold mb-4">Algorithm Logic</h3>
        <div className="space-y-3 text-sm">
          <div>
            <strong>1. Workload Analysis:</strong> Calculates required staff based on{' '}
            {MINUTES_PER_STAFF} task minutes per person
          </div>
          <div>
            <strong>2. Priority Assignment:</strong> Critical days (Friday/Sunday) get priority
            staffing
          </div>
          <div>
            <strong>3. Supervisor Coverage:</strong> Ensures at least one supervisor per day when
            available
          </div>
          <div>
            <strong>4. Skill Matching:</strong> Assigns staff based on primary roles and
            cross-training
          </div>
          <div>
            <strong>5. Availability Filtering:</strong> Only assigns staff who are available on
            specific days
          </div>
          <div>
            <strong>6. Optimization:</strong> Balances workload distribution and minimizes gaps
          </div>
        </div>
      </section>
    </div>
  );
};

export default RosteringAlgorithm;
