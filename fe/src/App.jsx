import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import LoadingSpinner from './components/common/LoadingSpinner';

// Lazy load pages for code splitting
const DashboardPage = lazy(() => import('./pages/Dashboard/DashboardPage'));
const EmployeeListPage = lazy(() => import('./pages/employees/EmployeeListPage'));
const EmployeeFormPage = lazy(() => import('./pages/employees/EmployeeFormPage'));
const ProjectListPage = lazy(() => import('./pages/projects/ProjectListPage'));
const ProjectFormPage = lazy(() => import('./pages/projects/ProjectFormPage'));
const AllocationListPage = lazy(() => import('./pages/allocations/AllocationListPage'));
const AllocationFormPage = lazy(() => import('./pages/allocations/AllocationFormPage'));
const WorkloadPage = lazy(() => import('./pages/workload/WorkloadPage'));
const UtilizationReportPage = lazy(() => import('./pages/reports/UtilizationReportPage'));
const AvailableResourcesPage = lazy(() => import('./pages/reports/AvailableResourcesPage'));
const OverloadedPage = lazy(() => import('./pages/reports/OverloadedPage'));
const AiRecommendPage = lazy(() => import('./pages/ai/AiRecommendPage'));
const AiRiskAnalysisPage = lazy(() => import('./pages/ai/AiRiskAnalysisPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function PageLoader() {
  return <LoadingSpinner text="Loading..." />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<AppLayout />}>
            {/* Dashboard */}
            <Route index element={<DashboardPage />} />

            {/* Employees */}
            <Route path="employees">
              <Route index element={<EmployeeListPage />} />
              <Route path="new" element={<EmployeeFormPage />} />
              <Route path=":id/edit" element={<EmployeeFormPage />} />
            </Route>

            {/* Projects */}
            <Route path="projects">
              <Route index element={<ProjectListPage />} />
              <Route path="new" element={<ProjectFormPage />} />
              <Route path=":id/edit" element={<ProjectFormPage />} />
            </Route>

            {/* Allocations */}
            <Route path="allocations">
              <Route index element={<AllocationListPage />} />
              <Route path="new" element={<AllocationFormPage />} />
              <Route path=":id/edit" element={<AllocationFormPage />} />
            </Route>

            {/* Workload */}
            <Route path="employees/:id/workload" element={<WorkloadPage />} />

            {/* Reports */}
            <Route path="reports">
              <Route path="utilization" element={<UtilizationReportPage />} />
              <Route path="available" element={<AvailableResourcesPage />} />
              <Route path="overloaded" element={<OverloadedPage />} />
            </Route>

            {/* AI */}
            <Route path="ai">
              <Route path="recommend" element={<AiRecommendPage />} />
              <Route path="risk-analysis" element={<AiRiskAnalysisPage />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
