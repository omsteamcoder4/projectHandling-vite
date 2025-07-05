import { useParams, useSearchParams } from 'react-router-dom';
import UpdateProject from '../components/UpdateProject'; // Your existing component

const SharedProject = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  return (
    <UpdateProject 
      isShared={true}
      shareToken={token}
    />
  );
};

export default SharedProject;