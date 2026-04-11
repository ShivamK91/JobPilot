import { Droppable } from '@hello-pangea/dnd';
import { Application } from '../types';
import ApplicationCard from './ApplicationCard';

interface KanbanColumnProps {
  title: string;
  accentHex: string;
  applications: Application[];
  onCardClick: (application: Application) => void;
}

const KanbanColumn = ({
  title,
  accentHex,
  applications,
  onCardClick,
}: KanbanColumnProps): JSX.Element => {
  return (
    <div
      className="flex flex-col w-72 shrink-0 rounded-xl shadow-sm overflow-hidden"
      style={{ background: 'var(--surface-soft)', border: '1px solid var(--border)' }}
    >
      {/* Colored top accent bar */}
      <div style={{ height: '3px', background: accentHex }} />

      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-100 tracking-wide">{title}</h2>
        <span
          className="text-xs font-bold px-2.5 py-0.5 rounded-full min-w-[1.5rem] text-center text-white"
          style={{ background: accentHex }}
        >
          {applications.length}
        </span>
      </div>

      {/* Droppable area */}
      <Droppable droppableId={title}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex-1 overflow-y-auto p-3 space-y-3"
            style={{
              minHeight: '120px',
              background: snapshot.isDraggingOver ? `${accentHex}10` : 'transparent',
              transition: 'background 0.15s',
            }}
          >
            {applications.length === 0 && !snapshot.isDraggingOver && (
              <div
                className="flex items-center justify-center h-24 rounded-xl"
                style={{ border: '2px dashed #cbd5e1' }}
              >
                <p className="text-slate-400 text-xs">Drop cards here</p>
              </div>
            )}

            {applications.map((app, index) => (
              <ApplicationCard
                key={app._id}
                application={app}
                index={index}
                onClick={onCardClick}
              />
            ))}

            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default KanbanColumn;
