import { useNavigate } from 'react-router-dom';
import QuoteManagement from '../components/QuoteManagement';

export default function ManagePage() {
  const navigate = useNavigate();

  return (
    <QuoteManagement onBackToRandom={() => navigate('/')} />
  );
}
