import React, { useState, useEffect } from "react";
import "./App.css";

// Color theme variables
const COLORS = {
  primary: "#1976D2",
  accent: "#FFA726",
  secondary: "#424242",
  lightBg: "#f8f9fa",
  mainBg: "#fff",
  border: "#e0e0e0",
  success: "#43A047",
  error: "#D32F2F",
  text: "#212121",
  textLight: "#757575"
};

// === Local Storage Keys ===
const LS_KEYS = {
  USER: "attendance_user",
  STUDENTS: "attendance_students",
  ATTENDANCE: "attendance_records"
};

// === Initial Data Structure ===
const INITIAL_USERS = [
  { email: "admin@school.org", password: "admin123", role: "admin" },
  { email: "teacher@school.org", password: "teach123", role: "teacher" }
];

// Helper for today in YYYY-MM-DD
function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function loadData(key, fallback) {
  try {
    const v = window.localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}
function saveData(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

// === COMPONENTS ===

// PUBLIC_INTERFACE
function App() {
  // Authentication state
  const [user, setUser] = useState(null);
  // Main navigation: "dashboard", "students", "attendance", "history"
  const [nav, setNav] = useState("dashboard");

  // Data states
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);

  // For login form
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");

  // Load from LocalStorage on mount
  useEffect(() => {
    // In Non-demo, you'd never keep starter accounts here
    if (!window.localStorage.getItem("attendance_initialized")) {
      saveData(LS_KEYS.STUDENTS, []);
      saveData(LS_KEYS.ATTENDANCE, []);
      window.localStorage.setItem("attendance_initialized", "1");
    }
    setUser(loadData(LS_KEYS.USER, null));
    setStudents(loadData(LS_KEYS.STUDENTS, []));
    setAttendance(loadData(LS_KEYS.ATTENDANCE, []));
  }, []);

  // Persist students or attendance changes
  useEffect(() => {
    saveData(LS_KEYS.STUDENTS, students);
  }, [students]);
  useEffect(() => {
    saveData(LS_KEYS.ATTENDANCE, attendance);
  }, [attendance]);
  useEffect(() => {
    if (user) saveData(LS_KEYS.USER, user);
    else window.localStorage.removeItem(LS_KEYS.USER);
  }, [user]);

  // === Navigation
  function handleNav(page) {
    setNav(page);
  }
  function handleLogout() {
    setUser(null);
    setNav("dashboard");
  }

  // === Authentication ===
  // PUBLIC_INTERFACE
  function handleLoginSubmit(e) {
    e.preventDefault();
    // Only demo users, no signup
    const found = INITIAL_USERS.find(
      (u) =>
        u.email === loginForm.email.trim() &&
        u.password === loginForm.password
    );
    if (found) {
      setUser({ email: found.email, role: found.role });
      setLoginError("");
      setLoginForm({ email: "", password: "" });
    } else {
      setLoginError("Invalid credentials.");
    }
  }
  // PUBLIC_INTERFACE
  function handleLoginInput(e) {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  }

  // === STUDENT MANAGEMENT ===
  // PUBLIC_INTERFACE
  function addStudent(student) {
    const nextId = students.length
      ? Math.max(0, ...students.map((s) => s.id)) + 1
      : 1;
    const newStudent = { ...student, id: nextId, active: true };
    setStudents([...students, newStudent]);
  }

  // PUBLIC_INTERFACE
  function updateStudent(id, changes) {
    setStudents(
      students.map((s) => (s.id === id ? { ...s, ...changes } : s))
    );
  }
  // PUBLIC_INTERFACE
  function deleteStudent(id) {
    setStudents(students.filter((s) => s.id !== id));
    setAttendance(attendance.filter((rec) => rec.student_id !== id));
  }

  // === ATTENDANCE ===
  // PUBLIC_INTERFACE
  function markAttendance({ student_id, status, date }) {
    // Overwrite today's attendance for this student
    const existing = attendance.find(
      (r) => r.student_id === student_id && r.date === date
    );
    let newRecs;
    if (!existing) {
      newRecs = [
        ...attendance,
        {
          student_id,
          student_name: students.find((s) => s.id === student_id)?.full_name || "",
          date,
          status
        }
      ];
    } else {
      newRecs = attendance.map((r) =>
        r.student_id === student_id && r.date === date
          ? {
              ...r,
              status
            }
          : r
      );
    }
    setAttendance(newRecs);
  }

  // === Derived data: Dashboard Summary
  const dashboardStats = (() => {
    const today = todayStr();
    const recs = attendance.filter((r) => r.date === today);
    const total = students.length;
    let present = 0,
      absent = 0,
      late = 0;
    for (const rec of recs) {
      if (rec.status === "present") present++;
      if (rec.status === "absent") absent++;
      if (rec.status === "late") late++;
    }
    const percent = total
      ? Math.round(((present + late) / total) * 100)
      : 0;
    return {
      total,
      present,
      absent,
      late,
      percent
    };
  })();

  // === Responsive sidebar toggle
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 900);
  useEffect(() => {
    function handleResize() {
      setSidebarOpen(window.innerWidth > 900);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // === Render
  if (!user) {
    return (
      <div className="auth-bg">
        <div className="auth-card">
          <Logo />
          <h2>Attendance Tracker Login</h2>
          <form className="auth-form" onSubmit={handleLoginSubmit}>
            <label>
              Email
              <input
                required
                type="email"
                value={loginForm.email}
                name="email"
                autoComplete="username"
                onChange={handleLoginInput}
              />
            </label>
            <label>
              Password
              <input
                required
                type="password"
                value={loginForm.password}
                name="password"
                autoComplete="current-password"
                onChange={handleLoginInput}
              />
            </label>
            {loginError && (
              <div className="form-error" data-testid="login-error">
                {loginError}
              </div>
            )}
            <button className="btn-primary" type="submit">
              Log in
            </button>
          </form>
          <p className="hint">
            <b>Demo accounts:</b>
            <br />
            admin@school.org / admin123
            <br />
            teacher@school.org / teach123
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="root-layout">
      <Sidebar
        nav={nav}
        onNav={handleNav}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={user}
        onLogout={handleLogout}
      />
      <div className="main-content">
        <TopBar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        <div className="main-area">
          {nav === "dashboard" && (
            <DashboardOverview stats={dashboardStats} />
          )}
          {nav === "students" && (
            <Students
              students={students}
              addStudent={addStudent}
              updateStudent={updateStudent}
              deleteStudent={deleteStudent}
            />
          )}
          {nav === "attendance" && (
            <Attendance
              students={students}
              attendance={attendance}
              markAttendance={markAttendance}
            />
          )}
          {nav === "history" && (
            <AttendanceHistory attendance={attendance} students={students} />
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------- Layout and UI Components -------------------

// Logo SVG
function Logo() {
  return (
    <div className="logo">
      <svg
        width="32"
        height="32"
        viewBox="0 0 50 50"
        fill={COLORS.primary}
        xmlns="http://www.w3.org/2000/svg"
        style={{
          verticalAlign: "middle",
          marginRight: 8
        }}
      >
        <circle cx="25" cy="25" r="24" stroke={COLORS.primary} strokeWidth="2" fill={COLORS.accent} />
        <text x="50%" y="60%" textAnchor="middle" fontWeight="bold" fontFamily="Arial" fontSize="21" fill={COLORS.primary}>
          AT
        </text>
      </svg>
      <span className="logo-text" style={{ color: COLORS.primary, fontWeight: 700, fontSize: 22 }}>
        Tracker
      </span>
    </div>
  );
}

// Sidebar navigation
function Sidebar({ nav, onNav, sidebarOpen, setSidebarOpen, user, onLogout }) {
  return (
    <aside className={`sidebar${sidebarOpen ? "" : " collapsed"}`} tabIndex="-1">
      <div className="sidebar-header">
        <Logo />
        {sidebarOpen && (
          <span className="sidebar-close" onClick={() => setSidebarOpen(false)} tabIndex={0} title="Hide menu">
            ×
          </span>
        )}
      </div>
      <nav className="sidebar-nav">
        <SidebarLink
          label="Dashboard"
          active={nav === "dashboard"}
          icon="dashboard"
          onClick={() => onNav("dashboard")}
        />
        <SidebarLink
          label="Students"
          active={nav === "students"}
          icon="group"
          onClick={() => onNav("students")}
        />
        <SidebarLink
          label="Attendance"
          active={nav === "attendance"}
          icon="check_circle"
          onClick={() => onNav("attendance")}
        />
        <SidebarLink
          label="History"
          active={nav === "history"}
          icon="history"
          onClick={() => onNav("history")}
        />
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <span className="user-icon" title={user.role}>
            <span className="material-icons" style={{ color: COLORS.primary }}>account_circle</span>
          </span>{" "}
          <span className="sidebar-email">{user.email}</span>
        </div>
        <button className="btn-secondary fullwidth" onClick={onLogout}>
          <span className="material-icons" style={{ verticalAlign: "middle", fontSize: 18, color: COLORS.secondary }}>logout</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
function SidebarLink({ label, active, icon, onClick }) {
  return (
    <div
      className={`sidebar-link${active ? " active" : ""}`}
      onClick={onClick}
      tabIndex={0}
      title={label}
      role="menuitem"
    >
      <span className="material-icons" style={{ fontSize: 20, verticalAlign: "middle", color: active ? COLORS.primary : COLORS.textLight, marginRight: 8 }}>
        {icon}
      </span>
      {label}
    </div>
  );
}

// Top Navigation Bar
function TopBar({ sidebarOpen, setSidebarOpen }) {
  return (
    <header className="topbar" tabIndex={-1}>
      {!sidebarOpen && (
        <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
          <span className="material-icons" style={{ color: COLORS.primary, fontSize: 26 }}>menu</span>
        </button>
      )}
      <span style={{ fontWeight: 600, fontSize: "1.18em", marginLeft: sidebarOpen ? 0 : 16 }}>
        <span className="material-icons" style={{ verticalAlign: "middle", color: COLORS.primary, marginRight: 4 }}>checklist</span>
        Student Attendance Tracker
      </span>
    </header>
  );
}

// Dashboard Overview
function DashboardOverview({ stats }) {
  return (
    <div className="dashboard">
      <h2 style={{ marginTop: 0 }}>Attendance Overview ({todayStr()})</h2>
      <div className="dashboard-cards">
        <StatCard title="Total Students" value={stats.total} icon="group" color={COLORS.primary} />
        <StatCard title="Present" value={stats.present} icon="check_circle" color={COLORS.success} />
        <StatCard title="Absent" value={stats.absent} icon="highlight_off" color={COLORS.error} />
        <StatCard title="Late" value={stats.late} icon="schedule" color={COLORS.accent} />
        <StatCard title="Attendance %" value={stats.percent + "%"} icon="percent" color={COLORS.secondary} />
      </div>
    </div>
  );
}
function StatCard({ title, value, icon, color }) {
  return (
    <div className="stat-card">
      <span className="material-icons" style={{ color, fontSize: 28, marginBottom: 2 }}>{icon}</span>
      <div className="stat-title">{title}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

// Students management (list/add/edit/delete)
function Students({ students, addStudent, updateStudent, deleteStudent }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ full_name: "", roll_no: "", class: "" });
  const [editId, setEditId] = useState(null);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
  function startEdit(stud) {
    setEditId(stud.id);
    setForm({ full_name: stud.full_name, roll_no: stud.roll_no, class: stud.class });
    setShowForm(true);
  }
  function handleSubmit(e) {
    e.preventDefault();
    if (!form.full_name.trim() || !form.roll_no.trim() || !form.class.trim()) return;
    if (editId) {
      updateStudent(editId, { ...form });
    } else {
      addStudent(form);
    }
    setForm({ full_name: "", roll_no: "", class: "" });
    setEditId(null);
    setShowForm(false);
  }
  return (
    <div className="students-section">
      <div className="section-header">
        <h2>Student List</h2>
        <button className="btn-primary" onClick={() => { setShowForm(true); setEditId(null); setForm({ full_name: "", roll_no: "", class: "" }); }}>
          <span className="material-icons" style={{ fontSize: 18, verticalAlign: "middle", marginRight: 3 }}>person_add</span>
          Add Student
        </button>
      </div>
      <div className="table-responsive">
        <table className="main-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Roll No</th>
              <th>Class</th>
              <th>Status</th>
              <th style={{ minWidth: 100 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 && (
              <tr>
                <td colSpan={5} style={{ color: COLORS.textLight, fontStyle: "italic" }}>
                  No students registered.
                </td>
              </tr>
            )}
            {students.map((s) => (
              <tr key={s.id}>
                <td>{s.full_name}</td>
                <td>{s.roll_no}</td>
                <td>{s.class}</td>
                <td>
                  <span className={`status-dot ${s.active ? "status-active" : "status-inactive"}`}></span>
                  {s.active ? "Active" : "Inactive"}
                </td>
                <td>
                  <button className="btn-sm" style={{ background: COLORS.primary, color: "#fff" }} onClick={() => startEdit(s)} title="Edit">
                    <span className="material-icons" style={{ fontSize: 15 }}>edit</span>
                  </button>
                  <button className="btn-sm" style={{ background: COLORS.error, color: "#fff", marginLeft: 6 }} onClick={() => { if (window.confirm("Delete permanently?")) deleteStudent(s.id);}} title="Delete">
                    <span className="material-icons" style={{ fontSize: 15 }}>delete</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showForm && (
        <div className="modal">
          <form className="student-form" onSubmit={handleSubmit}>
            <h3>{editId ? "Edit Student" : "Add Student"}</h3>
            <label>
              Name
              <input required name="full_name" value={form.full_name} onChange={handleChange} />
            </label>
            <label>
              Roll No
              <input required name="roll_no" value={form.roll_no} onChange={handleChange} />
            </label>
            <label>
              Class
              <input required name="class" value={form.class} onChange={handleChange} />
            </label>
            <div style={{display:"flex",gap:8,marginTop:15}}>
              <button className="btn-primary" type="submit">{editId ? "Save" : "Add"}</button>
              <button className="btn-secondary" type="button" onClick={() => {setShowForm(false);setEditId(null);}}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// Attendance Marking UI
function Attendance({ students, attendance, markAttendance }) {
  const [today] = useState(todayStr()); // today's date

  function handleChange(id, status) {
    markAttendance({ student_id: id, status, date: today });
  }
  return (
    <div className="attendance-section">
      <h2>Mark Today's Attendance</h2>
      <div className="table-responsive">
        <table className="main-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Roll No</th>
              <th>Class</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 && (
              <tr>
                <td colSpan={5} style={{ color: COLORS.textLight, fontStyle: "italic" }}>
                  No students registered.
                </td>
              </tr>
            )}
            {students.map((s) => {
              const rec = attendance.find(
                (r) => r.student_id === s.id && r.date === today
              );
              return (
                <tr key={s.id}>
                  <td>{s.full_name}</td>
                  <td>{s.roll_no}</td>
                  <td>{s.class}</td>
                  <td>
                    <strong>
                      {rec
                        ? rec.status.charAt(0).toUpperCase() +
                          rec.status.slice(1)
                        : <span style={{ color: "#ffa726" }}>Not marked</span>}
                    </strong>
                  </td>
                  <td>
                    <select
                      className="attendance-select"
                      value={rec ? rec.status : ""}
                      onChange={(e) => handleChange(s.id, e.target.value)}
                    >
                      <option value="" disabled>
                        Select
                      </option>
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="late">Late</option>
                      <option value="leave">Leave</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="section-note">Attendance can only be marked for today ({today}).</div>
    </div>
  );
}

// Attendance History Table
function AttendanceHistory({ attendance, students }) {
  // Sorted by date desc, then name
  const hist = [...attendance].sort((a, b) => {
    if (a.date === b.date) {
      return a.student_name.localeCompare(b.student_name);
    }
    return b.date.localeCompare(a.date);
  });
  return (
    <div className="history-section">
      <h2>Attendance History</h2>
      <div className="table-responsive">
        <table className="main-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Name</th>
              <th>Roll No</th>
              <th>Class</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {hist.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ color: COLORS.textLight }}>
                  No attendance records found.
                </td>
              </tr>
            ) : (
              hist.map((rec, idx) => {
                const s = students.find((s) => s.id === rec.student_id);
                return (
                  <tr key={idx + "-" + rec.student_id}>
                    <td>{rec.date}</td>
                    <td>{rec.student_name}</td>
                    <td>{s?.roll_no || "-"}</td>
                    <td>{s?.class || "-"}</td>
                    <td>
                      <span
                        className="history-badge"
                        data-status={rec.status}
                        style={{
                          background:
                            rec.status === "present"
                              ? COLORS.success
                              : rec.status === "absent"
                              ? COLORS.error
                              : rec.status === "late"
                              ? COLORS.accent
                              : "#888"
                        }}
                      >
                        {rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --------- Material Icons Inline --------
/**
 * Only minimal CSS for Google Material Icons. User must have access to fonts.gstatic.com /fonts.googleapis.
 * Can be replaced with @font-face for true offline, but here just style fallback for demo.
 */
const style = document.createElement('style');
style.innerHTML = `
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');
.material-icons { font-family: 'Material Icons', Arial, sans-serif; font-weight: normal; font-style: normal; font-size: 22px; display: inline-block; line-height: 1; letter-spacing: normal; text-transform: none; direction: ltr; -webkit-font-feature-settings: 'liga'; -webkit-font-smoothing: antialiased;}
`;
document.head.appendChild(style);

export default App;
