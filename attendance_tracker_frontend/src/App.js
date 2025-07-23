import React, { useState, useEffect } from "react";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Typography,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  AppBar,
  Toolbar,
  Divider,
  Paper,
  Tooltip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Slide,
  MenuItem,
  Snackbar,
  Alert
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Group as GroupIcon,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  Logout as LogoutIcon,
  AssignmentInd as AssignmentIndIcon,
  HighlightOff as HighlightOffIcon,
  Schedule as ScheduleIcon,
  Percent as PercentIcon,
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccountCircle as AccountCircleIcon,
  Close as CloseIcon
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import "@fontsource-variable/roboto";
import "./App.css";

// --- Theme and Palette ---
const palette = {
  primary: { main: "#1976D2" },
  secondary: { main: "#424242" },
  accent: { main: "#FFA726" },
  background: { default: "#f8f9fa", paper: "#fff" },
  success: { main: "#43A047" },
  error: { main: "#D32F2F" }
};
const muiTheme = createTheme({
  palette: {
    primary: palette.primary,
    secondary: palette.secondary,
    background: palette.background,
    accent: palette.accent,
    success: palette.success,
    error: palette.error,
    mode: "light"
  },
  typography: {
    fontFamily: [
      "Roboto Variable", "Segoe UI", "Arial", "sans-serif"
    ].join(","),
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h5: { fontWeight: 600 }
  },
  shape: {
    borderRadius: 15
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 700,
          letterSpacing: 0.2,
          textTransform: "none"
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          transition: "box-shadow .16s cubic-bezier(.4,0,.2,1)",
        }
      }
    }
  }
});

// --- Local Storage Data Keys & Helpers ---
const LS_KEYS = {
  USER: "attendance_user",
  STUDENTS: "attendance_students",
  ATTENDANCE: "attendance_records"
};
const INITIAL_USERS = [
  { email: "admin@school.org", password: "admin123", role: "admin" },
  { email: "teacher@school.org", password: "teach123", role: "teacher" }
];
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

// --- Sidebar config ---
const drawerWidth = 250;
const navLinks = [
  {
    label: "Dashboard",
    icon: <DashboardIcon />,
    key: "dashboard"
  },
  {
    label: "Students",
    icon: <GroupIcon />,
    key: "students"
  },
  {
    label: "Attendance",
    icon: <CheckCircleIcon />,
    key: "attendance"
  },
  {
    label: "History",
    icon: <HistoryIcon />,
    key: "history"
  }
];

// --- Styled components for polish ---
const LogoFlex = styled(Box)(({ theme }) => ({
  display: "flex", alignItems: "center"
}));
const ModernAvatar = styled(Avatar)(({ theme }) => ({
  background: theme.palette.accent.main,
  color: theme.palette.primary.main,
  fontWeight: 700,
  fontSize: 20,
  marginRight: 8,
  width: 42, height: 42,
  boxShadow: "0 2px 12px #ffa72666"
}));
const StatPaper = styled(Paper)(({ color, theme }) => ({
  flex: "1 1 150px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "26px 24px 18px",
  minWidth: 140,
  background: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius + 3,
  boxShadow: `0 4px 16px 0 ${color || "#1976d233"}`,
  marginBottom: 6,
  transition: "transform .13s, box-shadow .13s",
  "&:hover": {
    transform: "translateY(-2.5px) scale(1.035)",
    boxShadow: `0 8px 28px 0 ${color || "#1976d255"}`,
  }
}));
const BlurredDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiPaper-root": {
    backdropFilter: "blur(3.5px)",
    backgroundColor: "rgba(255,255,255,0.87)!important"
  }
}));

// === MAIN APP COMPONENT ===
// PUBLIC_INTERFACE
function App() {
  // Auth and user state
  const [user, setUser] = useState(null);
  const [nav, setNav] = useState("dashboard");
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  // UI state
  const [mobileOpen, setMobileOpen] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "info" });

  // Authentication form
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");

  // Student modal form
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("add"); // add/edit
  const [formData, setFormData] = useState({ full_name: "", roll_no: "", class: "" });
  const [formId, setFormId] = useState(null);

  // Load data on mount
  useEffect(() => {
    if (!window.localStorage.getItem("attendance_initialized")) {
      saveData(LS_KEYS.STUDENTS, []);
      saveData(LS_KEYS.ATTENDANCE, []);
      window.localStorage.setItem("attendance_initialized", "1");
    }
    setUser(loadData(LS_KEYS.USER, null));
    setStudents(loadData(LS_KEYS.STUDENTS, []));
    setAttendance(loadData(LS_KEYS.ATTENDANCE, []));
  }, []);
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

  // Sidebar Responsive Handling
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 900) setMobileOpen(false);
      else setMobileOpen(true);
    }
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- Authentication ---
  // PUBLIC_INTERFACE
  function handleLoginSubmit(e) {
    e.preventDefault();
    const found = INITIAL_USERS.find(
      (u) =>
        u.email === loginForm.email.trim() &&
        u.password === loginForm.password
    );
    if (found) {
      setUser({ email: found.email, role: found.role });
      setLoginError("");
      setLoginForm({ email: "", password: "" });
      setSnack({ open: true, message: `Logged in as ${found.role}`, severity: "success" });
    } else {
      setLoginError("Invalid credentials.");
      setSnack({ open: true, message: "Invalid login credentials.", severity: "error" });
    }
  }
  // PUBLIC_INTERFACE
  function handleLoginInput(e) {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  }

  // --- Navigation/Logout
  function handleNav(page) {
    setNav(page);
    setMobileOpen(false);
  }
  function handleLogout() {
    setUser(null);
    setNav("dashboard");
    setSnack({ open: true, message: "Logged out", severity: "info" });
  }

  // --- Student Management
  // PUBLIC_INTERFACE
  function addStudent(student) {
    const nextId = students.length
      ? Math.max(0, ...students.map((s) => s.id)) + 1
      : 1;
    const newStudent = { ...student, id: nextId, active: true };
    setStudents([...students, newStudent]);
    setSnack({ open: true, message: "Student added!", severity: "success" });
  }
  // PUBLIC_INTERFACE
  function updateStudent(id, changes) {
    setStudents(students.map((s) => (s.id === id ? { ...s, ...changes } : s)));
    setSnack({ open: true, message: "Student updated!", severity: "success" });
  }
  // PUBLIC_INTERFACE
  function deleteStudent(id) {
    setStudents(students.filter((s) => s.id !== id));
    setAttendance(attendance.filter((rec) => rec.student_id !== id));
    setSnack({ open: true, message: "Student deleted.", severity: "warning" });
  }
  // Handle form open/close for add/edit
  function openForm(mode, stud = null) {
    setFormMode(mode);
    if (mode === "edit" && stud) {
      setFormData({ full_name: stud.full_name, roll_no: stud.roll_no, class: stud.class });
      setFormId(stud.id);
    } else {
      setFormData({ full_name: "", roll_no: "", class: "" });
      setFormId(null);
    }
    setFormOpen(true);
  }
  function closeForm() {
    setFormOpen(false);
  }
  function handleFormChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }
  function handleFormSubmit(e) {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.roll_no.trim() || !formData.class.trim()) return;
    if (formMode === "edit" && formId != null) {
      updateStudent(formId, { ...formData });
    } else {
      addStudent(formData);
    }
    closeForm();
  }

  // --- Attendance
  // PUBLIC_INTERFACE
  function markAttendance({ student_id, status, date }) {
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
    setSnack({ open: true, message: "Attendance marked!", severity: "success" });
  }

  // Derived dashboard stats
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

  // --- Login Page ---
  if (!user) {
    return (
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <Box
          minHeight="100vh"
          display="flex"
          alignItems="center"
          justifyContent="center"
          sx={{
            background: "linear-gradient(105deg,#eaf6ff 30%,#fff 80%)"
          }}
        >
          <Paper
            elevation={9}
            sx={{
              borderRadius: 5,
              px: { xs: 2, sm: 4 },
              py: 5,
              maxWidth: 385,
              width: "95vw",
              boxShadow: "0 6px 32px #1976d22a"
            }}
          >
            <LogoBrand />
            <Typography variant="h5" mb={2} fontWeight={700} sx={{ letterSpacing: 0.4 }}>
              Attendance Tracker Login
            </Typography>
            <form onSubmit={handleLoginSubmit} autoComplete="on">
              <TextField
                autoFocus
                required
                fullWidth
                margin="dense"
                label="Email"
                name="email"
                variant="outlined"
                type="email"
                value={loginForm.email}
                onChange={handleLoginInput}
                sx={{ mb: 2 }}
              />
              <TextField
                required
                fullWidth
                label="Password"
                name="password"
                variant="outlined"
                type="password"
                value={loginForm.password}
                onChange={handleLoginInput}
                sx={{ mb: 2 }}
              />
              {loginError && (
                <Alert severity="error" sx={{ mt: 0, mb: 1 }}>
                  {loginError}
                </Alert>
              )}
              <Button
                type="submit"
                variant="contained"
                size="large"
                color="primary"
                fullWidth
                sx={{
                  fontWeight: 700,
                  mt: 2,
                  py: 1.6,
                  fontSize: "1.08em",
                  boxShadow: "0 2px 8px #1976d215"
                }}
              >
                Log In
              </Button>
            </form>
            <Typography mt={2.2} color="text.secondary" fontSize={15} align="center">
              <span style={{ fontWeight: 600 }}>Demo:</span>
              <br />admin@school.org / admin123<br />
              teacher@school.org / teach123
            </Typography>
          </Paper>
          <Snackbar
            open={snack.open}
            autoHideDuration={3400}
            onClose={() => setSnack({ ...snack, open: false })}
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <Alert onClose={() => setSnack({ ...snack, open: false })} severity={snack.severity} sx={{ width: '100%' }}>
              {snack.message}
            </Alert>
          </Snackbar>
        </Box>
      </ThemeProvider>
    );
  }

  // --- Authenticated Main Layout ---
  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
        {/* Sidebar navigation (Drawer) */}
        <AppDrawer
          user={user}
          nav={nav}
          handleNav={handleNav}
          open={mobileOpen}
          setOpen={setMobileOpen}
          handleLogout={handleLogout}
        />
        <Box sx={{ flexGrow: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          {/* App Bar/TopBar */}
          <ElevatedAppBar open={mobileOpen} setOpen={setMobileOpen} />
          <Box component="main" sx={{ flex: 1, py: { xs: 2, md: 4 }, px: { xs: 1.7, sm: 2.5, md: 4 }, width: "100%", maxWidth: 1150, margin: "0 auto" }}>
            {nav === "dashboard" && <DashboardOverview stats={dashboardStats} />}
            {nav === "students" && (
              <Students
                students={students}
                addStudent={addStudent}
                updateStudent={updateStudent}
                deleteStudent={deleteStudent}
                openForm={openForm}
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
          </Box>
        </Box>
        {/* Student Dialog */}
        <BlurredDialog
          open={formOpen}
          onClose={closeForm}
          TransitionComponent={Slide}
          TransitionProps={{ direction: "up" }}
          aria-labelledby="student-form"
        >
          <DialogTitle id="student-form" sx={{ fontWeight: 700, letterSpacing: 0.4, color: "primary.main" }}>
            {formMode === "edit" ? "Edit Student" : "Add Student"}
          </DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={handleFormSubmit} sx={{ pt: 1, display: 'flex', flexDirection: "column", gap: 1.7 }}>
              <TextField
                required
                name="full_name"
                label="Name"
                value={formData.full_name}
                onChange={handleFormChange}
                autoFocus
                margin="dense"
              />
              <TextField
                required
                name="roll_no"
                label="Roll Number"
                value={formData.roll_no}
                onChange={handleFormChange}
                margin="dense"
              />
              <TextField
                required
                name="class"
                label="Class"
                value={formData.class}
                onChange={handleFormChange}
                margin="dense"
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ pb: 2, px: 3 }}>
            <Button onClick={closeForm} variant="outlined" color="secondary">
              Cancel
            </Button>
            <Button onClick={handleFormSubmit} type="submit" variant="contained" color="primary" sx={{ fontWeight: 700 }}>
              {formMode === "edit" ? "Save" : "Add"}
            </Button>
          </DialogActions>
        </BlurredDialog>
        <Snackbar
          open={snack.open}
          autoHideDuration={3400}
          onClose={() => setSnack({ ...snack, open: false })}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert onClose={() => setSnack({ ...snack, open: false })} severity={snack.severity} sx={{ width: '100%' }}>
            {snack.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

// --- Logo Brand (modern) ---
function LogoBrand() {
  return (
    <LogoFlex mb={2}>
      <ModernAvatar variant="rounded">AT</ModernAvatar>
      <Typography variant="h5" color="primary" fontWeight={800} ml={-0.2} letterSpacing={1.0}>
        Tracker
      </Typography>
    </LogoFlex>
  );
}

// --- Drawer Sidebar (navigation) ---
function AppDrawer({ user, nav, handleNav, open, setOpen, handleLogout }) {
  return (
    <Drawer
      variant="persistent"
      open={open}
      anchor="left"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          background: "rgba(255,255,255,0.98)",
          borderRight: "2px solid #1976D225",
          boxShadow: "4px 0 16px 0 #1976D210",
          transition: "all .22s cubic-bezier(.7,.25,.33,1.36)"
        },
        display: { xs: open ? "block" : "none", md: "block" }
      }}
      PaperProps={{
        elevation: 3,
        sx: { pt: 1.5 }
      }}
    >
      <Box px={2} py={2.6}>
        <LogoBrand />
        <IconButton
          onClick={() => setOpen(false)}
          edge="end"
          size="small"
          sx={{
            position: "absolute", right: 12, top: 8,
            bgcolor: "#fff", color: "#424242aa",
            display: { xs: "inline-flex", md: "none" }
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <List sx={{ mt: 0.5 }}>
        {navLinks.map((link) => (
          <ListItem
            button
            key={link.key}
            selected={nav === link.key}
            onClick={() => handleNav(link.key)}
            sx={{
              borderRadius: "11px 0 0 11px",
              mb: 0.2,
              mx: 0.5,
              color: nav === link.key ? "primary.main" : "text.secondary",
              background: nav === link.key ? "rgba(25,118,210,0.075)" : undefined,
              transition: "background .14s"
            }}
          >
            <ListItemIcon sx={{ minWidth: 34, color: nav === link.key ? "primary.main" : "secondary.main" }}>
              {link.icon}
            </ListItemIcon>
            <ListItemText primary={link.label} primaryTypographyProps={{ fontWeight: nav === link.key ? 700 : 500, fontSize: "1.11em" }} />
          </ListItem>
        ))}
      </List>
      <Box flex="1 1 0" />
      <Box px={2} pb={2} mt={8}>
        <Divider sx={{ mb: 1.5 }} />
        <Box display="flex" alignItems="center" mb={0.8}>
          <Avatar sx={{ bgcolor: "primary.main", mr: 1, width: 32, height: 32 }}>
            <AccountCircleIcon />
          </Avatar>
          <Box>
            <Typography fontSize={14.2} fontWeight={700} color="primary.main">{user.email}</Typography>
            <Typography fontSize={13} color="text.secondary">{user.role}</Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          fullWidth
          sx={{
            mt: 1.2,
            fontWeight: 700,
            fontSize: 15,
            boxShadow: "0 2px 8px 0 #42424218"
          }}
        >
          Logout
        </Button>
      </Box>
    </Drawer>
  );
}

// --- AppBar (Top Navigation) ---
function ElevatedAppBar({ open, setOpen }) {
  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={4}
      sx={{
        background: "linear-gradient(90deg,#eaf0fa 65%,#fff 100%)",
        zIndex: (theme) => theme.zIndex.drawer + 1,
        boxShadow: "0 1.5px 7px #1976d210"
      }}
    >
      <Toolbar>
        <IconButton
          color="primary"
          edge="start"
          onClick={() => setOpen((old) => !old)}
          sx={{
            mr: 2, display: { xs: "inline-flex", md: "none" }
          }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1, letterSpacing: 0.4, display: "flex", alignItems: "center" }}>
          <CheckCircleIcon sx={{ color: "primary.main", mr: 1, fontSize: 28 }} />
          Student Attendance Tracker
        </Typography>
      </Toolbar>
    </AppBar>
  );
}

// --- Dashboard Overview ---
function DashboardOverview({ stats }) {
  return (
    <Box my={0.7}>
      <Typography variant="h4" fontWeight={700} gutterBottom sx={{ mt: 0 }}>
        Attendance Overview <span style={{ fontWeight:400,fontSize:"0.82em" }}>({todayStr()})</span>
      </Typography>
      <Box display="flex" flexWrap="wrap" gap={2.4} my={2.2}>
        <StatCard
          icon={<GroupIcon />}
          color="primary.main"
          label="Total Students"
          value={stats.total}
        />
        <StatCard
          icon={<CheckCircleIcon />}
          color="success.main"
          label="Present"
          value={stats.present}
        />
        <StatCard
          icon={<HighlightOffIcon />}
          color="error.main"
          label="Absent"
          value={stats.absent}
        />
        <StatCard
          icon={<ScheduleIcon />}
          color="accent.main"
          label="Late"
          value={stats.late}
        />
        <StatCard
          icon={<PercentIcon />}
          color="secondary.main"
          label="Attendance %"
          value={`${stats.percent}%`}
        />
      </Box>
    </Box>
  );
}
function StatCard({ icon, color, label, value }) {
  return (
    <StatPaper
      color={muiTheme.palette[color?.split(".")[0]]?.main || "#1976d211"}
      elevation={6}
    >
      <Box mb={0.8} color={color}>{icon}</Box>
      <Typography variant="subtitle2" fontWeight={600} color="text.secondary" mb={0.5} letterSpacing={0.2}>{label}</Typography>
      <Typography variant="h5" fontWeight={800} color={color} lineHeight={1.1}>{value}</Typography>
    </StatPaper>
  );
}

// --- Student Management ---
function Students({ students, addStudent, updateStudent, deleteStudent, openForm }) {
  // For focus styling and smooth appearance, use MUI
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" fontWeight={700}>Student List</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PersonAddIcon />}
          onClick={() => openForm("add")}
          sx={{
            fontWeight: 700,
            px: 2,
            py: 1,
            fontSize: "1.04em",
            borderRadius: 2,
            boxShadow: "0 2px 8px 0 #1976d220"
          }}
        >
          Add Student
        </Button>
      </Box>
      <Paper elevation={3} sx={{
        overflowX: "auto",
        borderRadius: 3,
        boxShadow: "0 1.5px 12px #1976d211",
        background: "#fff"
      }}>
        <Box component="table" width="100%" sx={{
          borderCollapse: "collapse",
          minWidth: 400
        }}>
          <Box component="thead" sx={{ bgcolor: "#F6FAFF" }}>
            <Box component="tr">
              <Box component="th" p={1.3} sx={{ color: "primary.main", fontWeight: 800, fontSize: "1.08em" }}>Name</Box>
              <Box component="th" p={1.3} sx={{ color: "primary.main", fontWeight: 800 }}>Roll No</Box>
              <Box component="th" p={1.3} sx={{ color: "primary.main", fontWeight: 800 }}>Class</Box>
              <Box component="th" p={1.3} sx={{ color: "primary.main", fontWeight: 800 }}>Status</Box>
              <Box component="th" p={1.3} minWidth={110} sx={{ color: "primary.main", fontWeight: 800 }}>Actions</Box>
            </Box>
          </Box>
          <Box component="tbody">
            {students.length === 0 ? (
              <Box component="tr" sx={{ background: "#fcfdff" }}>
                <Box component="td" colSpan={5} sx={{ color: "text.secondary", fontStyle: "italic", textAlign: "center", py: 3 }}>
                  No students registered.
                </Box>
              </Box>
            ) : (
              students.map((s) => (
                <Box component="tr" key={s.id} sx={{ transition: "background .13s", "&:hover": { background: "#F4F7FF" } }}>
                  <Box component="td" p={1.2}>{s.full_name}</Box>
                  <Box component="td" p={1.2}>{s.roll_no}</Box>
                  <Box component="td" p={1.2}>{s.class}</Box>
                  <Box component="td" p={1.2}>
                    <Box
                      component="span"
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 1,
                        fontWeight: 700,
                        color: s.active ? "success.main" : "error.main"
                      }}
                    >
                      <Box
                        component="span"
                        sx={{
                          display: "inline-block",
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          bgcolor: s.active ? "success.main" : "error.main",
                          mr: 1
                        }}
                      />
                      {s.active ? "Active" : "Inactive"}
                    </Box>
                  </Box>
                  <Box component="td" p={1.2}>
                    <Tooltip title="Edit">
                      <IconButton color="primary" size="small" onClick={() => openForm("edit", s)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        color="error"
                        size="small"
                        sx={{ ml: 0.5 }}
                        onClick={() => {
                          if (window.confirm("Delete permanently?")) deleteStudent(s.id);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

// --- Attendance Marking UI ---
function Attendance({ students, attendance, markAttendance }) {
  const [today] = useState(todayStr());
  function handleChange(id, status) {
    markAttendance({ student_id: id, status, date: today });
  }
  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={2.2}>Mark Today's Attendance</Typography>
      <Paper elevation={3} sx={{ overflowX: "auto", borderRadius: 3 }}>
        <Box component="table" width="100%" sx={{ borderCollapse: "collapse", minWidth: 400 }}>
          <Box component="thead" sx={{ bgcolor: "#F6FAFF" }}>
            <Box component="tr">
              <Box component="th" p={1.3} sx={{ color: "primary.main", fontWeight: 800 }}>Name</Box>
              <Box component="th" p={1.3} sx={{ color: "primary.main", fontWeight: 800 }}>Roll No</Box>
              <Box component="th" p={1.3} sx={{ color: "primary.main", fontWeight: 800 }}>Class</Box>
              <Box component="th" p={1.3} sx={{ color: "primary.main", fontWeight: 800 }}>Status</Box>
              <Box component="th" p={1.3} sx={{ color: "primary.main", fontWeight: 800 }}>Action</Box>
            </Box>
          </Box>
          <Box component="tbody">
            {students.length === 0 ? (
              <Box component="tr" sx={{ background: "#fcfdff" }}>
                <Box component="td" colSpan={5} sx={{ color: "text.secondary", fontStyle: "italic", textAlign: "center", py: 3 }}>
                  No students registered.
                </Box>
              </Box>
            ) : (
              students.map((s) => {
                const rec = attendance.find((r) => r.student_id === s.id && r.date === today);
                return (
                  <Box component="tr" key={s.id} sx={{ transition: "background .13s", "&:hover": { background: "#F4F7FF" } }}>
                    <Box component="td" p={1.2}>{s.full_name}</Box>
                    <Box component="td" p={1.2}>{s.roll_no}</Box>
                    <Box component="td" p={1.2}>{s.class}</Box>
                    <Box component="td" p={1.2}>
                      <Typography fontWeight={700} color={rec ? "primary.main" : "accent.main"}>
                        {rec
                          ? rec.status.charAt(0).toUpperCase() + rec.status.slice(1)
                          : <span style={{ color: "#ffa726" }}>Not marked</span>}
                      </Typography>
                    </Box>
                    <Box component="td" p={1.2}>
                      <TextField
                        select
                        fullWidth
                        value={rec ? rec.status : ""}
                        size="small"
                        onChange={e => handleChange(s.id, e.target.value)}
                        sx={{ minWidth: 105 }}
                        variant="outlined"
                        color="primary"
                        InputProps={{
                          sx: {
                            borderRadius: 2,
                            background: "#f3f7fa"
                          }
                        }}
                      >
                        <MenuItem value="" disabled>Select</MenuItem>
                        <MenuItem value="present">Present</MenuItem>
                        <MenuItem value="absent">Absent</MenuItem>
                        <MenuItem value="late">Late</MenuItem>
                        <MenuItem value="leave">Leave</MenuItem>
                      </TextField>
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>
        </Box>
      </Paper>
      <Typography color="text.secondary" fontStyle="italic" fontSize={16} mt={1.7}>
        Attendance can only be marked for today ({today}).
      </Typography>
    </Box>
  );
}

// --- Attendance History Table ---
function AttendanceHistory({ attendance, students }) {
  // Sorted by date desc, then name
  const hist = [...attendance].sort((a, b) => {
    if (a.date === b.date) {
      return a.student_name.localeCompare(b.student_name);
    }
    return b.date.localeCompare(a.date);
  });
  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={2.2}>Attendance History</Typography>
      <Paper elevation={3} sx={{ overflowX: "auto", borderRadius: 3 }}>
        <Box component="table" width="100%" sx={{ borderCollapse: "collapse", minWidth: 400 }}>
          <Box component="thead" sx={{ bgcolor: "#F6FAFF" }}>
            <Box component="tr">
              <Box component="th" p={1.3} sx={{ color: "primary.main", fontWeight: 800 }}>Date</Box>
              <Box component="th" p={1.3} sx={{ color: "primary.main", fontWeight: 800 }}>Name</Box>
              <Box component="th" p={1.3} sx={{ color: "primary.main", fontWeight: 800 }}>Roll No</Box>
              <Box component="th" p={1.3} sx={{ color: "primary.main", fontWeight: 800 }}>Class</Box>
              <Box component="th" p={1.3} sx={{ color: "primary.main", fontWeight: 800 }}>Status</Box>
            </Box>
          </Box>
          <Box component="tbody">
            {hist.length === 0 ? (
              <Box component="tr" sx={{ background: "#fcfdff" }}>
                <Box component="td" colSpan={5} sx={{ color: "text.secondary", textAlign: "center", fontSize: "1.1em", py: 3 }}>
                  No attendance records found.
                </Box>
              </Box>
            ) : (
              hist.map((rec, idx) => {
                const s = students.find((s) => s.id === rec.student_id);
                return (
                  <Box component="tr" key={idx + "-" + rec.student_id} sx={{ transition: "background .13s", "&:hover": { background: "#F4F7FF" } }}>
                    <Box component="td" p={1.1}>{rec.date}</Box>
                    <Box component="td" p={1.1}>{rec.student_name}</Box>
                    <Box component="td" p={1.1}>{s?.roll_no || "-"}</Box>
                    <Box component="td" p={1.1}>{s?.class || "-"}</Box>
                    <Box component="td" p={1.1}>
                      <ChipStatus status={rec.status} />
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

// --- Custom chip style for status ---
function ChipStatus({ status }) {
  let color = "accent.main", label = "";
  if (status === "present") { color = "success.main"; label = "Present"; }
  else if (status === "absent") { color = "error.main"; label = "Absent"; }
  else if (status === "late") { color = "accent.main"; label = "Late"; }
  else if (status === "leave") { color = "secondary.main"; label = "Leave"; }
  else { color = "secondary.light"; label = status; }
  return (
    <Box
      component="span"
      sx={{
        color: "#fff",
        px: 2,
        py: 0.7,
        minWidth: 49,
        borderRadius: 16,
        fontWeight: 800,
        display: "inline-block",
        fontSize: { xs: 14, md: 15.5 },
        backgroundColor: muiTheme.palette[color.split(".")[0]]?.main || "#888",
        boxShadow: "0 1.5px 6px #1976d214"
      }}
    >
      {label}
    </Box>
  );
}

export default App;
