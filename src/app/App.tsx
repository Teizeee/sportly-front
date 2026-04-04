import { ToastContainer } from 'react-toastify'
import { AppRouter } from '@app/providers/router/AppRouter'
import 'react-toastify/dist/ReactToastify.css'

export default function App() {
  return (
    <>
      <AppRouter />
      <ToastContainer position="top-right" autoClose={3500} newestOnTop />
    </>
  )
}
