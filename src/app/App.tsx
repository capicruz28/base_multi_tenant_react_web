import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProviders } from './provider';
import { router } from './router';

function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </AppProviders>
  );
}

export default App;

