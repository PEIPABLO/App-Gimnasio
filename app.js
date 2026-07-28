const {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback
} = React;

/* ============================================================
   Almacenamiento persistente (localStorage del dispositivo)
   ============================================================ */
const store = {
  async get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw != null ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  async set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error("storage set error", e);
    }
  }
};
const K = {
  routines: "gymRoutines",
  workouts: "gymWorkouts",
  schedule: "gymSchedule",
  body: "gymBody"
};

/* ============================================================
   Utilidades
   ============================================================ */
const uid = () => typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
const pad = n => String(n).padStart(2, "0");
const dateKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayKey = () => dateKey(new Date());
const parseKey = k => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const MESES_C = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const DIAS = ["L", "M", "X", "J", "V", "S", "D"];
const DIAS_L = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const fmtFecha = k => {
  const d = parseKey(k);
  return `${DIAS_L[(d.getDay() + 6) % 7]} ${d.getDate()} ${MESES_C[d.getMonth()]}`;
};
const mmss = s => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
const restLabel = s => s >= 60 ? `${(s / 60).toFixed(s % 60 ? 1 : 0)} min` : `${s}s`;

/* Paleta por rutina para poder distinguir de un vistazo en el calendario */
const PALETTE = [{
  key: "amber",
  dot: "bg-amber-400",
  chip: "bg-amber-400/20 text-amber-300 border-amber-400/30",
  solid: "bg-amber-400",
  ring: "text-amber-400"
}, {
  key: "sky",
  dot: "bg-sky-400",
  chip: "bg-sky-400/20 text-sky-300 border-sky-400/30",
  solid: "bg-sky-400",
  ring: "text-sky-400"
}, {
  key: "violet",
  dot: "bg-violet-400",
  chip: "bg-violet-400/20 text-violet-300 border-violet-400/30",
  solid: "bg-violet-400",
  ring: "text-violet-400"
}, {
  key: "emerald",
  dot: "bg-emerald-400",
  chip: "bg-emerald-400/20 text-emerald-300 border-emerald-400/30",
  solid: "bg-emerald-400",
  ring: "text-emerald-400"
}, {
  key: "rose",
  dot: "bg-rose-400",
  chip: "bg-rose-400/20 text-rose-300 border-rose-400/30",
  solid: "bg-rose-400",
  ring: "text-rose-400"
}, {
  key: "teal",
  dot: "bg-teal-400",
  chip: "bg-teal-400/20 text-teal-300 border-teal-400/30",
  solid: "bg-teal-400",
  ring: "text-teal-400"
}, {
  key: "indigo",
  dot: "bg-indigo-400",
  chip: "bg-indigo-400/20 text-indigo-300 border-indigo-400/30",
  solid: "bg-indigo-400",
  ring: "text-indigo-400"
}, {
  key: "orange",
  dot: "bg-orange-400",
  chip: "bg-orange-400/20 text-orange-300 border-orange-400/30",
  solid: "bg-orange-400",
  ring: "text-orange-400"
}];
const colorFor = (routines, id) => {
  const i = Math.max(0, routines.findIndex(r => r.id === id));
  return PALETTE[i % PALETTE.length];
};

/* ============================================================
   Rutinas por defecto (extraídas del PDF).
   El descanso no venía en la tabla: son valores por defecto editables.
   ============================================================ */
const ex = (muscle, name, notes, label, sets, reps, rir, rest) => ({
  id: uid(),
  muscle,
  name,
  notes: notes || "",
  label: label || "",
  sets,
  reps,
  rir: String(rir),
  rest
});
const DEFAULT_ROUTINES = [{
  id: uid(),
  name: "PUSH I",
  phase: "Pérdida de Grasa",
  exercises: [ex("Cuádriceps", "Sentadilla con barra", "", "TOP SET", 1, "5-6", 2, 180), ex("Cuádriceps", "Sentadilla con barra", "", "BACK OFF", 2, "7-10", 3, 150), ex("Pectoral", "Press banca", "", "TOP SET", 1, "5-6", 2, 180), ex("Pectoral", "Press banca", "", "BACK OFF", 2, "7-10", 3, 150), ex("Deltoides ant.", "Press militar barra sentado 75°", "", "TOP SET", 1, "6-7", 2, 150), ex("Deltoides ant.", "Press militar barra sentado 75°", "", "BACK OFF", 1, "7-10", 2, 120), ex("Deltoides lat.", "Elevaciones laterales de pie", "", "", 3, "8-12", 2, 60), ex("Pectoral", "Pec fly", "", "", 3, "9-12", 1, 75), ex("Aductores", "Aductor en máquina V1", "", "", 2, "10-13", 1, 75), ex("Tríceps", "Extensiones de codo en polea V3", "", "", 3, "9-12", 1, 60)]
}, {
  id: uid(),
  name: "PULL I",
  phase: "Pérdida de Grasa",
  exercises: [ex("Isquios", "Peso muerto convencional", "", "TOP SET", 1, "5-6", 2, 180), ex("Isquios", "Peso muerto convencional", "", "BACK OFF", 2, "7-10", 3, 150), ex("Espalda", "Remo en T", "", "TOP SET", 1, "6-7", 2, 150), ex("Espalda", "Remo en T", "", "BACK OFF", 2, "7-10", 3, 120), ex("Espalda", "Jalón al pecho neutro", "", "TOP SET", 1, "7-8", 2, 150), ex("Espalda", "Jalón al pecho neutro", "", "BACK OFF", 2, "8-11", 2, 120), ex("Bíceps", "Curl con mancuernas sentado", "Sentado en banco Scott al revés con esta técnica", "TOP SET", 1, "7-8", 2, 90), ex("Bíceps", "Curl con mancuernas sentado", "", "BACK OFF", 2, "8-11", 2, 75), ex("Bíceps", "Curl predicador con mancuerna a 1 mano", "Banco lo más vertical posible. Descanso entre lados", "", 3, "9-12", 1, 75), ex("Abdomen", "Crunch en máquina sentado", "", "", 3, "10-13", 1, 60)]
}, {
  id: uid(),
  name: "PUSH II",
  phase: "Pérdida de Grasa",
  exercises: [ex("Pectoral", "Press ligera inclinación en multipower", "Inclinación 30°", "TOP SET", 1, "5-6", 2, 180), ex("Pectoral", "Press ligera inclinación en multipower", "", "BACK OFF", 2, "7-10", 2, 150), ex("Deltoides ant.", "Press militar sentado en multipower", "Inclinación 60°", "TOP SET", 1, "6-7", 2, 150), ex("Deltoides ant.", "Press militar sentado en multipower", "", "BACK OFF", 1, "7-10", 2, 120), ex("Deltoides lat.", "Elevaciones laterales polea baja unilateral", "Descanso entre lados", "", 3, "9-12", 1, 60), ex("Deltoides lat.", "Elevaciones laterales cable altura cadera", "Descanso entre lados", "", 3, "9-12", 1, 60), ex("Pectoral", "Fondos en paralelas para pectoral", "", "TOP SET", 1, "6-7", 2, 150), ex("Pectoral", "Fondos en paralelas para pectoral", "", "BACK OFF", 1, "7-10", 2, 120), ex("Cuádriceps", "Leg extensions", "Última serie rest-pause", "", 3, "7-10", 1, 75), ex("Tríceps", "Extensiones Katana", "Polea altura cadera. Descanso entre lados", "", 2, "9-12", 1, 60), ex("Tríceps", "Press francés con mancuernas tumbado", "", "", 3, "9-12", 2, 75)]
}, {
  id: uid(),
  name: "PULL II",
  phase: "Pérdida de Grasa",
  exercises: [ex("Abdomen", "Crunch en polea alta", "", "", 3, "9-12", 1, 60), ex("Deltoides post.", "Contractora invertida", "", "", 3, "9-12", 1, 60), ex("Espalda", "Jalón al pecho foco espalda alta", "", "TOP SET", 1, "6-7", 2, 150), ex("Espalda", "Jalón al pecho foco espalda alta", "", "BACK OFF", 2, "7-10", 2, 120), ex("Cuádriceps", "Prensa 45°", "", "TOP SET", 1, "6-7", 2, 180), ex("Cuádriceps", "Prensa 45°", "", "BACK OFF", 1, "7-10", 2, 150), ex("Isquios", "Peso muerto piernas rígidas (SLDL)", "", "TOP SET", 1, "6-7", 2, 150), ex("Isquios", "Peso muerto piernas rígidas (SLDL)", "", "BACK OFF", 1, "7-10", 2, 120), ex("Espalda", "Pull over en polea alta unilateral", "Descanso entre lados", "", 3, "9-12", 2, 75), ex("Bíceps", "Curl bayesian unilateral de pie", "Polea a la altura de la cadera. Descanso entre lados", "", 2, "9-12", 1, 75), ex("Aductores", "Aductor en máquina V1", "", "", 2, "9-12", 1, 75), ex("Isquios", "Leg curl sentado", "", "", 3, "7-10", 1, 75)]
}];
const BODY_FIELDS = [{
  key: "peso",
  label: "Peso",
  unit: "kg"
}, {
  key: "cuello",
  label: "Cuello",
  unit: "cm"
}, {
  key: "hombros",
  label: "Hombros",
  unit: "cm"
}, {
  key: "pecho",
  label: "Pecho",
  unit: "cm"
}, {
  key: "brazo",
  label: "Brazo",
  unit: "cm"
}, {
  key: "cintura",
  label: "Cintura",
  unit: "cm"
}, {
  key: "cadera",
  label: "Cadera",
  unit: "cm"
}, {
  key: "muslo",
  label: "Muslo",
  unit: "cm"
}, {
  key: "gemelo",
  label: "Gemelo",
  unit: "cm"
}];

/* ============================================================
   Sonido + vibración al terminar el descanso
   ============================================================ */
let _audioCtx = null;
function getCtx() {
  try {
    if (!_audioCtx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      _audioCtx = new C();
    }
    if (_audioCtx.state === "suspended") _audioCtx.resume();
    return _audioCtx;
  } catch {
    return null;
  }
}
function unlockAudio() {
  getCtx();
}
function ping() {
  try {
    const ctx = getCtx();
    if (!ctx) throw new Error("no audio");
    [0, 0.22].forEach(t => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = "sine";
      o.frequency.value = 880;
      const s = ctx.currentTime + t;
      g.gain.setValueAtTime(0.0001, s);
      g.gain.exponentialRampToValueAtTime(0.35, s + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, s + 0.18);
      o.start(s);
      o.stop(s + 0.2);
    });
  } catch {}
  try {
    navigator.vibrate && navigator.vibrate([220, 90, 220]);
  } catch {}
}

/* ============================================================
   Átomos de interfaz
   ============================================================ */
function Stepper({
  value,
  onChange,
  step = 1,
  min = -Infinity,
  placeholder,
  suffix
}) {
  const num = value === "" || value == null ? "" : Number(value);
  const set = v => {
    if (v === "") return onChange("");
    const n = Math.round((Number(v) + Number.EPSILON) * 100) / 100;
    onChange(String(Math.max(min, n)));
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "flex-1 min-w-0 flex items-stretch rounded-lg bg-zinc-950 border border-zinc-800 overflow-hidden"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => set((num === "" ? 0 : num) - step),
    className: "w-8 shrink-0 text-xl text-zinc-400 active:bg-zinc-800 select-none",
    "aria-label": "menos"
  }, "−"), /*#__PURE__*/React.createElement("input", {
    inputMode: "decimal",
    value: value,
    placeholder: placeholder,
    onChange: e => onChange(e.target.value.replace(",", ".")),
    className: "w-full min-w-0 bg-transparent text-center text-base font-mono tabular-nums text-zinc-50 py-2.5 outline-none placeholder:text-zinc-600"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => set((num === "" ? 0 : num) + step),
    className: "w-8 shrink-0 text-xl text-zinc-400 active:bg-zinc-800 select-none",
    "aria-label": "más"
  }, "+"));
}
function Modal({
  open,
  onClose,
  title,
  children
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 flex items-end sm:items-center justify-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 bg-black/70",
    onClick: onClose
  }), /*#__PURE__*/React.createElement("div", {
    className: "relative w-full sm:max-w-md max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-zinc-900 border-t sm:border border-zinc-800 p-5 pb-8"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-4"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-lg font-semibold text-zinc-50"
  }, title), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    className: "text-zinc-500 text-2xl leading-none px-2 -mr-1"
  }, "×")), children));
}

/* ============================================================
   App
   ============================================================ */
function GymApp() {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("entrenar");
  const [routines, setRoutines] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [schedule, setSchedule] = useState({}); // { 'YYYY-MM-DD': [routineId,...] }
  const [body, setBody] = useState([]);
  const [active, setActive] = useState(null); // entrenamiento en curso
  const [toast, setToast] = useState("");
  useEffect(() => {
    (async () => {
      const [r, w, s, b] = await Promise.all([store.get(K.routines, null), store.get(K.workouts, []), store.get(K.schedule, {}), store.get(K.body, [])]);
      if (r && r.length) setRoutines(r);else {
        setRoutines(DEFAULT_ROUTINES);
        store.set(K.routines, DEFAULT_ROUTINES);
      }
      setWorkouts(w || []);
      setSchedule(s || {});
      setBody(b || []);
      setLoading(false);
    })();
  }, []);
  const flash = useCallback(m => {
    setToast(m);
    setTimeout(() => setToast(""), 2200);
  }, []);
  const saveRoutines = next => {
    setRoutines(next);
    store.set(K.routines, next);
  };
  const saveWorkouts = next => {
    setWorkouts(next);
    store.set(K.workouts, next);
  };
  const saveSchedule = next => {
    setSchedule(next);
    store.set(K.schedule, next);
  };
  const saveBody = next => {
    setBody(next);
    store.set(K.body, next);
  };
  const finishWorkout = wk => {
    const clean = {
      ...wk,
      finishedAt: Date.now(),
      exercises: wk.exercises.map(e => ({
        ...e,
        sets: e.sets.filter(s => s.done || s.weight !== "" || s.reps !== "")
      })).filter(e => e.sets.length > 0)
    };
    if (clean.exercises.length === 0) {
      setActive(null);
      flash("Entrenamiento descartado (sin series)");
      return;
    }
    const next = [clean, ...workouts];
    saveWorkouts(next);
    setActive(null);
    setTab("calendario");
    flash("Entrenamiento guardado ✓");
  };
  if (loading) {
    return /*#__PURE__*/React.createElement("div", {
      className: "min-h-screen bg-zinc-950 flex items-center justify-center"
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-zinc-600 font-mono text-sm animate-pulse"
    }, "cargando…"));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-screen bg-zinc-950 text-zinc-100",
    style: {
      fontFamily: "ui-sans-serif, system-ui, sans-serif"
    }
  }, /*#__PURE__*/React.createElement("style", null, `
        .text-\\[7px\\]{font-size:7px;line-height:1.1}
        .text-\\[8px\\]{font-size:8px;line-height:1.1}
        .text-\\[9px\\]{font-size:9px;line-height:1.15}
        .text-\\[10px\\]{font-size:10px;line-height:1.3}
        .text-\\[11px\\]{font-size:11px;line-height:1.35}
        .tracking-\\[0\\.3em\\]{letter-spacing:0.3em}
        .max-h-\\[88vh\\]{max-height:88vh}
        input[type=date]{color-scheme:dark}
        ::-webkit-scrollbar{width:0;height:0}
      `), /*#__PURE__*/React.createElement("div", {
    className: "max-w-md mx-auto min-h-screen flex flex-col relative overflow-x-hidden"
  }, active ? /*#__PURE__*/React.createElement(Workout, {
    active: active,
    setActive: setActive,
    routines: routines,
    onFinish: finishWorkout
  }) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("main", {
    className: "flex-1 pb-24"
  }, tab === "entrenar" && /*#__PURE__*/React.createElement(Home, {
    routines: routines,
    workouts: workouts,
    schedule: schedule,
    onStart: routine => setActive(newWorkout(routine, workouts)),
    goTo: setTab
  }), tab === "calendario" && /*#__PURE__*/React.createElement(CalendarView, {
    routines: routines,
    workouts: workouts,
    schedule: schedule,
    onStart: routine => setActive(newWorkout(routine, workouts)),
    onDelete: id => saveWorkouts(workouts.filter(w => w.id !== id)),
    onUnschedule: (k, rid) => {
      const arr = (schedule[k] || []).filter(x => x !== rid);
      const n = {
        ...schedule
      };
      if (arr.length) n[k] = arr;else delete n[k];
      saveSchedule(n);
    }
  }), tab === "rutinas" && /*#__PURE__*/React.createElement(Routines, {
    routines: routines,
    save: saveRoutines,
    schedule: schedule,
    saveSchedule: saveSchedule,
    flash: flash
  }), tab === "cuerpo" && /*#__PURE__*/React.createElement(Body, {
    body: body,
    save: saveBody,
    flash: flash
  })), /*#__PURE__*/React.createElement(TabBar, {
    tab: tab,
    setTab: setTab
  })), toast && /*#__PURE__*/React.createElement("div", {
    className: "fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-zinc-100 text-zinc-900 text-sm font-medium px-4 py-2.5 rounded-full shadow-lg"
  }, toast)));
}

/* Construye un entrenamiento en curso a partir de una rutina, precargando
   pesos/reps del último entrenamiento del mismo ejercicio. */
function newWorkout(routine, workouts) {
  const lastFor = (name, label) => {
    for (const w of workouts) {
      const m = w.exercises.find(e => e.name === name && (e.label || "") === (label || ""));
      if (m) return m.sets;
    }
    return null;
  };
  return {
    id: uid(),
    date: todayKey(),
    startedAt: Date.now(),
    finishedAt: null,
    routineId: routine.id,
    routineName: routine.name,
    exercises: routine.exercises.map(e => {
      const prev = lastFor(e.name, e.label);
      return {
        ...e,
        key: uid(),
        sets: Array.from({
          length: e.sets
        }, (_, i) => {
          const p = prev && prev[i];
          return {
            weight: p ? p.weight : "",
            reps: "",
            rir: "",
            done: false
          };
        })
      };
    })
  };
}

/* ============================================================
   Navegación inferior
   ============================================================ */
function TabBar({
  tab,
  setTab
}) {
  const items = [{
    id: "entrenar",
    label: "Entrenar",
    icon: "M6 3v18M18 3v18M6 8h12M6 16h12M3 8v8M21 8v8"
  }, {
    id: "calendario",
    label: "Calendario",
    icon: "M3 5h18v16H3zM3 9h18M8 3v4M16 3v4"
  }, {
    id: "rutinas",
    label: "Rutinas",
    icon: "M4 6h16M4 12h16M4 18h10"
  }, {
    id: "cuerpo",
    label: "Cuerpo",
    icon: "M12 3v18M5 8l7-3 7 3M5 8v5a7 7 0 0014 0V8"
  }];
  return /*#__PURE__*/React.createElement("nav", {
    className: "fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-zinc-900/95 backdrop-blur border-t border-zinc-800 z-40"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-4"
  }, items.map(it => {
    const on = tab === it.id;
    return /*#__PURE__*/React.createElement("button", {
      key: it.id,
      onClick: () => setTab(it.id),
      className: `flex flex-col items-center gap-1 py-3 ${on ? "text-amber-400" : "text-zinc-500"}`
    }, /*#__PURE__*/React.createElement("svg", {
      width: "22",
      height: "22",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.8",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: it.icon
    })), /*#__PURE__*/React.createElement("span", {
      className: "text-[10px] font-medium"
    }, it.label));
  })));
}

/* ============================================================
   HOME / Empezar entrenamiento
   ============================================================ */
function Home({
  routines,
  workouts,
  schedule,
  onStart,
  goTo
}) {
  const tk = todayKey();
  const todaysIds = schedule[tk] || [];
  const todays = todaysIds.map(id => routines.find(r => r.id === id)).filter(Boolean);
  const last = workouts[0];
  const [pickAll, setPickAll] = useState(false);
  const hoy = new Date();
  return /*#__PURE__*/React.createElement("div", {
    className: "px-5 pt-8"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs font-mono uppercase tracking-widest text-amber-400/80"
  }, DIAS_L[(hoy.getDay() + 6) % 7], " · ", hoy.getDate(), " ", MESES[hoy.getMonth()]), /*#__PURE__*/React.createElement("h1", {
    className: "text-3xl font-bold mt-1 mb-6"
  }, "A entrenar."), todays.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "mb-6"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs uppercase tracking-wider text-zinc-500 mb-2"
  }, "Programado para hoy"), todays.map(r => {
    const c = colorFor(routines, r.id);
    return /*#__PURE__*/React.createElement("button", {
      key: r.id,
      onClick: () => onStart(r),
      className: "w-full mb-2 text-left rounded-2xl p-4 bg-zinc-900 border border-zinc-800 active:scale-[0.99] transition"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2"
    }, /*#__PURE__*/React.createElement("span", {
      className: `w-2.5 h-2.5 rounded-full ${c.dot}`
    }), /*#__PURE__*/React.createElement("span", {
      className: "text-lg font-semibold"
    }, r.name)), /*#__PURE__*/React.createElement("p", {
      className: "text-xs text-zinc-500 mt-0.5"
    }, r.exercises.length, " ejercicios · ", r.exercises.reduce((a, e) => a + e.sets, 0), " series")), /*#__PURE__*/React.createElement("span", {
      className: "text-sm font-semibold text-amber-400"
    }, "Empezar ▸")));
  })), /*#__PURE__*/React.createElement("div", {
    className: "mb-3 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs uppercase tracking-wider text-zinc-500"
  }, todays.length ? "Otra rutina" : "Elige rutina"), routines.length > 3 && /*#__PURE__*/React.createElement("button", {
    onClick: () => setPickAll(v => !v),
    className: "text-xs text-amber-400"
  }, pickAll ? "Ver menos" : "Ver todas")), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, (pickAll ? routines : routines.slice(0, todays.length ? routines.length : 4)).map(r => {
    const c = colorFor(routines, r.id);
    return /*#__PURE__*/React.createElement("button", {
      key: r.id,
      onClick: () => onStart(r),
      className: "w-full text-left rounded-2xl p-4 bg-zinc-900/60 border border-zinc-800 active:bg-zinc-900 transition flex items-center justify-between"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-3"
    }, /*#__PURE__*/React.createElement("span", {
      className: `w-2.5 h-2.5 rounded-full ${c.dot}`
    }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "font-semibold"
    }, r.name), /*#__PURE__*/React.createElement("div", {
      className: "text-xs text-zinc-500"
    }, r.exercises.length, " ej · ", r.exercises.reduce((a, e) => a + e.sets, 0), " series"))), /*#__PURE__*/React.createElement("span", {
      className: "text-zinc-600"
    }, "▸"));
  })), last && /*#__PURE__*/React.createElement("div", {
    className: "mt-8"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs uppercase tracking-wider text-zinc-500 mb-2"
  }, "Último entrenamiento"), /*#__PURE__*/React.createElement("button", {
    onClick: () => goTo("calendario"),
    className: "w-full text-left rounded-2xl p-4 bg-zinc-900/60 border border-zinc-800"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-semibold"
  }, last.routineName), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-zinc-500"
  }, fmtFecha(last.date))), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-zinc-500 mt-1"
  }, last.exercises.reduce((a, e) => a + e.sets.length, 0), " series registradas"))));
}

/* ============================================================
   ENTRENAMIENTO EN CURSO
   ============================================================ */
function Workout({
  active,
  setActive,
  routines,
  onFinish
}) {
  const [wk, setWk] = useState(active);
  const [elapsed, setElapsed] = useState(Math.floor((Date.now() - active.startedAt) / 1000));
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [rest, setRest] = useState(null); // { left, total }
  const [restRunning, setRestRunning] = useState(true);
  const c = colorFor(routines, wk.routineId) || PALETTE[0];

  // cronómetro de sesión
  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - active.startedAt) / 1000)), 1000);
    return () => clearInterval(t);
  }, [active.startedAt]);

  // temporizador de descanso
  useEffect(() => {
    if (!rest || !restRunning) return;
    if (rest.left <= 0) return;
    const t = setInterval(() => {
      setRest(r => {
        if (!r) return r;
        const left = r.left - 1;
        if (left === 0) ping();
        return {
          ...r,
          left: Math.max(0, left)
        };
      });
    }, 1000);
    return () => clearInterval(t);
  }, [rest, restRunning]);
  const startRest = seconds => {
    setRest({
      left: seconds,
      total: seconds
    });
    setRestRunning(true);
  };
  const updateSet = (exIdx, setIdx, patch) => {
    setWk(w => {
      const ex2 = w.exercises.map((e, i) => {
        if (i !== exIdx) return e;
        const sets = e.sets.map((s, j) => j === setIdx ? {
          ...s,
          ...patch
        } : s);
        return {
          ...e,
          sets
        };
      });
      return {
        ...w,
        exercises: ex2
      };
    });
  };
  const toggleDone = (exIdx, setIdx) => {
    const s = wk.exercises[exIdx].sets[setIdx];
    const willDo = !s.done;
    updateSet(exIdx, setIdx, {
      done: willDo
    });
    if (willDo) startRest(wk.exercises[exIdx].rest || 90);
  };
  const addSet = exIdx => {
    setWk(w => {
      const ex2 = w.exercises.map((e, i) => {
        if (i !== exIdx) return e;
        const last = e.sets[e.sets.length - 1] || {};
        return {
          ...e,
          sets: [...e.sets, {
            weight: last.weight || "",
            reps: "",
            rir: "",
            done: false
          }]
        };
      });
      return {
        ...w,
        exercises: ex2
      };
    });
  };
  const removeSet = (exIdx, setIdx) => {
    setWk(w => {
      const ex2 = w.exercises.map((e, i) => i === exIdx ? {
        ...e,
        sets: e.sets.filter((_, j) => j !== setIdx)
      } : e);
      return {
        ...w,
        exercises: ex2
      };
    });
  };
  const totalSets = wk.exercises.reduce((a, e) => a + e.sets.length, 0);
  const doneSets = wk.exercises.reduce((a, e) => a + e.sets.filter(s => s.done).length, 0);
  return /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col min-h-screen"
  }, /*#__PURE__*/React.createElement("header", {
    className: "sticky top-0 z-30 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 px-4 py-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 min-w-0"
  }, /*#__PURE__*/React.createElement("span", {
    className: `w-2.5 h-2.5 rounded-full ${c.dot} shrink-0`
  }), /*#__PURE__*/React.createElement("span", {
    className: "font-bold truncate"
  }, wk.routineName)), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-mono tabular-nums text-lg text-amber-400"
  }, mmss(elapsed)), /*#__PURE__*/React.createElement("button", {
    onClick: () => setConfirmEnd(true),
    className: "text-xs font-semibold bg-amber-400 text-zinc-950 px-3 py-1.5 rounded-full"
  }, "Terminar"))), /*#__PURE__*/React.createElement("div", {
    className: "mt-2 h-1 rounded-full bg-zinc-800 overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: `h-full ${c.solid} transition-all`,
    style: {
      width: `${totalSets ? doneSets / totalSets * 100 : 0}%`
    }
  })), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-zinc-500 mt-1 font-mono"
  }, doneSets, "/", totalSets, " series")), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 px-3 py-4 space-y-4"
  }, wk.exercises.map((e, exIdx) => /*#__PURE__*/React.createElement(ExerciseCard, {
    key: e.key,
    e: e,
    exIdx: exIdx,
    onSet: updateSet,
    onToggle: toggleDone,
    onAdd: addSet,
    onRemove: removeSet,
    onRest: () => startRest(e.rest || 90),
    accent: c
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => setConfirmEnd(true),
    className: "w-full py-4 rounded-2xl bg-amber-400 text-zinc-950 font-bold text-lg active:scale-[0.99] transition"
  }, "Terminar entrenamiento"), /*#__PURE__*/React.createElement("div", {
    className: "h-8"
  })), rest && /*#__PURE__*/React.createElement(RestOverlay, {
    rest: rest,
    running: restRunning,
    accent: c,
    onToggle: () => setRestRunning(v => !v),
    onAdd: d => setRest(r => ({
      ...r,
      left: Math.max(0, r.left + d),
      total: Math.max(r.total, r.left + d)
    })),
    onSkip: () => setRest(null)
  }), /*#__PURE__*/React.createElement(Modal, {
    open: confirmEnd,
    onClose: () => setConfirmEnd(false),
    title: "¿Terminar entrenamiento?"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-zinc-400 mb-5"
  }, "Se guardarán las ", doneSets, " series completadas en el calendario de hoy."), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-3"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setActive(null);
    },
    className: "flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-300 text-sm"
  }, "Descartar"), /*#__PURE__*/React.createElement("button", {
    onClick: () => onFinish(wk),
    className: "flex-1 py-3 rounded-xl bg-emerald-500 text-zinc-950 font-semibold text-sm"
  }, "Guardar"))));
}
function ExerciseCard({
  e,
  exIdx,
  onSet,
  onToggle,
  onAdd,
  onRemove,
  onRest,
  accent
}) {
  const allDone = e.sets.length > 0 && e.sets.every(s => s.done);
  return /*#__PURE__*/React.createElement("div", {
    className: `rounded-2xl border ${allDone ? "border-emerald-500/40 bg-emerald-500/5" : "border-zinc-800 bg-zinc-900"} p-3`
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-start justify-between gap-3 mb-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "min-w-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 flex-wrap"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] uppercase tracking-wider text-zinc-500"
  }, e.muscle), e.label && /*#__PURE__*/React.createElement("span", {
    className: "text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300"
  }, e.label)), /*#__PURE__*/React.createElement("h3", {
    className: "font-semibold leading-tight mt-0.5"
  }, e.name)), /*#__PURE__*/React.createElement("button", {
    onClick: onRest,
    className: "shrink-0 flex items-center gap-1 text-[11px] text-zinc-400 border border-zinc-700 rounded-full px-2.5 py-1"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "13",
    r: "8"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 9v4l2 2M9 2h6",
    strokeLinecap: "round"
  })), restLabel(e.rest || 90))), e.notes && /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-amber-300/70 italic mb-2"
  }, e.notes), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-zinc-500 mb-3 font-mono"
  }, "Objetivo · ", e.reps, " reps · RIR ", e.rir), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5 px-0.5 text-[10px] uppercase tracking-wider text-zinc-600"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-5 shrink-0"
  }), /*#__PURE__*/React.createElement("span", {
    className: "flex-1 text-center"
  }, "Peso"), /*#__PURE__*/React.createElement("span", {
    className: "flex-1 text-center"
  }, "Reps"), /*#__PURE__*/React.createElement("span", {
    className: "w-9 shrink-0 text-center"
  }, "RIR"), /*#__PURE__*/React.createElement("span", {
    className: "w-9 shrink-0"
  })), e.sets.map((s, setIdx) => /*#__PURE__*/React.createElement(SetRow, {
    key: setIdx,
    s: s,
    n: setIdx + 1,
    onWeight: v => onSet(exIdx, setIdx, {
      weight: v
    }),
    onReps: v => onSet(exIdx, setIdx, {
      reps: v
    }),
    onRir: v => onSet(exIdx, setIdx, {
      rir: v
    }),
    onToggle: () => onToggle(exIdx, setIdx),
    onRemove: () => onRemove(exIdx, setIdx)
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: () => onAdd(exIdx),
    className: "mt-3 text-xs text-zinc-400 border border-dashed border-zinc-700 rounded-lg w-full py-2"
  }, "+ añadir serie"));
}
const RIR_OPTS = ["0", "1", "2", "3", "4", "F"];
function SetRow({
  s,
  n,
  onWeight,
  onReps,
  onRir,
  onToggle,
  onRemove
}) {
  const [showRir, setShowRir] = useState(false);
  return /*#__PURE__*/React.createElement("div", {
    className: `rounded-xl p-1.5 ${s.done ? "bg-emerald-500/10" : "bg-zinc-950/40"}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-5 shrink-0 text-center font-mono text-sm text-zinc-500"
  }, n), /*#__PURE__*/React.createElement(Stepper, {
    value: s.weight,
    onChange: onWeight,
    step: 2.5,
    min: 0,
    placeholder: "–"
  }), /*#__PURE__*/React.createElement(Stepper, {
    value: s.reps,
    onChange: onReps,
    step: 1,
    min: 0,
    placeholder: "–"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowRir(v => !v),
    className: "w-9 h-11 shrink-0 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-sm text-zinc-200"
  }, s.rir === "" ? "·" : s.rir), /*#__PURE__*/React.createElement("button", {
    onClick: onToggle,
    className: `w-9 h-11 shrink-0 rounded-lg flex items-center justify-center ${s.done ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-500"}`
  }, /*#__PURE__*/React.createElement("svg", {
    width: "17",
    height: "17",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "3",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M5 12l5 5L20 6"
  })))), showRir && /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5 mt-2 pl-6"
  }, RIR_OPTS.map(o => /*#__PURE__*/React.createElement("button", {
    key: o,
    onClick: () => {
      onRir(o);
      setShowRir(false);
    },
    className: `flex-1 py-1.5 rounded-lg text-xs font-mono ${s.rir === o ? "bg-amber-400 text-zinc-950" : "bg-zinc-800 text-zinc-300"}`
  }, o)), /*#__PURE__*/React.createElement("button", {
    onClick: onRemove,
    className: "px-2 text-rose-400 text-lg leading-none"
  }, "🗑")));
}
function RestOverlay({
  rest,
  running,
  accent,
  onToggle,
  onAdd,
  onSkip
}) {
  const R = 130,
    STROKE = 12,
    C = 2 * Math.PI * R;
  const pct = rest.total ? rest.left / rest.total : 0;
  const done = rest.left <= 0;
  const ringColor = done ? "text-emerald-400" : rest.left <= 10 ? "text-rose-400" : accent.ring;
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-sm flex flex-col items-center justify-center px-6"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs uppercase tracking-[0.3em] text-zinc-500 mb-8"
  }, done ? "¡A por la siguiente!" : "Descanso"), /*#__PURE__*/React.createElement("div", {
    className: "relative"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "300",
    height: "300",
    viewBox: "0 0 300 300",
    className: "-rotate-90"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "150",
    cy: "150",
    r: R,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: STROKE,
    className: "text-zinc-800"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "150",
    cy: "150",
    r: R,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: STROKE,
    strokeLinecap: "round",
    className: `${ringColor} transition-all duration-1000 ease-linear`,
    strokeDasharray: C,
    strokeDashoffset: C * (1 - pct)
  })), /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 flex flex-col items-center justify-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: `font-mono tabular-nums text-6xl font-bold ${done ? "text-emerald-400" : "text-zinc-50"}`
  }, mmss(rest.left)), !done && /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-zinc-500 font-mono mt-1"
  }, "/ ", mmss(rest.total)))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3 mt-10"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => onAdd(-15),
    className: "w-14 h-14 rounded-full bg-zinc-800 text-zinc-200 font-mono text-sm"
  }, "−15"), /*#__PURE__*/React.createElement("button", {
    onClick: onToggle,
    className: "w-16 h-16 rounded-full bg-zinc-100 text-zinc-950 flex items-center justify-center"
  }, running && !done ? /*#__PURE__*/React.createElement("svg", {
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "currentColor"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "6",
    y: "5",
    width: "4",
    height: "14",
    rx: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "14",
    y: "5",
    width: "4",
    height: "14",
    rx: "1"
  })) : /*#__PURE__*/React.createElement("svg", {
    width: "26",
    height: "26",
    viewBox: "0 0 24 24",
    fill: "currentColor"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M8 5v14l11-7z"
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: () => onAdd(15),
    className: "w-14 h-14 rounded-full bg-zinc-800 text-zinc-200 font-mono text-sm"
  }, "+15")), /*#__PURE__*/React.createElement("button", {
    onClick: onSkip,
    className: "mt-8 text-sm text-zinc-400 border border-zinc-700 rounded-full px-6 py-2.5"
  }, done ? "Cerrar" : "Saltar descanso"));
}

/* ============================================================
   CALENDARIO
   ============================================================ */
function CalendarView({
  routines,
  workouts,
  schedule,
  onStart,
  onDelete,
  onUnschedule
}) {
  const now = new Date();
  const [ym, setYm] = useState({
    y: now.getFullYear(),
    m: now.getMonth()
  });
  const [selected, setSelected] = useState(null);
  const byDate = useMemo(() => {
    const map = {};
    workouts.forEach(w => {
      (map[w.date] = map[w.date] || []).push(w);
    });
    return map;
  }, [workouts]);
  const first = new Date(ym.y, ym.m, 1);
  const startPad = (first.getDay() + 6) % 7; // lunes primero
  const daysInMonth = new Date(ym.y, ym.m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const shift = dir => {
    let m = ym.m + dir,
      y = ym.y;
    if (m < 0) {
      m = 11;
      y--;
    }
    if (m > 11) {
      m = 0;
      y++;
    }
    setYm({
      y,
      m
    });
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "px-4 pt-8"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-5 px-1"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "text-2xl font-bold"
  }, MESES[ym.m], " ", /*#__PURE__*/React.createElement("span", {
    className: "text-zinc-600 font-mono text-lg"
  }, ym.y)), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-1"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => shift(-1),
    className: "w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300"
  }, "‹"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setYm({
        y: now.getFullYear(),
        m: now.getMonth()
      });
    },
    className: "px-3 h-9 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300"
  }, "Hoy"), /*#__PURE__*/React.createElement("button", {
    onClick: () => shift(1),
    className: "w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300"
  }, "›"))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-7 gap-1 mb-1"
  }, DIAS.map((d, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "text-center text-[10px] uppercase text-zinc-600 font-medium py-1"
  }, d))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-7 gap-1"
  }, cells.map((d, i) => {
    if (d == null) return /*#__PURE__*/React.createElement("div", {
      key: i
    });
    const k = dateKey(new Date(ym.y, ym.m, d));
    const done = byDate[k] || [];
    const plan = (schedule[k] || []).map(id => routines.find(r => r.id === id)).filter(Boolean);
    const isToday = k === todayKey();
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      onClick: () => setSelected(k),
      className: `aspect-square rounded-lg p-1 flex flex-col ${isToday ? "border border-amber-400/60" : "border border-transparent"} ${done.length ? "bg-zinc-900" : "bg-zinc-900/40"}`
    }, /*#__PURE__*/React.createElement("span", {
      className: `text-[11px] font-mono self-start ${isToday ? "text-amber-400" : "text-zinc-500"}`
    }, d), /*#__PURE__*/React.createElement("div", {
      className: "flex-1 flex flex-col justify-end gap-0.5 w-full"
    }, done.slice(0, 2).map((w, j) => {
      const c = colorFor(routines, w.routineId);
      return /*#__PURE__*/React.createElement("span", {
        key: j,
        className: `text-[8px] leading-tight font-semibold truncate rounded px-0.5 ${c.chip}`
      }, w.routineName);
    }), done.length === 0 && plan.slice(0, 1).map((r, j) => {
      const c = colorFor(routines, r.id);
      return /*#__PURE__*/React.createElement("span", {
        key: j,
        className: `text-[8px] leading-tight truncate rounded px-0.5 border border-dashed ${c.chip} opacity-70`
      }, r.name);
    }), done.length > 2 && /*#__PURE__*/React.createElement("span", {
      className: "text-[7px] text-zinc-500"
    }, "+", done.length - 2)));
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-x-3 gap-y-1 mt-5 px-1"
  }, routines.map(r => {
    const c = colorFor(routines, r.id);
    return /*#__PURE__*/React.createElement("span", {
      key: r.id,
      className: "flex items-center gap-1.5 text-[10px] text-zinc-400"
    }, /*#__PURE__*/React.createElement("span", {
      className: `w-2 h-2 rounded-full ${c.dot}`
    }), r.name);
  })), /*#__PURE__*/React.createElement(DayDetail, {
    k: selected,
    onClose: () => setSelected(null),
    workouts: selected ? byDate[selected] || [] : [],
    planned: selected ? (schedule[selected] || []).map(id => routines.find(r => r.id === id)).filter(Boolean) : [],
    routines: routines,
    onStart: onStart,
    onDelete: onDelete,
    onUnschedule: rid => onUnschedule(selected, rid)
  }));
}
function DayDetail({
  k,
  onClose,
  workouts,
  planned,
  routines,
  onStart,
  onDelete,
  onUnschedule
}) {
  if (!k) return null;
  return /*#__PURE__*/React.createElement(Modal, {
    open: !!k,
    onClose: onClose,
    title: fmtFecha(k)
  }, planned.length > 0 && workouts.length === 0 && /*#__PURE__*/React.createElement("div", {
    className: "mb-4"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs uppercase tracking-wider text-zinc-500 mb-2"
  }, "Programado"), planned.map(r => /*#__PURE__*/React.createElement("div", {
    key: r.id,
    className: "flex items-center justify-between rounded-xl bg-zinc-950 border border-zinc-800 p-3 mb-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-semibold"
  }, r.name), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      onClose();
      onStart(r);
    },
    className: "text-xs bg-amber-400 text-zinc-950 font-semibold px-3 py-1.5 rounded-full"
  }, "Empezar"), /*#__PURE__*/React.createElement("button", {
    onClick: () => onUnschedule(r.id),
    className: "text-xs text-zinc-500 px-2"
  }, "Quitar"))))), workouts.length === 0 && planned.length === 0 && /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-zinc-500 py-6 text-center"
  }, "Sin entrenamientos este día."), workouts.map(w => {
    const c = colorFor(routines, w.routineId);
    const dur = w.finishedAt ? Math.round((w.finishedAt - w.startedAt) / 60000) : null;
    return /*#__PURE__*/React.createElement("div", {
      key: w.id,
      className: "mb-4 rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between px-4 py-3 border-b border-zinc-800"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2"
    }, /*#__PURE__*/React.createElement("span", {
      className: `w-2.5 h-2.5 rounded-full ${c.dot}`
    }), /*#__PURE__*/React.createElement("span", {
      className: "font-semibold"
    }, w.routineName)), /*#__PURE__*/React.createElement("span", {
      className: "text-xs text-zinc-500 font-mono"
    }, dur != null ? `${dur} min` : "")), /*#__PURE__*/React.createElement("div", {
      className: "px-4 py-3 space-y-3"
    }, w.exercises.map((e, i) => /*#__PURE__*/React.createElement("div", {
      key: i
    }, /*#__PURE__*/React.createElement("p", {
      className: "text-sm font-medium text-zinc-200"
    }, e.name, " ", e.label && /*#__PURE__*/React.createElement("span", {
      className: "text-[10px] text-zinc-500"
    }, "· ", e.label)), /*#__PURE__*/React.createElement("div", {
      className: "flex flex-wrap gap-1.5 mt-1"
    }, e.sets.map((s, j) => /*#__PURE__*/React.createElement("span", {
      key: j,
      className: "text-[11px] font-mono bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 text-zinc-300"
    }, s.weight || "–", /*#__PURE__*/React.createElement("span", {
      className: "text-zinc-600"
    }, "kg"), " × ", s.reps || "–", s.rir !== "" && /*#__PURE__*/React.createElement("span", {
      className: "text-amber-400/70"
    }, " @", s.rir))))))), /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        if (confirm("¿Eliminar este entrenamiento?")) {
          onDelete(w.id);
          onClose();
        }
      },
      className: "w-full py-2.5 text-xs text-rose-400 border-t border-zinc-800"
    }, "Eliminar entrenamiento"));
  }));
}

/* ============================================================
   RUTINAS
   ============================================================ */
function Routines({
  routines,
  save,
  schedule,
  saveSchedule,
  flash
}) {
  const [editing, setEditing] = useState(null); // objeto rutina en edición
  const [schedFor, setSchedFor] = useState(null); // rutina a programar

  const createNew = () => setEditing({
    id: uid(),
    name: "Nueva rutina",
    phase: "",
    exercises: [],
    _new: true
  });
  const commit = routine => {
    const clean = {
      ...routine
    };
    delete clean._new;
    const exists = routines.some(r => r.id === routine.id);
    const next = exists ? routines.map(r => r.id === routine.id ? clean : r) : [...routines, clean];
    save(next);
    setEditing(null);
    flash("Rutina guardada ✓");
  };
  const remove = id => {
    if (confirm("¿Eliminar la rutina?")) {
      save(routines.filter(r => r.id !== id));
    }
  };
  const duplicate = r => {
    const copy = {
      ...r,
      id: uid(),
      name: r.name + " (copia)",
      exercises: r.exercises.map(e => ({
        ...e,
        id: uid()
      }))
    };
    save([...routines, copy]);
    flash("Rutina duplicada");
  };
  if (editing) return /*#__PURE__*/React.createElement(RoutineEditor, {
    routine: editing,
    onSave: commit,
    onCancel: () => setEditing(null)
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "px-5 pt-8"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-6"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "text-2xl font-bold"
  }, "Rutinas"), /*#__PURE__*/React.createElement("button", {
    onClick: createNew,
    className: "text-sm font-semibold bg-amber-400 text-zinc-950 px-4 py-2 rounded-full"
  }, "+ Nueva")), /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, routines.map(r => {
    const c = colorFor(routines, r.id);
    return /*#__PURE__*/React.createElement("div", {
      key: r.id,
      className: "rounded-2xl bg-zinc-900 border border-zinc-800 p-4"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-start justify-between"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2.5 min-w-0"
    }, /*#__PURE__*/React.createElement("span", {
      className: `w-3 h-3 rounded-full ${c.dot} shrink-0`
    }), /*#__PURE__*/React.createElement("div", {
      className: "min-w-0"
    }, /*#__PURE__*/React.createElement("h3", {
      className: "font-semibold truncate"
    }, r.name), /*#__PURE__*/React.createElement("p", {
      className: "text-xs text-zinc-500"
    }, r.exercises.length, " ejercicios · ", r.exercises.reduce((a, e) => a + e.sets, 0), " series", r.phase ? ` · ${r.phase}` : "")))), /*#__PURE__*/React.createElement("div", {
      className: "flex gap-2 mt-3 flex-wrap"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setSchedFor(r),
      className: "text-xs bg-zinc-800 text-zinc-200 px-3 py-1.5 rounded-full"
    }, "📅 Programar"), /*#__PURE__*/React.createElement("button", {
      onClick: () => setEditing(JSON.parse(JSON.stringify(r))),
      className: "text-xs bg-zinc-800 text-zinc-200 px-3 py-1.5 rounded-full"
    }, "Editar"), /*#__PURE__*/React.createElement("button", {
      onClick: () => duplicate(r),
      className: "text-xs bg-zinc-800 text-zinc-200 px-3 py-1.5 rounded-full"
    }, "Duplicar"), /*#__PURE__*/React.createElement("button", {
      onClick: () => remove(r.id),
      className: "text-xs text-rose-400 px-3 py-1.5 rounded-full"
    }, "Eliminar")));
  })), /*#__PURE__*/React.createElement(ScheduleModal, {
    routine: schedFor,
    onClose: () => setSchedFor(null),
    onConfirm: k => {
      const arr = schedule[k] || [];
      if (!arr.includes(schedFor.id)) saveSchedule({
        ...schedule,
        [k]: [...arr, schedFor.id]
      });
      setSchedFor(null);
      flash(`Programado el ${fmtFecha(k)}`);
    }
  }));
}
function ScheduleModal({
  routine,
  onClose,
  onConfirm
}) {
  const [d, setD] = useState(todayKey());
  if (!routine) return null;
  return /*#__PURE__*/React.createElement(Modal, {
    open: !!routine,
    onClose: onClose,
    title: `Programar ${routine.name}`
  }, /*#__PURE__*/React.createElement("label", {
    className: "text-xs uppercase tracking-wider text-zinc-500"
  }, "Fecha"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: d,
    onChange: e => setD(e.target.value),
    className: "w-full mt-2 mb-5 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 font-mono"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => onConfirm(d),
    className: "w-full py-3 rounded-xl bg-amber-400 text-zinc-950 font-semibold"
  }, "Añadir al calendario"));
}
const MUSCLES = ["Cuádriceps", "Isquios", "Aductores", "Glúteo", "Gemelo", "Pectoral", "Espalda", "Deltoides ant.", "Deltoides lat.", "Deltoides post.", "Bíceps", "Tríceps", "Abdomen", "Antebrazo", "Trapecio"];
function RoutineEditor({
  routine,
  onSave,
  onCancel
}) {
  const [r, setR] = useState(routine);
  const [openIdx, setOpenIdx] = useState(routine._new ? null : -1);
  const patchEx = (idx, patch) => setR(s => ({
    ...s,
    exercises: s.exercises.map((e, i) => i === idx ? {
      ...e,
      ...patch
    } : e)
  }));
  const addEx = () => {
    const ne = ex("Pectoral", "Nuevo ejercicio", "", "", 3, "8-12", 2, 90);
    setR(s => ({
      ...s,
      exercises: [...s.exercises, ne]
    }));
    setOpenIdx(r.exercises.length);
  };
  const delEx = idx => setR(s => ({
    ...s,
    exercises: s.exercises.filter((_, i) => i !== idx)
  }));
  const move = (idx, dir) => setR(s => {
    const arr = [...s.exercises];
    const j = idx + dir;
    if (j < 0 || j >= arr.length) return s;
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    return {
      ...s,
      exercises: arr
    };
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col min-h-screen"
  }, /*#__PURE__*/React.createElement("header", {
    className: "sticky top-0 z-30 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onCancel,
    className: "text-sm text-zinc-400"
  }, "Cancelar"), /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-semibold"
  }, "Editar rutina"), /*#__PURE__*/React.createElement("button", {
    onClick: () => onSave(r),
    className: "text-sm font-semibold text-amber-400"
  }, "Guardar")), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 px-4 py-4 space-y-4 pb-28"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-xs uppercase tracking-wider text-zinc-500"
  }, "Nombre"), /*#__PURE__*/React.createElement("input", {
    value: r.name,
    onChange: e => setR({
      ...r,
      name: e.target.value
    }),
    className: "w-full mt-1.5 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 font-semibold text-lg"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-xs uppercase tracking-wider text-zinc-500"
  }, "Fase (opcional)"), /*#__PURE__*/React.createElement("input", {
    value: r.phase || "",
    onChange: e => setR({
      ...r,
      phase: e.target.value
    }),
    className: "w-full mt-1.5 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm",
    placeholder: "p. ej. Pérdida de grasa"
  })), /*#__PURE__*/React.createElement("div", {
    className: "pt-2"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs uppercase tracking-wider text-zinc-500 mb-2"
  }, "Ejercicios (", r.exercises.length, ")"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, r.exercises.map((e, idx) => {
    const open = openIdx === idx;
    return /*#__PURE__*/React.createElement("div", {
      key: e.id,
      className: "rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setOpenIdx(open ? -1 : idx),
      className: "flex-1 text-left px-4 py-3 min-w-0"
    }, /*#__PURE__*/React.createElement("p", {
      className: "text-[10px] uppercase text-zinc-500"
    }, e.muscle, e.label ? ` · ${e.label}` : ""), /*#__PURE__*/React.createElement("p", {
      className: "font-medium truncate"
    }, e.name), /*#__PURE__*/React.createElement("p", {
      className: "text-[11px] text-zinc-500 font-mono"
    }, e.sets, "×", e.reps, " · RIR ", e.rir, " · ", restLabel(e.rest))), /*#__PURE__*/React.createElement("div", {
      className: "flex flex-col pr-2"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => move(idx, -1),
      className: "text-zinc-600 px-2"
    }, "▲"), /*#__PURE__*/React.createElement("button", {
      onClick: () => move(idx, 1),
      className: "text-zinc-600 px-2"
    }, "▼"))), open && /*#__PURE__*/React.createElement("div", {
      className: "px-4 pb-4 pt-1 border-t border-zinc-800 space-y-3"
    }, /*#__PURE__*/React.createElement(Field, {
      label: "Ejercicio"
    }, /*#__PURE__*/React.createElement("input", {
      value: e.name,
      onChange: ev => patchEx(idx, {
        name: ev.target.value
      }),
      className: "w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm"
    })), /*#__PURE__*/React.createElement("div", {
      className: "grid grid-cols-2 gap-3"
    }, /*#__PURE__*/React.createElement(Field, {
      label: "Músculo"
    }, /*#__PURE__*/React.createElement("select", {
      value: e.muscle,
      onChange: ev => patchEx(idx, {
        muscle: ev.target.value
      }),
      className: "w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-2 text-sm"
    }, MUSCLES.map(m => /*#__PURE__*/React.createElement("option", {
      key: m
    }, m)))), /*#__PURE__*/React.createElement(Field, {
      label: "Etiqueta"
    }, /*#__PURE__*/React.createElement("select", {
      value: e.label,
      onChange: ev => patchEx(idx, {
        label: ev.target.value
      }),
      className: "w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-2 text-sm"
    }, /*#__PURE__*/React.createElement("option", {
      value: ""
    }, "—"), /*#__PURE__*/React.createElement("option", null, "TOP SET"), /*#__PURE__*/React.createElement("option", null, "BACK OFF")))), /*#__PURE__*/React.createElement("div", {
      className: "grid grid-cols-3 gap-3"
    }, /*#__PURE__*/React.createElement(Field, {
      label: "Series"
    }, /*#__PURE__*/React.createElement(NumBox, {
      value: e.sets,
      onChange: v => patchEx(idx, {
        sets: Math.max(1, parseInt(v || "1", 10))
      })
    })), /*#__PURE__*/React.createElement(Field, {
      label: "Reps"
    }, /*#__PURE__*/React.createElement("input", {
      value: e.reps,
      onChange: ev => patchEx(idx, {
        reps: ev.target.value
      }),
      className: "w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-2 text-sm font-mono text-center",
      placeholder: "8-12"
    })), /*#__PURE__*/React.createElement(Field, {
      label: "RIR"
    }, /*#__PURE__*/React.createElement("input", {
      value: e.rir,
      onChange: ev => patchEx(idx, {
        rir: ev.target.value
      }),
      className: "w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-2 text-sm font-mono text-center"
    }))), /*#__PURE__*/React.createElement(Field, {
      label: `Descanso · ${restLabel(e.rest)}`
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex gap-1.5 flex-wrap"
    }, [45, 60, 90, 120, 150, 180, 210, 240].map(sec => /*#__PURE__*/React.createElement("button", {
      key: sec,
      onClick: () => patchEx(idx, {
        rest: sec
      }),
      className: `px-2.5 py-1.5 rounded-lg text-xs font-mono ${e.rest === sec ? "bg-amber-400 text-zinc-950" : "bg-zinc-950 border border-zinc-800 text-zinc-300"}`
    }, restLabel(sec))))), /*#__PURE__*/React.createElement(Field, {
      label: "Observaciones"
    }, /*#__PURE__*/React.createElement("input", {
      value: e.notes,
      onChange: ev => patchEx(idx, {
        notes: ev.target.value
      }),
      className: "w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm",
      placeholder: "Técnica, ángulo…"
    })), /*#__PURE__*/React.createElement("button", {
      onClick: () => delEx(idx),
      className: "text-xs text-rose-400 pt-1"
    }, "Eliminar ejercicio")));
  })), /*#__PURE__*/React.createElement("button", {
    onClick: addEx,
    className: "mt-3 w-full py-3 rounded-xl border border-dashed border-zinc-700 text-sm text-zinc-300"
  }, "+ Añadir ejercicio"))));
}
function Field({
  label,
  children
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-[10px] uppercase tracking-wider text-zinc-500 block mb-1"
  }, label), children);
}
function NumBox({
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("input", {
    inputMode: "numeric",
    value: value,
    onChange: e => onChange(e.target.value),
    className: "w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-2 text-sm font-mono text-center"
  });
}

/* ============================================================
   CUERPO · Registro de peso y contornos
   ============================================================ */
function Body({
  body,
  save,
  flash
}) {
  const [adding, setAdding] = useState(false);
  const [metric, setMetric] = useState("peso");
  const sorted = useMemo(() => [...body].sort((a, b) => a.date < b.date ? 1 : -1), [body]);
  const series = useMemo(() => [...body].filter(e => e.values[metric] != null && e.values[metric] !== "").sort((a, b) => a.date < b.date ? -1 : 1).map(e => ({
    date: e.date,
    v: Number(e.values[metric])
  })), [body, metric]);
  const addEntry = entry => {
    save([entry, ...body]);
    setAdding(false);
    flash("Medición guardada ✓");
  };
  const del = id => {
    if (confirm("¿Eliminar medición?")) save(body.filter(e => e.id !== id));
  };
  const latest = sorted[0];
  const metricField = BODY_FIELDS.find(f => f.key === metric);
  return /*#__PURE__*/React.createElement("div", {
    className: "px-5 pt-8"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-6"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "text-2xl font-bold"
  }, "Cuerpo"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setAdding(true),
    className: "text-sm font-semibold bg-amber-400 text-zinc-950 px-4 py-2 rounded-full"
  }, "+ Medición")), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-1.5 overflow-x-auto pb-1 mb-3 -mx-1 px-1"
  }, BODY_FIELDS.map(f => /*#__PURE__*/React.createElement("button", {
    key: f.key,
    onClick: () => setMetric(f.key),
    className: `shrink-0 px-3 py-1.5 rounded-full text-xs ${metric === f.key ? "bg-zinc-100 text-zinc-950 font-semibold" : "bg-zinc-900 border border-zinc-800 text-zinc-400"}`
  }, f.label))), /*#__PURE__*/React.createElement(Chart, {
    series: series,
    unit: metricField.unit
  }), /*#__PURE__*/React.createElement("div", {
    className: "mt-6 space-y-2"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs uppercase tracking-wider text-zinc-500 mb-1"
  }, "Historial"), sorted.length === 0 && /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-zinc-500 py-8 text-center"
  }, "Aún no hay mediciones. Añade la primera."), sorted.map(e => /*#__PURE__*/React.createElement("div", {
    key: e.id,
    className: "rounded-xl bg-zinc-900 border border-zinc-800 p-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-medium"
  }, fmtFecha(e.date)), /*#__PURE__*/React.createElement("button", {
    onClick: () => del(e.id),
    className: "text-xs text-zinc-600"
  }, "Eliminar")), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-x-3 gap-y-1"
  }, BODY_FIELDS.filter(f => e.values[f.key] != null && e.values[f.key] !== "").map(f => /*#__PURE__*/React.createElement("span", {
    key: f.key,
    className: "text-[11px] text-zinc-400"
  }, f.label, " ", /*#__PURE__*/React.createElement("span", {
    className: "font-mono text-zinc-100"
  }, e.values[f.key]), /*#__PURE__*/React.createElement("span", {
    className: "text-zinc-600"
  }, f.unit))))))), /*#__PURE__*/React.createElement(BodyForm, {
    open: adding,
    onClose: () => setAdding(false),
    onSave: addEntry,
    last: latest
  }));
}
function Chart({
  series,
  unit
}) {
  if (series.length < 2) {
    return /*#__PURE__*/React.createElement("div", {
      className: "rounded-2xl bg-zinc-900 border border-zinc-800 h-44 flex items-center justify-center"
    }, /*#__PURE__*/React.createElement("p", {
      className: "text-xs text-zinc-600"
    }, series.length === 1 ? `${series[0].v} ${unit} · añade más para ver la evolución` : "Sin datos suficientes"));
  }
  const W = 320,
    H = 150,
    P = 24;
  const vals = series.map(s => s.v);
  let min = Math.min(...vals),
    max = Math.max(...vals);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const pad = (max - min) * 0.15;
  min -= pad;
  max += pad;
  const x = i => P + i / (series.length - 1) * (W - P * 2);
  const y = v => H - P - (v - min) / (max - min) * (H - P * 2);
  const pts = series.map((s, i) => `${x(i)},${y(s.v)}`).join(" ");
  const area = `${P},${H - P} ${pts} ${W - P},${H - P}`;
  const first = series[0].v,
    lastV = series[series.length - 1].v;
  const delta = lastV - first;
  return /*#__PURE__*/React.createElement("div", {
    className: "rounded-2xl bg-zinc-900 border border-zinc-800 p-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-baseline justify-between mb-1 px-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-mono text-2xl font-bold"
  }, lastV, /*#__PURE__*/React.createElement("span", {
    className: "text-sm text-zinc-500 ml-1"
  }, unit)), /*#__PURE__*/React.createElement("span", {
    className: `text-xs font-mono ${delta > 0 ? "text-rose-400" : delta < 0 ? "text-emerald-400" : "text-zinc-500"}`
  }, delta > 0 ? "+" : "", delta.toFixed(1), " ", unit)), /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${W} ${H}`,
    className: "w-full"
  }, /*#__PURE__*/React.createElement("polyline", {
    points: area,
    fill: "rgba(251,191,36,0.10)",
    stroke: "none"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: pts,
    fill: "none",
    stroke: "rgb(251,191,36)",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }), series.map((s, i) => /*#__PURE__*/React.createElement("circle", {
    key: i,
    cx: x(i),
    cy: y(s.v),
    r: "2.5",
    fill: "rgb(251,191,36)"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between px-1 text-[9px] text-zinc-600 font-mono"
  }, /*#__PURE__*/React.createElement("span", null, fmtFecha(series[0].date).replace(/^\S+\s/, "")), /*#__PURE__*/React.createElement("span", null, fmtFecha(series[series.length - 1].date).replace(/^\S+\s/, ""))));
}
function BodyForm({
  open,
  onClose,
  onSave,
  last
}) {
  const [date, setDate] = useState(todayKey());
  const [vals, setVals] = useState({});
  useEffect(() => {
    if (open) {
      setDate(todayKey());
      setVals({});
    }
  }, [open]);
  const submit = () => {
    const values = {};
    Object.entries(vals).forEach(([k, v]) => {
      if (v !== "" && v != null) values[k] = v;
    });
    if (Object.keys(values).length === 0) {
      onClose();
      return;
    }
    onSave({
      id: uid(),
      date,
      values
    });
  };
  return /*#__PURE__*/React.createElement(Modal, {
    open: open,
    onClose: onClose,
    title: "Nueva medición"
  }, /*#__PURE__*/React.createElement("label", {
    className: "text-[10px] uppercase tracking-wider text-zinc-500 block mb-1"
  }, "Fecha"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: date,
    onChange: e => setDate(e.target.value),
    className: "w-full mb-4 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 font-mono text-sm"
  }), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3"
  }, BODY_FIELDS.map(f => /*#__PURE__*/React.createElement("div", {
    key: f.key
  }, /*#__PURE__*/React.createElement("label", {
    className: "text-[10px] uppercase tracking-wider text-zinc-500 block mb-1"
  }, f.label, " ", /*#__PURE__*/React.createElement("span", {
    className: "text-zinc-600"
  }, f.unit)), /*#__PURE__*/React.createElement("input", {
    inputMode: "decimal",
    value: vals[f.key] || "",
    onChange: e => setVals(s => ({
      ...s,
      [f.key]: e.target.value.replace(",", ".")
    })),
    placeholder: last && last.values[f.key] != null ? String(last.values[f.key]) : "–",
    className: "w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 font-mono text-center placeholder:text-zinc-700"
  })))), /*#__PURE__*/React.createElement("button", {
    onClick: submit,
    className: "w-full mt-5 py-3 rounded-xl bg-amber-400 text-zinc-950 font-semibold"
  }, "Guardar medición"));
}

/* Arranque */
const _root = document.getElementById("root");
["touchstart", "pointerdown", "keydown"].forEach(ev => document.addEventListener(ev, unlockAudio, {
  passive: true
}));
if (ReactDOM.createRoot) {
  ReactDOM.createRoot(_root).render(React.createElement(GymApp));
} else {
  ReactDOM.render(React.createElement(GymApp), _root);
}