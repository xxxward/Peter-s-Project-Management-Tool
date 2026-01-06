import React, { useState } from 'react';
import { TeamMember, Task, Department } from '../types';
import { User, CheckCircle2, Clock, ChevronDown, BarChart2 } from 'lucide-react';

interface WorkloadViewProps {
  team: TeamMember[];
  tasks: Task[];
  departments: Department[];
}

export const WorkloadView: React.FC<WorkloadViewProps> = ({ team, tasks, departments }) => {
    const [collapsedDepts, setCollapsedDepts] = useState<Set<string>>(new Set());

    const toggleDept = (id: string) => {
        setCollapsedDepts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };
    
    // Org-wide stats
    const totalActiveTasks = tasks.filter(t => !t.completed && t.assignee).length;
    const totalEstimatedHours = tasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0);
    const uniqueAssignees = [...new Set(tasks.filter(t => t.assignee).map(t => t.assignee))].length;
    const avgTasksPerPerson = uniqueAssignees > 0 ? (totalActiveTasks / uniqueAssignees).toFixed(1) : 0;

    return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Team Workload</h2>
        <p className="text-sm text-gray-500">Capacity planning and resource distribution</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="text-xs text-gray-500 font-medium mb-1">Total Active Tasks</div>
            <div className="text-2xl font-bold text-gray-800">{totalActiveTasks}</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="text-xs text-gray-500 font-medium mb-1">Total Estimated Hours</div>
            <div className="text-2xl font-bold text-gray-800">{totalEstimatedHours}h</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="text-xs text-gray-500 font-medium mb-1">Avg. Tasks / Person</div>
            <div className="text-2xl font-bold text-gray-800">{avgTasksPerPerson}</div>
        </div>
      </div>

      <div className="space-y-6 overflow-y-auto flex-1 custom-scrollbar -mr-4 pr-4">
        {departments.map(dept => {
          const deptMembers = team.filter(m => m.departmentId === dept.id);
          if (deptMembers.length === 0) return null;

          const isCollapsed = collapsedDepts.has(dept.id);

          return (
            <div key={dept.id} className="border border-gray-100 rounded-xl bg-white">
                <div 
                    className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleDept(dept.id)}
                >
                    <h3 className="font-bold text-nexus-primary flex items-center gap-2">{dept.name} <span className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-0.5 rounded-full">{deptMembers.length} members</span></h3>
                    <ChevronDown size={20} className={`text-gray-400 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                </div>
                
                {!isCollapsed && (
                    <div className="space-y-4 p-4 border-t border-gray-100 animate-in fade-in duration-200">
                        {deptMembers.map(member => {
                            const memberTasks = tasks.filter(t => t.assignee === member.id && !t.completed);
                            const completedTasks = tasks.filter(t => t.assignee === member.id && t.completed);
                            
                            const workloadScore = memberTasks.reduce((acc, t) => {
                                const weight = t.priority === 'Critical' ? 3 : t.priority === 'High' ? 2 : 1;
                                return acc + weight;
                            }, 0);

                            const capacityStatus = workloadScore > 8 ? 'Overloaded' : workloadScore > 4 ? 'Optimal' : 'Available';
                            const statusColor = workloadScore > 8 ? 'text-red-600 bg-red-50 border-red-200' : workloadScore > 4 ? 'text-green-600 bg-green-50 border-green-200' : 'text-blue-600 bg-blue-50 border-blue-200';
                            
                            return (
                                <div key={member.id} className="border border-gray-100 rounded-xl p-4 shadow-sm bg-white">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${member.color}`}>
                                        {member.initials}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{member.name}</h3>
                                        <div className="text-xs text-gray-500">{member.role}</div>
                                    </div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColor}`}>
                                    {capacityStatus}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><CheckCircle2 size={12}/> Active Tasks</div>
                                        <div className="text-xl font-bold text-gray-800">{memberTasks.length}</div>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Clock size={12}/> Estimated Hours</div>
                                        <div className="text-xl font-bold text-gray-800">
                                        {memberTasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0)}h
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><CheckCircle2 size={12}/> Completed</div>
                                        <div className="text-xl font-bold text-gray-800">{completedTasks.length}</div>
                                    </div>
                                </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
          );
        })}
      </div>
    </div>
  );
};