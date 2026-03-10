import { createBrowserRouter } from 'react-router-dom'
import LoginPage from '../pages/Login'
import HomePage from '../pages/Home'
import PatientRecordsPage from '../pages/PatientRecords'
import RecordDetailPage from '../pages/RecordDetail'
import AppointmentPage from '../pages/Appointment'
import AppointmentDoctorsPage from '../pages/AppointmentDoctors'
import DoctorSchedulePage from '../pages/DoctorSchedule'
import SettingsPage from '../pages/Settings'
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
          <DoctorSchedulePage />
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
