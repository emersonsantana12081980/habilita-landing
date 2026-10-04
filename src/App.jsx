import React, { lazy, Suspense } from "react";
import { useStore } from "./store";
import { cloudEnabled } from "./lib/supabase";
import { LandingPage } from "./components/LandingPage";
const CloudAdminPanel = lazy(() =>
  import("./components/CloudAdminPanel").then((m) => ({
    default: m.CloudAdminPanel,
  })),
);
const CloudStudentPortal = lazy(() =>
  import("./components/CloudStudentPortal").then((m) => ({
    default: m.CloudStudentPortal,
  })),
);
const AdminPanel = lazy(() =>
  import("./components/AdminPanel").then((m) => ({ default: m.AdminPanel })),
);
const StudentPortal = lazy(() =>
  import("./components/StudentPortal").then((m) => ({
    default: m.StudentPortal,
  })),
);
export function App() {
  const [data, update, error] = useStore();
  const path = window.location.pathname.replace(/\/$/, "");
  let page;
  if (path === "/admin")
    page = cloudEnabled ? (
      <CloudAdminPanel />
    ) : (
      <AdminPanel data={data} update={update} error={error} />
    );
  else if (["/aluno", "/cadastro"].includes(path))
    page = cloudEnabled ? (
      <CloudStudentPortal />
    ) : (
      <StudentPortal data={data} update={update} error={error} />
    );
  else page = <LandingPage data={data} error={error} />;
  return (
    <Suspense
      fallback={
        <p role="status" className="p-8 text-center">
          Carregando Habilita+…
        </p>
      }
    >
      {page}
    </Suspense>
  );
}
