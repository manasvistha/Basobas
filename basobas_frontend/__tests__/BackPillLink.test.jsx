import React from 'react';
import { render, screen } from '@testing-library/react';
import BackPillLink from '@/components/ui/BackPillLink';

jest.mock('next/link');

test('BackPillLink renders label and href', () => {
  render(<BackPillLink href="/test" label="Go Back" />);
  const el = screen.getByText('Go Back');
  expect(el).toBeInTheDocument();
  const anchor = el.closest('a');
  expect(anchor).toHaveAttribute('href', '/test');
});
