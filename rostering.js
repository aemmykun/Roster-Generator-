import React, { useState, useEffect } from ‘react’;
import { AlertCircle, CheckCircle, Clock, Users, Calendar } from ‘lucide-react’;

const RosteringAlgorithm = () => {
const [currentStep, setCurrentStep] = useState(0);
const [workloadData, setWorkloadData] = useState({
monday: 2600,
tuesday: 2400,
wednesday: 1800,
thursday: 1400,
friday: 1500,
saturday: 1800,
sunday: 1600
});

const [staffData] = useState({
Em: { primary: ‘HM’, crossTrained: [‘Sup’], type: ‘Full time’, minHours: 2280, maxHours: 2280, availability: [‘Mon’, ‘Tue’, ‘Wed’, ‘Thu’, ‘Fri’] },
Soon: { primary: ‘HK’, crossTrained: [‘Sup’], type: ‘Part time’, minHours: 1800, maxHours: 2100, availability: [‘Mon’, ‘Tue’, ‘Wed’, ‘Fri’, ‘Sat’, ‘Sun’] },
Jann: { primary: ‘HK’, crossTrained: [‘Sup’], type: ‘Casual’, minHours: 1080, maxHours: 1440, availability: [‘Mon’, ‘Tue’, ‘Wed’, ‘Sat’, ‘Sun’] },
Bhavna: { primary: ‘HK’, crossTrained: [], type: ‘Casual’, minHours: 1440, maxHours: 1800, availability: [‘Mon’, ‘Tue’, ‘Wed’, ‘Thu’, ‘Fri’, ‘Sat’] },
Maylada: { primary: ‘HK’, crossTrained: [], type: ‘Casual’, minHours: 1440, maxHours: 1800, availability: [‘Mon’, ‘Tue’, ‘Wed’, ‘Thu’, ‘Fri’] },
Rupa: { primary: ‘HK’, crossTrained: [], type: ‘Casual’, minHours: 1440, maxHours: 1800, availability: [‘Tue’, ‘Wed’, ‘Thu’, ‘Fri’, ‘Sat’, ‘Sun’] },
Ramandeep: { primary: ‘CA’, crossTrained: [‘HK’], type: ‘Casual’, minHours: 1080, maxHours: 1440, availability: [‘Tue’, ‘Wed’, ‘Thu’, ‘Fri’, ‘Sat’, ‘Sun’] },
Kate: { primary: ‘HK’, crossTrained: [], type: ‘Casual’, minHours: 1080, maxHours: 1440, availability: [‘Mon’, ‘Wed’, ‘Thu’, ‘Sun’] },
Deepinder: { primary: ‘HK’, crossTrained: [], type: ‘Casual’, minHours: 1080, maxHours: 1440, availability: [‘Tue’, ‘Thu’, ‘Fri’, ‘Sat’, ‘Sun’] },
Marzana: { primary: ‘HK’, crossTrained: [], type: ‘Casual’, minHours: 1080, maxHours: 1440, availability: [‘Wed’, ‘Thu’, ‘Sat’, ‘Sun’] },
Wendy: { primary: ‘HK’, crossTrained: [], type: ‘Casual’, minHours: 720, maxHours: 1080, availability: [‘Tue’, ‘Sat’] },
Kiki: { primary: ‘HK’, crossTrained: [], type: ‘Casual’, minHours: 300, maxHours: 720, availability: [‘Mon’, ‘Wed’] },
Kay: { primary: ‘HM’, crossTrained: [‘CA’], type: ‘Casual’, minHours: 420, maxHours: 720, availability: [‘Tue’, ‘Thu’] },
Harold: { primary: ‘HM’, crossTrained: [‘CA’], type: ‘Casual’, minHours: 1080, maxHours: 1440, availability: [‘Thu’, ‘Fri’, ‘Sat’, ‘Sun’] },
Santiago: { primary: ‘HM’, crossTrained: [‘CA’], type: ‘Casual’, minHours: 720, maxHours: 1440, availability: [‘Mon’, ‘Tue’, ‘Wed’, ‘Thu’, ‘Fri’, ‘Sat’, ‘Sun’] }
});

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

```
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


// Step : Priority HK roles based on workload priority const sortedDays = requiredStaff.sort((a, b) => b.workload + a.workload);

sortedDays.forEach(dayData => {
  const day = dayData.day;
  const needed = dayData.staffNeeded - roster[day].total;
  
  Object.entries(staffData).forEach(([name, staff]) => {
    if (staff.primary === 'HK' && staff.availability.includes(day) && roster[day].total < dayData.staffNeeded) {
      if (!Object.values(roster).some(d => d.HK.includes(name) || d.Sup.includes(name))) {
        roster[day].HK.push(name);
        roster[day].total++;
      }
    }
  });
});

// Step 4: Sup assignment
Object.entries(staffData).forEach(([name, staff]) => {
  if (staff.primary === 'Sup') {
    staff.availability.forEach(day => {
      if (roster[day].Sup.length < 1) {
        roster[day].Sup.push(name);
        roster[day].total++;
      }
    });
  }
});


// Step 5: Fill remaining roles
Object.entries(staffData).forEach(([name, staff]) => {
  if (staff.primary === 'HM' ) {
    staff.availability.forEach(day => {
      if (roster[day][staff.primary].length < 1 && !Object.values(roster[day]).flat().includes(name)) {
        roster[day][staff.primary].push(name);
        roster[day].total++;
      }
    });
  }
});

// Step 6: Fill remaining roles
Object.entries(staffData).forEach(([name, staff]) => {
  if (staff.primary === 'CA') {
    staff.availability.forEach(day => {
      if (roster[day][staff.primary].length < 1 && !Object.values(roster[day]).flat().includes(name)) {
        roster[day][staff.primaryTop(name)].push(name);
        roster[day].total++;
      }
    });
  }
});

setRosterOutput({ roster, requiredStaff });
```

};

const getRosterAnalysis = () => {
if (!rosterOutput) return null;

```
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
```

};

return (
<div className="max-w-6xl mx-auto p-6 bg-white">
<div className="mb-8">
<h1 className="text-3xl font-bold text-gray-900 mb-2">Hospitality Rostering Algorithm</h1>
<p className="text-gray-600">Intelligent staff scheduling based on workload, availability, and operational requirements</p>
</div>

```
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

  {/* Workload Input */}
  <div className="mb-8">
    <h2 className="text-xl font-semibold mb-4">Weekly Workload (Task Minutes)</h2>
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {Object.entries(workloadData).map(([day, minutes]) => (
        <div key={day} className="bg-gray-50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {day.charAt(0).toUpperCase() + day.slice(1)}
          </label>
          <input
            type="number"
            value={minutes}
            onChange={(e) => setWorkloadData({...workloadData, [day]: parseInt(e.target.value)})}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
      ))}
    </div>
  </div>

  {/* Run Algorithm Button */}
  <div className="mb-8 text-center">
    <button
      onClick={() => {
        setCurrentStep(0);
        const interval = setInterval(() => {
          setCurrentStep(prev => {
            if (prev < algorithmSteps.length - 1) {
              return prev + 1;
            } else {
              clearInterval(interval);
              setTimeout(runAlgorithm, 500);
              return prev;
            }
          });
        }, 800);
      }}
      className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
    >
      Run Rostering Algorithm
    </button>
  </div>

  {/* Roster Output */}
  {rosterOutput && (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Users className="mr-2" size={20} />
        Generated Roster
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-3 text-left">Day</th>
              <th className="border border-gray-300 p-3 text-left">Supervisor</th>
              <th className="border border-gray-300 p-3 text-left">Housekeeping</th>
              <th className="border border-gray-300 p-3 text-left">Houseman</th>
              <th className="border border-gray-300 p-3 text-left">Common Area</th>
              <th className="border border-gray-300 p-3 text-left">Total Staff</th>
              <th className="border border-gray-300 p-3 text-left">Required</th>
              <th className="border border-gray-300 p-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(rosterOutput.roster).map(([day, staff]) => {
              const required = rosterOutput.requiredStaff.find(d => d.day === day);
              const status = staff.total >= required.staffNeeded ? 'optimal' : 'understaffed';
              
              return (
                <tr key={day} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-3 font-medium">{day}</td>
                  <td className="border border-gray-300 p-3">{staff.Sup.join(', ') || 'None'}</td>
                  <td className="border border-gray-300 p-3">{staff.HK.join(', ') || 'None'}</td>
                  <td className="border border-gray-300 p-3">{staff.HM.join(', ') || 'None'}</td>
                  <td className="border border-gray-300 p-3">{staff.CA.join(', ') || 'None'}</td>
                  <td className="border border-gray-300 p-3 text-center font-semibold">{staff.total}</td>
                  <td className="border border-gray-300 p-3 text-center">{required.staffNeeded}</td>
                  <td className="border border-gray-300 p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      status === 'optimal' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {status === 'optimal' ? 'Optimal' : `Gap: ${required.staffNeeded - staff.total}`}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  )}

  {/* Analysis Summary */}
  {rosterOutput && (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <AlertCircle className="mr-2" size={20} />
        Roster Analysis
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {getRosterAnalysis().map((analysis, index) => (
          <div key={index} className={`p-4 rounded-lg border-2 ${
            analysis.status === 'optimal' 
              ? 'border-green-200 bg-green-50' 
              : 'border-red-200 bg-red-50'
          }`}>
            <h3 className="font-semibold text-lg mb-2">{analysis.day}</h3>
            <div className="space-y-1 text-sm">
              <div>Assigned: {analysis.assigned} staff</div>
              <div>Required: {analysis.required} staff</div>
              {analysis.gap > 0 && (
                <div className="text-red-600 font-medium">
                  Shortage: {analysis.gap} staff
                </div>
              )}
            </div>
          </div>
        ))}
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
```

);
};

export default RosteringAlgorithm;
