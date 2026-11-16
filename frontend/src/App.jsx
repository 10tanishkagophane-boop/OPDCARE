
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  Activity, ArrowRight, ArrowUpRight, CalendarDays,
  CheckCircle2, Clock3, HeartPulse, MapPin, Search,
  ShieldCheck, Stethoscope, Users, X
} from "lucide-react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const departmentStyles = {
  Cardiology: { icon: "♡", color: "rose" },
  Neurology: { icon: "⌘", color: "blue" },
  Orthopedics: { icon: "✳", color: "mint" },
  Pediatrics: { icon: "☺", color: "peach" },
  Gynecology: { icon: "♀", color: "lavender" },
  "General Medicine": { icon: "＋", color: "sky" },
  Dermatology: { icon: "✧", color: "sand" },
  Oncology: { icon: "♧", color: "lilac" },
};

function App() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [selectedHospital, setSelectedHospital] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [registering, setRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState("");
  const [tokenResult, setTokenResult] = useState(null);

  const [queuePatients, setQueuePatients] = useState([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueError, setQueueError] = useState("");
  const [queueVisible, setQueueVisible] = useState(false);

  const [adminOpen, setAdminOpen] = useState(false);
  const [adminPatients, setAdminPatients] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");

  useEffect(() => {
    const loadHospitals = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/hospitals`);
        setHospitals(response.data.data || []);
      } catch (err) {
        console.error(err);
        setError("We couldn't load hospitals. Please check that the backend is running.");
      } finally {
        setLoading(false);
      }
    };
    loadHospitals();
  }, []);

  const fetchQueue = useCallback(async () => {
    if (!selectedHospital || !selectedDepartment) return;
    try {
      setQueueLoading(true);
      setQueueError("");
      const response = await axios.get(`${API_URL}/api/queue`, {
        params: {
          hospitalId: selectedHospital._id,
          department: selectedDepartment,
        },
      });
      setQueuePatients(response.data.data || []);
      setQueueVisible(true);
    } catch (err) {
      console.error("Queue error:", err);
      setQueueError("Unable to load the queue. Please try again.");
    } finally {
      setQueueLoading(false);
    }
  }, [selectedHospital, selectedDepartment]);

  useEffect(() => {
    if (!tokenResult) return;
    fetchQueue();
    const timer = setInterval(fetchQueue, 5000);
    return () => clearInterval(timer);
  }, [tokenResult, fetchQueue]);

  const fetchAdminPatients = useCallback(async () => {
    try {
      setAdminLoading(true);
      setAdminError("");
      const response = await axios.get(`${API_URL}/api/patients`);
      setAdminPatients(response.data.data || []);
    } catch (err) {
      console.error("Admin dashboard error:", err);
      setAdminError("Could not load patients. Please check that the backend is running.");
    } finally {
      setAdminLoading(false);
    }
  }, []);

  useEffect(() => {
    if (adminOpen) fetchAdminPatients();
  }, [adminOpen, fetchAdminPatients]);

  const updatePatientStatus = async (patientId, status) => {
    try {
      await axios.patch(
        `${API_URL}/api/patients/${patientId}/status`,
        { status }
      );
      await fetchAdminPatients();
    } catch (err) {
      console.error("Status update error:", err);
      setAdminError(
        err.response?.data?.message || "Could not update patient status."
      );
    }
  };

  const openRegistration = (hospital, department = "") => {
    setSelectedHospital(hospital);
    setSelectedDepartment(department || hospital.departments?.[0] || "");
    setPatientName("");
    setPatientAge("");
    setPatientPhone("");
    setRegistrationError("");
    setTokenResult(null);
    setQueuePatients([]);
    setQueueError("");
    setQueueVisible(false);
  };

  const closeRegistration = () => {
    setSelectedHospital(null);
    setTokenResult(null);
    setQueuePatients([]);
    setQueueVisible(false);
    setRegistrationError("");
  };

  const registerPatient = async (event) => {
    event.preventDefault();

    if (!selectedHospital || !selectedDepartment) {
      setRegistrationError("Please select a department.");
      return;
    }

    try {
      setRegistering(true);
      setRegistrationError("");
      const response = await axios.post(`${API_URL}/api/patients`, {
        name: patientName.trim(),
        age: Number(patientAge),
        phone: patientPhone,
        hospitalId: selectedHospital._id,
        department: selectedDepartment,
      });
      setTokenResult(response.data.data);
    } catch (err) {
      console.error("Registration error:", err);
      setRegistrationError(
        err.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setRegistering(false);
    }
  };

  const filteredHospitals = hospitals.filter((hospital) =>
    `${hospital.name} ${hospital.location}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const allDepartments = [
    ...new Set(hospitals.flatMap((hospital) => hospital.departments || [])),
  ];

  const getDepartmentStyle = (department) =>
    departmentStyles[department] || { icon: "✚", color: "blue" };

  return (
    <div className="opd-app">
      <div className="top-strip">
        <span>CARE THAT MOVES WITH YOU</span>
        <span className="top-strip-message">
          Your health journey, made simpler <ArrowRight size={13} />
        </span>
      </div>

      <header className="site-header">
        <a className="logo" href="#">
          <span className="logo-symbol"><HeartPulse size={27} /></span>
          <span className="logo-copy">
            <strong>OPD<span>Care</span></strong>
            <small>SMARTER HEALTH. BETTER CARE.</small>
          </span>
        </a>

        <nav className="main-nav">
          <a href="#home">Home</a>
          <a href="#departments">Departments</a>
          <a href="#hospitals">Hospitals</a>
          <a href="#why-opdcare">Why OPDCare</a>
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={() => setAdminOpen(true)}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              border: "1px solid #dce6ef", borderRadius: "999px",
              padding: "11px 16px", background: "#ffffff",
              color: "#17324d", fontWeight: 700, cursor: "pointer",
            }}
          >
            <Users size={16} /> Admin
          </button>
          <a className="header-cta" href="#hospitals">
            Find a Hospital <ArrowRight size={16} />
          </a>
        </div>
      </header>

      <main>
        <section className="hero-section" id="home">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-dot" />
              A BETTER WAY TO ACCESS HEALTHCARE
            </div>
            <h1>Your health deserves<br /><span>time, not waiting.</span></h1>
            <p>
              Find the right hospital, choose your department,
              book your OPD token and follow your queue —
              all in one simple place.
            </p>
            <div className="hero-actions">
              <a className="button-primary" href="#hospitals">
                Find your hospital <ArrowRight size={17} />
              </a>
              <a className="button-secondary" href="#how-it-works">
                How it works <ArrowUpRight size={16} />
              </a>
            </div>
            <div className="hero-trust">
              <div className="trust-icon"><ShieldCheck size={19} /></div>
              <div>
                <strong>Care, made more convenient</strong>
                <span>Simple booking · Clear queue updates</span>
              </div>
            </div>
          </div>

          <div className="hero-photo">
            <div className="hero-photo-overlay" />
            <div className="photo-caption">
              <span className="photo-caption-icon"><HeartPulse size={19} /></span>
              <div>
                <strong>Healthcare, with you in mind.</strong>
                <span>A calmer way to plan your hospital visit.</span>
              </div>
            </div>
            <div className="photo-floating-card">
              <span className="floating-card-icon"><Clock3 size={20} /></span>
              <div>
                <small>YOUR OPD VISIT</small>
                <strong>Know your queue.</strong>
                <span>Stay informed as you wait.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="quick-benefits">
          <div className="benefit-item">
            <span className="benefit-icon"><CalendarDays size={21} /></span>
            <div><strong>Easy registration</strong><small>Book your OPD token online</small></div>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon"><Activity size={21} /></span>
            <div><strong>Live queue updates</strong><small>Follow your queue position</small></div>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon"><Stethoscope size={21} /></span>
            <div><strong>Multiple departments</strong><small>Explore available specialties</small></div>
          </div>
        </section>

        <section className="department-section section-wrap" id="departments">
          <div className="section-heading">
            <div>
              <span className="section-kicker">CARE FOR EVERY NEED</span>
              <h2>Explore our departments</h2>
              <p>Choose a specialty and find the right care for you.</p>
            </div>
            <a href="#hospitals" className="text-link">
              Explore hospitals <ArrowRight size={15} />
            </a>
          </div>
          <div className="department-grid">
            {allDepartments.length > 0 ? (
              allDepartments.map((department) => {
                const style = getDepartmentStyle(department);
                return (
                  <button
                    className={`department-card ${style.color}`}
                    key={department}
                    onClick={() => {
                      document.getElementById("hospitals")?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    <span className="department-symbol">{style.icon}</span>
                    <strong>{department}</strong>
                    <span className="department-arrow"><ArrowUpRight size={15} /></span>
                  </button>
                );
              })
            ) : (
              <p className="muted-message">Departments will appear here once hospitals are loaded.</p>
            )}
          </div>
        </section>

        <section className="hospital-feature">
          <div className="hospital-feature-photo">
            <div className="building-label">
              <span className="building-label-dot" />
              CARE STARTS HERE
            </div>
          </div>
          <div className="hospital-feature-copy">
            <span className="section-kicker">A MORE ORGANIZED VISIT</span>
            <h2>Good care begins before you reach the doctor.</h2>
            <p>
              OPDCare brings hospital discovery, OPD registration
              and queue information together, helping make every
              visit a little easier to plan.
            </p>
            <a className="button-primary" href="#hospitals">
              Get started <ArrowRight size={16} />
            </a>
          </div>
          <div className="feature-stats">
            <div><strong>{hospitals.length.toString().padStart(2, "0")}</strong><span>Hospitals listed</span></div>
            <div><strong>{allDepartments.length.toString().padStart(2, "0")}</strong><span>Departments</span></div>
            <div><strong>24/7</strong><span>Online access</span></div>
            <div><strong>Live</strong><span>Queue updates</span></div>
          </div>
        </section>

        <section className="hospital-section section-wrap" id="hospitals">
          <div className="section-heading hospital-heading">
            <div>
              <span className="section-kicker">FIND YOUR CARE</span>
              <h2>Hospitals near your needs</h2>
              <p>Explore hospitals and choose where you'd like to book your OPD visit.</p>
            </div>
            <div className="hospital-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search hospitals..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          {loading && <p className="state-message">Loading hospitals...</p>}
          {error && <p className="state-message error-message">{error}</p>}

          {!loading && !error && (
            <div className="hospital-grid">
              {filteredHospitals.map((hospital, index) => (
                <article className="hospital-card" key={hospital._id}>
                  <div className={`hospital-card-visual hospital-visual-${index % 3}`}>
                    <span className="hospital-card-tag"><Activity size={13} /> OPD AVAILABLE</span>
                    <span className="hospital-card-mark"><HeartPulse size={35} /></span>
                  </div>
                  <div className="hospital-card-body">
                    <span className="hospital-location">
                      <MapPin size={14} /> {hospital.location || "Location not provided"}
                    </span>
                    <h3>{hospital.name}</h3>
                    <p>{hospital.departments?.length || 0} departments available for consultation</p>
                    <div className="hospital-card-bottom">
                      <span><Clock3 size={15} /> Queue after registration</span>
                      <button onClick={() => openRegistration(hospital)}>
                        Book OPD <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
              {filteredHospitals.length === 0 && (
                <p className="state-message">
                  {hospitals.length === 0 ? "No hospitals are available yet." : "No hospitals match your search."}
                </p>
              )}
            </div>
          )}
        </section>

        <section className="how-section section-wrap" id="how-it-works">
          <div className="section-heading centered-heading">
            <div>
              <span className="section-kicker">THREE SIMPLE STEPS</span>
              <h2>Your visit, made easier</h2>
              <p>From choosing a hospital to checking your queue, it all happens here.</p>
            </div>
          </div>
          <div className="steps-grid">
            <article className="step-card">
              <span className="step-number">01</span>
              <span className="step-icon"><Search size={22} /></span>
              <h3>Find your hospital</h3>
              <p>Explore hospitals and select the department you need.</p>
            </article>
            <article className="step-card">
              <span className="step-number">02</span>
              <span className="step-icon"><CalendarDays size={22} /></span>
              <h3>Get your token</h3>
              <p>Enter your details and receive your OPD token number.</p>
            </article>
            <article className="step-card">
              <span className="step-number">03</span>
              <span className="step-icon"><Activity size={22} /></span>
              <h3>Follow your queue</h3>
              <p>See your queue position and status with live updates.</p>
            </article>
          </div>
        </section>

        <section className="why-section" id="why-opdcare">
          <div className="why-inner">
            <div>
              <span className="section-kicker">THE OPDCARE DIFFERENCE</span>
              <h2>A little less waiting.<br />A little more peace of mind.</h2>
            </div>
            <div className="why-points">
              <div><CheckCircle2 size={19} /><span><strong>Simple to use</strong><small>Clear steps from start to finish.</small></span></div>
              <div><CheckCircle2 size={19} /><span><strong>Information in one place</strong><small>Hospital, department and token details.</small></span></div>
              <div><CheckCircle2 size={19} /><span><strong>Queue visibility</strong><small>Follow your position without repeated checking at the counter.</small></span></div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <a className="logo footer-logo" href="#">
          <span className="logo-symbol"><HeartPulse size={24} /></span>
          <span className="logo-copy">
            <strong>OPD<span>Care</span></strong>
            <small>SMARTER HEALTH. BETTER CARE.</small>
          </span>
        </a>
        <p>Making hospital visits easier, one step at a time.</p>
        <span className="footer-note">Smart OPD Queue Management System · Academic project demonstration</span>
      </footer>

      {/* ADMIN DASHBOARD */}
      {adminOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Admin Dashboard"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setAdminOpen(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            background: "rgba(10, 27, 43, 0.68)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "18px",
          }}
        >
          <div style={{
            width: "min(1050px, 100%)",
            maxHeight: "90vh",
            overflowY: "auto",
            background: "#f6f9fc",
            borderRadius: "20px",
            padding: "clamp(18px, 4vw, 32px)",
            color: "#17324d",
            boxShadow: "0 24px 80px rgba(0,0,0,.25)",
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}>
              <div>
                <span style={{ color: "#258a83", fontSize: "12px", fontWeight: 800, letterSpacing: "1.5px" }}>
                  OPDCARE MANAGEMENT
                </span>
                <h2 style={{ margin: "6px 0 4px", fontSize: "clamp(24px, 4vw, 32px)" }}>
                  Admin Dashboard
                </h2>
                <p style={{ margin: 0, color: "#64778a" }}>
                  Overview of registered OPD patients
                </p>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={fetchAdminPatients}
                  disabled={adminLoading}
                  style={{
                    border: 0, borderRadius: "10px", padding: "10px 14px",
                    background: "#dff2ef", color: "#176b65",
                    fontWeight: 700, cursor: "pointer",
                  }}
                >
                  {adminLoading ? "Refreshing..." : "↻ Refresh"}
                </button>
                <button
                  type="button"
                  onClick={() => setAdminOpen(false)}
                  aria-label="Close admin dashboard"
                  style={{
                    border: 0, borderRadius: "10px", padding: "10px 13px",
                    background: "#e8eef4", color: "#17324d",
                    fontSize: "18px", cursor: "pointer",
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "12px",
              margin: "24px 0",
            }}>
              <div style={{ background: "#fff", border: "1px solid #e3ebf2", borderRadius: "14px", padding: "18px" }}>
                <div style={{ color: "#718398", fontSize: "13px" }}>Total patients</div>
                <strong style={{ display: "block", fontSize: "30px", marginTop: "6px" }}>
                  {adminPatients.length}
                </strong>
              </div>
              <div style={{ background: "#fff", border: "1px solid #e3ebf2", borderRadius: "14px", padding: "18px" }}>
                <div style={{ color: "#718398", fontSize: "13px" }}>Waiting</div>
                <strong style={{ display: "block", fontSize: "30px", marginTop: "6px", color: "#bd7b22" }}>
                  {adminPatients.filter((p) => (p.status || "").toLowerCase() === "waiting").length}
                </strong>
              </div>
              <div style={{ background: "#fff", border: "1px solid #e3ebf2", borderRadius: "14px", padding: "18px" }}>
                <div style={{ color: "#718398", fontSize: "13px" }}>In consultation</div>
                <strong style={{ display: "block", fontSize: "30px", marginTop: "6px", color: "#258a83" }}>
                  {adminPatients.filter((p) => (p.status || "").toLowerCase() === "in consultation").length}
                </strong>
              </div>
            </div>

            <div style={{ background: "#fff", border: "1px solid #e3ebf2", borderRadius: "14px", overflow: "hidden" }}>
              <div style={{ padding: "16px 18px", borderBottom: "1px solid #e8eef4", fontWeight: 800 }}>
                Registered patients
              </div>

              {adminLoading && <p style={{ padding: "18px", color: "#64778a" }}>Loading patient records...</p>}
              {adminError && <p style={{ padding: "18px", color: "#b42318" }}>{adminError}</p>}
              {!adminLoading && !adminError && adminPatients.length === 0 && (
                <p style={{ padding: "18px", color: "#64778a" }}>No patients registered yet.</p>
              )}

              {!adminLoading && !adminError && adminPatients.length > 0 && (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "680px", textAlign: "left" }}>
                    <thead>
                      <tr style={{ background: "#f4f7fa", color: "#64778a", fontSize: "12px", textTransform: "uppercase" }}>
                        <th style={{ padding: "13px 16px" }}>Token</th>
                        <th style={{ padding: "13px 16px" }}>Patient</th>
                        <th style={{ padding: "13px 16px" }}>Hospital</th>
                        <th style={{ padding: "13px 16px" }}>Department</th>
                        <th style={{ padding: "13px 16px" }}>Position</th>
                        <th style={{ padding: "13px 16px" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminPatients.map((patient) => (
                        <tr key={patient._id} style={{ borderTop: "1px solid #edf1f5" }}>
                          <td style={{ padding: "14px 16px", fontWeight: 800 }}>
                            {patient.tokenNumber || "—"}
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <strong>{patient.name || "—"}</strong>
                            <div style={{ color: "#8190a0", fontSize: "12px" }}>
                              Age: {patient.age ?? "—"}
                            </div>
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            {patient.hospitalId?.name || "—"}
                          </td>
                          <td style={{ padding: "14px 16px" }}>{patient.department || "—"}</td>
                          <td style={{ padding: "14px 16px" }}>#{patient.queuePosition ?? "—"}</td>
                          <td style={{ padding: "14px 16px" }}>
                            <select
                              value={patient.status || "Waiting"}
                              onChange={(event) => updatePatientStatus(patient._id, event.target.value)}
                              style={{
                                border: "1px solid #dce6ef",
                                borderRadius: "8px",
                                padding: "8px",
                                background: "#fff",
                                color: "#17324d",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              <option value="Waiting">Waiting</option>
                              <option value="In Consultation">In Consultation</option>
                              <option value="Completed">Completed</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <p style={{ color: "#8190a0", fontSize: "12px", margin: "14px 2px 0" }}>
              Demo note: patient status can be updated here. This academic demo does not yet include admin login or access protection.
            </p>
          </div>
        </div>
      )}

      {/* PATIENT REGISTRATION */}
      {selectedHospital && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeRegistration();
          }}
        >
          <div className="booking-modal">
            <button className="modal-close" onClick={closeRegistration} aria-label="Close">
              <X size={20} />
            </button>

            {!tokenResult ? (
              <>
                <div className="modal-heading-icon"><HeartPulse size={25} /></div>
                <span className="section-kicker">PATIENT CHECK-IN</span>
                <h2>Book your OPD visit</h2>
                <p className="modal-subtitle">{selectedHospital.name}</p>

                <form onSubmit={registerPatient} className="booking-form">
                  <label>Patient full name</label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    required
                  />

                  <div className="form-two-col">
                    <div>
                      <label>Age</label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        placeholder="Your age"
                        value={patientAge}
                        onChange={(e) => setPatientAge(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label>Mobile number</label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]{10}"
                        maxLength="10"
                        placeholder="10-digit number"
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        required
                      />
                    </div>
                  </div>

                  <label>Select department</label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    required
                  >
                    {selectedHospital.departments?.map((department) => (
                      <option key={department} value={department}>{department}</option>
                    ))}
                  </select>

                  {registrationError && <p className="form-error">{registrationError}</p>}

                  <button className="button-primary submit-button" type="submit" disabled={registering}>
                    {registering ? "Registering..." : "Confirm registration"}
                    {!registering && <ArrowRight size={17} />}
                  </button>
                </form>
                <p className="modal-footnote">
                  <ShieldCheck size={14} /> Your details are used for this OPD registration.
                </p>
              </>
            ) : (
              <div className="success-content">
                <div className="success-icon"><CheckCircle2 size={34} /></div>
                <span className="section-kicker">REGISTRATION SUCCESSFUL</span>
                <h2>You're in the queue!</h2>
                <p className="modal-subtitle">Keep this token number for your visit.</p>

                <div className="token-ticket">
                  <span>YOUR OPD TOKEN</span>
                  <strong>{tokenResult.tokenNumber || tokenResult.token || "Issued"}</strong>
                  <div className="ticket-details">
                    <span>Patient<strong>{tokenResult.name || patientName}</strong></span>
                    <span>Department<strong>{tokenResult.department || selectedDepartment}</strong></span>
                    <span>Queue position<strong>#{tokenResult.queuePosition ?? "—"}</strong></span>
                    <span>Status<strong>{tokenResult.status || "Waiting"}</strong></span>
                  </div>
                </div>

                {queueError && <p className="form-error">{queueError}</p>}

                <div className="queue-panel">
                  <div className="queue-panel-heading">
                    <div><span className="live-indicator" /> LIVE QUEUE</div>
                    <button onClick={fetchQueue} disabled={queueLoading}>
                      {queueLoading ? "Updating..." : "Refresh"}
                    </button>
                  </div>
                  {!queueVisible && <p className="queue-empty">Loading your queue...</p>}
                  {queueVisible && queuePatients.length === 0 && (
                    <p className="queue-empty">No patients currently waiting.</p>
                  )}
                  {queuePatients.map((patient) => (
                    <div className="queue-row" key={patient._id}>
                      <div><strong>{patient.tokenNumber}</strong><span>{patient.name}</span></div>
                      <div><strong>#{patient.queuePosition}</strong><span>{patient.status}</span></div>
                    </div>
                  ))}
                  <small className="queue-refresh-note">
                    Queue refreshes automatically every 5 seconds.
                  </small>
                </div>

                <button className="button-primary submit-button" onClick={closeRegistration}>
                  Done <ArrowRight size={17} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
