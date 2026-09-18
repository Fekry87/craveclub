import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useIsMobile } from './CrudTable';

const labelMono = {
  color: '#6E6E73', fontSize: 13, fontWeight: 400,
  fontFamily: 'var(--font-body)', lineHeight: 1.4,
};

/** 32.45 → "32.45s"; 95.3 → "1:35.30". */
function formatSwimTime(seconds) {
  const total = Number(seconds);
  if (!Number.isFinite(total)) return '—';
  if (total < 60) return `${total.toFixed(2)}s`;
  const minutes = Math.floor(total / 60);
  const rest = (total - minutes * 60).toFixed(2).padStart(5, '0');
  return `${minutes}:${rest}`;
}

const PAGE_SIZE = 20;

/**
 * القياس — a swimmer's recorded times (stroke, distance, time), newest first.
 * Read-only: coaches record them from the app during a live session.
 *
 * `endpoint` is the history route (`/coach/swimmers/:id/measurements`, or the
 * club manager's twin). The section hides itself when the club does not have
 * the Skills feature the options live in (403).
 */
export function MeasurementHistory({ endpoint }) {
  const isMobile = useIsMobile();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [state, setState] = useState('loading'); // loading | ready | hidden | error
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = (next) => api.get(endpoint, { params: { page: next, per_page: PAGE_SIZE } }).then(r => {
    setRows(prev => (next === 1 ? r.data.data : [...prev, ...r.data.data]));
    setTotal(r.data.total);
    setPage(r.data.current_page);
    setLastPage(r.data.last_page);
    setState('ready');
  });

  useEffect(() => {
    setState('loading');
    fetchPage(1).catch(err => setState(err.response?.status === 403 ? 'hidden' : 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  if (state === 'hidden') return null;

  const loadMore = () => {
    setLoadingMore(true);
    fetchPage(page + 1).catch(() => {}).finally(() => setLoadingMore(false));
  };

  const cell = { padding: '12px 10px', borderBottom: '1px solid #F2F2F7', fontSize: 14, color: '#1D1D1F', textAlign: 'start' };
  const head = { ...labelMono, padding: '0 10px 10px', textAlign: 'start', fontWeight: 500, borderBottom: '1px solid #E5E5EA' };

  return (
    <div style={{ borderRadius: 16,
      background: '#FFFFFF',
      padding: isMobile ? '22px 18px' : '28px',
      border: '1px solid #E5E5EA',
      marginTop: 20,
      animation: 'fadeInUp 0.4s ease-out 0.25s both',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22, paddingBottom: 14, borderBottom: '1px solid #E5E5EA' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2.5M9 2h6" />
        </svg>
        <h2 style={{ margin: 0, color: '#1D1D1F', fontSize: 18, fontWeight: 500, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1 }}>
          Measurements
        </h2>
        {state === 'ready' && <span style={{ ...labelMono, marginInlineStart: 'auto' }}>{total}</span>}
      </div>

      {state === 'loading' && <div style={labelMono}>Loading measurements...</div>}
      {state === 'error' && <div style={labelMono}>Couldn't load measurements. Refresh to try again.</div>}

      {state === 'ready' && rows.length === 0 && (
        <div style={{ textAlign: 'center', padding: '28px 20px' }}>
          <div style={{ color: '#1D1D1F', fontSize: 16, fontWeight: 500, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', marginBottom: 6 }}>No measurements yet</div>
          <div style={labelMono}>Times recorded from the app during a live session show up here.</div>
        </div>
      )}

      {state === 'ready' && rows.length > 0 && (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
              <thead>
                <tr>
                  <th style={head}>Date</th>
                  <th style={head}>Swim type</th>
                  <th style={head}>Distance</th>
                  <th style={{ ...head, textAlign: 'end' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(m => {
                  const day = (m.session?.date || m.created_at || '').split('T')[0];
                  const formatted = day ? new Date(`${day}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '—';
                  const meters = m.distance_skill?.numeric_value != null ? `${Number(m.distance_skill.numeric_value)}m` : (m.distance_skill?.name || '—');
                  return (
                    <tr key={m.id}>
                      <td style={{ ...cell, color: '#515154' }}>{formatted}</td>
                      <td style={cell}>{m.stroke_skill?.name || '—'}</td>
                      <td style={cell}>{meters}</td>
                      <td style={{ ...cell, textAlign: 'end', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{formatSwimTime(m.time_seconds)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {page < lastPage && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button type="button" onClick={loadMore} disabled={loadingMore} className="pl-btn pl-btn-secondary pl-btn-sm">
                {loadingMore ? 'Loading...' : 'Show more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
