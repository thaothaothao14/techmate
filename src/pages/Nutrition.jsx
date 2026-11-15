import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Coffee, Cookie, HeartPulse, Moon, Pencil, Plus, Save, Soup, Sun, Trash2, Utensils } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { MEALS, MEAL_KEYS, MENU_DAYS, todayMenuDay } from '../store/utils';
import { ConfirmDialog, Field, Modal, PageHeader, TagInput } from '../components/ui';

const MEAL_ICONS = { breakfast: Coffee, lunch: Sun, snack: Cookie, dinner: Moon };

export default function Nutrition() {
  return (
    <div className="page">
      <PageHeader title="Dinh dưỡng" subtitle="Thông tin chế độ ăn uống và thực đơn mẫu tham khảo." />
      <DietForm />
      <MenuSection />
    </div>
  );
}

// ===== Thông tin chế độ ăn =====
function DietForm() {
  const { diet, updateDiet, showToast } = useApp();
  const [form, setForm] = useState(diet);
  const dirty = JSON.stringify(form) !== JSON.stringify(diet);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <section className="card">
      <div className="section-title">
        <h2>
          <HeartPulse size={20} /> Chế độ ăn uống
        </h2>
        {dirty && <span className="pill pill-warn">Chưa lưu</span>}
      </div>
      <form
        className="diet-grid"
        onSubmit={(e) => {
          e.preventDefault();
          updateDiet({ ...form, notes: form.notes.trim() });
          showToast('Đã lưu thông tin chế độ ăn.', 'success');
        }}
      >
        <Field label="Các bệnh nền">
          <TagInput value={form.conditions} onChange={set('conditions')} placeholder="VD: Tăng huyết áp" tone="red" />
        </Field>
        <Field label="Khẩu vị & sở thích ăn uống">
          <TagInput value={form.preferences} onChange={set('preferences')} placeholder="VD: Thích món hấp" tone="green" />
        </Field>
        <Field label="Thực phẩm không thích / cần tránh">
          <TagInput value={form.avoid} onChange={set('avoid')} placeholder="VD: Đồ quá mặn" tone="amber" />
        </Field>
        <Field label="Ghi chú về chế độ ăn">
          <textarea className="input" rows={4} value={form.notes} onChange={(e) => set('notes')(e.target.value)} placeholder="VD: Chia nhỏ bữa, ăn chậm…" />
        </Field>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" disabled={!dirty} onClick={() => setForm(diet)}>
            Hoàn tác
          </button>
          <button type="submit" className="btn btn-primary" disabled={!dirty}>
            <Save size={18} /> Lưu thông tin
          </button>
        </div>
      </form>
    </section>
  );
}

// ===== Thực đơn mẫu =====
function MenuSection() {
  const { menu, deleteDish } = useApp();
  const [day, setDay] = useState(todayMenuDay());
  const [editing, setEditing] = useState(null); // { dish? , day, meal }
  const [toDelete, setToDelete] = useState(null);
  const tabsRef = useRef(null);

  const dishes = menu.filter((m) => m.day === day);

  // Cuộn tab ngày đang chọn vào giữa (quan trọng trên điện thoại)
  useEffect(() => {
    const box = tabsRef.current;
    const active = box?.querySelector('button.active');
    if (box && active) box.scrollLeft = active.offsetLeft - box.clientWidth / 2 + active.clientWidth / 2;
  }, [day]);

  return (
    <section className="card">
      <div className="section-title">
        <h2>
          <Soup size={20} /> Thực đơn mẫu tham khảo
        </h2>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setEditing({ day, meal: 'breakfast' })}>
          <Plus size={18} /> Thêm món
        </button>
      </div>

      <div className="day-tabs" ref={tabsRef} role="tablist" aria-label="Chọn ngày">
        {MENU_DAYS.map((d) => (
          <button key={d} type="button" role="tab" aria-selected={day === d} className={day === d ? 'active' : ''} onClick={() => setDay(d)}>
            {d}
            {d === todayMenuDay() && <span className="today-dot" aria-label="Hôm nay" />}
            <small>{menu.filter((m) => m.day === d).length} món</small>
          </button>
        ))}
      </div>

      <div className="meal-grid">
        {MEAL_KEYS.map((meal) => {
          const Icon = MEAL_ICONS[meal];
          const list = dishes.filter((d) => d.meal === meal);
          return (
            <div key={meal} className={`meal meal-${meal}`}>
              <div className="meal-head">
                <span className="meal-icon">
                  <Icon size={18} />
                </span>
                <strong>{MEALS[meal]}</strong>
                <button type="button" className="icon-btn sm" onClick={() => setEditing({ day, meal })} aria-label={`Thêm món cho ${MEALS[meal]}`}>
                  <Plus size={18} />
                </button>
              </div>
              {list.length === 0 ? (
                <p className="meal-empty">Chưa có món</p>
              ) : (
                <ul className="dish-list">
                  {list.map((d) => (
                    <li key={d.id}>
                      <div>
                        <strong>{d.name}</strong>
                        {d.desc && <p>{d.desc}</p>}
                      </div>
                      <div className="dish-actions">
                        <button type="button" className="icon-btn sm" onClick={() => setEditing({ dish: d, day: d.day, meal: d.meal })} aria-label="Sửa món">
                          <Pencil size={16} />
                        </button>
                        <button type="button" className="icon-btn sm danger" onClick={() => setToDelete(d)} aria-label="Xoá món">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <div className="disclaimer">
        <AlertCircle size={18} />
        <p>Thực đơn chỉ mang tính tham khảo, không thay thế tư vấn dinh dưỡng của chuyên gia y tế.</p>
      </div>

      {editing && <DishForm key={editing.dish?.id || `${editing.day}-${editing.meal}`} editing={editing} onClose={() => setEditing(null)} onSaved={(d) => setDay(d)} />}

      <ConfirmDialog
        open={!!toDelete}
        title="Xoá món ăn"
        message={toDelete ? `Xoá “${toDelete.name}” khỏi ${MEALS[toDelete.meal].toLowerCase()} ${toDelete.day}?` : ''}
        onConfirm={() => deleteDish(toDelete.id)}
        onClose={() => setToDelete(null)}
      />
    </section>
  );
}

function DishForm({ editing, onClose, onSaved }) {
  const { addDish, updateDish, showToast } = useApp();
  const isEdit = !!editing.dish;
  const [form, setForm] = useState(editing.dish || { day: editing.day, meal: editing.meal, name: '', desc: '' });
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Vui lòng nhập tên món ăn.');
      return;
    }
    const clean = { ...form, name: form.name.trim(), desc: form.desc.trim() };
    if (isEdit) {
      const { id, ...patch } = clean;
      updateDish(id, patch);
      showToast('Đã cập nhật món ăn.', 'success');
    } else {
      addDish(clean);
      showToast(`Đã thêm “${clean.name}”.`, 'success');
    }
    onSaved(clean.day);
    onClose();
  };

  return (
    <Modal
      open
      title={isEdit ? 'Sửa món ăn' : 'Thêm món ăn'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Huỷ
          </button>
          <button type="submit" form="dish-form" className="btn btn-primary">
            <Utensils size={18} /> {isEdit ? 'Lưu' : 'Thêm món'}
          </button>
        </>
      }
    >
      <form id="dish-form" className="form-grid" onSubmit={submit} noValidate>
        <div className="form-row">
          <Field label="Ngày">
            <select className="input" value={form.day} onChange={set('day')}>
              {MENU_DAYS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </Field>
          <Field label="Bữa">
            <select className="input" value={form.meal} onChange={set('meal')}>
              {MEAL_KEYS.map((k) => (
                <option key={k} value={k}>
                  {MEALS[k]}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Tên món" required>
          <input className="input" value={form.name} onChange={set('name')} placeholder="VD: Cháo yến mạch" autoFocus />
        </Field>
        <Field label="Mô tả ngắn">
          <textarea className="input" rows={3} value={form.desc} onChange={set('desc')} placeholder="Nguyên liệu, cách chế biến, khẩu phần…" />
        </Field>
        {error && <p className="form-error">{error}</p>}
      </form>
    </Modal>
  );
}
