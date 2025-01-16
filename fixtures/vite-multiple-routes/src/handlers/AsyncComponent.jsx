import { useState } from 'react';

function AsyncComponent() {
  const [num, setNumber] = useState(0);

  return (
    <span onClick={() => setNumber(num + 1)}>
      Some special async content {num}
    </span>
  );
}

export default AsyncComponent;
