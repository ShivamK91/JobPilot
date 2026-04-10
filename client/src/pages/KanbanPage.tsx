import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { getApplications, updateApplication } from '../api/applicationApi';
import { Application } from '../types';
import KanbanColumn from '../components/KanbanColumn';
import AddApplicationModal from '../components/AddApplicationModal';
import ApplicationModal from '../components/ApplicationModal';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';

type Status = Application['status'];

const COLUMNS: Status[] = [
  'Applied',
  'Phone Screen',
  'Interview',
  'Offer',
  'Rejected',
];

// Hex accent per column
const COLUMN_HEX: Record<Status, string> = {
  Applied:       '#378ADD',
  'Phone Screen':'#BA7517',
  Interview:     '#534AB7',
  Offer:         '#3B6D11',
  Rejected:      '#A32D2D',
};

// ── Stats card ────────────────────────────────────────────────────────────────
interface StatCardProps { label: string; value: number; accent: string }
const StatCard = ({ label, value, accent }: StatCardProps) => (
  <div
    className="bg-white rounded-xl border px-5 py-3 flex flex-col gap-0.5 min-w-[120px]"
    style={{ borderColor: '#e2e8f0', borderTopWidth: '3px', borderTopColor: accent }}
  >
    <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{label}</span>
    <span className="text-2xl font-bold text-slate-800">{value}</span>
  </div>
);

const KanbanPage = (): JSX.Element => {
  const queryClient = useQueryClient();
  const { logout } = useAuth();
  const { addToast } = useToast();
  const userEmail = localStorage.getItem('userEmail') ?? 'Account';

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const { data: applications = [], isLoading, isError } = useQuery<Application[]>(
    'applications',
    getApplications,
    { refetchOnWindowFocus: false }
  );

  // ── Drag mutation ─────────────────────────────────────────────────────────
  const { mutate: moveApplication } = useMutation(
    ({ id, status }: { id: string; status: Status }) =>
      updateApplication(id, { status }),
    {
      onMutate: async ({ id, status }) => {
        await queryClient.cancelQueries('applications');
        const previous = queryClient.getQueryData<Application[]>('applications');
        queryClient.setQueryData<Application[]>('applications', (old = []) =>
          old.map((app) => (app._id === id ? { ...app, status } : app))
        );
        return { previous };
      },
      onError: (_err, _vars, context) => {
        if (context?.previous) {
          queryClient.setQueryData('applications', context.previous);
        }
        addToast('Failed to move card. Please try again.', 'error');
      },
      onSettled: () => {
        queryClient.invalidateQueries('applications');
      },
    }
  );

  // ── Group by column ───────────────────────────────────────────────────────
  const grouped = COLUMNS.reduce<Record<Status, Application[]>>(
    (acc, col) => {
      acc[col] = applications.filter((a) => a.status === col);
      return acc;
    },
    {} as Record<Status, Application[]>
  );

  // ── Stats ─────────────────────────────────────────────────────────────────
  const total      = applications.length;
  const active     = applications.filter((a) => a.status !== 'Rejected').length;
  const interviews = applications.filter((a) => a.status === 'Interview').length;
  const offers     = applications.filter((a) => a.status === 'Offer').length;

  // ── Drag handler ──────────────────────────────────────────────────────────
  const handleDragEnd = (result: DropResult): void => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    const newStatus = destination.droppableId as Status;
    moveApplication({ id: draggableId, status: newStatus });
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f1f5f9' }}>

      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <nav className="bg-white border-b px-6 py-3 flex items-center justify-between shrink-0 shadow-sm" style={{ borderColor: '#e2e8f0' }}>
        <h1 className="text-xl font-bold tracking-tight text-white" style={{ color: 'inherit' }}>
          <span className="text-slate-900">Job</span>
          <span style={{ color: '#534AB7' }}>Pilot</span>
        </h1>

        <div className="flex items-center gap-4">
          <button
            id="add-application-btn"
            onClick={() => setIsAddModalOpen(true)}
            className="text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm hover:opacity-90 transition-opacity"
            style={{ background: '#534AB7' }}
          >
            + Add Application
          </button>

          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-sm hidden sm:block">{userEmail}</span>
            <button
              id="logout-btn"
              onClick={logout}
              className="text-slate-500 hover:text-slate-800 text-sm border px-3 py-1.5 rounded-lg"
              style={{ borderColor: '#e2e8f0' }}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b px-6 py-3 flex items-center gap-3 shrink-0 shadow-sm overflow-x-auto" style={{ borderColor: '#e2e8f0' }}>
        <StatCard label="Total" value={total}      accent="#534AB7" />
        <StatCard label="Active" value={active}    accent="#378ADD" />
        <StatCard label="Interviews" value={interviews} accent="#BA7517" />
        <StatCard label="Offers"  value={offers}   accent="#3B6D11" />
      </div>

      {/* ── Board ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-x-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full min-h-[60vh]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: '#534AB7 transparent transparent transparent' }} />
              <p className="text-slate-400 text-sm">Loading applications…</p>
            </div>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: '#fef2f2' }}>
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#dc2626" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-slate-700 font-semibold">Failed to load applications</p>
              <p className="text-slate-400 text-sm mt-1">Check your connection or try refreshing the page.</p>
            </div>
          </div>
        ) : applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: '#ede9fe' }}>
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#534AB7" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-slate-700 font-semibold">No applications yet</p>
              <p className="text-slate-400 text-sm mt-1">Click <span className="font-semibold" style={{ color: '#534AB7' }}>+ Add Application</span> to get started.</p>
            </div>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-4 h-full min-h-[70vh] pb-4" style={{ minWidth: 'max-content' }}>
              {COLUMNS.map((col) => (
                <KanbanColumn
                  key={col}
                  title={col}
                  accentHex={COLUMN_HEX[col]}
                  applications={grouped[col]}
                  onCardClick={setSelectedApplication}
                />
              ))}
            </div>
          </DragDropContext>
        )}
      </main>

      {/* Modals */}
      <AddApplicationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
      <ApplicationModal
        application={selectedApplication}
        isOpen={selectedApplication !== null}
        onClose={() => setSelectedApplication(null)}
      />
    </div>
  );
};

export default KanbanPage;
