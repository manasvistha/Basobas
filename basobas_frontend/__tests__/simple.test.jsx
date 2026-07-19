import React from 'react';
import { render, screen } from '@testing-library/react';

function Hello() {
  return <div>Hello Rentora</div>;
}

test('renders Hello Rentora', () => {
  render(<Hello />);
  expect(screen.getByText('Hello Rentora')).toBeInTheDocument();
});
