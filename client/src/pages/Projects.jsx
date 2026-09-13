import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { hiringApi } from "../api/hiring.js";
import { ProjectPayments } from "../components/ProjectPayments.jsx";
import {
  useProjects,
  useWorkspace,
  useHiringMutation,
} from "../services/hiring.js";
import { useAuth } from "../context/AuthContext.jsx";
import { apiErrorMessage } from "../api/client.js";
const cols = [
  ["TODO", "Todo"],
  ["IN_PROGRESS", "In Progress"],
  ["IN_REVIEW", "In Review"],
  ["DONE", "Done"],
];
const entityId = (value) =>
  value?._id || value?.id || value?.$oid || value || null;
function List() {
  const { data, isLoading, isError, refetch } = useProjects();
  if (isLoading) return <div>Loading projects...</div>;
  if (isError) return <div role="alert">Projects could not be loaded. <button onClick={() => refetch()}>Try again</button></div>;
  return (
    <section>
      <h1 className="text-3xl font-bold">Projects</h1>
      <Link className="text-brand-700" to="/dashboard/payments">View payment history</Link>
      {data?.projects?.length === 0 && <p className="mt-4">No projects yet. Accepted offers create project workspaces.</p>}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {(data?.projects || []).map((p) => (
          <Link
            key={p._id}
            to={`/dashboard/projects/${p._id}`}
            className="rounded-xl border bg-white p-5 shadow-sm"
          >
            <h2 className="font-semibold">{p.title}</h2>
            <p className="text-sm text-slate-500">{p.description}</p><span className="mt-3 block text-sm font-semibold text-brand-700">View project & payments</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
function Detail() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useWorkspace(projectId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [issue, setIssue] = useState("");
  const update = useHiringMutation(({ id, payload }) =>
    hiringApi.updateTask(id, payload),
  );
  const addTask = useHiringMutation((p) => hiringApi.createTask(projectId, p));
  const addIssue = useHiringMutation((p) =>
    hiringApi.createIssue(projectId, p),
  );
  if (isLoading) return <div>Loading workspace...</div>;
  if (isError || !data)
    return (
      <div className="rounded bg-red-50 p-4 text-red-700">
        Project workspace could not be loaded. <button className="underline" onClick={() => refetch()}>Try again</button>
      </div>
    );
  const p = data.project;
  const client =
    data.permissions?.canFundMilestones === true ||
    String(entityId(p.client)) === String(entityId(user));
  const team = data.team || [];
  return (
    <section>
      <Link
        to="/dashboard/projects"
        className="text-sm font-semibold text-brand-600"
      >
        Back to projects
      </Link>
      <header className="mt-4 rounded-2xl bg-slate-900 p-6 text-white">
        <p className="text-sm text-slate-300">Project workspace</p>
        <h1 className="text-3xl font-bold">{p.title}</h1>
        <p className="mt-2 text-slate-300">
          Client: {p.client?.name || "Project client"} · {p.progress}% complete
        </p>
      </header>
      <ProjectPayments workspace={data} client={client} />
      <div className="mt-5 rounded-xl border bg-white p-5">
        <h2 className="font-semibold">Project team</h2>
        <p className="mt-2 text-sm text-slate-600">
          {team.map((m) => m.name || m.email).join(", ") ||
            "No assigned freelancers."}
        </p>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-4">
        {cols.map(([id, label]) => (
          <div className="min-h-40 rounded-xl bg-slate-100 p-3" key={id}>
            <h2 className="mb-3 font-semibold">{label}</h2>
            {(data.tasks || [])
              .filter((t) => t.status === id)
              .map((t) => (
                <div
                  key={t._id}
                  className="mb-2 rounded-lg border bg-white p-3"
                >
                  <strong className="text-sm">{t.title}</strong>
                  <p className="text-xs text-slate-500">
                    Assigned: {t.assignedTo?.name || "Unassigned"}
                  </p>
                  {t.status === "IN_REVIEW" && client && (
                    <button
                      className="mt-2 rounded bg-brand-700 px-2 py-1 text-xs text-white"
                      onClick={() =>
                        update.mutate({
                          id: t._id,
                          payload: { status: "DONE", progress: 100 },
                        })
                      }
                    >
                      Approve task
                    </button>
                  )}
                </div>
              ))}
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <form
          className="rounded-xl border bg-white p-5"
          onSubmit={(e) => {
            e.preventDefault();
            addTask.mutate({ title, description });
            setTitle("");
            setDescription("");
          }}
        >
          <h2 className="font-semibold">Add work item</h2>
          <input
            required
            className="mt-3 w-full rounded border p-2"
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="mt-2 w-full rounded border p-2"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button className="mt-2 rounded bg-brand-700 px-3 py-2 text-sm font-semibold text-white">
            Add task
          </button>
        </form>
        <form
          className="rounded-xl border bg-white p-5"
          onSubmit={(e) => {
            e.preventDefault();
            addIssue.mutate({ title: "Project issue", description: issue });
            setIssue("");
          }}
        >
          <h2 className="font-semibold">Report an issue</h2>
          <textarea
            required
            className="mt-3 w-full rounded border p-2"
            placeholder="Describe the problem"
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
          />
          <button className="mt-2 rounded border border-amber-300 px-3 py-2 text-sm text-amber-700">
            Report issue
          </button>
        </form>
      </div>
    </section>
  );
}
export default function Projects() {
  return useParams().projectId ? <Detail /> : <List />;
}
