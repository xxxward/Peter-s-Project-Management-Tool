import React from 'react';
import { Goal, TeamMember, Project, Task } from '../types';
import { Target, Plus } from 'lucide-react';
import { GoalCard } from './GoalCard';

interface GoalsViewProps {
  goals: Goal[];
  team: TeamMember[];
  projects: Project[];
  tasks: Task[];
  currentUser: TeamMember;
  onAddGoal: (parentId?: string) => void;
  onUpdateGoal: (goal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
  onEditGoal: (goal: Goal) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({ goals, team, projects, tasks, currentUser, onAddGoal, onUpdateGoal, onDeleteGoal, onEditGoal }) => {
  const topLevelGoals = goals.filter(g => !g.parentId);

  return (
    <div className="h-full overflow-y-auto bg-gray-50/50 p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Target size={24} className="text-nexus-primary" /> 
              Company Goals
            </h2>
            <p className="text-gray-500 mt-1">Track strategic objectives and their connection to day-to-day work.</p>
          </div>
          <button 
            onClick={() => onAddGoal()}
            className="flex items-center gap-2 px-5 py-2.5 bg-nexus-primary text-white rounded-xl shadow-lg shadow-nexus-primary/20 hover:bg-indigo-600 hover:-translate-y-0.5 transition-all font-medium"
          >
            <Plus size={18} /> New Goal
          </button>
        </div>
        
        <div className="space-y-6">
          {topLevelGoals.map(goal => (
            <GoalCard 
              key={goal.id}
              goal={goal}
              allGoals={goals}
              team={team}
              projects={projects}
              tasks={tasks}
              level={0}
              onAddSubGoal={onAddGoal}
              onUpdate={onUpdateGoal}
              onDelete={onDeleteGoal}
              onEdit={onEditGoal}
            />
          ))}
          {topLevelGoals.length === 0 && (
              <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-2xl">
                  <Target size={48} className="mx-auto text-gray-300 mb-4"/>
                  <h3 className="text-xl font-bold text-gray-700">Set Your First Goal</h3>
                  <p className="text-gray-500 mt-2">Define your company's high-level objectives to get started.</p>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};
