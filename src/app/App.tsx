import { RouterProvider } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import { appRouter } from '@app/providers/router/AppRouter'
import 'react-toastify/dist/ReactToastify.css'

export default function App() {
  return (
    <>
      <RouterProvider router={appRouter} />
      <ToastContainer position="top-right" autoClose={3500} newestOnTop />
    </>
  )
}
