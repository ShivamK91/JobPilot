import { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Application } from '../types';

interface ApplicationCardProps {
  application: Application;
  index: number;
  onClick: (application: Application) => void;
}

const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const ApplicationCard = ({
  application,
  index,
  onClick,
}: ApplicationCardProps): JSX.Element => {
  const [hovered, setHovered] = useState(false);
  const visibleSkills = application.requiredSkills.slice(0, 3);
  const extraCount    = application.requiredSkills.length - visibleSkills.length;

  return (
    <Draggable draggableId={application._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(application)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            ...provided.draggableProps.style,
            cursor: snapshot.isDragging ? 'grabbing' : 'grab',
            transform: snapshot.isDragging
              ? provided.draggableProps.style?.transform
              : hovered
              ? `${provided.draggableProps.style?.transform ?? ''} translateY(-1px)`
              : provided.draggableProps.style?.transform,
            transition: snapshot.isDragging ? undefined : 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
            borderRadius: '10px',
            background: 'var(--surface)',
            border: snapshot.isDragging
              ? '1.5px solid #534AB7'
              : hovered
              ? '1.5px solid #a5b4fc'
              : '1.5px solid var(--border)',
            boxShadow: snapshot.isDragging
              ? '0 8px 24px rgba(83,74,183,0.25)'
              : hovered
              ? '0 4px 12px rgba(0,0,0,0.08)'
              : '0 1px 3px rgba(0,0,0,0.04)',
            padding: '14px',
          }}
        >
          {/* Company (muted, small) above role */}
          <p className="text-slate-400 text-[11px] font-medium mb-0.5 truncate">
            {application.company}
          </p>

          {/* Role (bold, primary) */}
          <h3 className="text-slate-800 font-semibold text-sm leading-tight mb-2 truncate">
            {application.role}
          </h3>

          {/* Location */}
          {application.location && (
            <div className="flex items-center gap-1 mb-2">
              <span className="text-slate-400 text-xs">⊙</span>
              <span className="text-slate-400 text-xs truncate">{application.location}</span>
            </div>
          )}

          {/* Skill chips */}
          {visibleSkills.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {visibleSkills.map((skill) => (
                <span
                  key={skill}
                  style={{
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    fontSize: '10px',
                    fontWeight: 500,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    border: '1px solid #bfdbfe',
                  }}
                >
                  {skill}
                </span>
              ))}
              {extraCount > 0 && (
                <span
                  style={{
                    background: '#f1f5f9',
                    color: '#64748b',
                    fontSize: '10px',
                    fontWeight: 500,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  +{extraCount} more
                </span>
              )}
            </div>
          )}

          {/* Date bottom-left */}
          <div className="flex items-center gap-1 pt-2" style={{ borderTop: '1px solid #f1f5f9' }}>
            <span className="text-slate-400 text-[10px]">
              {formatDate(application.dateApplied)}
            </span>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default ApplicationCard;
