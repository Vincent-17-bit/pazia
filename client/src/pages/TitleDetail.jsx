import { useParams, useNavigate } from 'react-router-dom';
import TitleContent from '../components/TitleContent.jsx';

export default function TitleDetail() {
  const { mediaType, id } = useParams();
  const navigate = useNavigate();

  return (
    <TitleContent
      mediaType={mediaType}
      id={id}
      variant="page"
      onClose={() => navigate('/')}
      onNavigateTitle={(nextType, nextId) => navigate(`/title/${nextType}/${nextId}`)}
    />
  );
}
