"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Banknote,
  CalendarCheck2,
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Edit3,
  MoreHorizontal,
  Plus,
  Search,
  Scissors,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { categories, clients } from "@/lib/data";
import {
  availableSlots,
  currentYearEndInput,
  money,
  prettyDate,
  todayInput,
} from "@/lib/scheduling";
import {
  AppointmentStatus,
  Professional,
  ScheduleBlock,
  Service,
} from "@/lib/types";
import { useSalon } from "@/contexts/SalonContext";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { MetricCard } from "./MetricCard";
import { StatusBadge } from "./StatusBadge";

const today = todayInput;
const localIso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const mondayOf = (offset = 0) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1 + offset * 7);
  return date;
};

export function DashboardView({ navigate }: { navigate: (p: string) => void }) {
  const { appointments, services, professionals } = useSalon();
  const { user } = useAuth();
  const isProfessional = user?.role === "professional";
  const active = appointments.filter(
    (a) => a.date === today() && !["Cancelado"].includes(a.status),
  );
  const expectedRevenue = appointments
    .filter((a) => !["Cancelado", "Não compareceu"].includes(a.status))
    .reduce(
      (sum, a) =>
        sum +
        (a.price ?? services.find((s) => s.id === a.serviceId)?.price ?? 0),
      0,
    );
  const profileRevenue = expectedRevenue * (isProfessional ? 0.6 : 0.4);
  const next = [...appointments]
    .filter(
      (a) =>
        a.date >= today() && !["Cancelado", "Concluído"].includes(a.status),
    )
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 5);
  const confirmedToday = active.filter((a) => a.status === "Confirmado").length;
  const clientCount = new Set(appointments.map((a) => a.phone)).size;
  const serviceStats = services
    .map((service) => ({
      name: service.name,
      value: appointments.filter((item) => item.serviceId === service.id)
        .length,
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
  const maxServiceCount = Math.max(
    1,
    ...serviceStats.map((item) => item.value),
  );
  const currentWeek = Array.from({ length: 6 }, (_, index) => {
    const date = mondayOf();
    date.setDate(date.getDate() + index);
    return localIso(date);
  });
  const weekCounts = currentWeek.map(
    (date) =>
      appointments.filter(
        (item) => item.date === date && item.status !== "Cancelado",
      ).length,
  );
  const maxWeekCount = Math.max(1, ...weekCounts);
  const activeProfessionals = professionals.filter(
    (item) => item.active,
  ).length;
  const occupancy = activeProfessionals
    ? Math.round(
        (weekCounts.reduce((sum, value) => sum + value, 0) /
          (activeProfessionals * 60)) *
          100,
      )
    : 0;
  return (
    <>
      <div className="admin-welcome">
        <div>
          <h2>Bom dia, {user?.name.split(" ")[0] || "equipe"}.</h2>
          <p>
            {isProfessional
              ? "Aqui estão seus atendimentos e ganhos previstos."
              : "Aqui está o ritmo do seu salão hoje."}
          </p>
        </div>
        <span>
          {new Intl.DateTimeFormat("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
          }).format(new Date())}
        </span>
      </div>
      <div className="metrics-grid">
        <MetricCard
          label="Agendamentos hoje"
          value={String(active.length)}
          detail={`${confirmedToday} confirmados`}
          icon={CalendarCheck2}
        />
        <MetricCard
          label={
            isProfessional ? "Ganhos previstos" : "Receita prevista do salão"
          }
          value={money(profileRevenue)}
          detail={
            isProfessional
              ? "60% dos seus atendimentos válidos"
              : "40% dos atendimentos válidos"
          }
          icon={Banknote}
          tone="dark"
        />
        <MetricCard
          label="Clientes ativos"
          value={String(clientCount)}
          detail="com agendamentos registrados"
          icon={UsersRound}
          tone="rose"
        />
        <MetricCard
          label="Profissionais ativos"
          value={String(professionals.filter((p) => p.active).length)}
          detail="profissionais disponíveis"
          icon={UserCheck}
          tone="olive"
        />
      </div>
      <div className="dashboard-grid">
        <section className="admin-card schedule-card">
          <div className="card-head">
            <div>
              <small>PRÓXIMOS ATENDIMENTOS</small>
              <h3>Agenda em movimento</h3>
            </div>
            <button onClick={() => navigate("agenda")}>
              Ver agenda completa
            </button>
          </div>
          <div className="compact-list">
            {next.length === 0 && (
              <p className="muted-copy">Nenhum atendimento agendado.</p>
            )}
            {next.map((a) => {
              const s = services.find((x) => x.id === a.serviceId);
              const p = professionals.find((x) => x.id === a.professionalId);
              return (
                <article key={a.id}>
                  <time>{a.time}</time>
                  <span className={`avatar-sm tone-${p?.tone}`}>
                    {p?.initials}
                  </span>
                  <div>
                    <strong>{a.client}</strong>
                    <small>
                      {s?.name || a.serviceName} com{" "}
                      {p?.name || a.professionalName}
                    </small>
                  </div>
                  <StatusBadge status={a.status} />
                </article>
              );
            })}
          </div>
        </section>
        <section className="admin-card chart-card">
          <div className="card-head">
            <div>
              <small>DESEMPENHO</small>
              <h3>Serviços mais agendados</h3>
            </div>
            <select aria-label="Período">
              <option>Este mês</option>
            </select>
          </div>
          <div className="bar-chart">
            {serviceStats.length === 0 && (
              <p className="muted-copy">Ainda não há dados de atendimento.</p>
            )}
            {serviceStats.map((item) => (
              <div key={item.name}>
                <span>{item.name}</span>
                <i>
                  <b
                    style={{
                      width: `${(item.value / maxServiceCount) * 100}%`,
                    }}
                  />
                </i>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
      <div className="dashboard-grid bottom">
        <section className="admin-card occupancy">
          <div className="card-head">
            <div>
              <small>OCUPAÇÃO DA SEMANA</small>
              <h3>Horários preenchidos</h3>
            </div>
            <strong>{occupancy}%</strong>
          </div>
          <div className="week-bars">
            {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d, i) => (
              <div key={d}>
                <i>
                  <b
                    style={{
                      height: `${(weekCounts[i] / maxWeekCount) * 100}%`,
                    }}
                  />
                </i>
                <span>{d}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="insight-card">
          <SparkleIcon />
          <small>INSIGHT DO DIA</small>
          <h3>
            {appointments.length
              ? "Acompanhe a agenda da semana."
              : "Seu painel está pronto para começar."}
          </h3>
          <p>
            {appointments.length
              ? "Os indicadores são atualizados conforme os atendimentos são registrados."
              : "Cadastre profissionais e serviços para receber os primeiros agendamentos."}
          </p>
        </section>
      </div>
    </>
  );
}

export function AgendaView() {
  const {
    appointments,
    services,
    professionals,
    blocks,
    setAppointments,
    notify,
  } = useSalon();
  const [selected, setSelected] = useState("");
  const [professional, setProfessional] = useState("Todos");
  const [status, setStatus] = useState("Todos");
  const [weekOffset, setWeekOffset] = useState(0);
  const weekDates = useMemo(() => {
    const monday = mondayOf(weekOffset);
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return date;
    });
  }, [weekOffset]);
  const weekIds = weekDates.map(localIso);
  const visible = appointments.filter(
    (a) =>
      weekIds.includes(a.date) &&
      (professional === "Todos" || a.professionalId === professional) &&
      (status === "Todos" || a.status === status),
  );
  useEffect(() => {
    setSelected((current) =>
      visible.some((a) => a.id === current) ? current : visible[0]?.id || "",
    );
  }, [weekOffset, professional, status, appointments]);
  const detail = visible.find((a) => a.id === selected);
  const first = weekDates[0];
  const last = weekDates[5];
  const periodLabel = `${String(first.getDate()).padStart(2, "0")} ${first.toLocaleDateString("pt-BR", { month: "short" })} - ${String(last.getDate()).padStart(2, "0")} ${last.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}`;
  const update = async (newStatus: AppointmentStatus) => {
    if (!selected) return;
    try {
      const result = await api<{ appointment: { status: AppointmentStatus } }>(
        `/appointments/${selected}/status`,
        { method: "PATCH", body: JSON.stringify({ status: newStatus }) },
      );
      setAppointments(
        appointments.map((a) =>
          a.id === selected ? { ...a, status: result.appointment.status } : a,
        ),
      );
      notify(`Status alterado para ${newStatus}.`);
    } catch (err) {
      notify(
        err instanceof Error
          ? err.message
          : "Não foi possível atualizar o status.",
      );
    }
  };
  return (
    <>
      <div className="toolbar">
        <div className="period-switch">
          <button
            onClick={() => setWeekOffset((value) => value - 1)}
            aria-label="Semana anterior"
          >
            <ChevronLeft />
          </button>
          <strong>{periodLabel}</strong>
          <button
            onClick={() => setWeekOffset((value) => value + 1)}
            aria-label="Próxima semana"
          >
            <ChevronRight />
          </button>
          <button
            className="today-button"
            onClick={() => setWeekOffset(0)}
            disabled={weekOffset === 0}
          >
            Hoje
          </button>
        </div>
        <div className="toolbar-filters">
          <select
            value={professional}
            onChange={(e) => setProfessional(e.target.value)}
          >
            <option>Todos</option>
            {professionals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>Todos</option>
            <option>Agendado</option>
            <option>Confirmado</option>
            <option>Concluído</option>
            <option>Cancelado</option>
          </select>
        </div>
      </div>
      <div className="agenda-layout">
        <section className="admin-card agenda-board">
          <div className="agenda-header">
            <span>Horário</span>
            {weekDates.map((date) => (
              <span key={localIso(date)}>
                {date
                  .toLocaleDateString("pt-BR", { weekday: "short" })
                  .replace(".", "")}
                <small>{String(date.getDate()).padStart(2, "0")}</small>
              </span>
            ))}
          </div>
          <div className="agenda-scroll">
            {[
              "09:00",
              "10:00",
              "11:00",
              "12:00",
              "13:00",
              "14:00",
              "15:00",
              "16:00",
              "17:00",
              "18:00",
            ].map((h) => (
              <div className="agenda-row" key={h}>
                <time>{h}</time>
                {weekIds.map((date) => {
                  const item = visible.find(
                    (a) =>
                      a.date === date && a.time.slice(0, 2) === h.slice(0, 2),
                  );
                  const block = blocks.find(
                    (b) =>
                      b.date === date &&
                      (professional === "Todos"
                        ? !b.professionalId
                        : !b.professionalId ||
                          b.professionalId === professional) &&
                      (b.wholeDay ||
                        (h >= (b.startTime || "00:00") &&
                          h < (b.endTime || "23:59"))),
                  );
                  const s =
                    item && services.find((x) => x.id === item.serviceId);
                  const p =
                    item &&
                    professionals.find((x) => x.id === item.professionalId);
                  return (
                    <button
                      key={date}
                      className={
                        item
                          ? `calendar-event tone-${p?.tone}`
                          : block
                            ? "calendar-blocked"
                            : "calendar-empty"
                      }
                      onClick={() => item && setSelected(item.id)}
                    >
                      {item ? (
                        <>
                          <strong>
                            {item.time} {item.client.split(" ")[0]}
                          </strong>
                          <span>{s?.name || item.serviceName}</span>
                        </>
                      ) : block ? (
                        <>
                          <strong>Bloqueado</strong>
                          <span>{block.reason}</span>
                        </>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
        <aside className="admin-card detail-panel">
          {detail ? (
            (() => {
              const s = services.find((x) => x.id === detail.serviceId);
              const p = professionals.find(
                (x) => x.id === detail.professionalId,
              );
              return (
                <>
                  <div className="detail-head">
                    <small>DETALHES</small>
                    <StatusBadge status={detail.status} />
                  </div>
                  <div className="detail-client">
                    <span>
                      {detail.client
                        .split(" ")
                        .map((x) => x[0])
                        .join("")
                        .slice(0, 2)}
                    </span>
                    <div>
                      <h3>{detail.client}</h3>
                      <p>{detail.phone}</p>
                    </div>
                  </div>
                  <dl>
                    <div>
                      <dt>Serviço</dt>
                      <dd>{s?.name || detail.serviceName}</dd>
                    </div>
                    <div>
                      <dt>Profissional</dt>
                      <dd>{p?.name || detail.professionalName}</dd>
                    </div>
                    <div>
                      <dt>Data</dt>
                      <dd>{prettyDate(detail.date)}</dd>
                    </div>
                    <div>
                      <dt>Horário</dt>
                      <dd>
                        {detail.time} • {s?.duration} min
                      </dd>
                    </div>
                    <div>
                      <dt>Valor</dt>
                      <dd>{money(detail.price ?? s?.price ?? 0)}</dd>
                    </div>
                    <div>
                      <dt>Observações</dt>
                      <dd>{detail.notes || "Nenhuma observação."}</dd>
                    </div>
                  </dl>
                  <div className="detail-actions">
                    <button
                      className="primary-button"
                      onClick={() => update("Confirmado")}
                    >
                      <Check /> Confirmar
                    </button>
                    <button
                      className="outline-button"
                      onClick={() => update("Concluído")}
                    >
                      Concluir
                    </button>
                    <button
                      className="danger-link"
                      onClick={() => update("Não compareceu")}
                    >
                      Não compareceu
                    </button>
                  </div>
                </>
              );
            })()
          ) : (
            <div className="detail-placeholder">
              <CalendarCheck2 />
              <strong>Nenhum atendimento selecionado</strong>
              <p>Navegue entre as semanas ou ajuste os filtros.</p>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

export function AppointmentsAdmin() {
  const { appointments, services, professionals } = useSalon();
  const [query, setQuery] = useState("");
  const rows = appointments.filter((a) =>
    a.client.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <section className="admin-card table-card">
      <div className="table-toolbar">
        <div>
          <h2>Todos os agendamentos</h2>
          <p>{rows.length} registros encontrados</p>
        </div>
        <label className="search-field">
          <Search />
          <input
            placeholder="Buscar cliente..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      <div className="responsive-table">
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Serviço</th>
              <th>Profissional</th>
              <th>Data</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <td>
                  <strong>{a.client}</strong>
                  <small>{a.phone}</small>
                </td>
                <td>
                  {services.find((s) => s.id === a.serviceId)?.name ||
                    a.serviceName}
                </td>
                <td>
                  {professionals.find((p) => p.id === a.professionalId)?.name ||
                    a.professionalName}
                </td>
                <td>
                  {prettyDate(a.date)}
                  <small>{a.time}</small>
                </td>
                <td>
                  <StatusBadge status={a.status} />
                </td>
                <td>
                  <button className="icon-button">
                    <MoreHorizontal />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ClientsAdmin() {
  const [q, setQ] = useState("");
  const rows = clients.filter((c) =>
    c.name.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <section className="admin-card table-card">
      <div className="table-toolbar">
        <div>
          <h2>Clientes</h2>
          <p>Relacionamento e histórico de atendimento.</p>
        </div>
        <label className="search-field">
          <Search />
          <input
            placeholder="Buscar cliente..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
      </div>
      <div className="responsive-table">
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Contato</th>
              <th>Atendimentos</th>
              <th>Último atendimento</th>
              <th>Próximo</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c, i) => (
              <tr key={c.email}>
                <td>
                  <strong>{c.name}</strong>
                  <small>{c.email}</small>
                </td>
                <td>{c.phone}</td>
                <td>{c.visits}</td>
                <td>{i % 2 ? "12 ago. 2026" : "03 set. 2026"}</td>
                <td>{i < 3 ? "Agendado" : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ProfessionalsAdmin() {
  const { professionals, setProfessionals, services, notify } = useSalon();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const empty = {
    name: "",
    email: "",
    phone: "",
    password: "",
    specialty: "",
    description: "",
    start: "09:00",
    end: "18:00",
    active: true,
    serviceIds: [] as string[],
    workDays: [1, 2, 3, 4, 5, 6] as number[],
  };
  const [draft, setDraft] = useState(empty);
  const toggleArray = <T extends string | number>(items: T[], value: T) =>
    items.includes(value)
      ? items.filter((item) => item !== value)
      : [...items, value];
  const closeForm = () => {
    setShowForm(false);
    setEditId(null);
    setDraft(empty);
    setError("");
  };
  const openNew = () => {
    setEditId(null);
    setDraft(empty);
    setError("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const openEdit = (professional: Professional) => {
    setEditId(professional.id);
    setDraft({
      ...empty,
      name: professional.name,
      specialty: professional.specialty,
      description: professional.description,
      start: professional.start,
      end: professional.end,
      active: professional.active,
      serviceIds: [...professional.serviceIds],
      workDays: [...professional.workDays],
    });
    setError("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api<{ professional: Professional }>(
        editId ? `/professionals/${editId}` : "/professionals",
        { method: editId ? "PATCH" : "POST", body: JSON.stringify(draft) },
      );
      setProfessionals(
        editId
          ? professionals.map((item) =>
              item.id === editId ? result.professional : item,
            )
          : [...professionals, result.professional],
      );
      notify(
        editId
          ? "Perfil profissional atualizado com sucesso!"
          : "Profissional e acesso cadastrados com sucesso!",
      );
      closeForm();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Não foi possível ${editId ? "editar" : "cadastrar"} o profissional.`,
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <div className="content-heading">
        <div>
          <h2>Equipe</h2>
          <p>Profissionais, especialidades, acessos e disponibilidade.</p>
        </div>
        <button className="primary-button" onClick={openNew}>
          <Plus /> Adicionar profissional
        </button>
      </div>
      {showForm && (
        <form className="admin-card professional-form" onSubmit={save}>
          <div className="form-title">
            <div>
              <small>{editId ? "EDIÇÃO DE PERFIL" : "NOVO PROFISSIONAL"}</small>
              <h3>
                {editId
                  ? "Atualizar dados profissionais"
                  : "Dados profissionais e acesso"}
              </h3>
            </div>
            <button type="button" className="text-button" onClick={closeForm}>
              Fechar
            </button>
          </div>
          <div className="form-grid">
            <label>
              Nome completo
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                required
              />
            </label>
            <label>
              Especialidade
              <input
                value={draft.specialty}
                onChange={(e) =>
                  setDraft({ ...draft, specialty: e.target.value })
                }
                placeholder="Ex.: Colorista e hair artist"
                required
              />
            </label>
          </div>
          {!editId && (
            <>
              <div className="form-grid">
                <label>
                  E-mail de acesso
                  <input
                    type="email"
                    value={draft.email}
                    onChange={(e) =>
                      setDraft({ ...draft, email: e.target.value })
                    }
                    required
                  />
                </label>
                <label>
                  Telefone
                  <input
                    value={draft.phone}
                    onChange={(e) =>
                      setDraft({ ...draft, phone: e.target.value })
                    }
                    placeholder="(41) 99999-9999"
                    required
                  />
                </label>
              </div>
              <label>
                Senha inicial
                <input
                  type="password"
                  minLength={8}
                  value={draft.password}
                  onChange={(e) =>
                    setDraft({ ...draft, password: e.target.value })
                  }
                  placeholder="Mínimo de 8 caracteres"
                  required
                />
              </label>
            </>
          )}
          <label>
            Apresentação
            <textarea
              rows={3}
              value={draft.description}
              onChange={(e) =>
                setDraft({ ...draft, description: e.target.value })
              }
              placeholder="Experiência, técnicas e estilo de atendimento"
            />
          </label>
          <div className="form-grid">
            <label>
              Início do expediente
              <input
                type="time"
                value={draft.start}
                onChange={(e) => setDraft({ ...draft, start: e.target.value })}
                required
              />
            </label>
            <label>
              Fim do expediente
              <input
                type="time"
                value={draft.end}
                onChange={(e) => setDraft({ ...draft, end: e.target.value })}
                required
              />
            </label>
          </div>
          {editId && (
            <label className="active-switch">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) =>
                  setDraft({ ...draft, active: e.target.checked })
                }
              />
              <span>
                <strong>Profissional ativo</strong>
                <small>
                  Profissionais inativos deixam de aparecer para novos
                  agendamentos.
                </small>
              </span>
            </label>
          )}
          <fieldset>
            <legend>Dias de trabalho</legend>
            <div className="check-grid">
              {[
                ["Seg", 1],
                ["Ter", 2],
                ["Qua", 3],
                ["Qui", 4],
                ["Sex", 5],
                ["Sáb", 6],
              ].map(([label, day]) => (
                <label key={day}>
                  <input
                    type="checkbox"
                    checked={draft.workDays.includes(Number(day))}
                    onChange={() =>
                      setDraft({
                        ...draft,
                        workDays: toggleArray(draft.workDays, Number(day)),
                      })
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Serviços realizados</legend>
            <div className="service-check-grid">
              {services
                .filter((s) => s.active)
                .map((service) => (
                  <label key={service.id}>
                    <input
                      type="checkbox"
                      checked={draft.serviceIds.includes(service.id)}
                      onChange={() =>
                        setDraft({
                          ...draft,
                          serviceIds: toggleArray(draft.serviceIds, service.id),
                        })
                      }
                    />
                    <span>{service.name}</span>
                  </label>
                ))}
            </div>
          </fieldset>
          {error && <div className="auth-error">{error}</div>}
          <button className="primary-button" disabled={busy}>
            {busy
              ? "Salvando..."
              : editId
                ? "Salvar alterações"
                : "Cadastrar profissional"}
          </button>
        </form>
      )}
      <div className="admin-card-grid">
        {professionals.map((p) => (
          <article className="admin-card team-card" key={p.id}>
            <div className="team-card-top">
              <span className={`avatar-lg tone-${p.tone}`}>{p.initials}</span>
              <span
                className={p.active ? "availability active" : "availability"}
              >
                {p.active ? "Ativo" : "Inativo"}
              </span>
            </div>
            <h3>{p.name}</h3>
            <p>{p.specialty}</p>
            <div className="team-meta">
              <span>
                <Clock3 /> {p.start} às {p.end}
              </span>
              <span>
                <Scissors /> {p.serviceIds.length} serviços
              </span>
            </div>
            <button className="outline-button" onClick={() => openEdit(p)}>
              <Edit3 /> Editar perfil
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}

export function ServicesAdmin() {
  const { services, setServices, notify } = useSalon();
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({
    name: "",
    category: "Cabelos",
    description: "",
    duration: 60,
    price: 100,
  });
  const resetDraft = () =>
    setDraft({
      name: "",
      category: "Cabelos",
      description: "",
      duration: 60,
      price: 100,
    });
  const toggle = async (service: Service) => {
    setBusy(true);
    setError("");
    try {
      const result = await api<{ service: Service }>(
        `/services/${service.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ ...service, active: !service.active }),
        },
      );
      setServices(
        services.map((item) =>
          item.id === service.id ? result.service : item,
        ),
      );
      notify("Disponibilidade do serviço atualizada.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível atualizar o serviço.",
      );
    } finally {
      setBusy(false);
    }
  };
  const add = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api<{ service: Service }>("/services", {
        method: "POST",
        body: JSON.stringify({ ...draft, icon: "Sparkles" }),
      });
      setServices([...services, result.service]);
      resetDraft();
      setShowForm(false);
      notify("Serviço adicionado e salvo no banco de dados!");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível cadastrar o serviço.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <div className="content-heading">
        <div>
          <h2>Catálogo de serviços</h2>
          <p>Valores, duração e disponibilidade.</p>
        </div>
        <button
          className="primary-button"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus /> Novo serviço
        </button>
      </div>
      {showForm && (
        <form className="admin-card inline-form" onSubmit={add}>
          <label>
            Nome
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              required
            />
          </label>
          <label>
            Categoria
            <select
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            >
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
          <label>
            Descrição
            <input
              value={draft.description}
              onChange={(e) =>
                setDraft({ ...draft, description: e.target.value })
              }
              placeholder="Descreva o que está incluído"
              minLength={3}
              required
            />
          </label>
          <label>
            Duração
            <input
              type="number"
              min={15}
              max={720}
              value={draft.duration}
              onChange={(e) =>
                setDraft({ ...draft, duration: Number(e.target.value) })
              }
            />
          </label>
          <label>
            Preço
            <input
              type="number"
              min={0}
              step="0.01"
              value={draft.price}
              onChange={(e) =>
                setDraft({ ...draft, price: Number(e.target.value) })
              }
            />
          </label>
          {error && <div className="auth-error">{error}</div>}
          <button className="primary-button" disabled={busy}>
            {busy ? "Salvando..." : "Salvar"}
          </button>
        </form>
      )}
      {!showForm && error && <div className="auth-error">{error}</div>}
      <section className="admin-card table-card">
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Serviço</th>
                <th>Categoria</th>
                <th>Duração</th>
                <th>Preço</th>
                <th>Status</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong>{s.name}</strong>
                    <small>{s.description}</small>
                  </td>
                  <td>{s.category}</td>
                  <td>{s.duration} min</td>
                  <td>{money(s.price)}</td>
                  <td>
                    <span
                      className={
                        s.active ? "availability active" : "availability"
                      }
                    >
                      {s.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="outline-button small"
                      onClick={() => toggle(s)}
                      disabled={busy}
                    >
                      {s.active ? "Desativar" : "Ativar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export function SettingsAdmin() {
  const {
    professionals,
    blocks,
    setBlocks,
    businessHours,
    setBusinessHours,
    notify,
  } = useSalon();
  const [showBlock, setShowBlock] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({
    professionalId: "",
    date: "",
    reason: "",
    wholeDay: true,
    startTime: "09:00",
    endTime: "10:00",
  });
  const saveHours = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api<{ businessHours: typeof businessHours }>(
        "/business-hours",
        { method: "PUT", body: JSON.stringify({ businessHours }) },
      );
      setBusinessHours(result.businessHours);
      notify("Dias e horários de funcionamento salvos.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar o funcionamento.",
      );
    } finally {
      setBusy(false);
    }
  };
  const saveBlock = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api<{ block: ScheduleBlock }>("/blocks", {
        method: "POST",
        body: JSON.stringify({
          ...draft,
          professionalId: draft.professionalId || null,
        }),
      });
      setBlocks([...blocks, result.block]);
      setDraft({
        professionalId: "",
        date: "",
        reason: "",
        wholeDay: true,
        startTime: "09:00",
        endTime: "10:00",
      });
      setShowBlock(false);
      notify("Bloqueio adicionado à agenda.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível adicionar o bloqueio.",
      );
    } finally {
      setBusy(false);
    }
  };
  const removeBlock = async (id: string) => {
    if (!confirm("Remover este bloqueio?")) return;
    try {
      await api(`/blocks/${id}`, { method: "DELETE" });
      setBlocks(blocks.filter((block) => block.id !== id));
      notify("Bloqueio removido.");
    } catch (err) {
      notify(
        err instanceof Error
          ? err.message
          : "Não foi possível remover o bloqueio.",
      );
    }
  };
  return (
    <div className="settings-grid">
      <form className="admin-card settings-form" onSubmit={saveHours}>
        <small>FUNCIONAMENTO</small>
        <h2>Horários do salão</h2>
        <p>Desative os dias em que o salão não realiza atendimentos.</p>
        {businessHours.map((item) => (
          <div className="day-row" key={item.day}>
            <label>
              <input
                type="checkbox"
                checked={item.active}
                onChange={(e) =>
                  setBusinessHours(
                    businessHours.map((hour) =>
                      hour.day === item.day
                        ? { ...hour, active: e.target.checked }
                        : hour,
                    ),
                  )
                }
              />{" "}
              {
                [
                  "",
                  "Segunda-feira",
                  "Terça-feira",
                  "Quarta-feira",
                  "Quinta-feira",
                  "Sexta-feira",
                  "Sábado",
                ][item.day]
              }
            </label>
            <input
              type="time"
              value={item.start}
              disabled={!item.active}
              onChange={(e) =>
                setBusinessHours(
                  businessHours.map((hour) =>
                    hour.day === item.day
                      ? { ...hour, start: e.target.value }
                      : hour,
                  ),
                )
              }
            />
            <span>até</span>
            <input
              type="time"
              value={item.end}
              disabled={!item.active}
              onChange={(e) =>
                setBusinessHours(
                  businessHours.map((hour) =>
                    hour.day === item.day
                      ? { ...hour, end: e.target.value }
                      : hour,
                  ),
                )
              }
            />
          </div>
        ))}
        {error && <div className="auth-error">{error}</div>}
        <button className="primary-button" disabled={busy}>
          {busy ? "Salvando..." : "Salvar horários"}
        </button>
      </form>
      <section className="admin-card settings-form">
        <small>BLOQUEIOS E FOLGAS</small>
        <h2>Indisponibilidades</h2>
        <p>
          Cadastre feriados, pausas ou períodos em que o salão ou um
          profissional não poderá receber agendamentos.
        </p>
        <button
          className="outline-button"
          onClick={() => setShowBlock(!showBlock)}
        >
          <CalendarPlus /> Adicionar bloqueio
        </button>
        {showBlock && (
          <form className="block-form" onSubmit={saveBlock}>
            <label>
              Aplicar a
              <select
                value={draft.professionalId}
                onChange={(e) =>
                  setDraft({ ...draft, professionalId: e.target.value })
                }
              >
                <option value="">Todo o salão</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Data
              <input
                type="date"
                min={today()}
                max={currentYearEndInput()}
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                required
              />
            </label>
            <label>
              Motivo
              <input
                value={draft.reason}
                onChange={(e) => setDraft({ ...draft, reason: e.target.value })}
                placeholder="Ex.: consulta, folga ou feriado"
                required
              />
            </label>
            <label className="whole-day">
              <input
                type="checkbox"
                checked={draft.wholeDay}
                onChange={(e) =>
                  setDraft({ ...draft, wholeDay: e.target.checked })
                }
              />{" "}
              Dia inteiro
            </label>
            {!draft.wholeDay && (
              <div className="form-grid">
                <label>
                  Início
                  <input
                    type="time"
                    value={draft.startTime}
                    onChange={(e) =>
                      setDraft({ ...draft, startTime: e.target.value })
                    }
                  />
                </label>
                <label>
                  Fim
                  <input
                    type="time"
                    value={draft.endTime}
                    onChange={(e) =>
                      setDraft({ ...draft, endTime: e.target.value })
                    }
                  />
                </label>
              </div>
            )}
            {error && <div className="auth-error">{error}</div>}
            <button className="primary-button" disabled={busy}>
              {busy ? "Salvando..." : "Salvar bloqueio"}
            </button>
          </form>
        )}
        <div className="blocks-list">
          {blocks.length ? (
            blocks.map((block) => {
              const owner = block.professionalId
                ? professionals.find((p) => p.id === block.professionalId)?.name
                : "Todo o salão";
              return (
                <div className="block-item" key={block.id}>
                  <span>
                    <strong>{block.reason}</strong>
                    <small>
                      {prettyDate(block.date)} •{" "}
                      {block.wholeDay
                        ? "dia inteiro"
                        : `${block.startTime} às ${block.endTime}`}{" "}
                      • {owner}
                    </small>
                  </span>
                  <button
                    className="danger-link"
                    onClick={() => removeBlock(block.id)}
                  >
                    Remover
                  </button>
                </div>
              );
            })
          ) : (
            <p className="muted-copy">Nenhum bloqueio cadastrado.</p>
          )}
        </div>
      </section>
    </div>
  );
}

export function ManualBooking() {
  const {
    services,
    professionals,
    blocks,
    businessHours,
    appointments,
    setAppointments,
    notify,
  } = useSalon();
  const [form, setForm] = useState({
    client: "",
    phone: "",
    serviceId: "",
    professionalId: "",
    date: "",
    time: "",
  });
  const service = services.find((s) => s.id === form.serviceId);
  const pros = professionals.filter((p) =>
    p.serviceIds.includes(form.serviceId),
  );
  const pro = professionals.find((p) => p.id === form.professionalId);
  const slots =
    service && pro
      ? availableSlots(
          form.date,
          pro,
          service,
          appointments,
          blocks,
          businessHours,
        )
      : [];
  const save = () => {
    if (
      !form.client ||
      !form.phone ||
      !service ||
      !pro ||
      !form.date ||
      !form.time
    ) {
      notify("Preencha todos os campos obrigatórios.");
      return;
    }
    setAppointments([
      ...appointments,
      { id: `a${Date.now()}`, ...form, status: "Agendado" },
    ]);
    notify("Agendamento manual criado.");
    setForm({
      client: "",
      phone: "",
      serviceId: "",
      professionalId: "",
      date: "",
      time: "",
    });
  };
  return (
    <section className="admin-card manual-form">
      <div>
        <small>NOVO AGENDAMENTO</small>
        <h2>Cadastro manual</h2>
        <p>
          Para atendimentos recebidos por telefone ou diretamente na recepção.
        </p>
      </div>
      <div className="form-grid">
        <label>
          Cliente
          <input
            value={form.client}
            onChange={(e) => setForm({ ...form, client: e.target.value })}
          />
        </label>
        <label>
          Telefone
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </label>
      </div>
      <label>
        Serviço
        <select
          value={form.serviceId}
          onChange={(e) =>
            setForm({
              ...form,
              serviceId: e.target.value,
              professionalId: "",
              time: "",
            })
          }
        >
          <option value="">Selecione</option>
          {services
            .filter((s) => s.active)
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
        </select>
      </label>
      <div className="form-grid">
        <label>
          Profissional
          <select
            value={form.professionalId}
            onChange={(e) =>
              setForm({ ...form, professionalId: e.target.value, time: "" })
            }
          >
            <option value="">Selecione</option>
            {pros.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Data
          <input
            type="date"
            min={today()}
            max={currentYearEndInput()}
            value={form.date}
            onChange={(e) =>
              setForm({ ...form, date: e.target.value, time: "" })
            }
          />
        </label>
      </div>
      <label>
        Horário
        <select
          value={form.time}
          onChange={(e) => setForm({ ...form, time: e.target.value })}
        >
          <option value="">Selecione</option>
          {slots.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <button className="primary-button" onClick={save}>
        Criar agendamento
      </button>
    </section>
  );
}

function SparkleIcon() {
  return <span className="insight-icon">✦</span>;
}
