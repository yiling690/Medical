import { createBrowserRouter } from 'react-router-dom'
import LoginPage from '../pages/Login'
import HomePage from '../pages/Home'
import PatientRecordsPage from '../pages/PatientRecords'
import RecordDetailPage from '../pages/RecordDetail'
import AppointmentPage from '../pages/Appointment'
import AppointmentDoctorsPage from '../pages/AppointmentDoctors'
import AppointmentSchedulePage from '../pages/AppointmentSchedule'
import AppointmentRecordsPage from '../pages/AppointmentRecords'
import InspectionOrderDetailPage from '../pages/InspectionOrderDetail'
import PatientChatPage from '../pages/PatientChat'
import DoctorSchedulePage from '../pages/DoctorSchedule'
import SettingsPage from '../pages/Settings'
import DoctorPatientManagePage from '../pages/DoctorPatientManage'
import DoctorPatientsPage from '../pages/DoctorPatients'
import StatsPage from '../pages/Stats'
import MainLayout from '../layout/MainLayout.jsx'
import DoctorDashboardPage from '../pages/DoctorDashboard'
import RequireAuth from '../router/requireAuth.jsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <LoginPage />,
  },
  {
    path: '/home',
    element: (
      <RequireAuth>
        <MainLayout>
          <HomePage />
        </MainLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/patient',
    element: (
      <RequireAuth>
        <MainLayout>
          <PatientRecordsPage />
        </MainLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/records/:id',
    element: (
      <RequireAuth>
        <MainLayout>
          <RecordDetailPage />
        </MainLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/doctor',
    element: (
      <RequireAuth>
        <MainLayout>
          <DoctorDashboardPage />
        </MainLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/doctor/patient-manage',
    element: (
      <RequireAuth>
        <MainLayout>
          <DoctorPatientManagePage />
        </MainLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/doctor/my-patients',
    element: (
      <RequireAuth>
        <MainLayout>
          <DoctorPatientsPage />
        </MainLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/doctor/schedule',
    element: (
      <RequireAuth>
        <MainLayout>
          <DoctorSchedulePage />
        </MainLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/doctor/stats',
    element: (
      <RequireAuth>
        <MainLayout>
          <StatsPage />
        </MainLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/appointment',
    element: (
      <RequireAuth>
        <MainLayout>
          <AppointmentPage />
        </MainLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/appointment/doctors',
    element: (
      <RequireAuth>
        <MainLayout>
          <AppointmentDoctorsPage />
        </MainLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/appointment/schedule',
    element: (
      <RequireAuth>
        <MainLayout>
          <AppointmentSchedulePage />
        </MainLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/appointment/records',
    element: (
      <RequireAuth>
        <MainLayout>
          <AppointmentRecordsPage />
        </MainLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/appointment/orders/:id',
    element: (
      <RequireAuth>
        <MainLayout>
          <InspectionOrderDetailPage />
        </MainLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/chat',
    element: (
      <RequireAuth>
        <MainLayout>
          <PatientChatPage />
        </MainLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/settings',
    element: (
      <RequireAuth>
        <MainLayout>
          <SettingsPage />
        </MainLayout>
      </RequireAuth>
    ),
  },
])

export default router
