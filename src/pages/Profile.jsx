import { useRef, useState } from 'react';
import { Camera, Database, ImageOff, Phone, RotateCcw, Save, UserRound } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { calcAge, resizeImage, todayStr } from '../store/utils';
import { Avatar, ConfirmDialog, Field, PageHeader } from '../components/ui';

export default function Profile() {
  const { profile, updateProfile, showToast, resetDemo } = useApp();
  const [form, setForm] = useState(profile);
  const [error, setError] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef(null);
  const dirty = JSON.stringify(form) !== JSON.stringify(profile);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const age = calcAge(form.dob);

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn một file ảnh.', 'danger');
      return;
    }
    try {
      const dataUrl = await resizeImage(file, 320);
      setForm((f) => ({ ...f, avatar: dataUrl }));
    } catch {
      showToast('Không đọc được ảnh, vui lòng thử ảnh khác.', 'danger');
    }
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Vui lòng nhập họ tên.');
      return;
    }
    if (form.dob && form.dob > todayStr()) {
      setError('Ngày sinh không hợp lệ.');
      return;
    }
    if (form.caregiverPhone && !/^[0-9+\s().-]{8,20}$/.test(form.caregiverPhone.trim())) {
      setError('Số điện thoại chỉ gồm chữ số (8–20 ký tự).');
      return;
    }
    setError('');
    const clean = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, typeof v === 'string' && k !== 'avatar' ? v.trim() : v]));
    updateProfile(clean);
    setForm(clean);
    showToast('Đã cập nhật hồ sơ.', 'success');
  };

  return (
    <div className="page">
      <PageHeader title="Hồ sơ người cao tuổi" subtitle="Thông tin được đồng bộ trên toàn bộ ứng dụng." />

      <form className="profile-layout" onSubmit={submit} noValidate>
        <section className="card profile-card">
          <div className="avatar-edit">
            <Avatar src={form.avatar} size={128} className="avatar-ring" />
            <button type="button" className="avatar-cam" onClick={() => fileRef.current?.click()} aria-label="Đổi ảnh đại diện">
              <Camera size={18} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
          </div>
          <h2>{form.name || 'Chưa đặt tên'}</h2>
          <p className="muted">
            {age !== null ? `${age} tuổi` : 'Chưa có ngày sinh'}
            {form.gender ? ` · ${form.gender}` : ''}
          </p>
          <div className="avatar-btns">
            <button type="button" className="btn btn-soft btn-sm" onClick={() => fileRef.current?.click()}>
              <Camera size={16} /> Chọn ảnh
            </button>
            {form.avatar && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm((f) => ({ ...f, avatar: '' }))}>
                <ImageOff size={16} /> Gỡ ảnh
              </button>
            )}
          </div>
          {profile.caregiverPhone && (
            <a className="call-btn" href={`tel:${profile.caregiverPhone.replace(/\s/g, '')}`}>
              <Phone size={18} /> Gọi người chăm sóc
            </a>
          )}
        </section>

        <section className="card">
          <div className="section-title">
            <h2>
              <UserRound size={20} /> Thông tin cá nhân
            </h2>
            {dirty && <span className="pill pill-warn">Chưa lưu</span>}
          </div>
          <div className="form-grid">
            <Field label="Họ và tên" required>
              <input className="input" value={form.name} onChange={set('name')} placeholder="VD: Nguyễn Văn A" />
            </Field>
            <div className="form-row">
              <Field label="Ngày sinh">
                <input className="input" type="date" value={form.dob} max={todayStr()} onChange={set('dob')} />
              </Field>
              <Field label="Giới tính">
                <select className="input" value={form.gender} onChange={set('gender')}>
                  <option value="">-- Chọn --</option>
                  <option>Nữ</option>
                  <option>Nam</option>
                  <option>Khác</option>
                </select>
              </Field>
            </div>
            <div className="form-row">
              <Field label="Tên người chăm sóc">
                <input className="input" value={form.caregiverName || ''} onChange={set('caregiverName')} placeholder="VD: Trần Minh Anh" />
              </Field>
              <Field label="SĐT người chăm sóc">
                <input className="input" type="tel" inputMode="tel" value={form.caregiverPhone} onChange={set('caregiverPhone')} placeholder="VD: 0912 345 678" />
              </Field>
            </div>
            <Field label="Thông tin liên hệ" hint="Địa chỉ, email hoặc người liên hệ khẩn cấp">
              <textarea className="input" rows={2} value={form.contact} onChange={set('contact')} />
            </Field>
            <Field label="Ghi chú chăm sóc">
              <textarea className="input" rows={4} value={form.careNotes} onChange={set('careNotes')} placeholder="Tình trạng sức khoẻ, thói quen, lưu ý đặc biệt…" />
            </Field>
            {error && <p className="form-error">{error}</p>}
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-ghost"
                disabled={!dirty}
                onClick={() => {
                  setForm(profile);
                  setError('');
                }}
              >
                Hoàn tác
              </button>
              <button type="submit" className="btn btn-primary" disabled={!dirty}>
                <Save size={18} /> Lưu hồ sơ
              </button>
            </div>
          </div>
        </section>
      </form>

      <section className="card data-card">
        <div>
          <h2>
            <Database size={20} /> Dữ liệu demo
          </h2>
          <p className="muted">Dữ liệu được lưu trong trình duyệt (localStorage). Bạn có thể khôi phục dữ liệu mẫu ban đầu bất cứ lúc nào.</p>
        </div>
        <button type="button" className="btn btn-danger-soft" onClick={() => setConfirmReset(true)}>
          <RotateCcw size={18} /> Khôi phục dữ liệu mẫu
        </button>
      </section>

      <ConfirmDialog
        open={confirmReset}
        title="Khôi phục dữ liệu mẫu"
        message="Toàn bộ hồ sơ, lịch trình, thông báo và thực đơn hiện tại sẽ bị thay thế bằng dữ liệu mẫu. Không thể hoàn tác."
        confirmText="Khôi phục"
        onConfirm={() => {
          resetDemo();
          // đồng bộ form với dữ liệu mới ở lần render sau
          setTimeout(() => window.location.reload(), 50);
        }}
        onClose={() => setConfirmReset(false)}
      />
    </div>
  );
}
