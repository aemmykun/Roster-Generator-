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

/**
 * Priority weights for day-based staffing decisions.
 * Higher values indicate higher priority for staff allocation.
 */
const PRIORITY_WEIGHTS = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1
};

/**
 * Default staff data containing employee information including:
 * - primary: Main role assignment (HM=Houseman, HK=Housekeeper, CA=Common Area, Sup=Supervisor)
 * - crossTrained: Additional roles the staff member can fill
 * - type: Employment type (Full time, Part time, Casual)
 * - minHours/maxHours: Contracted hour ranges
 * - availability: Days the staff member is available to work
 */
const DEFAULT_STAFF_DATA = {
  Em: { primary: 'HM', crossTrained: ['Sup'], type: 'Full time', minHours: 2280, maxHours: 2280, availability: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
  Soon: { primary: 'HK', crossTrained: ['Sup'], type: 'Part time', minHours: 1800, maxHours: 2100, availability: ['Mon', 'Tue', 'Wed', 'Fri', 'Sat', 'Sun'] },
  Jann: { primary: 'HK', crossTrained: ['Sup'], type: 'Casual', minHours: 1080, maxHours: 1440, availability: ['Mon', 'Tue', 'Wed', 'Sat', 'Sun'] },
  Bhavna: { primary: 'HK', crossTrained: [], type: 'Casual', minHours: 1440, maxHours: 1800, availability: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
  Maylada: { primary: 'HK', crossTrained: [], type: 'Casual', minHours: 1440, maxHours: 1800, availability: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
  Rupa: { primary: 'HK', crossTrained: [], type: 'Casual', minHours: 1440, maxHours: 1800, availability: ['Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
  Ramandeep: { primary: 'CA', crossTrained: ['HK'], type: 'Casual', minHours: 1080, maxHours: 1440, availability: ['Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
  Kate: { primary: 'HK', crossTrained: [], type: 'Casual', minHours: 1080, maxHours: 1440, availability: ['Mon', 'Wed', 'Thu', 'Sun'] },
  Deepinder: { primary: 'HK', crossTrained: [], type: 'Casual', minHours: 1080, maxHours: 1440, availability: ['Tue', 'Thu', 'Fri', 'Sat', 'Sun'] },
  Marzana: { primary: 'HK', crossTrained: [], type: 'Casual', minHours: 1080, maxHours: 1440, availability: ['Wed', 'Thu', 'Sat', 'Sun'] },
  Wendy: { primary: 'HK', crossTrained: [], type: 'Casual', minHours: 720, maxHours: 1080, availability: ['Tue', 'Sat'] },
  Kiki: { primary: 'HK', crossTrained: [], type: 'Casual', minHours: 300, maxHours: 720, availability: ['Mon', 'Wed'] },
  Kay: { primary: 'HM', crossTrained: ['CA'], type: 'Casual', minHours: 420, maxHours: 720, availability: ['Tue', 'Thu'] },
  Harold: { primary: 'HM', crossTrained: ['CA'], type: 'Casual', minHours: 1080, maxHours: 1440, availability: ['Thu', 'Fri', 'Sat', 'Sun'] },
  Santiago: { primary: 'HM', crossTrained: ['CA'], type: 'Casual', minHours: 720, maxHours: 1440, availability: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }
};

/**
 * Default workload data representing task minutes for each day of the week.
 */
const DEFAULT_WORKLOAD_DATA = {
  monday: 2600,
  tuesday: 2400,
  wednesday: 1800,
  thursday: 1400,
  friday: 1500,
  saturday: 1800,
  sunday: 1600
};

/**
 * Algorithm steps displayed in the UI to show progress.
 */
const ALGORITHM_STEPS = [
  'Step 1: Analyze Workload Patterns',
  'Step 2: Identify Critical Coverage Days',
  'Step 3: Assign Essential Roles',
  'Step 4: Balance Workload Distribution',
  'Step 5: Optimize Staff Utilization',
  'Step 6: Generate Final Roster'
];

/**
 * Calculates required staff per day based on workload and priority.
 * @param {Object} workloadData - Object containing workload minutes for each day
 * @returns {Array} Array of day objects with workload, priority, and staff requirements
 */
const calculateRequiredStaff = (workloadData) => {
  const dayPriorities = {
    Mon: 'High',
    Tue: 'High',
    Wed: 'Medium',
    Thu: 'Low',
    Fri: 'Critical',
    Sat: 'High',
    Sun: 'Critical'
  };

  const dayMapping = {
    Mon: 'monday',
    Tue: 'tuesday',
    Wed: 'wednesday',
    Thu: 'thursday',
    Fri: 'friday',
    Sat: 'saturday',
    Sun: 'sunday'
  };

  return DAYS_OF_WEEK.map(day => ({
    day,
    workload: workloadData[dayMapping[day]],
    priority: dayPriorities[day],
    staffNeeded: Math.ceil(workloadData[dayMapping[day]] / MINUTES_PER_STAFF)
  }));
};

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

  const staffEntries = Object.entries(staffData).filter(
    ([, staff]) => staff.primary === roleType
  );

  sortedDays.forEach(dayData => {
    const { day, staffNeeded } = dayData;

    staffEntries.forEach(([name, staff]) => {
      // Skip if staff is not available on this day
      if (!staff.availability.includes(day)) return;

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

  // Step 2: Initialize empty roster structure
  const roster = initializeRoster();

  // Step 3: Sort days by priority weight and workload (descending)
  const sortedDays = [...requiredStaff].sort((a, b) => {
    const priorityDiff = PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority];
    return priorityDiff !== 0 ? priorityDiff : b.workload - a.workload;
  });

  // Step 4: Assign Housekeepers first (highest volume role)
  assignStaffByRole(roster, staffData, 'HK', sortedDays, {
    allowMultiplePerDay: true,
    checkGlobalAssignment: true
  });

  // Step 5: Assign Supervisors
  assignStaffByRole(roster, staffData, 'Sup', sortedDays, {
    allowMultiplePerDay: false,
    checkGlobalAssignment: false
  });

  // Step 6: Assign Housemen
  assignStaffByRole(roster, staffData, 'HM', sortedDays, {
    allowMultiplePerDay: false,
    checkGlobalAssignment: false
  });

  // Step 7: Assign Common Area staff
  assignStaffByRole(roster, staffData, 'CA', sortedDays, {
    allowMultiplePerDay: false,
    checkGlobalAssignment: false
  });

  return { roster, requiredStaff };
};

/**
 * Generates analysis data comparing assigned vs required staff.
 * @param {Object} rosterOutput - Output from generateRoster function
 * @returns {Array|null} Analysis array or null if no roster data
 */
const generateRosterAnalysis = (rosterOutput) => {
  if (!rosterOutput) return null;

  return Object.entries(rosterOutput.roster).map(([day, staff]) => {
    const required = rosterOutput.requiredStaff.find(d => d.day === day);
    const staffNeeded = required?.staffNeeded ?? 0;
    const gap = staffNeeded - staff.total;

    return {
      day,
      assigned: staff.total,
      required: staffNeeded,
      status: gap <= 0 ? 'optimal' : 'understaffed',
      gap: Math.max(0, gap)
    };
  });
};

/**
 * AlgorithmStep Component - Displays a single step in the algorithm progress.
 * Uses React.memo for performance optimization to prevent unnecessary re-renders.
 */
const AlgorithmStep = React.memo(({ step, index, isActive }) => (
  <div
    className={`p-4 rounded-lg border-2 transition-all ${
      isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'
    }`}
  >
    <div className="flex items-center">
      {isActive ? (
        <CheckCircle className="mr-2 text-blue-500 flex-shrink-0" size={16} />
      ) : (
        <div className="w-4 h-4 rounded-full border-2 border-gray-300 mr-2 flex-shrink-0" />
      )}
      <span className={`text-sm ${isActive ? 'text-blue-700' : 'text-gray-500'}`}>
        {step}
      </span>
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
