import { useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  CalendarX2,
  ClipboardList,
  ListChecks,
  Pencil,
  Pill,
  Plus,
  Trash2,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import {
  MANAGE_STATUS_KEYS,
  MED_TIMINGS,
  STATUS,
  STATUS_KEYS,
  TASK_CATEGORIES,
  addDays,
  formatDateShort,
  itemKind,
  itemSubtitle,
  itemTitle,
  relativeDayLabel,
  sortByDateTime,
  todayStr,
} from '../store/utils';
import { ConfirmDialog, EmptyState, Field, FilterChips, KindIcon, Modal, PageHeader, StatusBadge, StatusSelect } from '../components/ui';

const inRange = (item, range) => {
  if (range === 'all') return true;
  const t = todayStr();
  if (range === 'today') return item.date === t;
  if (range === 'week') return item.date >= t && item.date <= addDays(t, 6);
  return true;
};

const RANGE_OPTIONS = [
  { value: 'today', label: 'Hôm nay' },
  { value: 'week', label: '7 ngày tới' },
  { value: 'all', label: 'Tất cả' },
];

export default function Schedule() {
  const { items } = useApp();
  const [editing, setEditing] = useState(null); // { type, item? }

  return (
    <div className="page">
      <PageHeader
        title="Lịch trình & Quản lý"
        subtitle="Quản lý toàn bộ lịch trình, thuốc và tác vụ hằng ngày."
        actions={
          <>
            <button type="button" className="btn btn-soft" onClick={() => setEditing({ type: 'medicine' })}>
              <Pill size={18} /> Thêm thuốc
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setEditing({ type: 'task' })}>
              <Plus size={18} /> Thêm tác vụ
            </button>
          </>
        }
      />

      <ScheduleList items={items} onEdit={(item) => setEditing({ type: item.type, item })} />
      <Manager items={items} onAdd={(type) => setEditing({ type })} onEdit={(item) => setEditing({ type: item.type, item })} />
      <Report items={items} />

      <ItemFormModal editing={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

// ===================== A. DANH SÁCH LỊCH TRÌNH =====================
function ScheduleList({ items, onEdit }) {
  const { setStatus } = useApp();
  const [range, setRange] = useState('today');
  const [status, setStatusFilter] = useState('all');

  const scoped = items.filter((i) => i.date && i.time && inRange(i, range));
  const filtered = scoped.filter((i) => status === 'all' || i.status === status).sort(sortByDateTime);

  const groups = filtered.reduce((acc, i) => {
    (acc[i.date] = acc[i.date] || []).push(i);
    return acc;
  }, {});

  const statusOptions = [
    { value: 'all', label: 'Tất cả', count: scoped.length },
    ...STATUS_KEYS.map((k) => ({ value: k, label: STATUS[k].schedule, tone: STATUS[k].tone, count: scoped.filter((i) => i.status === k).length })),
  ];

  return (
    <section className="card" id="lich-trinh">
      <div className="section-title">
        <h2>
          <CalendarDays size={20} /> A. Danh sách lịch trình
        </h2>
        <div className="segmented" role="tablist" aria-label="Khoảng thời gian">
          {RANGE_OPTIONS.map((o) => (
            <button key={o.value} type="button" role="tab" aria-selected={range === o.value} className={range === o.value ? 'active' : ''} onClick={() => setRange(o.value)}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <FilterChips options={statusOptions} value={status} onChange={setStatusFilter} ariaLabel="Lọc theo trạng thái" />

      {filtered.length === 0 ? (
        <EmptyState icon={CalendarX2} title="Không có lịch trình phù hợp" text="Thử đổi bộ lọc, hoặc thêm thuốc / tác vụ có thời gian thực hiện." />
      ) : (
        Object.entries(groups).map(([date, list]) => (
          <div key={date} className="day-group">
            <h3 className="day-label">
              {relativeDayLabel(date)} <span>{formatDateShort(date)}</span>
            </h3>
            <ul className="timeline">
              {list.map((i) => (
                <li key={i.id} className={`timeline-item st-${i.status}`}>
                  <span className="tl-time">{i.time}</span>
                  <span className="tl-dot" aria-hidden="true" />
                  <div className="tl-card" onClick={() => onEdit(i)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onEdit(i)}>
                    <KindIcon kind={itemKind(i)} />
                    <div className="tl-info">
                      <strong>{itemTitle(i)}</strong>
                      <small>{itemSubtitle(i)}</small>
                    </div>
                    <StatusSelect value={i.status} onChange={(v) => setStatus(i.id, v)} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </section>
  );
}

// ===================== B. KHU VỰC NHẬP & QUẢN LÝ =====================
function Manager({ items, onAdd, onEdit }) {
  const { setStatus, deleteItem } = useApp();
  const [tab, setTab] = useState('medicine');
  const [filter, setFilter] = useState('all');
  const [toDelete, setToDelete] = useState(null);

  const ofType = items.filter((i) => i.type === tab).sort(sortByDateTime);
  const list = ofType.filter((i) => filter === 'all' || i.status === filter);
  const hasMissed = ofType.some((i) => i.status === 'missed');

  const keys = hasMissed ? [...MANAGE_STATUS_KEYS, 'missed'] : MANAGE_STATUS_KEYS;
  const options = [
    { value: 'all', label: 'Tất cả', count: ofType.length },
    ...keys.map((k) => ({ value: k, label: STATUS[k].manage, tone: STATUS[k].tone, count: ofType.filter((i) => i.status === k).length })),
  ];

  return (
    <section className="card" id="quan-ly">
      <div className="section-title">
        <h2>
          <ListChecks size={20} /> B. Nhập & quản lý
        </h2>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => onAdd(tab)}>
          <Plus size={18} /> {tab === 'medicine' ? 'Thêm thuốc' : 'Thêm tác vụ'}
        </button>
      </div>

      <div className="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'medicine'}
          className={tab === 'medicine' ? 'active' : ''}
          onClick={() => {
            setTab('medicine');
            setFilter('all');
          }}
        >
          <Pill size={18} /> Thuốc <span className="chip-count">{items.filter((i) => i.type === 'medicine').length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'task'}
          className={tab === 'task' ? 'active' : ''}
          onClick={() => {
            setTab('task');
            setFilter('all');
          }}
        >
          <ClipboardList size={18} /> Tác vụ hằng ngày <span className="chip-count">{items.filter((i) => i.type === 'task').length}</span>
        </button>
      </div>

      <FilterChips options={options} value={filter} onChange={setFilter} ariaLabel="Lọc việc cần làm" />

      {list.length === 0 ? (
        <EmptyState
          title={tab === 'medicine' ? 'Chưa có thuốc nào' : 'Chưa có tác vụ nào'}
          text="Bấm nút thêm để tạo mới."
          action={
            <button type="button" className="btn btn-soft" onClick={() => onAdd(tab)}>
              <Plus size={18} /> Thêm ngay
            </button>
          }
        />
      ) : (
        <ul className="manage-list">
          {list.map((i) => (
            <li key={i.id} className={`manage-item st-${i.status}`}>
              <div className="mi-main">
                <KindIcon kind={itemKind(i)} />
                <div className="mi-info">
                  <strong className={i.status === 'done' ? 'strike' : ''}>{i.type === 'medicine' ? i.name : i.title}</strong>
                  <div className="mi-meta">
                    {i.type === 'medicine' ? (
                      <>
                        {i.dosage && <span>{i.dosage}</span>}
                        {i.timing && <span>{i.timing}</span>}
                      </>
                    ) : (
                      <span>{TASK_CATEGORIES[i.category]}</span>
                    )}
                    <span>
                      {i.time ? `${i.time} · ` : 'Không đặt giờ · '}
                      {i.date ? relativeDayLabel(i.date) : 'Không đặt ngày'}
                    </span>
                  </div>
                  {i.note && <p className="mi-note">{i.note}</p>}
                </div>
              </div>
              <div className="mi-actions">
                <StatusSelect value={i.status} variant="manage" onChange={(v) => setStatus(i.id, v)} />
                <button type="button" className="icon-btn" onClick={() => onEdit(i)} aria-label="Sửa">
                  <Pencil size={18} />
                </button>
                <button type="button" className="icon-btn danger" onClick={() => setToDelete(i)} aria-label="Xoá">
                  <Trash2 size={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title={toDelete?.type === 'medicine' ? 'Xoá thuốc' : 'Xoá tác vụ'}
        message={toDelete ? `Bạn chắc chắn muốn xoá “${toDelete.type === 'medicine' ? toDelete.name : toDelete.title}”${toDelete.date ? ` (${formatDateShort(toDelete.date)}${toDelete.time ? ` ${toDelete.time}` : ''})` : ''}? Mục này cũng sẽ biến mất khỏi lịch trình.` : ''}
        onConfirm={() => deleteItem(toDelete.id)}
        onClose={() => setToDelete(null)}
      />
    </section>
  );
}

// ===================== FORM THÊM / SỬA =====================
const emptyMedicine = () => ({ type: 'medicine', name: '', dosage: '', timing: 'Sau ăn', date: todayStr(), time: '', note: '', status: 'todo' });
const emptyTask = () => ({ type: 'task', title: '', category: 'exercise', date: todayStr(), time: '', note: '', status: 'todo' });

function ItemFormModal({ editing, onClose }) {
  if (!editing) return null;
  // key giúp reset form mỗi lần mở
  return <ItemForm key={editing.item?.id || editing.type} editing={editing} onClose={onClose} />;
}

function ItemForm({ editing, onClose }) {
  const { addItem, updateItem, showToast } = useApp();
  const isEdit = !!editing.item;
  const [form, setForm] = useState(() => editing.item || (editing.type === 'medicine' ? emptyMedicine() : emptyTask()));
  const [repeat, setRepeat] = useState(1);
  const [error, setError] = useState('');
  const isMed = form.type === 'medicine';
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const name = (isMed ? form.name : form.title).trim();
    if (!name) {
      setError(isMed ? 'Vui lòng nhập tên thuốc.' : 'Vui lòng nhập tên công việc.');
      return;
    }
    if (form.time && !form.date) {
      setError('Vui lòng chọn ngày khi đã đặt giờ thực hiện.');
      return;
    }
    const clean = { ...form, [isMed ? 'name' : 'title']: name, dosage: form.dosage?.trim(), note: form.note?.trim() };
    if (isEdit) {
      const { id, ...patch } = clean;
      updateItem(id, patch);
      showToast('Đã lưu thay đổi.', 'success');
    } else {
      addItem(clean, repeat);
      showToast(
        clean.time && clean.date ? `Đã thêm “${name}” vào lịch trình${repeat > 1 ? ` (${repeat} ngày)` : ''}.` : `Đã thêm “${name}”.`,
        'success',
      );
    }
    onClose();
  };

  return (
    <Modal
      open
      title={`${isEdit ? 'Sửa' : 'Thêm'} ${isMed ? 'thuốc' : 'tác vụ hằng ngày'}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Huỷ
          </button>
          <button type="submit" form="item-form" className="btn btn-primary">
            {isEdit ? 'Lưu thay đổi' : 'Thêm mới'}
          </button>
        </>
      }
    >
      <form id="item-form" className="form-grid" onSubmit={submit} noValidate>
        {isMed ? (
          <>
            <Field label="Tên thuốc" required>
              <input className="input" value={form.name} onChange={set('name')} placeholder="VD: Amlodipine 5mg" autoFocus />
            </Field>
            <Field label="Liều lượng">
              <input className="input" value={form.dosage} onChange={set('dosage')} placeholder="VD: 1 viên" />
            </Field>
            <Field label="Thời điểm uống">
              <select className="input" value={form.timing} onChange={set('timing')}>
                {MED_TIMINGS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
          </>
        ) : (
          <>
            <Field label="Tên công việc" required>
              <input className="input" value={form.title} onChange={set('title')} placeholder="VD: Tập dưỡng sinh" autoFocus />
            </Field>
            <Field label="Loại công việc">
              <select className="input" value={form.category} onChange={set('category')}>
                {Object.entries(TASK_CATEGORIES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
          </>
        )}
        <div className="form-row">
          <Field label="Ngày">
            <input className="input" type="date" value={form.date} onChange={set('date')} />
          </Field>
          <Field label="Giờ thực hiện" hint="Có giờ sẽ hiện trong lịch trình">
            <input className="input" type="time" value={form.time} onChange={set('time')} />
          </Field>
        </div>
        <div className="form-row">
          <Field label="Trạng thái">
            <select className="input" value={form.status} onChange={set('status')}>
              {(form.status === 'missed' ? STATUS_KEYS : MANAGE_STATUS_KEYS).map((k) => (
                <option key={k} value={k}>
                  {STATUS[k].manage}
                </option>
              ))}
            </select>
          </Field>
          {!isEdit && (
            <Field label="Lặp lại">
              <select className="input" value={repeat} onChange={(e) => setRepeat(Number(e.target.value))} disabled={!form.date}>
                <option value={1}>Không lặp</option>
                <option value={3}>3 ngày liên tiếp</option>
                <option value={7}>7 ngày liên tiếp</option>
                <option value={14}>14 ngày liên tiếp</option>
              </select>
            </Field>
          )}
        </div>
        <Field label="Ghi chú">
          <textarea className="input" rows={3} value={form.note} onChange={set('note')} placeholder={isMed ? 'VD: Uống với nhiều nước' : 'VD: 20 phút, có người đi cùng'} />
        </Field>
        {error && <p className="form-error">{error}</p>}
      </form>
    </Modal>
  );
}

// ===================== C. BÁO CÁO =====================
function Report({ items }) {
  const [range, setRange] = useState('today');

  const stats = useMemo(() => {
    const scoped = items.filter((i) => (range === 'all' ? true : i.date && inRange(i, range)));
    const count = (arr, s) => arr.filter((i) => i.status === s).length;
    const meds = scoped.filter((i) => i.type === 'medicine');
    const tasks = scoped.filter((i) => i.type === 'task');
    const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
    return {
      total: scoped.length,
      byStatus: STATUS_KEYS.map((k) => ({ key: k, n: count(scoped, k) })),
      rate: pct(count(scoped, 'done'), scoped.length),
      meds: { total: meds.length, done: count(meds, 'done'), rate: pct(count(meds, 'done'), meds.length) },
      tasks: { total: tasks.length, done: count(tasks, 'done'), rate: pct(count(tasks, 'done'), tasks.length) },
      missed: scoped.filter((i) => i.status === 'missed').sort(sortByDateTime),
    };
  }, [items, range]);

  const reportRanges = [
    { value: 'today', label: 'Hôm nay' },
    { value: 'week', label: '7 ngày tới' },
    { value: 'all', label: 'Toàn bộ' },
  ];

  return (
    <section className="card" id="bao-cao">
      <div className="section-title">
        <h2>
          <BarChart3 size={20} /> C. Báo cáo nhanh
        </h2>
        <div className="segmented" role="tablist" aria-label="Phạm vi báo cáo">
          {reportRanges.map((o) => (
            <button key={o.value} type="button" role="tab" aria-selected={range === o.value} className={range === o.value ? 'active' : ''} onClick={() => setRange(o.value)}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="report-grid">
        <div className="report-main">
          <div className="ring" style={{ '--p': stats.rate }}>
            <span>
              <b>{stats.rate}%</b>
              <small>hoàn thành</small>
            </span>
          </div>
          <p className="muted center">
            {stats.byStatus[2].n}/{stats.total} mục đã xong
          </p>
        </div>

        <div className="report-bars">
          {stats.byStatus.map(({ key, n }) => (
            <div key={key} className="bar-row">
              <span className="bar-label">
                <StatusBadge status={key} />
              </span>
              <div className="bar">
                <span className={`bar-fill tone-${STATUS[key].tone}`} style={{ width: `${stats.total ? (n / stats.total) * 100 : 0}%` }} />
              </div>
              <b className="bar-num">{n}</b>
            </div>
          ))}
        </div>

        <div className="report-stats">
          <div className="stat">
            <span className="stat-icon kind-medicine">
              <Pill size={20} />
            </span>
            <div>
              <small>Tuân thủ uống thuốc</small>
              <b>{stats.meds.rate}%</b>
              <small>
                {stats.meds.done}/{stats.meds.total} lần uống
              </small>
            </div>
          </div>
          <div className="stat">
            <span className="stat-icon kind-exercise">
              <ClipboardList size={20} />
            </span>
            <div>
              <small>Tác vụ hoàn thành</small>
              <b>{stats.tasks.rate}%</b>
              <small>
                {stats.tasks.done}/{stats.tasks.total} tác vụ
              </small>
            </div>
          </div>
        </div>
      </div>

      {stats.missed.length > 0 && (
        <div className="missed-box">
          <strong>Mục bị bỏ lỡ ({stats.missed.length})</strong>
          <ul>
            {stats.missed.slice(0, 5).map((i) => (
              <li key={i.id}>
                <span>{itemTitle(i)}</span>
                <small>
                  {i.time} · {relativeDayLabel(i.date)}
                </small>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
