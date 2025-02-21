import { useState, useEffect } from 'react';
import { useParams } from 'react-router';

export default function Details({ site }: { site: string }) {
  const { id } = useParams();
  const [detailsId, setDetailsId] = useState<string>();
  const message = `Welcome to the Details page - ${site}`;

  useEffect(() => {
    if (id) {
      setDetailsId(id);
    }
  }, [id]);

  return (
    <h1>
      {message}
      {detailsId && `ID: ${detailsId}`}
    </h1>
  );
}
